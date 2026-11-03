# Painel de estoque — /admin

Abre em `vrmultimarcasguanhaes.netlify.app/admin` e edita o estoque da loja de Guanhães.

## Primeiro acesso

1. Entre com a senha (`PAINEL_SENHA`).
2. O estoque começa vazio, e a vitrine mostra o catálogo do projeto (as 50 motos).
   Clique em **Importar o catálogo do projeto** para trazer essas motos para o painel e
   editá-las a partir daí.
3. Nada vai ao ar sem **Salvar alterações**.

## Quando o catálogo do projeto ganha motos ou fotos

Se o estoque já foi salvo e depois o catálogo do projeto recebe motos, cores ou fotos
novas (como na atualização de 24/09), o site continua mostrando o estoque salvo. O painel
avisa no topo da aba Estoque, com a lista do que chegou, e o botão **Trazer para o
estoque** junta só a diferença: motos que faltam, fotos em cores que estavam sem foto,
cores novas com foto e motos que mudaram de aba (DR 160 e DK 160 → Haojue, Storm 200 →
SBM). Também troca fotos que o projeto substituiu (as da Yamaha em 28/09), só onde a foto
antiga continua lá, e, se as Mais vendidas salvas ainda forem as provisórias da primeira
versão, aplica as pedidas pelo cliente em 28/09. Nada do que já está no estoque é apagado,
e as motos novas entram fora das Mais vendidas. Revise e clique em **Salvar alterações**.

Atenção: uma moto que a loja apagou do painel de propósito volta a aparecer nessa lista
enquanto estiver no catálogo do projeto. É só não trazer, ou apagar de novo antes de
salvar.

## No dia a dia

- **Mais vendidas:** o botão ☆/★ "Mais vendida" de cada moto. Até 6. A faixa amarela no
  topo da lista mostra a ordem em que aparecem no site; as setas ← → mudam a ordem.
- **Em estoque / Sem estoque:** liga e desliga a etiqueta verde "Em estoque" no card e na
  página da moto. Moto nova já nasce em estoque.
- **Na vitrine / Escondida:** tira a moto do site sem apagar o cadastro.
- **↑ ↓:** muda a posição dentro da marca. As marcas seguem sempre a ordem Shineray,
  Suzuki, Honda, Avelloz, Zontes, Yamaha, Haojue, SBM (a ordem mora em
  `src/config/marcas.ts`).

## Cadastrar ou editar uma moto

- **Marca:** decide em que aba a moto aparece.
- **Lojas:** deixe Guanhães marcada para a moto aparecer no site.
- **Cores:** nome da cor, a bolinha (clique no quadrado para escolher a cor; "bicolor"
  para pintura de duas cores) e a foto. A primeira cor é a que o card mostra ao abrir;
  a seta ↑ promove uma cor para primeira.
- **Foto:** no site do fabricante, escolha a cor, clique com o botão direito na foto →
  "Copiar endereço da imagem" e cole. O ✓ ao lado confirma que o link abre. Foto com
  fundo branco ou recortada — as duas funcionam.
- Cor sem foto aparece no site como "foto oficial em breve".

## Aba SEO

Lista o que falta em cada página de moto para ela disputar a busca no Google, da mais
fraca para a mais forte, com uma nota de 0 a 100. **Corrigir** abre a moto já no campo
que resolve.

- **Vermelho (alta):** resolver antes de divulgar — foto faltando ou quebrada, endereço
  repetido, loja sem WhatsApp ou endereço.
- **Amarelo (média):** o que mais sobe a página — o **texto da página** e a **abertura de
  cada loja**. A abertura é o primeiro parágrafo, com a cara de Guanhães; sem ela, a
  página fica parecida com a de outras lojas da rede.
- **Cinza (baixa):** acabamento — ficha técnica, destaques do card.

No formulário da moto, a seção **Página da moto e Google** tem esses campos, a prévia de
como a página aparece no Google e a nota da moto, que muda enquanto você digita. Tudo ali
é opcional: o que fica em branco é gerado automaticamente.

Evite mudar o **endereço da página** de uma moto que já está no Google: ela perde a posição.

## Onde o estoque fica

Netlify Blobs do próprio site. Em desenvolvimento (fora do Netlify), num arquivo
`.dados/estoque.json`.
