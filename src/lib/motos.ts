// Tipo e utilidades das motos da vitrine — o mesmo formato que o painel /admin grava e
// que a página lê. Este arquivo roda nos dois lados (servidor e navegador); nada de
// Node aqui.
import { ordemDaMarca } from "@/config/marcas";
import type { UnidadeId } from "@/config/unidade";

export type Cor = {
  /** Como aparece para o visitante: "Vermelho Metálico". */
  nome: string;
  /** Cor da bolinha do seletor (#rrggbb). */
  hex: string;
  /** Segunda cor, para pintura bicolor (a bolinha vira meio a meio). Opcional. */
  hex2?: string;
  /**
   * De 1 a 4 fotos da moto nesta cor; a primeira é a do card. Cada item é uma URL
   * completa (https://...) ou o nome de um arquivo em src/assets/motos. Guardar o
   * nome, e não a URL final, é o que faz a foto sobreviver a um novo build.
   */
  fotos: string[];
};

export type Moto = {
  id: string;
  /** id de src/config/marcas.ts — decide a aba e o logo do card. */
  marca: string;
  nome: string;
  /** "Trail", "Street", "Scooter"... Vai no selo do card. */
  categoria: string;
  descricao: string;
  /** Até 3 — viram as tags do card. */
  specs: string[];
  /** De 1 a 8. A primeira é a cor que o card mostra ao abrir a página. */
  cores: Cor[];
  /** Opcional, aparece na quina do card: "Lançamento", "Novidade"... */
  selo?: string;
  /** Entra na seção "Mais vendidas" do topo da vitrine. */
  destaque: boolean;
  /** Posição dentro das Mais vendidas (1 = primeira). Só vale com destaque. */
  posicaoDestaque?: number;
  /**
   * Etiqueta "Em estoque" no card e na página da moto. Vazio conta como em estoque:
   * a lista que a loja passou é o estoque dela, então é o caso comum.
   */
  emEstoque?: boolean;
  /** Em quais lojas a moto aparece. */
  unidades: UnidadeId[];
  /** Esconde da vitrine sem apagar o cadastro. */
  ativo: boolean;
  /** Posição dentro da marca, crescente. */
  ordem: number;

  // --- Página da moto e SEO (tudo opcional: vazio = gerado automaticamente) ---

  /** Endereço da página: /motos/<slug>. Vazio = marca + nome ("honda-cg-160-titan"). */
  slug?: string;
  /** Título que aparece no Google. Vazio = "Honda CG 160 Titan 0 km em Guanhães/MG | VR Multimarcas". */
  tituloSeo?: string;
  /** Descrição que aparece no Google, abaixo do título. Vazio = montada da descrição e das cores. */
  descricaoSeo?: string;
  /** Texto longo da página da moto — o que o Google mais lê. */
  textoPagina?: string;
  /**
   * Abertura própria de cada loja. É o que impede a mesma página de existir igual nos
   * dois domínios (o Google escolheria um e esconderia o outro).
   */
  textoPorLoja?: Partial<Record<UnidadeId, string>>;
  /** Ficha técnica da página: pares rótulo/valor. */
  ficha?: ItemFicha[];
};

export type ItemFicha = { rotulo: string; valor: string };

export const TODAS_AS_UNIDADES: UnidadeId[] = ["guanhaes"];

export const LIMITE_DESTAQUES = 6;
export const LIMITE_CORES = 8;
export const LIMITE_FOTOS_POR_COR = 4;

// Fotos que vieram no projeto. O glob é resolvido no build, então isto é uma tabela de
// nome de arquivo -> URL final com hash.
const ASSETS = import.meta.glob("/src/assets/motos/*.{webp,png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const POR_NOME = new Map(
  Object.entries(ASSETS).map(([caminho, url]) => [caminho.split("/").pop() as string, url]),
);

/** Nomes das fotos que acompanham o projeto, para o painel oferecer numa lista. */
export const FOTOS_DO_PROJETO = [...POR_NOME.keys()].sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true }),
);

export const ehUrlExterna = (foto: string) => /^https?:\/\//i.test(foto);

/**
 * URL para exibir uma foto. Devolve string vazia quando o nome não existe mais no
 * projeto — quem renderiza decide o que fazer com isso.
 */
export function urlDaFoto(foto: string): string {
  if (!foto) return "";
  if (ehUrlExterna(foto)) return foto;
  return POR_NOME.get(foto) ?? "";
}

/**
 * As cores com as URLs das fotos já resolvidas. Foto que não carrega (arquivo que
 * saiu do projeto) cai fora; a cor continua, e o card mostra "foto em breve" no
 * lugar — assim uma moto cadastrada antes da foto chegar já aparece com as cores.
 */
export function coresResolvidas(moto: Moto): Cor[] {
  return moto.cores.map((c) => ({ ...c, fotos: c.fotos.map(urlDaFoto).filter(Boolean) }));
}

export const temFoto = (moto: Moto) => coresResolvidas(moto).some((c) => c.fotos.length > 0);

/** Ordem da vitrine: marca (na ordem das abas) e, dentro dela, a ordem cadastrada. */
export function ordenar(motos: Moto[]): Moto[] {
  return [...motos].sort(
    (a, b) => ordemDaMarca(a.marca) - ordemDaMarca(b.marca) || a.ordem - b.ordem,
  );
}

export const estaEmEstoque = (m: Pick<Moto, "emEstoque">) => m.emEstoque !== false;

/**
 * As Mais vendidas na ordem escolhida no painel. Moto marcada sem posição (cadastro
 * antigo) vai depois das numeradas, na ordem em que veio.
 */
export function ordenarDestaques<T extends Pick<Moto, "destaque" | "posicaoDestaque">>(
  lista: T[],
): T[] {
  return lista
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.destaque)
    .sort((a, b) => (a.m.posicaoDestaque ?? 99) - (b.m.posicaoDestaque ?? 99) || a.i - b.i)
    .map(({ m }) => m);
}

/** O que a vitrine de uma loja mostra: ativas, da loja, com pelo menos uma cor. */
export function paraVitrine(motos: Moto[], unidade: UnidadeId): Moto[] {
  return ordenar(
    motos.filter((m) => m.ativo && m.unidades.includes(unidade) && m.cores.length > 0),
  );
}

export function novoId() {
  return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Aceita "#abc", "abc", "#AABBCC" — devolve "#aabbcc" ou "" se não for cor. */
export function normalizarHex(valor: string): string {
  let v = valor.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(v)) v = v.replace(/./g, (c) => c + c);
  return /^[0-9a-f]{6}$/.test(v) ? `#${v}` : "";
}

/** Corta e limpa o que veio do formulário antes de gravar. */
export function normalizar(moto: Moto): Moto {
  return {
    ...moto,
    posicaoDestaque: moto.destaque ? moto.posicaoDestaque : undefined,
    emEstoque: estaEmEstoque(moto),
    marca: moto.marca.trim(),
    nome: moto.nome.trim(),
    categoria: moto.categoria.trim(),
    descricao: moto.descricao.trim(),
    specs: moto.specs
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3),
    cores: moto.cores
      .map((c) => ({
        nome: c.nome.trim(),
        hex: normalizarHex(c.hex) || "#777777",
        hex2: c.hex2 ? normalizarHex(c.hex2) || undefined : undefined,
        fotos: c.fotos
          .map((f) => f.trim())
          .filter(Boolean)
          .slice(0, LIMITE_FOTOS_POR_COR),
      }))
      .filter((c) => c.nome || c.fotos.length > 0)
      .slice(0, LIMITE_CORES),
    selo: moto.selo?.trim() || undefined,
    unidades: TODAS_AS_UNIDADES.filter((u) => moto.unidades.includes(u)),
    slug: moto.slug?.trim() || undefined,
    tituloSeo: moto.tituloSeo?.trim() || undefined,
    descricaoSeo: moto.descricaoSeo?.trim() || undefined,
    textoPagina: moto.textoPagina?.trim() || undefined,
    textoPorLoja: limparTextoPorLoja(moto.textoPorLoja),
    ficha: (moto.ficha ?? [])
      .map((f) => ({ rotulo: f.rotulo.trim(), valor: f.valor.trim() }))
      .filter((f) => f.rotulo && f.valor)
      .slice(0, 30),
  };
}

function limparTextoPorLoja(t: Moto["textoPorLoja"]): Moto["textoPorLoja"] {
  if (!t) return undefined;
  const limpo: Partial<Record<UnidadeId, string>> = {};
  for (const u of TODAS_AS_UNIDADES) {
    const v = t[u]?.trim();
    if (v) limpo[u] = v;
  }
  return Object.keys(limpo).length ? limpo : undefined;
}

/** O que impede de salvar. Lista vazia = pode gravar. */
export function problemas(moto: Moto): string[] {
  const erros: string[] = [];
  if (!moto.marca.trim()) erros.push("Escolha a marca — ela decide a aba da vitrine.");
  if (!moto.nome.trim()) erros.push("A moto precisa de um nome.");
  if (!moto.categoria.trim()) erros.push("Falta a categoria (Trail, Street, Scooter...).");
  if (!moto.descricao.trim()) erros.push("Falta a descrição que aparece no card.");
  const cores = moto.cores.filter((c) => c.nome.trim() || c.fotos.some(Boolean));
  if (cores.length === 0) erros.push("Cadastre pelo menos uma cor.");
  cores.forEach((c, i) => {
    const rotulo = c.nome.trim() || `Cor ${i + 1}`;
    if (!c.nome.trim()) erros.push(`${rotulo}: falta o nome da cor.`);
    if (c.hex && !HEX.test(normalizarHex(c.hex))) erros.push(`${rotulo}: a cor não é um #hex.`);
    const invalida = c.fotos.find((f) => f && !ehUrlExterna(f) && !POR_NOME.has(f));
    if (invalida) erros.push(`${rotulo}: "${invalida}" não é uma URL nem um arquivo do projeto.`);
  });
  if (moto.unidades.length === 0) erros.push("Marque pelo menos uma loja.");
  return erros;
}
