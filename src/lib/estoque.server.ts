// Onde o estoque mora. Só roda no servidor — nunca importe este arquivo de um
// componente; use as funções de src/servidor/estoque.ts.
//
// Em produção: Netlify Blobs do próprio site. Cada moto diz em quais lojas aparece
// (campo `unidades`) — aqui só existe Guanhães.
//
// As variáveis opcionais ESTOQUE_SITE_ID e ESTOQUE_TOKEN fazem o site ler o Blobs de
// OUTRO site do Netlify (usado quando duas lojas dividem um estoque). Guanhães não
// precisa delas.
//
// Em desenvolvimento: um JSON em .dados/estoque.json, porque o Blobs precisa do
// contexto que o Netlify injeta em tempo de execução e que não existe no `vite dev`.
import type { Moto } from "@/lib/motos";

const LOJA = "estoque";
const CHAVE = "motos";
const ARQUIVO_LOCAL = ".dados/estoque.json";

const compartilhado = () => Boolean(process.env.ESTOQUE_SITE_ID && process.env.ESTOQUE_TOKEN);

// O @netlify/blobs lê este contexto do ambiente. Se ele não está lá (e não há as
// variáveis do estoque compartilhado), não estamos rodando dentro do Netlify.
const temBlobs = () =>
  compartilhado() ||
  Boolean(process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_LOCAL_BLOBS_CONTEXT);

async function lerLocal(): Promise<Moto[] | null> {
  const { readFile } = await import("node:fs/promises");
  try {
    return JSON.parse(await readFile(ARQUIVO_LOCAL, "utf8")) as Moto[];
  } catch {
    return null;
  }
}

async function gravarLocal(motos: Moto[]): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(".dados", { recursive: true });
  await writeFile(ARQUIVO_LOCAL, JSON.stringify(motos, null, 2), "utf8");
}

async function loja() {
  const { getStore } = await import("@netlify/blobs");
  if (compartilhado()) {
    // Pela API do Netlify (não pela borda): a leitura já é a versão mais recente,
    // sem a opção `consistency`, que só existe no acesso de dentro do próprio site.
    return getStore({
      name: LOJA,
      siteID: process.env.ESTOQUE_SITE_ID as string,
      token: process.env.ESTOQUE_TOKEN as string,
    });
  }
  // `strong`: o painel salva e recarrega a lista em seguida; leitura eventual mostraria
  // a versão anterior e daria a impressão de que o salvamento não pegou.
  return getStore({ name: LOJA, consistency: "strong" });
}

/** null = nunca ninguém salvou nada (diferente de "salvou uma lista vazia"). */
export async function lerEstoque(): Promise<Moto[] | null> {
  if (!temBlobs()) return lerLocal();
  const dados = (await (await loja()).get(CHAVE, { type: "json" })) as Moto[] | null;
  return Array.isArray(dados) ? dados : null;
}

export async function gravarEstoque(motos: Moto[]): Promise<void> {
  if (!temBlobs()) return gravarLocal(motos);
  await (await loja()).setJSON(CHAVE, motos);
}

/** Para o painel avisar onde está gravando. */
export function ondeEstaGravando(): "netlify-compartilhado" | "netlify-site" | "arquivo-local" {
  if (compartilhado()) return "netlify-compartilhado";
  return temBlobs() ? "netlify-site" : "arquivo-local";
}
