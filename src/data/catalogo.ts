// Catálogo que veio no projeto: as motos que a loja passou (lista de 23/09 e a
// atualização de 24/09), na ordem das marcas e, dentro de cada marca, na ordem que o
// cliente listou.
//
// Fotos: links oficiais, uma por cor — a foto de perfil que cada fabricante usa no
// próprio seletor de cor (Honda, Suzuki, Haojue, Zontes, Avelloz). Yamaha: ver abaixo.
//
// Shineray e SBM: o site da Shineray estava fora do ar em 23 e 24/09. As fotos por cor
// vêm da plataforma que a rede de concessionárias Shineray usa (as mesmas imagens em
// todas as revendas da rede) e, para SBM 150S e 400S, do site de uma concessionária da
// marca. A SHI 175 (vermelha) e as SBM 250S e 250T (vermelhas) usam fotos oficiais que
// já estavam no projeto (src/assets/motos).
// JEF 170 e New Jet 125 ainda não estão na rede: as fotos (jef170-1, newjet125-1 e -2,
// em src/assets/motos) são as de divulgação da Shineray publicadas no lançamento e no
// site de uma concessionária, com o fundo de estúdio clareado para casar com os cards.
// PENDENTE: a Shineray só divulgou a JEF 170 vermelha; as outras quatro cores mostram
// "foto em breve". Quando o site da Shineray voltar, vale trocar as fotos e os links de
// rede pelos do fabricante.
// New Jet 125 (28/09): a Shineray lançou só a bege (fev/2026) e a rede ainda não tem a
// New Jet. As outras quatro cores (cinza, branca com marrom, vermelha e preta com marrom)
// são as fotos que o cliente mandou (newjet125-cinza, -branca, -vermelha e -preta), com o
// fundo clareado e ampliadas 2x — vieram pequenas (~400 px); se chegar versão maior, trocar.
//
// A Storm 200 e a Denver passaram para a linha SBM (é como o cliente listou e como a
// rede passou a vender). DR 160 e DK 160 saíram da aba Suzuki: agora a Haojue tem aba
// própria.
//
// Mais vendidas (28/09, pedido do cliente, nesta ordem): New Jet 125, JEF 170, DK 160,
// SHI 175, NXR 160 Bros e Flash 250F — posicaoDestaque dá a ordem da seção.
//
// Yamaha (28/09): as fotos do seletor de cor do site vinham com a moto pequena no meio
// de um quadro branco e em baixa resolução. Agora são o quadro de perfil do giro 360°
// de cada cor, recortado e guardado em src/assets/motos (fz25-1, lander250-2...).
//
// Ficha técnica: só dados publicados pelo fabricante ou nos lançamentos (Motoo,
// Motociclismo Online, Motonline, Tudo de Motos, Motor Show). Onde não havia dado
// confiável, a linha ficou de fora em vez de estimada.
//
// Texto da página (textoPagina) e abertura por loja (textoPorLoja) ficam em branco de
// propósito: é o texto próprio que o cliente vai escrever, guiado pelo painel de SEO.
//
// Serve para três coisas:
//   1. é o que a vitrine mostra enquanto ninguém cadastrou nada no painel /admin;
//   2. é o ponto de partida do painel — o botão "importar o catálogo do projeto" grava
//      esta lista no estoque, e daí em diante ela é editável como qualquer outra moto;
//   3. quando este arquivo ganha motos ou fotos novas, o painel oferece trazer só a
//      diferença para o estoque já salvo (ver lib/novidades.ts).
import type { Cor, ItemFicha, Moto } from "@/lib/motos";

const HONDA = "https://www.honda.com.br/motos/sites/hda/files/";
const YAMAHA = "https://yamahamotors.fbitsstatic.net/img/p/";
const YAMAHA_360 = "https://stgmkpeus.blob.core.windows.net/yamaha-motor-strapi/uploads/";
const SUZUKI = "https://suzukimotos.com.br/storage/images/uploads/modelos/cores/";
const HAOJUE = "https://haojuemotos.com.br/storage/images/uploads/modelos/cores/";
const ZONTES = "https://zontesmotos.com.br/storage/images/uploads/modelos/cores/";
const AVELLOZ = "https://valloriza.blob.core.windows.net/avelloz/";
/** Imagens da plataforma da rede de concessionárias Shineray (Shineray e SBM). */
const REDE_SHINERAY =
  "https://dealersites-content.s3.us-east-1.amazonaws.com/dealersites/vehicles/versions/";
/** Imagens do site de uma concessionária SBM (Fabermoto). */
const REDE_SBM = "https://cloudfront.alpes.one/public/";

/** O site da Yamaha serve a foto no tamanho pedido; 1000px cobre o card e a ampliação. */
const yamaha = (caminho: string) => `${YAMAHA}${caminho}?w=1000&h=1000`;

const cor = (nome: string, hex: string, ...fotos: string[]): Cor => ({ nome, hex, fotos });
const cor2 = (nome: string, hex: string, hex2: string, ...fotos: string[]): Cor => ({
  nome,
  hex,
  hex2,
  fotos,
});
const ficha = (...linhas: [string, string][]): ItemFicha[] =>
  linhas.map(([rotulo, valor]) => ({ rotulo, valor }));

type Entrada = Omit<Moto, "destaque" | "unidades" | "ativo"> & Partial<Pick<Moto, "destaque">>;
/** Toda moto do catálogo nasce ativa, nas duas lojas e fora dos destaques. */
const moto = (m: Entrada): Moto => ({
  destaque: false,
  unidades: ["guanhaes"],
  ativo: true,
  ...m,
});

/**
 * Motos que mudaram de aba depois da primeira versão do catálogo. Serve para o painel
 * atualizar um estoque salvo antes da mudança (marca e nome antigos → novos).
 */
export const MUDARAM_DE_MARCA: Record<string, { marca: string; nome: string }> = {
  dr160: { marca: "suzuki", nome: "Haojue DR 160" },
  dk160: { marca: "suzuki", nome: "Haojue DK 160" },
  storm200: { marca: "shineray", nome: "Storm 200" },
};

/**
 * Fotos trocadas depois que o estoque já podia estar salvo no painel (28/09: as da Yamaha
 * vinham minúsculas no meio de um quadro branco; agora são as do giro 360° do site da
 * Yamaha, recortadas e guardadas no projeto; New Jet 125: as fotos provisórias da Jet
 * 125 SS dão lugar às fotos da New Jet que o cliente mandou). O painel troca a foto antiga
 * pela nova só onde ela continua igual — foto que a loja trocou por conta própria fica.
 */
export const TROCAS_DE_FOTO: {
  antiga: string;
  nova: string;
  nomeAntigo?: string;
  nomeNovo?: string;
  /** Cor da bolinha junto com a foto nova (quando a foto antiga era de outra pintura). */
  hex?: string;
  hex2?: string;
}[] = [
  { antiga: yamaha("fazer-fz25-connected-155370/352538-1.jpg"), nova: "fz25-1.webp" },
  { antiga: yamaha("fazer-fz25-connected-155370/352539-1.jpg"), nova: "fz25-2.webp" },
  { antiga: yamaha("fazer-fz25-connected-155370/352536-1.jpg"), nova: "fz25-3.webp" },
  { antiga: yamaha("fazer-fz25-connected-155370/352537-1.jpg"), nova: "fz25-4.webp" },
  { antiga: yamaha("factor-759373/969615-1.jpg"), nova: "factor150-1.webp" },
  { antiga: yamaha("factor-759373/969616-1.jpg"), nova: "factor150-2.webp" },
  { antiga: yamaha("factor-759373/969617-1.jpg"), nova: "factor150-3.webp" },
  {
    antiga: yamaha("nova-crosser-s-abs-connected-770796/1037716-1.jpg"),
    nova: "crosser150-1.webp",
  },
  {
    antiga: yamaha("nova-crosser-s-abs-connected-770796/1038145-1.jpg"),
    nova: "crosser150-2.webp",
  },
  {
    antiga: yamaha("nova-crosser-z-abs-connected-770797/1037718-1.jpg"),
    nova: "crosser150-3.webp",
  },
  { antiga: yamaha("lander-connected-150305/337219-1.jpg"), nova: "lander250-1.webp" },
  { antiga: yamaha("lander-connected-150305/337218-1.jpg"), nova: "lander250-2.webp" },
  { antiga: yamaha("lander-connected-150305/337216-1.jpg"), nova: "lander250-3.webp" },
  { antiga: yamaha("lander-connected-150305/337217-1.jpg"), nova: "lander250-4.webp" },
  { antiga: yamaha("r15-abs-151514/341195-1.jpg"), nova: "r15-1.webp" },
  { antiga: yamaha("r15-abs-151514/341114-1.jpg"), nova: "r15-2.webp" },
  { antiga: yamaha("r15-abs-151514/341274-1.jpg"), nova: "r15-3.webp" },
  { antiga: yamaha("r3-abs-connected-770613/1035845-1.jpg"), nova: "r3-1.webp" },
  {
    antiga: yamaha("r3-abs-connected-770613/1035844-1.jpg"),
    nova: "r3-2.webp",
    nomeAntigo: "Preto Fosco",
    nomeNovo: "Preto Metálico",
  },
  { antiga: yamaha("nova-nmax-abs-connected-151482/340854-1.jpg"), nova: "nmax160-1.webp" },
  { antiga: yamaha("nova-nmax-abs-connected-151482/340819-1.jpg"), nova: "nmax160-2.webp" },
  { antiga: yamaha("nova-nmax-abs-connected-151482/340894-1.jpg"), nova: "nmax160-3.webp" },
  { antiga: yamaha("xmax-300-connected-769713/1001970-1.jpg"), nova: "xmax300-1.webp" },
  { antiga: yamaha("xmax-300-connected-769713/1001969-1.jpg"), nova: "xmax300-2.webp" },
  { antiga: yamaha("xmax-300-connected-769713/1001971-1.jpg"), nova: "xmax300-3.webp" },
  {
    antiga: `${YAMAHA_360}30141_BRH_100010_B_foto360_desktop_1_f605754799.png`,
    nova: "mt03-1.webp",
  },
  {
    antiga: `${YAMAHA_360}30141_BRH_100010_A_foto360_desktop_1_bf1d225f35.png`,
    nova: "mt03-2.webp",
  },
  {
    antiga: `${YAMAHA_360}30141_BRH_100010_C_foto360_desktop_1_a76b0e3cbd.png`,
    nova: "mt03-3.webp",
  },
  {
    antiga: `${REDE_SHINERAY}shineray/foto_version_890_68e694d1cb614.webp`,
    nova: "newjet125-preta.webp",
    hex: "#111111",
    hex2: "#a8603a",
  },
  {
    antiga: `${REDE_SHINERAY}shineray/foto_version_890_68e694cac725d.webp`,
    nova: "newjet125-branca.webp",
    nomeAntigo: "Branca",
    nomeNovo: "Branca com Marrom",
    hex: "#f4f4f4",
    hex2: "#a8603a",
  },
];

/**
 * As Mais vendidas provisórias da primeira versão. Se o estoque salvo ainda tem
 * exatamente estas, ninguém escolheu outras — o painel oferece trocar pelas que o
 * cliente pediu em 28/09 (as marcadas com destaque abaixo, na ordem de posicaoDestaque).
 */
export const DESTAQUES_ANTIGOS = ["shi175", "bros160", "biz125", "cg160fan", "cg160titan", "az170"];

export const CATALOGO_BASE: Moto[] = [
  // Shineray ------------------------------------------------------------------------
  moto({
    id: "shi250",
    marca: "shineray",
    nome: "SHI 250",
    categoria: "Trail",
    descricao:
      "Trail de 250cc com câmbio de seis marchas, suspensão dianteira invertida e iluminação full LED com DRL. Fôlego para estrada e para a terra.",
    specs: ["249,6cc", "6 marchas", "Suspensão invertida"],
    ficha: ficha(
      ["Motor", "249,6 cc"],
      ["Potência", "19,3 cv a 8.000 rpm"],
      ["Torque", "18 N.m a 6.000 rpm"],
      ["Câmbio", "6 marchas"],
      ["Freios", "Disco na dianteira (267 mm) e na traseira (220 mm), com CBS"],
      ["Suspensão dianteira", "Invertida"],
      ["Painel", "Digital, com indicador de marcha"],
      ["Tanque", "18 litros"],
    ),
    cores: [
      cor("Preta", "#111111", `${REDE_SHINERAY}shineray/foto_version_890_68e907b28da21.webp`),
      cor("Vermelha", "#c8102e", `${REDE_SHINERAY}shineray/foto_version_890_68e907b61648e.webp`),
      cor("Amarela", "#f2d500", `${REDE_SHINERAY}shineray/foto_version_890_68e907b992769.webp`),
    ],
    ordem: 1,
  }),
  moto({
    id: "flash250",
    marca: "shineray",
    nome: "Flash 250F",
    categoria: "Street",
    descricao:
      "Street com motor DOHC de 248,9cc e refrigeração líquida, freios a disco e visual esportivo.",
    specs: ["248,9cc DOHC", "Refrigeração líquida", "Freio a disco"],
    ficha: ficha(
      ["Motor", "248,9 cc, DOHC"],
      ["Potência", "27,9 cv"],
      ["Refrigeração", "Líquida"],
      ["Freios", "A disco"],
    ),
    cores: [
      cor("Branca", "#f4f4f4", `${REDE_SHINERAY}shineray/foto_version_890_68e8ffcee344a.webp`),
      cor("Vermelha", "#c8102e", `${REDE_SHINERAY}shineray/foto_version_890_68e8ffd2afc8c.webp`),
      cor("Preta", "#111111", `${REDE_SHINERAY}shineray/foto_version_890_68e8ffd6612a7.webp`),
    ],
    ordem: 2,
    destaque: true,
    posicaoDestaque: 6,
  }),
  moto({
    id: "shi175",
    marca: "shineray",
    nome: "SHI 175",
    categoria: "Trail",
    descricao:
      "Trail leve e versátil, pronta para o asfalto e para a estrada de chão. Injeção eletrônica, painel digital e iluminação full LED.",
    specs: ["175cc", "Injeção eletrônica", "Painel digital"],
    ficha: ficha(
      ["Motor", "175,11 cc"],
      ["Alimentação", "Injeção eletrônica"],
      ["Câmbio", "5 marchas"],
      ["Painel", "Digital"],
      ["Iluminação", "Full LED com DRL"],
    ),
    cores: [
      cor(
        "Vermelha",
        "#d0101a",
        "shi175-1.webp",
        "shi175-2.webp",
        "shi175-3.webp",
        "shi175-4.webp",
      ),
      cor("Preta", "#111111", `${REDE_SHINERAY}shineray/foto_version_890_68e7f3a9c7f44.webp`),
      cor("Branca", "#f4f4f4", `${REDE_SHINERAY}shineray/foto_version_890_68e7f3ad599c1.webp`),
    ],
    ordem: 3,
    destaque: true,
    posicaoDestaque: 4,
  }),
  moto({
    id: "jef170",
    marca: "shineray",
    nome: "JEF 170",
    categoria: "Street",
    descricao:
      "Street urbana de 169cc com câmbio de cinco marchas, freio a disco com CBS e iluminação full LED. Mais torque que a antiga JEF 150.",
    specs: ["169,3cc", "Freio CBS", "Full LED"],
    ficha: ficha(
      ["Motor", "169,3 cc"],
      ["Potência", "13,59 cv a 8.000 rpm"],
      ["Torque", "1,53 kgf.m a 6.000 rpm"],
      ["Câmbio", "5 marchas"],
      ["Freios", "Disco dianteiro (235 mm) e tambor traseiro (128 mm), com CBS"],
      ["Altura do banco", "780 mm"],
      ["Iluminação", "Full LED"],
    ),
    cores: [
      // A vermelha vem primeiro: é a única cor com foto, e o card abre na primeira.
      cor("Vermelha", "#c8102e", "jef170-1.webp"),
      cor("Azul", "#1f4fa3"),
      cor("Branca", "#f2f2f2"),
      cor("Cinza", "#6b6f75"),
      cor("Preta", "#111111"),
    ],
    ordem: 4,
    destaque: true,
    posicaoDestaque: 2,
  }),
  moto({
    id: "newjet125",
    marca: "shineray",
    nome: "New Jet 125",
    categoria: "Cub",
    descricao:
      "Cub econômica para o dia a dia, com painel 100% digital, iluminação full LED, freio a disco dianteiro e porta USB.",
    specs: ["123,67cc", "Painel digital", "Porta USB"],
    ficha: ficha(
      ["Motor", "123,67 cc"],
      ["Potência", "7,2 cv a 7.500 rpm"],
      ["Freio dianteiro", "A disco"],
      ["Painel", "100% digital"],
      ["Iluminação", "Full LED"],
      ["Conectividade", "Porta USB 5V"],
    ),
    cores: [
      cor("Bege", "#e6cfa6", "newjet125-1.webp", "newjet125-2.webp"),
      cor("Cinza", "#95a3b8", "newjet125-cinza.webp"),
      cor2("Branca com Marrom", "#f4f4f4", "#a8603a", "newjet125-branca.webp"),
      cor("Vermelha", "#d4141c", "newjet125-vermelha.webp"),
      cor2("Preta com Marrom", "#111111", "#a8603a", "newjet125-preta.webp"),
    ],
    ordem: 5,
    destaque: true,
    posicaoDestaque: 1,
  }),

  // Suzuki --------------------------------------------------------------------------
  moto({
    id: "gsxs1000",
    marca: "suzuki",
    nome: "GSX-S1000",
    categoria: "Naked",
    descricao:
      "Naked de 152 cv com motor de quatro cilindros, freios Brembo e posição de pilotagem ereta. Visual agressivo e desempenho de sobra.",
    specs: ["152 cv", "4 cilindros", "Freios Brembo"],
    ficha: ficha(
      ["Motor", "4 cilindros em linha, DOHC, refrigeração líquida, injeção eletrônica"],
      ["Potência", "152 cv a 11.000 rpm"],
      ["Torque", "10,8 kgf.m a 9.250 rpm"],
      ["Câmbio", "6 marchas"],
      ["Freios", "Disco duplo de 310 mm com pinças Brembo na dianteira, 250 mm na traseira"],
      ["Suspensão", "Dianteira invertida, balança de alumínio"],
      ["Altura do assento", "810 mm"],
      ["Peso em ordem de marcha", "213 kg"],
      ["Tanque", "19 litros"],
    ),
    cores: [
      cor("Azul", "#00549d", `${SUZUKI}2026-05-20-18-00-14-CORES.png`),
      cor("Preta", "#111111", `${SUZUKI}2026-05-20-18-01-15-3.png`),
      cor("Vermelha", "#ac1417", `${SUZUKI}2026-05-20-18-02-09-2.png`),
    ],
    ordem: 1,
  }),
  moto({
    id: "gsx8s",
    marca: "suzuki",
    nome: "GSX-8S",
    categoria: "Naked",
    descricao:
      "Naked bicilíndrica de 776cc e 83 cv, com três modos de pilotagem, controle de tração, suspensão KYB e painel TFT colorido de 5 polegadas.",
    specs: ["776cc", "83 cv", "Controle de tração"],
    ficha: ficha(
      ["Motor", "776 cc, 2 cilindros em linha, DOHC, refrigeração líquida"],
      ["Potência", "83 cv a 8.500 rpm"],
      ["Torque", "7,95 kgf.m a 6.800 rpm"],
      ["Câmbio", "6 marchas"],
      [
        "Freios",
        "Disco duplo de 310 mm com pinças Nissin radiais na dianteira, 240 mm na traseira",
      ],
      ["Suspensão", "KYB: dianteira invertida de 41 mm, monoamortecedor com pré-carga ajustável"],
      ["Eletrônica", "3 modos de pilotagem e controle de tração"],
      ["Painel", "TFT colorido de 5 polegadas"],
      ["Altura do assento", "810 mm"],
      ["Peso em ordem de marcha", "202 kg"],
      ["Tanque", "14 litros"],
    ),
    cores: [
      cor2("Azul e Preta", "#005aa9", "#111111", `${SUZUKI}2026-07-17-12-30-38-cor-1.png`),
      cor2(
        "Vermelha e Preta Fosca",
        "#8b1637",
        "#1c1c1c",
        `${SUZUKI}2026-07-17-12-31-35-cor-3.png`,
      ),
      cor("Preta Fosca", "#1c1c1c", `${SUZUKI}2026-07-17-12-32-05-cor-2.png`),
    ],
    ordem: 2,
  }),
  moto({
    id: "vstrom650xt",
    marca: "suzuki",
    nome: "V-Strom 650XT",
    categoria: "Big trail",
    descricao:
      "Big trail com motor V-twin de 645cc e 71 cv, rodas raiadas aro 19 e 17 e tanque de 20 litros. Feita para viajar dentro e fora do asfalto.",
    specs: ["645cc V-twin", "71 cv", "Tanque de 20 L"],
    ficha: ficha(
      ["Motor", "645 cc, 2 cilindros em V a 90°, DOHC, refrigeração líquida"],
      ["Potência", "71 cv a 8.800 rpm"],
      ["Torque", "6,32 kgf.m a 6.300 rpm"],
      ["Câmbio", "6 marchas"],
      ["Freios", "Disco duplo de 310 mm na dianteira, 260 mm na traseira"],
      ["Rodas", "Raiadas, aro 19 e 17, pneus sem câmara"],
      ["Altura do assento", "835 mm"],
      ["Peso em ordem de marcha", "216 kg"],
      ["Tanque", "20 litros"],
    ),
    cores: [
      cor(
        "Amarela",
        "#ffd400",
        `${SUZUKI}2024-04-01-11-52-13-CHAMPION%20YELLOW%20NO.2%20MODELO%2024_25.png`,
      ),
      cor(
        "Preta",
        "#111111",
        `${SUZUKI}2024-04-01-11-55-24-GLASS%20SPARKLE%20BLACK%20MODELO%2024_25.png`,
      ),
      cor2(
        "Azul e Branca",
        "#1f4fa3",
        "#f2f2f2",
        `${SUZUKI}2024-04-01-11-58-37-PEARL%20VIGOR%20BLUE%20_%20PEARL%20BRILLIANT%20WHITE.png`,
      ),
    ],
    ordem: 3,
  }),
  moto({
    id: "vstrom800",
    marca: "suzuki",
    nome: "V-Strom 800",
    categoria: "Big trail",
    descricao:
      "Big trail de 776cc e 84 cv, com modos de pilotagem, quickshifter, suspensão ajustável, freios Nissin, painel TFT e tanque de 20 litros.",
    specs: ["776cc", "84 cv", "Quickshifter"],
    ficha: ficha(
      ["Motor", "776 cc, 2 cilindros em linha, DOHC, refrigeração líquida, ride by wire"],
      ["Potência", "84 cv a 8.500 rpm"],
      ["Torque", "7,96 kgf.m a 6.800 rpm"],
      ["Câmbio", "6 marchas"],
      [
        "Freios",
        "Disco duplo de 310 mm com pinças Nissin radiais na dianteira, 260 mm na traseira",
      ],
      [
        "Suspensão",
        "Dianteira invertida e monoamortecedor com pré-carga ajustável, 150 mm de curso",
      ],
      ["Rodas", "Liga leve, aro 19 e 17"],
      ["Painel", "TFT colorido de 5 polegadas"],
      ["Altura do assento", "825 mm"],
      ["Peso seco", "211 kg"],
      ["Tanque", "20 litros"],
    ),
    cores: [
      cor("Cinza", "#5d6568", `${SUZUKI}2025-11-06-16-25-20-cor1.png`),
      cor("Preta Fosca", "#293436", `${SUZUKI}2025-11-06-16-25-55-cor2.png`),
      cor("Vermelha", "#a3012b", `${SUZUKI}2025-11-06-16-26-29-cor3.png`),
    ],
    ordem: 4,
  }),

  // Honda ---------------------------------------------------------------------------
  moto({
    id: "bros160",
    marca: "honda",
    nome: "NXR 160 Bros",
    categoria: "Trail",
    descricao:
      "Trail de uso misto com motor 162,7cc flex e posição de pilotagem elevada. Duas versões: freio ABS ou CBS.",
    specs: ["162,7cc flex", "ABS ou CBS", "Trail"],
    ficha: ficha(
      ["Motor", "162,7 cc, flex"],
      ["Potência", "14,2 cv (gasolina) / 14,3 cv (etanol) a 8.000 rpm"],
      ["Torque", "1,44 kgf.m (gasolina) / 1,45 kgf.m (etanol) a 5.500 rpm"],
      ["Combustível", "Gasolina e/ou etanol"],
      ["Freios", "Versões ABS e CBS"],
    ),
    cores: [
      cor(
        "Cinza",
        "#4e5060",
        `${HONDA}2025-08/Imagem-Home-Honda-NXR-160-Bros-ABS-Cinza-Tempestade-Gray.webp`,
      ),
      cor(
        "Vermelho",
        "#ef000f",
        `${HONDA}2025-08/Imagem-Home-Honda-NXR-160-Bros-ABS-Vermelho-Fighting-Red.webp`,
      ),
      cor(
        "Azul",
        "#333b6a",
        `${HONDA}2025-08/Imagem-Home-Honda-NXR-160-Bros-CBS-Azul-Universe-Blue.webp`,
      ),
    ],
    ordem: 1,
    destaque: true,
    posicaoDestaque: 5,
  }),
  moto({
    id: "cgstart",
    marca: "honda",
    nome: "CG 160 Start",
    categoria: "Street",
    descricao:
      "A porta de entrada da família CG: motor 162,7cc, painel digital e freios CBS. Simples e econômica para o dia a dia.",
    specs: ["162,7cc", "Painel digital", "Freio CBS"],
    ficha: ficha(
      ["Motor", "162,7 cc"],
      ["Potência", "14,4 cv a 8.000 rpm"],
      ["Torque", "1,41 kgf.m a 6.750 rpm"],
      ["Combustível", "Gasolina"],
      ["Freios", "CBS"],
      ["Painel", "Digital"],
    ),
    cores: [
      cor(
        "Azul Perolizado",
        "#181c74",
        `${HONDA}2025-08/Imagem-home-visao-da-lateral-direita-da-honda-cg-160-start.webp`,
      ),
      cor(
        "Vermelho Perolizado",
        "#ff040f",
        `${HONDA}2025-08/Imagem-Home-Honda-CG-160-Start-Vermelho-Perolizado_0.webp`,
      ),
      cor("Preto", "#000000", `${HONDA}2025-08/Imagem-Home-Honda-CG-160-Start-Preto.webp`),
    ],
    ordem: 2,
  }),
  moto({
    id: "pcx160",
    marca: "honda",
    nome: "PCX 160",
    categoria: "Scooter",
    descricao:
      "Scooter premium com motor de 16 cv, iluminação full LED e versões CBS, ABS e DLX ABS. Conforto e porta-objetos para o dia a dia.",
    specs: ["16 cv", "Full LED", "CBS, ABS ou DLX"],
    ficha: ficha(
      ["Potência", "16 cv a 8.500 rpm"],
      ["Torque", "1,5 kgf.m a 6.500 rpm"],
      ["Combustível", "Gasolina"],
      ["Freios", "Versões CBS, ABS e DLX ABS"],
      ["Iluminação", "Full LED"],
    ),
    cores: [
      cor(
        "Preto Metálico",
        "#0c0c0c",
        `${HONDA}2025-08/visao-da-lateral-direita-da-moto-honda-pcx-preta.webp`,
      ),
      cor(
        "Azul Perolizado",
        "#181c74",
        `${HONDA}2025-08/visao-da-lateral-direita-da-honda-pcx-azul.webp`,
      ),
      cor("Branco Perolizado", "#dce2e7", `${HONDA}2025-08/imagem-home-honda-pcx-branco_0.webp`),
    ],
    ordem: 3,
  }),
  moto({
    id: "biz125",
    marca: "honda",
    nome: "Biz 125",
    categoria: "Cub",
    descricao:
      "Cub com novo painel digital e motor 125cc econômico. Versões EX (flex) e ES, com porta-objetos sob o banco.",
    specs: ["124,9cc", "Painel digital", "Versões EX e ES"],
    ficha: ficha(
      ["Motor", "124,9 cc"],
      ["Potência", "9,53 cv a 7.500 rpm (gasolina)"],
      ["Torque", "1,03 kgf.m a 6.000 rpm (gasolina)"],
      ["Combustível", "EX: gasolina e/ou etanol · ES: gasolina"],
      ["Painel", "Digital"],
    ),
    cores: [
      cor(
        "Cinza Perolizado",
        "#707070",
        `${HONDA}2026-05/Home%20-%20EX%20-%20Cinza%20Perolizado%20%28%20Pearl%20Stark%20Gray%20%29%20HERO.webp`,
      ),
      cor(
        "Azul Escuro Perolizado",
        "#01335b",
        `${HONDA}2026-05/Home%20-%20EX%20-%20Azul%20Escuro%20%28%20Pearl%20Cruzeiro%20Blue%29.webp`,
      ),
      cor(
        "Vermelho Metálico",
        "#99131c",
        `${HONDA}2026-05/Home%20-%20EX%20-%20Vermelho%20Met%C3%A1lico%20%28%20Pearl%20Royalty%20Red%20%29.webp`,
      ),
      cor(
        "Branco Perolizado",
        "#ebe6da",
        `${HONDA}2026-05/Home%20-%20EX%20-%20Branco%20Perolizado%20%28%20Pearl%20Lily%20Cream%20%29.webp`,
      ),
      cor(
        "Branco",
        "#edeff3",
        `${HONDA}2026-05/Home%20-%20ES%20-%20Branco%20%28%20Ross%20White%20%29%20HERO%20%281%29.webp`,
      ),
      cor(
        "Cinza Metálico",
        "#484848",
        `${HONDA}2026-05/Home%20-%20ES%20-%20Cinza%20Met%C3%A1lico%20%28%20Mat%20Cynos%20Gray%20Metallic%20%29.webp`,
      ),
    ],
    ordem: 4,
  }),
  moto({
    id: "cg160fan",
    marca: "honda",
    nome: "CG 160 Fan",
    categoria: "Street",
    descricao:
      "CG flex com freios CBS, farol e lanterna em LED. Equilíbrio entre economia e conforto para o dia a dia.",
    specs: ["162,7cc flex", "Freio CBS", "Farol LED"],
    ficha: ficha(
      ["Motor", "162,7 cc, flex"],
      ["Potência", "14,4 cv (gasolina) / 14,7 cv (etanol) a 8.000 rpm"],
      ["Torque", "1,41 kgf.m (gasolina) / 1,43 kgf.m (etanol) a 6.750 rpm"],
      ["Combustível", "Gasolina e/ou etanol"],
      ["Freios", "CBS"],
      ["Iluminação", "Farol e lanterna em LED"],
    ),
    cores: [
      cor(
        "Prata Metálico",
        "#abaaaf",
        `${HONDA}2025-08/Imagem-Home-Honda-CG-160-Fan-Prata-Met%C3%A1lico.webp`,
      ),
      cor(
        "Vermelho Perolizado",
        "#ff040f",
        `${HONDA}2025-08/Imagem-Home-Honda-CG-160-Fan-Vermelho-Perolizado.webp`,
      ),
      cor(
        "Preto Metálico",
        "#0c0c0c",
        `${HONDA}2025-08/Imagem-Home-Honda-CG-160-Fan-Preto-Met%C3%A1lico.webp`,
      ),
    ],
    ordem: 5,
  }),
  moto({
    id: "cg160titan",
    marca: "honda",
    nome: "CG 160 Titan",
    categoria: "Street",
    descricao:
      "A CG mais completa: freio ABS, painel digital, farol full LED e entrada USB-C. Motor 162,7cc flex com 14,7 cv no etanol.",
    specs: ["Freio ABS", "Farol full LED", "USB-C"],
    ficha: ficha(
      ["Motor", "162,7 cc, flex"],
      ["Potência", "14,4 cv (gasolina) / 14,7 cv (etanol) a 8.000 rpm"],
      ["Torque", "1,41 kgf.m (gasolina) / 1,43 kgf.m (etanol) a 6.750 rpm"],
      ["Combustível", "Gasolina e/ou etanol"],
      ["Freio", "ABS"],
      ["Painel", "Digital"],
      ["Farol", "Full LED"],
      ["Conectividade", "Entrada USB-C"],
    ),
    cores: [
      cor(
        "Cinza Perolizado",
        "#707070",
        `${HONDA}2025-08/Imagem-Home-Honda-CG-160-Titan-Cinza-Met%C3%A1lico.webp`,
      ),
      cor(
        "Vermelho Metálico",
        "#99131c",
        `${HONDA}2025-08/Imagem-Home-Honda-CG-160-Titan-Vermelho-Met%C3%A1lico.webp`,
      ),
      cor(
        "Preto Metálico",
        "#0c0c0c",
        `${HONDA}2025-08/Imagem-Home-Honda-CG-160-Titan-Preto-Met%C3%A1lico.webp`,
      ),
    ],
    ordem: 6,
  }),
  moto({
    id: "pop110i",
    marca: "honda",
    nome: "Pop 110i ES",
    categoria: "Street",
    descricao:
      "A Honda de entrada: leve, econômica e com partida elétrica. Injeção eletrônica e 8,4 cv para o vai e vem do dia a dia.",
    specs: ["8,4 cv", "Injeção eletrônica", "Partida elétrica"],
    ficha: ficha(
      ["Potência", "8,4 cv a 7.250 rpm"],
      ["Torque", "0,945 kgf.m a 5.000 rpm"],
      ["Combustível", "Gasolina"],
      ["Partida", "Elétrica"],
    ),
    cores: [
      cor("Azul", "#1b2e5e", `${HONDA}2026-04/HOME_Lateral_860x550_Pop%20azul.webp`),
      cor("Branca", "#edeff3", `${HONDA}2026-04/HOME_Lateral_860x550_Pop%20BRANCA.webp`),
      cor("Vermelha", "#ef000f", `${HONDA}2026-04/HOME_Lateral_860x550_Pop%20VERMELHA.webp`),
    ],
    ordem: 7,
  }),
  moto({
    id: "elite125",
    marca: "honda",
    nome: "Elite 125",
    categoria: "Scooter",
    descricao:
      "Scooter compacta e econômica para a cidade, com câmbio automático e 8,2 cv. Quatro cores, do roxo fosco ao cinza perolizado.",
    specs: ["8,2 cv", "Automática", "Gasolina"],
    ficha: ficha(
      ["Potência", "8,2 cv a 6.250 rpm"],
      ["Torque", "1,06 kgf.m a 5.000 rpm"],
      ["Combustível", "Gasolina"],
      ["Câmbio", "Automático (CVT)"],
    ),
    cores: [
      cor("Roxo Fosco", "#4b0082", `${HONDA}2026-02/scooter-honda-roxa-vista-lateral.webp`),
      cor(
        "Vermelho Metálico",
        "#99131c",
        `${HONDA}2026-02/Scooter%20Honda%20vermelha%20vis%C3%A3o%20lateral_0.webp`,
      ),
      cor(
        "Cinza Metálico",
        "#484848",
        `${HONDA}2026-02/scooter%20honda%20cinza%20perolizado%20vista%20lateral.webp`,
      ),
      cor(
        "Cinza Perolizado",
        "#707070",
        `${HONDA}2026-02/scooter%20honda%20cinza%20met%C3%A1lico%20vista%20lateral.webp`,
      ),
    ],
    ordem: 8,
  }),
  moto({
    id: "adv160",
    marca: "honda",
    nome: "ADV 160",
    categoria: "Scooter",
    descricao:
      "A scooter aventureira da Honda: visual off-road, 16 cv e posição de pilotagem alta. Vai bem na cidade e encara a estrada de terra.",
    specs: ["16 cv", "Scooter adventure", "Gasolina"],
    ficha: ficha(
      ["Potência", "16 cv a 8.500 rpm"],
      ["Torque", "1,46 kgf.m a 6.500 rpm"],
      ["Combustível", "Gasolina"],
      ["Câmbio", "Automático (CVT)"],
    ),
    cores: [
      cor(
        "Vermelho Perolizado",
        "#ed1932",
        `${HONDA}2025-08/Imagem-home-Honda-ADV-Vermelha-Lateral_0.webp`,
      ),
      cor(
        "Prata Metálico",
        "#abaaaf",
        `${HONDA}2025-08/Imagem-Home-Honda-ADV-Prata-Met%C3%A1lico_0.webp`,
      ),
    ],
    ordem: 9,
  }),
  moto({
    id: "xre190",
    marca: "honda",
    nome: "XRE 190",
    categoria: "Trail",
    descricao:
      "Trail flex para o asfalto e para a terra, nas versões Adventure e Standard. Até 16 cv com etanol e posição de pilotagem elevada.",
    specs: ["16 cv (etanol)", "Flex", "Adventure ou Standard"],
    ficha: ficha(
      ["Potência", "15,9 cv (gasolina) / 16,0 cv (etanol) a 8.000 rpm"],
      ["Torque", "1,65 kgf.m (gasolina) / 1,66 kgf.m (etanol) a 6.000 rpm"],
      ["Combustível", "Gasolina e/ou etanol"],
      ["Versões", "Adventure e Standard"],
    ),
    cores: [
      cor(
        "Cinza Perolizado (Adventure)",
        "#707070",
        `${HONDA}2025-08/imagem-home-honda-xre-190-lateral-cinza.webp`,
      ),
      cor(
        "Cinza Metálico",
        "#484848",
        `${HONDA}2025-08/Imagem-home-Honda-XRE-190-Cinza-Met%C3%A1lico.webp`,
      ),
      cor(
        "Vermelho Perolizado",
        "#ed1932",
        `${HONDA}2025-08/imagem-zoom-pequeno-honda-xre-190-lateral-vermelho.webp`,
      ),
    ],
    ordem: 10,
  }),
  moto({
    id: "crf300f",
    marca: "honda",
    nome: "CRF 300F",
    categoria: "Off-road",
    descricao:
      "Off-road da Honda para trilha e uso fora de estrada, com 24,6 cv e 2,59 kgf.m de torque. Robusta e fácil de levar na terra.",
    specs: ["24,6 cv", "2,59 kgf.m", "Fora de estrada"],
    ficha: ficha(
      ["Potência", "24,6 cv a 7.500 rpm"],
      ["Torque", "2,59 kgf.m a 6.000 rpm"],
      ["Combustível", "Gasolina"],
      ["Uso", "Fora de estrada"],
    ),
    cores: [
      cor(
        "Vermelha",
        "#fa0025",
        `${HONDA}2025-08/Imagem-Home-Honda-CRF-300F-Vermelho-Extreme-Red.webp`,
      ),
    ],
    ordem: 11,
  }),
  moto({
    id: "twister300",
    marca: "honda",
    nome: "CB 300F Twister",
    categoria: "Naked",
    descricao:
      "Naked flex nas versões Twister S e Twister ABS. Até 24,7 cv com etanol e 2,67 kgf.m de torque para cidade e estrada.",
    specs: ["24,7 cv (etanol)", "Flex", "Versões S e ABS"],
    ficha: ficha(
      ["Potência", "24,5 cv (gasolina) / 24,7 cv (etanol) a 7.500 rpm"],
      ["Torque", "2,61 kgf.m (gasolina) / 2,67 kgf.m (etanol) a 5.500 rpm"],
      ["Combustível", "Gasolina e/ou etanol"],
      ["Versões", "Twister S e Twister ABS"],
    ),
    cores: [
      cor("Azul Metálico (S)", "#38496c", `${HONDA}2026-08/Imagem-home-honda-Twister-S-AZUL.webp`),
      cor(
        "Vermelho Metálico (ABS)",
        "#9b051b",
        `${HONDA}2026-09/Twister%20ABS%20Vermelha%20-%20Lateral_1.webp`,
      ),
      cor(
        "Preto Metálico (ABS)",
        "#191919",
        `${HONDA}2026-08/Imagem-home-honda-Twister-ABS-PRETA.webp`,
      ),
    ],
    ordem: 12,
  }),
  moto({
    id: "sahara300",
    marca: "honda",
    nome: "XRE 300 Sahara",
    categoria: "Trail",
    descricao:
      "Trail flex em três versões — Adventure, Rally e Standard. Até 25,2 cv com etanol e 2,74 kgf.m de torque para viajar no asfalto e na terra.",
    specs: ["25,2 cv (etanol)", "Flex", "3 versões"],
    ficha: ficha(
      ["Potência", "24,8 cv (gasolina) / 25,2 cv (etanol) a 7.500 rpm"],
      ["Torque", "2,70 kgf.m (gasolina) / 2,74 kgf.m (etanol) a 5.750 rpm"],
      ["Combustível", "Gasolina e/ou etanol"],
      ["Versões", "Adventure, Rally e Standard"],
    ),
    cores: [
      cor("Branca (Adventure)", "#d8dae2", `${HONDA}2026-07/0048%20HONDA%2029-06-26%20ok.webp`),
      cor("Vermelha (Rally)", "#e00000", `${HONDA}2026-07/0058%20HONDA%2029-06-26%20ok.webp`),
      cor("Cinza Perolizado (Standard)", "#707070", `${HONDA}2026-07/0302%20HONDA%2029-06-26.webp`),
    ],
    ordem: 13,
  }),
  moto({
    id: "tornado300",
    marca: "honda",
    nome: "XR 300L Tornado",
    categoria: "Trail",
    descricao:
      "Trail flex com a pegada off-road da linha Tornado: até 24,8 cv com etanol e 2,74 kgf.m de torque para trilha, estrada de chão e cidade.",
    specs: ["24,8 cv (etanol)", "Flex", "Off-road"],
    ficha: ficha(
      ["Potência", "24,3 cv (gasolina) / 24,8 cv (etanol) a 7.500 rpm"],
      ["Torque", "2,70 kgf.m (gasolina) / 2,74 kgf.m (etanol) a 5.750 rpm"],
      ["Combustível", "Gasolina e/ou etanol"],
    ),
    cores: [
      cor("Vermelha", "#ef000f", `${HONDA}2026-07/0164%20HONDA%2029-06-26%20ok.webp`),
      cor("Preta", "#111111", `${HONDA}2026-07/0178%20HONDA%2029-06-26%20ok.webp`),
    ],
    ordem: 14,
  }),
  moto({
    id: "hornet500",
    marca: "honda",
    nome: "CB 500 Hornet",
    categoria: "Naked",
    descricao:
      "Naked de média cilindrada com 49,6 cv a 8.500 rpm e 4,50 kgf.m de torque. Esportiva no visual e fácil de conviver no dia a dia.",
    specs: ["49,6 cv", "4,50 kgf.m", "Gasolina"],
    ficha: ficha(
      ["Potência", "49,6 cv a 8.500 rpm"],
      ["Torque", "4,50 kgf.m a 7.000 rpm"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor(
        "Vermelha",
        "#e00000",
        `${HONDA}2025-08/Imagem-home-honda-Hornet500-Vermelha-Lateral_0.webp`,
      ),
      cor("Prata Metálico", "#abaaaf", `${HONDA}2026-06/Home_3.webp`),
      cor(
        "Preto Perolizado",
        "#121115",
        `${HONDA}2025-08/Imagem-home-honda-Hornet500-Preta-Lateral_0.webp`,
      ),
    ],
    ordem: 15,
  }),
  moto({
    id: "nx500",
    marca: "honda",
    nome: "NX 500",
    categoria: "Crossover",
    descricao:
      "Crossover para viagem e uso diário, com 49,6 cv e 4,50 kgf.m de torque. Posição de pilotagem confortável para rodar longe.",
    specs: ["49,6 cv", "4,50 kgf.m", "Crossover"],
    ficha: ficha(
      ["Potência", "49,6 cv a 8.500 rpm"],
      ["Torque", "4,50 kgf.m a 7.000 rpm"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor("Vermelha", "#e00000", `${HONDA}2025-08/Imagem-home-honda-NX500-Vermelha-Lateral.webp`),
      cor("Prata Metálico", "#abaaaf", `${HONDA}2026-06/Home.webp`),
      cor(
        "Preto Perolizado",
        "#121115",
        `${HONDA}2025-08/Imagem-home-honda-NX500-preta-Lateral.webp`,
      ),
    ],
    ordem: 16,
  }),

  // Avelloz -------------------------------------------------------------------------
  moto({
    id: "az170",
    marca: "avelloz",
    nome: "AZ170 Bravo",
    categoria: "Street",
    descricao:
      "Lançamento da Avelloz: street de 170cc com 18,3 cv, painel digital colorido, iluminação full LED e entradas USB-A e USB-C.",
    specs: ["170cc", "Painel colorido", "USB-A e USB-C"],
    ficha: ficha(
      ["Motor", "170 cc"],
      ["Potência", "18,3 cv"],
      ["Freios", "Disco dianteiro e tambor traseiro, com CBS"],
      ["Painel", "LCD colorido, 100% digital"],
      ["Iluminação", "Full LED"],
      ["Tanque", "16 litros"],
      ["Conectividade", "USB-A e USB-C"],
    ),
    cores: [
      cor(
        "Azul",
        "#1a6fd4",
        `${AVELLOZ}SITE%20DA%20AVELLOZ%202026/fotos%20170%20png/AZUL%20PNGS%20DAS%20MOTOS%20AZ170.png`,
      ),
      cor(
        "Vermelha",
        "#d42b2b",
        `${AVELLOZ}SITE%20DA%20AVELLOZ%202026/fotos%20170%20png/VERM%20PNGS%20DAS%20MOTOS%20AZ170%20(1).png`,
      ),
      cor(
        "Preta",
        "#1a1a1a",
        `${AVELLOZ}SITE%20DA%20AVELLOZ%202026/fotos%20170%20png/PRETA%20PNGS%20DAS%20MOTOS%20AZ170%20(2).png`,
      ),
    ],
    ordem: 1,
    selo: "Lançamento",
  }),
  moto({
    id: "az125",
    marca: "avelloz",
    nome: "AZ125 Alfa",
    categoria: "Cub",
    descricao:
      "Cub semiautomática de quatro marchas com farol de LED, painel digital, entradas USB-A e USB-C e espaço para bagagem sob o banco.",
    specs: ["123,67cc", "Semiautomática", "Farol LED"],
    ficha: ficha(
      ["Motor", "123,67 cc"],
      ["Potência", "8,5 cv a 8.000 rpm"],
      ["Câmbio", "Semiautomático, 4 marchas"],
      ["Freios", "Combinados: disco dianteiro e tambor traseiro"],
      ["Painel", "Digital"],
      ["Farol", "LED"],
      ["Conectividade", "USB-A e USB-C"],
      ["Bagageiro", "Espaço sob o banco"],
    ),
    cores: [
      cor(
        "Cinza",
        "#7a7a7a",
        `${AVELLOZ}SITE%20DA%20AVELLOZ%202026/LATERAL%20DIREITA%20-%20CINZA%201.png`,
      ),
      cor(
        "Branca",
        "#f0f0f0",
        `${AVELLOZ}SITE%20DA%20AVELLOZ%202026/LATERAL%20DIREITA%20-%20BRANCA%201.png`,
      ),
      cor(
        "Vermelha",
        "#d42b2b",
        `${AVELLOZ}SITE%20DA%20AVELLOZ%202026/LATERAL%20DIREITA%20-%20VERMELHA%201.png`,
      ),
      cor(
        "Preta",
        "#1a1a1a",
        `${AVELLOZ}SITE%20DA%20AVELLOZ%202026/LATERAL%20DIREITA%20-%20PRETO%201.png`,
      ),
    ],
    ordem: 2,
  }),

  // Zontes --------------------------------------------------------------------------
  moto({
    id: "t350x",
    marca: "zontes",
    nome: "T 350 X",
    categoria: "Crossover",
    descricao:
      "Crossover de 348cc e 41 cv, com suspensão invertida, ABS, chave presencial, painel TFT colorido e para-brisa com ajuste elétrico.",
    specs: ["41 cv", "Painel TFT", "Keyless"],
    ficha: ficha(
      ["Motor", "348 cc, monocilíndrico, DOHC, 4 válvulas, refrigeração líquida, injeção Bosch"],
      ["Potência", "41 cv a 8.300 rpm"],
      ["Torque", "3,34 kgf.m a 7.500 rpm"],
      [
        "Freios",
        "ABS; disco de 320 mm com pinça radial de 4 pistões na dianteira, 265 mm na traseira",
      ],
      ["Suspensão dianteira", "Invertida"],
      ["Recursos", "Chave presencial (keyless), painel TFT colorido, modos Eco e Sport, USB"],
      ["Rodas", "Raiadas, pneus sem câmara: 110/80 R19 e 160/60 R17"],
      ["Para-brisa", "Com ajuste elétrico"],
      ["Altura do assento", "830 mm"],
      ["Peso em ordem de marcha", "197 kg"],
      ["Tanque", "19 litros"],
    ),
    cores: [
      cor("Laranja", "#ff5f1f", `${ZONTES}2024-04-21-16-04-30-LARANJA.png`),
      cor("Preta", "#111111", `${ZONTES}2024-04-21-16-04-46-PRETA.png`),
      cor("Branco Pérola", "#efefef", `${ZONTES}2025-01-23-17-59-48-T350X-branca.png`),
    ],
    ordem: 1,
  }),
  moto({
    id: "r350",
    marca: "zontes",
    nome: "R 350",
    categoria: "Streetfighter",
    descricao:
      "Streetfighter de 348cc e 41 cv, com pinça radial de quatro pistões, ABS, painel TFT colorido e sensor de pressão dos pneus.",
    specs: ["41 cv", "Freio radial", "Painel TFT"],
    ficha: ficha(
      ["Motor", "348 cc, monocilíndrico, DOHC, 4 válvulas, refrigeração líquida, injeção Bosch"],
      ["Potência", "41 cv a 8.300 rpm"],
      ["Torque", "3,34 kgf.m a 7.500 rpm"],
      [
        "Freios",
        "ABS; disco de 320 mm com pinça radial de 4 pistões na dianteira, 265 mm na traseira",
      ],
      ["Suspensão dianteira", "Invertida"],
      ["Recursos", "Chave presencial (keyless), painel TFT colorido, modos Eco e Sport, USB"],
      ["Pneus", "120/70 R17 e 160/60 R17, com sensor de pressão"],
      ["Altura do assento", "795 mm"],
      ["Peso em ordem de marcha", "180 kg"],
      ["Tanque", "15 litros"],
    ),
    cores: [
      cor("Azul", "#00a0e5", `${ZONTES}2025-06-24-13-52-05-site-azul.png`),
      cor("Preta", "#111111", `${ZONTES}2025-06-24-13-52-21-site-preta.png`),
      cor("Prata Fosca", "#ced3d7", `${ZONTES}2025-06-24-13-52-46-site-branca.png`),
    ],
    ordem: 2,
  }),
  moto({
    id: "v350",
    marca: "zontes",
    nome: "V 350",
    categoria: "Cruiser",
    descricao:
      "Cruiser de 348cc e 41 cv com banco baixo, chave presencial, painel TFT colorido e injeção Bosch. Porte de moto grande para cidade e estrada.",
    specs: ["41 cv", "Banco a 765 mm", "Keyless"],
    ficha: ficha(
      ["Motor", "348 cc, monocilíndrico, DOHC, 4 válvulas, refrigeração líquida, injeção Bosch"],
      ["Potência", "41 cv a 8.300 rpm"],
      ["Torque", "3,34 kgf.m a 7.500 rpm"],
      [
        "Freios",
        "ABS; disco de 320 mm com pinça radial de 4 pistões na dianteira, 265 mm na traseira",
      ],
      ["Suspensão dianteira", "Invertida"],
      ["Recursos", "Chave presencial (keyless), painel TFT colorido, modos Eco e Sport, USB"],
      ["Pneus", "120/70 R17 e 180/55 R17"],
      ["Altura do assento", "765 mm"],
      ["Peso em ordem de marcha", "190 kg"],
      ["Tanque", "14 litros"],
    ),
    cores: [
      cor("Prata", "#d1d1d1", `${ZONTES}2025-09-16-20-11-55-branca.png`),
      cor("Preta", "#111111", `${ZONTES}2025-09-16-20-12-07-preta.png`),
      cor("Dourada", "#b4aea0", `${ZONTES}2025-09-16-20-13-13-rosa.png`),
    ],
    ordem: 3,
  }),
  moto({
    id: "s350",
    marca: "zontes",
    nome: "S 350",
    categoria: "Custom",
    descricao:
      "Muscle custom de 348cc e 41 cv, com balança monobraço em alumínio, chave presencial e painel TFT. Estilo clássico com tecnologia atual.",
    specs: ["41 cv", "Monobraço", "Keyless"],
    ficha: ficha(
      ["Motor", "348 cc, monocilíndrico, DOHC, 4 válvulas, refrigeração líquida, injeção Bosch"],
      ["Potência", "41 cv a 8.300 rpm"],
      ["Torque", "3,34 kgf.m a 7.500 rpm"],
      [
        "Freios",
        "ABS; disco de 320 mm com pinça radial de 4 pistões na dianteira, 265 mm na traseira",
      ],
      ["Suspensão dianteira", "Invertida"],
      ["Recursos", "Chave presencial (keyless), painel TFT colorido, modos Eco e Sport, USB"],
      ["Balança", "Monobraço em liga de alumínio"],
      ["Pneus", "120/70 R17 e 160/60 R17"],
      ["Altura do assento", "750 mm"],
      ["Peso em ordem de marcha", "188 kg"],
      ["Tanque", "16 litros"],
    ),
    cores: [
      cor("Preta Fosca", "#1c1c1c", `${ZONTES}2024-04-23-23-35-16-PRETA.png`),
      cor("Verde", "#0c3b18", `${ZONTES}2024-04-23-23-40-11-VERDE.png`),
    ],
    ordem: 4,
  }),

  // Yamaha --------------------------------------------------------------------------
  moto({
    id: "fz25",
    marca: "yamaha",
    nome: "Fazer FZ25",
    categoria: "Street",
    descricao:
      "Street de 249cc com freios ABS e versão Connected, que conversa com o celular. Motor SOHC refrigerado a ar, simples de manter.",
    specs: ["249cc", "Freio ABS", "Connected"],
    ficha: ficha(
      ["Motor", "249 cc, SOHC, 2 válvulas, 4 tempos, refrigeração a ar"],
      ["Freios", "ABS"],
      ["Peso", "151 kg"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor("Branco Metálico", "#eef0f2", "fz25-1.webp"),
      cor("Vermelho Metálico", "#a3131b", "fz25-2.webp"),
      cor("Azul Metálico", "#1f2f5c", "fz25-3.webp"),
      cor("Cinza Fosco", "#5b5f63", "fz25-4.webp"),
    ],
    ordem: 1,
  }),
  moto({
    id: "factor150",
    marca: "yamaha",
    nome: "Factor 150",
    categoria: "Street",
    descricao:
      "Street flex de 149cc, econômica e fácil de pilotar. Motor SOHC refrigerado a ar e 133 kg para o uso diário na cidade.",
    specs: ["149cc", "Flex", "133 kg"],
    ficha: ficha(
      ["Motor", "149 cc, SOHC, 2 válvulas, 4 tempos, refrigeração a ar"],
      ["Peso", "133 kg"],
      ["Combustível", "Gasolina e/ou etanol"],
    ),
    cores: [
      cor("Preta", "#111111", "factor150-1.webp"),
      cor("Vermelho Metálico", "#b0121b", "factor150-2.webp"),
      cor("Branca", "#f4f4f4", "factor150-3.webp"),
    ],
    ordem: 2,
  }),
  moto({
    id: "crosser150",
    marca: "yamaha",
    nome: "Crosser 150 ABS",
    categoria: "Trail",
    descricao:
      "Trail flex de 149cc com freio ABS, nas versões S e Z. Posição de pilotagem alta para a cidade e para a estrada de chão.",
    specs: ["149cc", "Flex", "Freio ABS"],
    ficha: ficha(
      ["Motor", "149 cc, SOHC, 2 válvulas, 4 tempos, refrigeração a ar"],
      ["Freios", "ABS"],
      ["Versões", "S e Z"],
      ["Peso", "137 kg"],
      ["Combustível", "Gasolina e/ou etanol"],
    ),
    cores: [
      cor("Preta", "#111111", "crosser150-1.webp"),
      cor("Vermelha", "#d0121b", "crosser150-2.webp"),
      cor("Cinza (Z)", "#8a8d91", "crosser150-3.webp"),
    ],
    ordem: 3,
  }),
  moto({
    id: "lander250",
    marca: "yamaha",
    nome: "Lander 250",
    categoria: "Trail",
    descricao:
      "Trail de 249cc para cidade, estrada e terra, na versão Connected. Quatro cores, do verde fosco ao marrom metálico.",
    specs: ["249cc", "Trail", "Connected"],
    ficha: ficha(
      ["Motor", "249 cc, SOHC, 2 válvulas, 4 tempos, refrigeração a ar"],
      ["Peso", "156 kg"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor("Verde Fosco", "#4b5a3a", "lander250-1.webp"),
      cor("Marrom Metálico", "#6b4a33", "lander250-2.webp"),
      cor("Azul Metálico", "#1f4bb4", "lander250-3.webp"),
      cor("Cinza Fosco", "#5b5f63", "lander250-4.webp"),
    ],
    ordem: 4,
  }),
  moto({
    id: "r15",
    marca: "yamaha",
    nome: "R15 ABS",
    categoria: "Esportiva",
    descricao:
      "A porta de entrada da família R: esportiva de 155cc com refrigeração líquida, quatro válvulas e freio ABS.",
    specs: ["155cc", "Refrigeração líquida", "Freio ABS"],
    ficha: ficha(
      ["Motor", "155 cc, SOHC, 4 válvulas, 4 tempos, refrigeração líquida"],
      ["Freios", "ABS"],
      ["Peso", "141 kg"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor("Branco Metálico", "#eef0f2", "r15-1.webp"),
      cor("Azul Metálico", "#1f4bb4", "r15-2.webp"),
      cor("Preto Fosco", "#1c1c1c", "r15-3.webp"),
    ],
    ordem: 5,
  }),
  moto({
    id: "r3",
    marca: "yamaha",
    nome: "R3 ABS",
    categoria: "Esportiva",
    descricao:
      "Esportiva de 321cc com motor DOHC de oito válvulas, refrigeração líquida e freio ABS. Versão Connected, pareada com o celular.",
    specs: ["321cc", "DOHC 8 válvulas", "Freio ABS"],
    ficha: ficha(
      ["Motor", "321 cc, DOHC, 8 válvulas, 4 tempos, refrigeração líquida"],
      ["Freios", "ABS"],
      ["Peso", "171 kg"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor("Azul Metálico", "#1f4bb4", "r3-1.webp"),
      cor("Preto Metálico", "#151515", "r3-2.webp"),
    ],
    ordem: 6,
  }),
  moto({
    id: "mt03",
    marca: "yamaha",
    nome: "MT-03",
    categoria: "Naked",
    descricao:
      "Naked de 321cc da família MT, com motor DOHC de oito válvulas e refrigeração líquida. Leve, com 169 kg, e com visual agressivo.",
    specs: ["321cc", "DOHC 8 válvulas", "169 kg"],
    ficha: ficha(
      ["Motor", "321 cc, DOHC, 8 válvulas, 4 tempos, refrigeração líquida"],
      ["Peso", "169 kg"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor2("Cinza Fosco", "#8f9499", "#c8e000", "mt03-1.webp"),
      cor("Azul Metálico", "#1f4bb4", "mt03-2.webp"),
      cor("Preto Fosco", "#1c1c1c", "mt03-3.webp"),
    ],
    ordem: 7,
  }),
  moto({
    id: "nmax160",
    marca: "yamaha",
    nome: "NMAX 160",
    categoria: "Scooter",
    descricao:
      "Scooter de 155cc com refrigeração líquida, freio ABS e versão Connected. Confortável e econômica para rodar todo dia.",
    specs: ["155cc", "Freio ABS", "Connected"],
    ficha: ficha(
      ["Motor", "155 cc, SOHC, 4 válvulas, 4 tempos, refrigeração líquida"],
      ["Freios", "ABS"],
      ["Peso", "131 kg"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor("Marrom Fosco", "#5a4636", "nmax160-1.webp"),
      cor("Azul Metálico", "#1f4bb4", "nmax160-2.webp"),
      cor("Vermelha", "#c8102e", "nmax160-3.webp"),
    ],
    ordem: 8,
  }),
  moto({
    id: "xmax300",
    marca: "yamaha",
    nome: "XMAX 300",
    categoria: "Scooter",
    descricao:
      "Maxiscooter de 292cc com refrigeração líquida, na versão Connected. Espaço, conforto e fôlego para cidade e estrada.",
    specs: ["292cc", "Refrigeração líquida", "Connected"],
    ficha: ficha(
      ["Motor", "292 cc, SOHC, 4 válvulas, 4 tempos, refrigeração líquida"],
      ["Peso", "183 kg"],
      ["Combustível", "Gasolina"],
    ),
    cores: [
      cor("Azul Metálico", "#1f4bb4", "xmax300-1.webp"),
      cor("Preto Fosco", "#1c1c1c", "xmax300-2.webp"),
      cor("Vermelho Metálico", "#a3131b", "xmax300-3.webp"),
    ],
    ordem: 9,
  }),

  // Haojue --------------------------------------------------------------------------
  moto({
    id: "dr160",
    marca: "haojue",
    nome: "DR 160",
    categoria: "Naked",
    descricao:
      "Naked agressiva de 162cc, com suspensão dianteira invertida e monoamortecedor ajustável em sete estágios. Visual imponente para o dia a dia na cidade.",
    specs: ["162cc", "Suspensão invertida", "Mono ajustável"],
    ficha: ficha(
      ["Motor", "162 cc"],
      ["Potência", "15 cv a 8.000 rpm"],
      ["Torque", "1,42 kgf.m a 6.500 rpm"],
      ["Suspensão dianteira", "Invertida"],
      ["Suspensão traseira", "Monoamortecedor central ajustável em 7 estágios"],
    ),
    cores: [
      cor("Branca", "#f4f4f4", `${HAOJUE}2025-06-13-19-06-06-site-branca.png`),
      cor("Vermelha", "#fb0006", `${HAOJUE}2025-06-13-19-06-26-site-vermelha.png`),
      cor2("Preta e Azul", "#111111", "#006af5", `${HAOJUE}2025-06-13-19-06-52-site-azul.png`),
    ],
    ordem: 1,
  }),
  moto({
    id: "dk160",
    marca: "haojue",
    nome: "DK 160",
    categoria: "Street",
    descricao:
      "Street de 162cc, robusta e econômica, feita para o uso diário. Grafismos renovados na linha 2026.",
    specs: ["162cc", "15 cv", "Street"],
    ficha: ficha(
      ["Motor", "162 cc"],
      ["Potência", "15 cv a 8.000 rpm"],
      ["Torque", "1,43 kgf.m a 8.000 rpm"],
      ["Categoria", "Street"],
    ),
    cores: [
      cor("Vermelha", "#e10600", `${HAOJUE}2025-05-19-13-35-41-Sem-T%C3%ADtulo-3.png`),
      cor("Preta", "#111111", `${HAOJUE}2025-05-19-13-36-09-Sem-T%C3%ADtulo-1.png`),
      cor("Azul", "#0062ff", `${HAOJUE}2025-05-19-13-36-29-Sem-T%C3%ADtulo-2.png`),
    ],
    ordem: 2,
    destaque: true,
    posicaoDestaque: 3,
  }),
  moto({
    id: "dl160",
    marca: "haojue",
    nome: "DL 160",
    categoria: "Street",
    descricao:
      "Street de 162cc com ABS de dois canais, tanque de 13 litros, sub-paralama traseiro e entrada USB. Resistente e econômica para cidade e estrada.",
    specs: ["162cc", "ABS 2 canais", "Tanque de 13 L"],
    ficha: ficha(
      ["Motor", "162,4 cc, 4 tempos, OHC, refrigerado a ar, injeção eletrônica"],
      ["Potência", "14,9 cv a 8.000 rpm"],
      ["Torque", "1,4 kgf.m a 6.500 rpm"],
      ["Freios", "ABS de 2 canais; disco de 276 mm na dianteira e 220 mm na traseira"],
      ["Suspensão", "Telescópica na dianteira, monoamortecedor na traseira"],
      ["Pneus", "100/80-17 e 130/70-17 Pirelli Sport Demon"],
      ["Altura do assento", "795 mm"],
      ["Peso em ordem de marcha", "148 kg"],
      ["Tanque", "13 litros"],
    ),
    cores: [
      cor("Azul", "#233eab", `${HAOJUE}2025-05-07-20-01-35-azul-site.png`),
      cor("Vermelha", "#ab1305", `${HAOJUE}2025-05-07-20-03-59-vermelho.png`),
      cor("Preta", "#111111", `${HAOJUE}2025-05-07-20-04-44-preto-fosco%5D.png`),
      cor("Preta Fosca", "#2a2a2a", `${HAOJUE}2025-05-07-20-05-12-preto-fosco.png`),
    ],
    ordem: 3,
  }),

  // SBM -----------------------------------------------------------------------------
  moto({
    id: "sbm150s",
    marca: "sbm",
    nome: "SBM 150S",
    categoria: "Street",
    descricao:
      "Street de 149cc para o dia a dia, com freios a disco e ABS. Rodas de liga leve, painel 100% digital e iluminação full LED.",
    specs: ["149cc", "Freio ABS", "Full LED"],
    ficha: ficha(
      ["Motor", "149 cc"],
      ["Potência", "12,3 cv a 8.500 rpm"],
      ["Freios", "A disco nas duas rodas, com ABS"],
      ["Suspensão", "Garfo telescópico na dianteira e monoshock na traseira"],
      ["Rodas", "Liga leve, aro 17"],
      ["Painel", "100% digital"],
      ["Iluminação", "Full LED"],
      ["Conectividade", "Porta USB"],
    ),
    cores: [cor("Preta", "#111111", `${REDE_SBM}6aa/928/9fc/6aa9289fc3c60364729871.webp`)],
    ordem: 1,
  }),
  moto({
    id: "storm200",
    marca: "sbm",
    nome: "SBM 200 Storm",
    categoria: "Trail",
    descricao:
      "Trail de 200cc com ABS de duplo canal, suspensão invertida, para-brisa e protetores laterais de fábrica. Painel digital e full LED.",
    specs: ["198cc", "ABS duplo canal", "Suspensão invertida"],
    ficha: ficha(
      ["Motor", "198,1 cc"],
      ["Potência", "20,4 cv a 9.000 rpm"],
      ["Freios", "Disco nas duas rodas, ABS de duplo canal"],
      ["Suspensão", "Dianteira invertida e monoamortecedor traseiro"],
      ["Painel", "Digital"],
      ["Iluminação", "Full LED"],
      ["De fábrica", "Para-brisa, protetores laterais e USB 5V"],
    ),
    cores: [
      cor("Amarela", "#e3e51b", `${REDE_SHINERAY}shineray/foto_version_890_68e806ef6a205.webp`),
      cor("Preta", "#111111", `${REDE_SHINERAY}shineray/foto_version_890_68e806f31d94e.webp`),
      cor("Cinza", "#8a8d91", `${REDE_SHINERAY}shineray/foto_version_890_68e806f6ab8eb.webp`),
    ],
    ordem: 2,
  }),
  moto({
    id: "sbm250t",
    marca: "sbm",
    nome: "SBM 250T",
    categoria: "Trail",
    descricao:
      "Trail de 250cc com câmbio de seis marchas, suspensão dianteira invertida, rodas aro 19 e 17 e ABS de duplo canal. Full LED com farol auxiliar.",
    specs: ["250cc", "6 marchas", "ABS duplo canal"],
    ficha: ficha(
      ["Motor", "250 cc"],
      ["Câmbio", "6 marchas"],
      ["Freios", "A disco, ABS de duplo canal"],
      ["Suspensão", "Dianteira invertida e monoshock na traseira"],
      ["Rodas", "Aro 19 na dianteira e 17 na traseira"],
      ["Iluminação", "Full LED, com farol auxiliar"],
      ["Painel", "Digital"],
    ),
    cores: [
      cor(
        "Vermelha",
        "#d0121b",
        "sbm250t-1.webp",
        "sbm250t-2.webp",
        "sbm250t-3.webp",
        "sbm250t-4.webp",
      ),
      cor("Azul", "#0b5fc0", `${REDE_SHINERAY}sbm/foto_version_890_6a1458529bc44.webp`),
      cor("Cinza", "#9a9da1", `${REDE_SHINERAY}sbm/foto_version_890_6a145854e6f9e.webp`),
    ],
    ordem: 3,
  }),
  moto({
    id: "sbm250s",
    marca: "sbm",
    nome: "SBM 250S",
    categoria: "Esportiva",
    descricao:
      "Esportiva de 249cc e 27,5 cv, com suspensão dianteira invertida, ABS de duplo canal, painel digital e iluminação full LED.",
    specs: ["249cc", "27,5 cv", "ABS duplo canal"],
    ficha: ficha(
      ["Motor", "249 cc"],
      ["Potência", "27,5 cv"],
      ["Freios", "ABS de duplo canal"],
      ["Suspensão", "Dianteira invertida e monoshock na traseira"],
      ["Rodas", "Liga leve"],
      ["Painel", "LCD"],
      ["Iluminação", "Full LED"],
    ),
    cores: [
      cor(
        "Vermelha",
        "#d0121b",
        "sbm250s-1.webp",
        "sbm250s-2.webp",
        "sbm250s-3.webp",
        "sbm250s-4.webp",
      ),
    ],
    ordem: 4,
  }),
  moto({
    id: "sbm400s",
    marca: "sbm",
    nome: "SBM 400S",
    categoria: "Naked",
    descricao:
      "Naked de 400cc com motor bicilíndrico de 41 cv e câmbio de seis marchas. Suspensão invertida, ABS de duplo canal e painel TFT.",
    specs: ["Bicilíndrica", "41 cv", "Painel TFT"],
    ficha: ficha(
      ["Motor", "400 cc, bicilíndrico"],
      ["Potência", "41 cv a 9.000 rpm"],
      ["Câmbio", "6 marchas"],
      ["Freios", "ABS de duplo canal"],
      ["Suspensão", "Dianteira invertida e monoshock na traseira"],
      ["Rodas", "Liga leve, aro 17"],
      ["Painel", "TFT"],
      ["Iluminação", "Full LED"],
    ),
    cores: [cor("Vermelha", "#c8102e", `${REDE_SBM}6aa/928/999/6aa9289993943010906841.webp`)],
    ordem: 5,
  }),
  moto({
    id: "sbm400rr",
    marca: "sbm",
    nome: "SBM 400RR",
    categoria: "Esportiva",
    descricao:
      "Esportiva de 400cc com motor de quatro cilindros, disco duplo na dianteira, ABS de duplo canal e painel TFT. Feita para quem gosta de giro alto.",
    specs: ["400cc", "4 cilindros", "ABS duplo canal"],
    ficha: ficha(
      ["Motor", "400 cc, quatro cilindros"],
      ["Freios", "Disco duplo na dianteira, ABS de duplo canal"],
      ["Suspensão", "Dianteira invertida e monoamortecedor na traseira"],
      ["Painel", "TFT"],
      ["Iluminação", "Full LED"],
    ),
    cores: [
      cor2(
        "Preta",
        "#111111",
        "#c8102e",
        `${REDE_SHINERAY}shineray/foto_version_890_6a71f3325e21e.webp`,
      ),
    ],
    ordem: 6,
  }),
  moto({
    id: "sbmdenver",
    marca: "sbm",
    nome: "SBM Denver",
    categoria: "Custom",
    descricao:
      "Custom de estilo clássico, com muito cromado, banco baixo e posição de pilotagem relaxada. A Denver 250 agora na linha SBM.",
    specs: ["250cc", "19 cv", "Custom clássica"],
    ficha: ficha(["Motor", "250 cc"], ["Potência", "19 cv"], ["Estilo", "Custom"]),
    cores: [
      cor("Cinza", "#9a9da1", `${REDE_SHINERAY}shineray/foto_version_890_68dd20a49eb5d.webp`),
      cor("Branca", "#f4f4f4", `${REDE_SHINERAY}shineray/foto_version_890_68dd20a84291b.webp`),
      cor("Preta", "#111111", `${REDE_SHINERAY}shineray/foto_version_890_68dd20abdba85.webp`),
    ],
    ordem: 7,
  }),
];
