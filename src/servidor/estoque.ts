// A ponte entre a página e o servidor. Cada função daqui vira uma chamada HTTP quando
// é usada no navegador e uma chamada direta quando é usada no SSR.
//
// Os imports de servidor (Blobs, sessão, node:fs) são dinâmicos e ficam dentro dos
// handlers de propósito: assim nada disso é arrastado para o pacote do navegador.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { CATALOGO_BASE } from "@/data/catalogo";
import { UNIDADE_ID } from "@/config/unidade";
import {
  LIMITE_CORES,
  LIMITE_FOTOS_POR_COR,
  normalizar,
  paraVitrine,
  type Moto,
} from "@/lib/motos";

const corSchema = z.object({
  nome: z.string().max(40),
  hex: z.string().max(9),
  hex2: z.string().max(9).optional(),
  fotos: z.array(z.string().max(500)).max(LIMITE_FOTOS_POR_COR),
});

const motoSchema = z.object({
  id: z.string().min(1),
  marca: z.string().min(1).max(30),
  nome: z.string().min(1).max(60),
  categoria: z.string().min(1).max(40),
  descricao: z.string().min(1).max(600),
  specs: z.array(z.string().max(60)).max(3),
  cores: z.array(corSchema).min(1).max(LIMITE_CORES),
  selo: z.string().max(30).optional(),
  destaque: z.boolean(),
  posicaoDestaque: z.number().int().min(1).max(99).optional(),
  emEstoque: z.boolean().optional(),
  unidades: z.array(z.enum(["guanhaes"])).min(1),
  ativo: z.boolean(),
  ordem: z.number().int().min(0),
  slug: z.string().max(80).optional(),
  tituloSeo: z.string().max(90).optional(),
  descricaoSeo: z.string().max(220).optional(),
  textoPagina: z.string().max(6000).optional(),
  textoPorLoja: z.object({ guanhaes: z.string().max(1500).optional() }).optional(),
  ficha: z
    .array(z.object({ rotulo: z.string().max(60), valor: z.string().max(120) }))
    .max(30)
    .optional(),
});

async function exigirAdmin() {
  const { estaLogado } = await import("@/lib/sessao.server");
  if (!(await estaLogado())) throw new Error("Sessão expirada. Entre de novo.");
}

/**
 * O que a vitrine desta loja mostra. Cai no catálogo do projeto enquanto o estoque
 * estiver vazio — e também se o armazenamento falhar, para a página nunca sair sem
 * motos por causa de um problema no painel.
 */
export const carregarVitrine = createServerFn().handler(async () => {
  let salvo: Moto[] | null = null;
  try {
    const { lerEstoque } = await import("@/lib/estoque.server");
    salvo = await lerEstoque();
  } catch (e) {
    console.error("Estoque indisponível, usando o catálogo do projeto:", e);
  }
  const motos = salvo && salvo.length > 0 ? salvo : CATALOGO_BASE;
  return {
    motos: paraVitrine(motos, UNIDADE_ID),
    doCatalogoBase: !salvo || salvo.length === 0,
  };
});

export const estadoDoPainel = createServerFn().handler(async () => {
  const { estaLogado, sessaoConfigurada } = await import("@/lib/sessao.server");
  const { ondeEstaGravando, lerEstoque } = await import("@/lib/estoque.server");
  const logado = await estaLogado();
  return {
    logado,
    configurado: sessaoConfigurada(),
    armazenamento: ondeEstaGravando(),
    motos: logado ? ((await lerEstoque()) ?? []) : [],
  };
});

export const entrar = createServerFn({ method: "POST" })
  .validator(z.object({ senha: z.string().max(200) }))
  .handler(async ({ data }) => {
    const { senhaConfere, sessaoDoPainel, sessaoConfigurada } = await import("@/lib/sessao.server");
    if (!sessaoConfigurada()) {
      return { ok: false as const, erro: "PAINEL_SENHA não está definida no Netlify." };
    }
    if (!senhaConfere(data.senha)) {
      // Atraso curto: encarece a tentativa em massa sem irritar quem só errou a senha.
      await new Promise((r) => setTimeout(r, 600));
      return { ok: false as const, erro: "Senha incorreta." };
    }
    const sessao = await sessaoDoPainel();
    await sessao.update({ admin: true });
    return { ok: true as const };
  });

export const sair = createServerFn({ method: "POST" }).handler(async () => {
  const { sessaoDoPainel } = await import("@/lib/sessao.server");
  await (await sessaoDoPainel()).clear();
  return { ok: true as const };
});

/**
 * Salva a lista inteira de uma vez. Só uma pessoa edita este painel, então não há
 * conflito de escrita para resolver — e uma escrita única é atômica no Blobs.
 */
export const salvarEstoque = createServerFn({ method: "POST" })
  .validator(z.object({ motos: z.array(motoSchema).max(200) }))
  .handler(async ({ data }) => {
    await exigirAdmin();
    const { gravarEstoque } = await import("@/lib/estoque.server");
    const motos: Moto[] = data.motos.map((m) => normalizar(m));
    await gravarEstoque(motos);
    return { ok: true as const, motos };
  });

/** Grava o catálogo que veio no projeto como ponto de partida do estoque. */
export const importarCatalogoBase = createServerFn({ method: "POST" }).handler(async () => {
  await exigirAdmin();
  const { gravarEstoque } = await import("@/lib/estoque.server");
  const motos = CATALOGO_BASE.map((m) => ({ ...m }));
  await gravarEstoque(motos);
  return { ok: true as const, motos };
});
