// SEO das páginas de moto: endereço, título, descrição e o diagnóstico que o painel
// mostra. Roda nos dois lados — a página usa para as metatags, o painel para listar o
// que falta. Tudo que o cliente deixa em branco é gerado aqui, então uma moto recém
// cadastrada já nasce com página e metatags válidas; o diagnóstico aponta onde um
// texto próprio faria diferença.
import { MARCAS, marcaPorId } from "@/config/marcas";
import { UNIDADES, type UnidadeId } from "@/config/unidade";
import type { Moto } from "@/lib/motos";

export const TITULO_MIN = 50;
export const TITULO_MAX = 60;
export const DESCRICAO_MIN = 120;
export const DESCRICAO_MAX = 155;
/** Abaixo disso, o texto da página é fino demais para disputar uma busca. */
export const TEXTO_PAGINA_MIN = 400;

export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Honda CG 160 Titan"; "Haojue DR 160" já começa com uma marca e fica como está. */
export function nomeCompleto(m: Pick<Moto, "marca" | "nome">): string {
  const jaTemMarca = MARCAS.some((x) => m.nome.toLowerCase().startsWith(x.nome.toLowerCase()));
  return jaTemMarca ? m.nome : `${marcaPorId(m.marca).nome} ${m.nome}`;
}

export function slugDaMoto(m: Pick<Moto, "marca" | "nome" | "slug">): string {
  return slugificar(m.slug?.trim() || nomeCompleto(m));
}

export const caminhoDaMoto = (m: Pick<Moto, "marca" | "nome" | "slug">) =>
  `/motos/${slugDaMoto(m)}`;

const listaHumana = (itens: string[]) =>
  itens.length <= 1
    ? itens.join("")
    : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;

const nomesDasCores = (m: Moto) => m.cores.map((c) => c.nome.trim().toLowerCase()).filter(Boolean);

export function tituloAutomatico(m: Moto, u: UnidadeId): string {
  const loja = UNIDADES[u];
  const fim = ` 0 km em ${loja.cidade}/${loja.uf} | VR Multimarcas`;
  const base = `${nomeCompleto(m)}${fim}`;
  // Nome curto (DK 160, PCX 160) deixa o título abaixo de 50 caracteres: "Moto" na
  // frente completa com a palavra que as pessoas de fato digitam. Se nem assim chegar
  // (SBM 150S), entra também a categoria — "Moto SBM 150S Street 0 km em...".
  if (base.length >= TITULO_MIN) return base;
  const comMoto = `Moto ${base}`;
  if (comMoto.length >= TITULO_MIN || !m.categoria.trim()) return comMoto;
  const comCategoria = `Moto ${nomeCompleto(m)} ${m.categoria.trim()}${fim}`;
  return comCategoria.length <= TITULO_MAX ? comCategoria : comMoto;
}

export const tituloEfetivo = (m: Moto, u: UnidadeId) =>
  m.tituloSeo?.trim() || tituloAutomatico(m, u);

/** Primeira frase da descrição do card, com ponto final. */
function primeiraFrase(texto: string): string {
  const t = texto.trim();
  const fim = t.search(/[.!?](\s|$)/);
  return fim === -1 ? `${t}.` : t.slice(0, fim + 1);
}

function cortar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  return `${corte.slice(0, corte.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * Descrição do Google montada da própria moto. Tenta a versão mais completa que caiba
 * em 155 caracteres; se sobrar espaço, completa com o convite para o WhatsApp.
 */
export function descricaoAutomatica(m: Moto, u: UnidadeId): string {
  const loja = UNIDADES[u];
  const abre = `${nomeCompleto(m)} 0 km em ${loja.cidade}/${loja.uf}`;
  const cores = nomesDasCores(m);
  const frase = primeiraFrase(m.descricao || "");
  const longo = "Condições e financiamento pelo WhatsApp.";
  const curto = "Condições pelo WhatsApp.";
  const emCores = cores.length > 1 ? `, nas cores ${listaHumana(cores)}` : "";
  const specs = m.specs.map((x) => x.trim()).filter(Boolean);
  // Da mais rica para a mais enxuta. Vale a primeira que cair na faixa ideal
  // (120–155); se nenhuma cair, a primeira que couber; em último caso, corta.
  const candidatos = [
    `${abre}${emCores}. ${frase} ${longo}`,
    `${abre}${emCores}. ${frase} ${curto}`,
    `${abre}. ${frase} ${longo}`,
    `${abre}. ${frase} ${curto}`,
    `${abre}. ${frase}`,
    `${abre}${emCores}. ${m.categoria} com ${listaHumana(specs)}. ${curto}`,
    `${abre}. ${m.categoria} com ${listaHumana(specs)}. ${longo}`,
    `${abre}${emCores}. ${longo}`,
    `${abre}, ${cores.length} cores. ${longo}`,
  ].map((t) => t.replace(/\s+/g, " ").trim());
  return (
    candidatos.find((t) => t.length >= DESCRICAO_MIN && t.length <= DESCRICAO_MAX) ??
    candidatos.find((t) => t.length <= DESCRICAO_MAX) ??
    cortar(candidatos[2], DESCRICAO_MAX)
  );
}

export const descricaoEfetiva = (m: Moto, u: UnidadeId) =>
  m.descricaoSeo?.trim() || descricaoAutomatica(m, u);

/** Abertura da página quando a loja ainda não escreveu a sua. */
export function aberturaAutomatica(m: Moto, u: UnidadeId): string {
  const loja = UNIDADES[u];
  const cores = nomesDasCores(m);
  const emCores =
    cores.length > 1
      ? `em ${cores.length} cores: ${listaHumana(cores)}`
      : `na cor ${cores[0] ?? ""}`;
  return (
    `Na ${loja.nome}, em ${loja.cidade}/${loja.uf}, a ${nomeCompleto(m)} 0 km está disponível ${emCores}. ` +
    "Escolha a sua, fale com um consultor pelo WhatsApp e receba a simulação com entrada, parcelas e prazo de entrega."
  );
}

export const aberturaEfetiva = (m: Moto, u: UnidadeId) =>
  m.textoPorLoja?.[u]?.trim() || aberturaAutomatica(m, u);

// ---------------------------------------------------------------------------------
// Diagnóstico (camada 1 do painel de SEO)
// ---------------------------------------------------------------------------------

export type Nivel = "alta" | "media" | "baixa";

/** Campo do formulário do painel que resolve o problema. */
export type CampoSeo =
  | "tituloSeo"
  | "descricaoSeo"
  | "textoPagina"
  | "textoPorLoja"
  | "cores"
  | "ficha"
  | "specs"
  | "descricao"
  | "slug";

export type Achado = { nivel: Nivel; campo: CampoSeo; mensagem: string };

const PESO: Record<Nivel, number> = { alta: 15, media: 6, baixa: 2 };

export function diagnosticar(m: Moto, todas: Moto[]): Achado[] {
  const achados: Achado[] = [];
  const add = (nivel: Nivel, campo: CampoSeo, mensagem: string) =>
    achados.push({ nivel, campo, mensagem });

  // Título e descrição: medidos pela loja mais "comprida" em que a moto aparece.
  for (const u of m.unidades) {
    const cidade = UNIDADES[u].cidade;
    const t = tituloEfetivo(m, u).length;
    if (t < TITULO_MIN || t > TITULO_MAX)
      add(
        "media",
        "tituloSeo",
        `Título com ${t} caracteres em ${cidade} (o ideal é de ${TITULO_MIN} a ${TITULO_MAX}).`,
      );
    const d = descricaoEfetiva(m, u).length;
    if (d < DESCRICAO_MIN || d > DESCRICAO_MAX)
      add(
        "media",
        "descricaoSeo",
        `Descrição do Google com ${d} caracteres em ${cidade} (o ideal é de ${DESCRICAO_MIN} a ${DESCRICAO_MAX}).`,
      );
    if (!m.textoPorLoja?.[u]?.trim())
      add(
        "media",
        "textoPorLoja",
        `Sem abertura própria para ${cidade}: a página sai quase igual nos dois sites.`,
      );
  }

  const texto = m.textoPagina?.trim() ?? "";
  if (!texto)
    add(
      "media",
      "textoPagina",
      "Página sem texto próprio — o Google não tem o que ler além do card.",
    );
  else if (texto.length < TEXTO_PAGINA_MIN)
    add(
      "baixa",
      "textoPagina",
      `Texto da página curto (${texto.length} caracteres; o ideal é ${TEXTO_PAGINA_MIN} ou mais).`,
    );

  const semFoto = m.cores.filter((c) => !c.fotos.some(Boolean)).map((c) => c.nome || "sem nome");
  if (semFoto.length) add("alta", "cores", `Sem foto: ${listaHumana(semFoto)}.`);
  const fotos = m.cores.reduce((n, c) => n + c.fotos.filter(Boolean).length, 0);
  if (fotos > 0 && fotos < 2)
    add("media", "cores", "Só uma foto no total — duas ou mais ajudam na busca de imagens.");

  if (!m.ficha?.length) add("baixa", "ficha", "Sem ficha técnica na página.");
  if (m.specs.filter(Boolean).length < 3)
    add("baixa", "specs", "Menos de 3 destaques técnicos no card.");

  const slug = slugDaMoto(m);
  if (todas.some((o) => o.id !== m.id && slugDaMoto(o) === slug))
    add("alta", "slug", `Outra moto usa o mesmo endereço (/motos/${slug}).`);
  const titulo = m.tituloSeo?.trim();
  if (titulo && todas.some((o) => o.id !== m.id && o.tituloSeo?.trim() === titulo))
    add("alta", "tituloSeo", "Outra moto tem exatamente o mesmo título.");

  const ordem: Record<Nivel, number> = { alta: 0, media: 1, baixa: 2 };
  return achados.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

export function nota(achados: Achado[]): number {
  return Math.max(0, 100 - achados.reduce((s, a) => s + PESO[a.nivel], 0));
}

/** O que falta na configuração de cada loja — isso mora no código, não no painel. */
export function diagnosticarLoja(u: UnidadeId): Achado[] {
  const loja = UNIDADES[u];
  const achados: Achado[] = [];
  if (!loja.whatsapp.e164)
    achados.push({
      nivel: "alta",
      campo: "descricao",
      mensagem: "Sem número de WhatsApp — todos os botões da página dependem dele.",
    });
  if (/em breve/i.test(loja.endereco.linha1))
    achados.push({
      nivel: "alta",
      campo: "descricao",
      mensagem: 'Sem endereço — pesa muito na busca local ("moto em ' + loja.cidade + '").',
    });
  if (loja.horario.some((h) => /em breve/i.test(h)))
    achados.push({ nivel: "media", campo: "descricao", mensagem: "Sem horário de funcionamento." });
  if (/netlify\.app/.test(loja.siteUrl))
    achados.push({ nivel: "baixa", campo: "descricao", mensagem: "Ainda sem domínio próprio." });
  return achados;
}
