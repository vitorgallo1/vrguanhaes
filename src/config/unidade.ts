// Loja de Guanhães/MG. Tudo que é específico da loja mora aqui; a página não repete
// endereço, telefone nem nome de cidade em nenhum outro arquivo.
//
// Mesma base das LPs de Biguaçu, João Pessoa, Tijucas e Taubaté. Este projeto tem uma
// loja só, então o build sempre sai como Guanhães (VITE_UNIDADE não é necessária).
//
// PENDENTE: razão social, CNPJ, endereço, WhatsApp e horário de Guanhães. Enquanto o
// WhatsApp estiver vazio, os botões abrem o WhatsApp sem destinatário e o diagnóstico
// de SEO do painel aponta o que falta.

export type UnidadeId = "guanhaes";

type DiaDaSemana =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

type Unidade = {
  id: UnidadeId;
  nome: string;
  nomeCurto: string;
  cidade: string;
  uf: string;
  /** Razão social e CNPJ, para o rodapé e os dados estruturados. */
  razaoSocial: string;
  cnpj: string;
  endereco: {
    /** Rua, número e complemento — vai para os dados estruturados. */
    rua: string;
    bairro: string;
    cep: string;
    linha1: string;
    linha2: string;
    /** Uma linha só, para o rodapé. */
    curto: string;
    /** Consulta do embed do Google Maps. */
    busca: string;
  };
  whatsapp: {
    /** Só dígitos, com 55 e DDD. Vazio = ainda não informado. */
    e164: string;
    exibicao: string;
  };
  horario: string[];
  /** O mesmo horário em formato de máquina, para os dados estruturados (schema.org). */
  funcionamento?: { dias: DiaDaSemana[]; abre: string; fecha: string }[];
  /** Endereço público do site. Alimenta canônica, og:image, robots e sitemap. */
  siteUrl: string;
};

export const UNIDADES: Record<UnidadeId, Unidade> = {
  guanhaes: {
    id: "guanhaes",
    nome: "VR Multimarcas Guanhães",
    nomeCurto: "VR Guanhães",
    cidade: "Guanhães",
    uf: "MG",
    // PENDENTE: razão social e CNPJ da loja.
    razaoSocial: "",
    cnpj: "",
    // PENDENTE: endereço do showroom.
    endereco: {
      rua: "",
      bairro: "",
      cep: "",
      linha1: "Guanhães / MG",
      linha2: "Endereço em breve",
      curto: "Guanhães/MG",
      busca: "Guanhães - MG",
    },
    // PENDENTE: WhatsApp da loja (só dígitos, com 55 e DDD — ex.: 5533999999999).
    whatsapp: { e164: "", exibicao: "" },
    // PENDENTE: confirmar horário com a loja.
    horario: ["Segunda a sexta: 09:00 às 18:00", "Sábado: 09:00 às 13:00"],
    funcionamento: [
      {
        dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        abre: "09:00",
        fecha: "18:00",
      },
      { dias: ["Saturday"], abre: "09:00", fecha: "13:00" },
    ],
    siteUrl: "https://vrmultimarcasguanhaes.netlify.app",
  },
};

export const UNIDADE_ID: UnidadeId = "guanhaes";
export const UNIDADE = UNIDADES[UNIDADE_ID];

export const SITE_URL = UNIDADE.siteUrl;

export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  UNIDADE.endereco.busca,
)}&output=embed`;

export const TEM_WHATSAPP = UNIDADE.whatsapp.e164.length > 0;

export const TELEFONE_HREF = TEM_WHATSAPP ? `tel:+${UNIDADE.whatsapp.e164}` : "";

// Link de WhatsApp com mensagem pronta. Sem argumento, usa a mensagem geral da LP.
export function whatsappUrl(mensagem?: string) {
  const texto = mensagem ?? `Olá! Gostaria de conhecer as motos da ${UNIDADE.nome}.`;
  const destino = TEM_WHATSAPP ? UNIDADE.whatsapp.e164 : "";
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}
