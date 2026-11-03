# LP VR Multimarcas — Guanhães/MG

Mesma base das LPs de Biguaçu, João Pessoa, Tijucas e Taubaté (copiada de
`vrtijucasetaubate`): TanStack Start + React 19 + Vite, SSR via Nitro com preset
`netlify`. Uma loja só (`guanhaes`). Ver `DEPLOY.md`.

## Onde mexer

- `src/config/unidade.ts` — nome, cidade, endereço, WhatsApp, horário e endereço do
  site de cada loja. Nenhum outro arquivo repete esses dados.
- `src/config/marcas.ts` — as marcas que a vitrine conhece, na ordem das abas
  (Shineray, Suzuki, Honda, Avelloz, Zontes, Yamaha, Haojue, SBM — a ordem em que o
  cliente mandou as listas), com os logos.
- `src/lib/novidades.ts` — diferença entre o catálogo do projeto e o estoque salvo; é o
  que o painel oferece em "Trazer para o estoque".
- `src/data/catalogo.ts` — as 50 motos, com as cores e as fotos por cor. É o que a
  vitrine mostra enquanto o painel está vazio, e o que o painel importa.
- `src/routes/index.tsx` — a página inteira, seção por seção:
  hero → mais vendidas (6 destaques) → catálogo com abas por marca → financiamento →
  experiência → serviços → visite → rodapé.
- `src/routes/motos.$slug.tsx` — a página própria de cada moto (`/motos/honda-cg-160-titan`):
  galeria por cor, abertura da loja, texto longo, ficha técnica, dados estruturados
  (schema.org `Motorcycle` + `BreadcrumbList`) e metatags próprias.
- `src/lib/seo.ts` — endereço (slug), título e descrição automáticos, abertura automática
  por loja e o diagnóstico que o painel de SEO mostra. Roda nos dois lados.
- `src/routes/admin.tsx` — o painel, com duas abas: Estoque e SEO.
  Ver `PAINEL.md`.
- `src/components/painel-seo.tsx` — a aba SEO (diagnóstico) e os campos de SEO do
  formulário da moto.
- `src/components/vitrine.tsx` e `src/components/layout.tsx` — card, seletor de cor,
  lightbox, cabeçalho e rodapé, compartilhados entre a página inicial e a da moto.
- `src/components/whatsapp-flutuante.tsx` — o botão flutuante, montado em `__root.tsx`
  para aparecer em todas as páginas públicas (some só no `/admin`).
- `src/lib/motos.ts` — tipos (`Moto`, `Cor`), validação e resolução de fotos.
- `src/lib/estoque.server.ts` — Netlify Blobs, com o estoque compartilhado entre os dois
  sites. Só servidor.
- `src/routes/robots[.]txt.ts` e `src/routes/sitemap[.]xml.ts` — gerados por loja, porque
  o endereço muda conforme o site. O sitemap lista a página de cada moto da loja, lido do
  estoque na hora.
- `public/og-guanhaes.jpg` — imagem de compartilhamento (1200×630).

## Como a vitrine funciona

- **Cor:** cada moto tem de 1 a 8 cores; cada cor tem de 1 a 4 fotos. A bolinha troca a
  foto do card, e o botão "Ver condições" manda para o WhatsApp o modelo e a cor
  escolhida.
- **Fotos:** links oficiais dos fabricantes (Shineray e SBM: plataforma da rede de
  concessionárias, porque o site da Shineray estava fora do ar em 23–24/09 — ver o
  cabeçalho de `src/data/catalogo.ts`). A área da foto é clara, com
  `mix-blend-multiply`, para que foto recortada e foto com fundo branco fiquem iguais —
  os fabricantes não padronizam (a PCX preta e a azul da Honda vêm com fundo branco).
- **Cor sem foto** aparece com "foto oficial em breve", sem quebrar o card.
- **Abas por marca:** "Todas" mostra os grupos de cada marca; clicar numa marca mostra só
  ela. A barra de abas fica presa no topo enquanto se rola o catálogo.
- **Destaques:** até 6 motos marcadas no painel viram a seção "Mais vendidas", na ordem de
  `posicaoDestaque` (a faixa do painel reordena).
- **Em estoque:** `emEstoque` na moto; vazio conta como em estoque (a lista que a loja
  passou é o estoque). Etiqueta verde no card, no lightbox e na página da moto.
- **Página da moto:** o nome e o botão "Detalhes" de cada card levam a ela. Só existe no
  site da loja em que a moto está marcada. Canônica, og:url e dados estruturados ficam em
  cada rota (não no `__root`): links não são deduplicados entre rotas.

## SEO

- Camada 1 (diagnóstico) pronta: aba SEO do painel. Níveis — alta: coisa quebrada ou que
  impede divulgar (foto faltando ou quebrada, endereço repetido, loja sem WhatsApp/endereço);
  média: o que mais sobe a página (texto próprio, abertura por loja, título/descrição fora da
  faixa); baixa: acabamento (ficha, destaques).
- Título e descrição automáticos já saem dentro das faixas (50–60 e 120–155) para as 50 motos.
- Endereço de moto que mudou (Storm 200 virou SBM 200 Storm) redireciona com 301 —
  `ENDERECOS_ANTIGOS` em `routes/motos.$slug.tsx`.
- Camada 2 (Search Console: posição, cliques, indexação) — espaço reservado no fim da aba;
  ligar depois de algumas semanas no ar.

## Pendências (marcadas `PENDENTE` no código)

- Razão social, CNPJ, endereço, WhatsApp e horário de Guanhães em `src/config/unidade.ts`.
- Domínio: trocar `siteUrl` em `src/config/unidade.ts`.
- Fotos da JEF 170 (só a vermelha tem foto) e trocar links de rede (Shineray/SBM) pelos do
  fabricante quando o site da Shineray voltar.
- Texto da página e abertura de Guanhães das 50 motos (guiado pela aba SEO).
- Arte do hero e foto da fachada da loja (as atuais são da rede).
