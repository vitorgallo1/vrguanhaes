// Sessão do painel /admin. Só roda no servidor.
//
// O risco aqui é uma lista de motos, não dinheiro: uma senha única, guardada em
// variável de ambiente do Netlify, é proporcional. O cookie não carrega a senha — o
// próprio TanStack Start sela (cifra e assina) o conteúdo da sessão com um segredo,
// então ninguém forja "sou admin" sem ele.
//
// Duas variáveis de ambiente, no painel do Netlify (Site settings > Environment
// variables):
//   PAINEL_SENHA   — a senha que a loja digita
//   PAINEL_SEGREDO — string aleatória de 32+ caracteres, só para selar o cookie
//
// Em desenvolvimento, sem elas, vale a senha "vr-local" e um segredo fixo. Isso nunca
// acontece em produção: se PAINEL_SENHA não estiver definida no Netlify, o login é
// recusado em vez de cair num padrão conhecido.
import { useSession } from "@tanstack/react-start/server";

type DadosSessao = { admin?: boolean };

const SEGREDO_DEV = "segredo-de-desenvolvimento-nao-usar-em-producao";

const emProducao = () => Boolean(process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY);

export function sessaoConfigurada(): boolean {
  return Boolean(process.env.PAINEL_SENHA) || !emProducao();
}

export async function sessaoDoPainel() {
  return useSession<DadosSessao>({
    name: "vr_painel",
    password: process.env.PAINEL_SEGREDO || SEGREDO_DEV,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: emProducao(),
      path: "/",
      maxAge: 60 * 60 * 12,
    },
  });
}

export async function estaLogado(): Promise<boolean> {
  const sessao = await sessaoDoPainel();
  return sessao.data.admin === true;
}

/** Comparação em tempo constante: evita descobrir a senha medindo o tempo da resposta. */
function igual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

export function senhaConfere(tentativa: string): boolean {
  const senha = process.env.PAINEL_SENHA ?? (emProducao() ? "" : "vr-local");
  if (!senha) return false;
  return igual(tentativa, senha);
}
