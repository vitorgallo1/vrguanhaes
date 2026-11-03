// Quando o catálogo do projeto (data/catalogo.ts) ganha motos ou fotos depois que a
// loja já salvou o estoque no painel, a vitrine continua mostrando o estoque salvo —
// é o certo, senão o painel perderia a razão de existir. Esta função calcula só a
// diferença, para o painel oferecer "trazer as novidades" sem desfazer nada do que a
// loja editou:
//
//   - moto do catálogo que não está no estoque entra no fim da marca dela (fora dos
//     destaques), a menos que já exista uma moto com o mesmo endereço /motos/...;
//   - cor salva sem foto ganha a foto da cor de mesmo nome no catálogo ("Preta" e
//     "Preto" contam como a mesma cor);
//   - cor que o catálogo tem com foto e a moto salva não tem entra no fim das cores;
//   - se a primeira cor (a que o card abre) segue sem foto, a primeira com foto passa
//     para a frente;
//   - moto que mudou de aba (DR 160, DK 160, Storm 200) muda de marca, se a loja não
//     tiver mexido nisso;
//   - foto que o projeto trocou (TROCAS_DE_FOTO: as da Yamaha e as provisórias da New
//     Jet em 28/09) é trocada onde a antiga continua igual;
//   - se as Mais vendidas salvas ainda são as provisórias da primeira versão, passam a
//     ser as do catálogo, na ordem pedida pelo cliente.
//
// Nada é removido e nada é gravado aqui: o painel aplica na lista em edição e a loja
// revisa antes de salvar.
import {
  CATALOGO_BASE,
  DESTAQUES_ANTIGOS,
  MUDARAM_DE_MARCA,
  TROCAS_DE_FOTO,
} from "@/data/catalogo";
import { LIMITE_CORES, type Cor, type Moto } from "@/lib/motos";
import { slugDaMoto } from "@/lib/seo";

export type Novidades = {
  motos: Moto[];
  /** Nomes das motos que entram no estoque. */
  motosNovas: string[];
  /** Cores que estavam sem foto e ganharam foto. */
  fotosNovas: number;
  /** Cores que entram em motos que já estavam no estoque. */
  coresNovas: number;
  /** Nomes das motos que mudam de aba. */
  mudaramDeAba: string[];
  /** Fotos antigas do projeto trocadas pelas novas. */
  fotosTrocadas: number;
  /** Nomes das novas Mais vendidas, na ordem — vazio quando não mudam. */
  destaquesNovos: string[];
};

const TROCA = new Map(TROCAS_DE_FOTO.map((t) => [t.antiga, t]));

/** "Vermelho Metálico" e "vermelha metalica" viram a mesma chave. */
export function chaveDaCor(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => (p.length > 3 ? p.replace(/[ao]s?$/, "") : p))
    .join(" ");
}

const temFoto = (c: Cor) => c.fotos.some((f) => f.trim());

export function calcularNovidades(salvo: Moto[], catalogo: Moto[] = CATALOGO_BASE): Novidades {
  const r: Novidades = {
    motos: [],
    motosNovas: [],
    fotosNovas: 0,
    coresNovas: 0,
    mudaramDeAba: [],
    fotosTrocadas: 0,
    destaquesNovos: [],
  };
  const doCatalogo = new Map(catalogo.map((m) => [m.id, m]));

  for (const original of salvo) {
    const cat = doCatalogo.get(original.id);
    if (!cat) {
      r.motos.push(original);
      continue;
    }
    const m: Moto = {
      ...original,
      cores: original.cores.map((c) => ({ ...c, fotos: [...c.fotos] })),
    };

    for (const c of m.cores) {
      c.fotos = c.fotos.map((f) => {
        const t = TROCA.get(f);
        if (!t) return f;
        r.fotosTrocadas++;
        if (t.nomeAntigo && t.nomeNovo && c.nome === t.nomeAntigo) c.nome = t.nomeNovo;
        if (t.hex) {
          c.hex = t.hex;
          c.hex2 = t.hex2;
        }
        return t.nova;
      });
    }

    const antes = MUDARAM_DE_MARCA[m.id];
    if (antes && m.marca === antes.marca && cat.marca !== antes.marca) {
      m.marca = cat.marca;
      if (m.nome === antes.nome) m.nome = cat.nome;
      r.mudaramDeAba.push(cat.nome);
    }

    const coresDoCatalogo = new Map(cat.cores.filter(temFoto).map((c) => [chaveDaCor(c.nome), c]));
    const chavesSalvas = new Set(m.cores.map((c) => chaveDaCor(c.nome)));
    for (const c of m.cores) {
      if (temFoto(c)) continue;
      const igual = coresDoCatalogo.get(chaveDaCor(c.nome));
      if (!igual) continue;
      c.fotos = [...igual.fotos];
      r.fotosNovas++;
    }
    for (const [chave, c] of coresDoCatalogo) {
      if (chavesSalvas.has(chave) || m.cores.length >= LIMITE_CORES) continue;
      m.cores.push({ ...c, fotos: [...c.fotos] });
      r.coresNovas++;
    }
    // O card abre na primeira cor. Se ela continua sem foto e alguma outra acabou de
    // ganhar uma, a que tem foto vai para a frente (JEF 170: só a vermelha tem foto).
    const mudouFoto = m.cores.some((c, i) => temFoto(c) && !temFoto(original.cores[i] ?? c));
    if (mudouFoto && !temFoto(m.cores[0])) {
      const i = m.cores.findIndex(temFoto);
      if (i > 0) m.cores.unshift(...m.cores.splice(i, 1));
    }
    r.motos.push(m);
  }

  // Motos que não estão no catálogo não passam pelo laço acima; a troca de foto vale
  // para elas também (a loja pode ter duplicado uma Yamaha no painel).
  for (const m of r.motos) {
    if (doCatalogo.has(m.id)) continue;
    if (!m.cores.some((c) => c.fotos.some((f) => TROCA.has(f)))) continue;
    const i = r.motos.indexOf(m);
    r.motos[i] = {
      ...m,
      cores: m.cores.map((c) => ({
        ...c,
        fotos: c.fotos.map((f) => {
          const t = TROCA.get(f);
          if (t) r.fotosTrocadas++;
          return t ? t.nova : f;
        }),
      })),
    };
  }

  const ids = new Set(salvo.map((m) => m.id));
  const slugs = new Set(r.motos.map((m) => slugDaMoto(m)));
  for (const cat of catalogo) {
    if (ids.has(cat.id) || slugs.has(slugDaMoto(cat))) continue;
    const irmas = r.motos.filter((m) => m.marca === cat.marca);
    const ordem = irmas.reduce((max, m) => Math.max(max, m.ordem), 0) + 1;
    r.motos.push({ ...cat, destaque: false, ordem });
    r.motosNovas.push(cat.nome);
  }

  const salvos = salvo.filter((m) => m.destaque).map((m) => m.id);
  const aindaProvisorios =
    salvos.length === DESTAQUES_ANTIGOS.length &&
    salvos.every((id) => DESTAQUES_ANTIGOS.includes(id));
  const pedidos = catalogo.filter((m) => m.destaque);
  if (aindaProvisorios && pedidos.some((p) => !DESTAQUES_ANTIGOS.includes(p.id))) {
    const posicao = new Map(pedidos.map((p) => [p.id, p.posicaoDestaque]));
    r.motos = r.motos.map((m) =>
      posicao.has(m.id)
        ? { ...m, destaque: true, posicaoDestaque: posicao.get(m.id) }
        : { ...m, destaque: false, posicaoDestaque: undefined },
    );
    r.destaquesNovos = [...pedidos]
      .sort((a, b) => (a.posicaoDestaque ?? 99) - (b.posicaoDestaque ?? 99))
      .map((p) => r.motos.find((m) => m.id === p.id)?.nome ?? p.nome);
  }
  return r;
}

export const haNovidades = (n: Novidades) =>
  n.motosNovas.length +
    n.fotosNovas +
    n.coresNovas +
    n.mudaramDeAba.length +
    n.fotosTrocadas +
    n.destaquesNovos.length >
  0;
