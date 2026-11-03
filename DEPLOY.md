# Deploy — Netlify

1. Netlify → **Add new project → Import an existing project → GitHub** → escolha
   `vitorgallo1/vrguanhaes`.
2. As configurações de build vêm do `netlify.toml` (comando `bun run build`, pasta
   `dist/client`). Não precisa mudar nada.
3. Em **Environment variables**, crie:
   - `PAINEL_SENHA` = a senha do painel
   - `PAINEL_SEGREDO` = uma sequência aleatória de 32+ caracteres
4. Nome do site: `vrmultimarcasguanhaes` (o endereço que está em `siteUrl`, em
   `src/config/unidade.ts`). Se renomear, troque lá também.
5. Publique. Depois, em `/admin`, use "Trazer para o estoque" para carregar o catálogo.

> Mudou alguma variável? Ela só vale depois de um deploy novo: Deploys → Trigger deploy.

## Domínio

**Domain management → Add a domain**. Depois de apontado, troque o `siteUrl` em
`src/config/unidade.ts` — ele alimenta a URL canônica, a imagem de compartilhamento, o
`robots.txt` e o `sitemap.xml`.

## Antes de divulgar

- [ ] Razão social, CNPJ, endereço, WhatsApp e horário em `src/config/unidade.ts`.
- [ ] Domínio da loja (`siteUrl`).
- [ ] Escolher as 6 mais vendidas no painel.
- [ ] Foto da fachada de Guanhães (a atual é da rede).
