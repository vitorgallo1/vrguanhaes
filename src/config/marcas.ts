// Marcas que a vitrine sabe mostrar, na ordem das abas. As quatro primeiras vêm na
// ordem da primeira lista do cliente (Shineray, Suzuki, Honda, Avelloz); as seguintes,
// na ordem da atualização de 24/09 (Zontes, Yamaha, Haojue, SBM). Para mudar a ordem
// das abas, basta reordenar esta lista. A Bull fica disponível no painel para quando a
// loja passar a vender a marca.
//
// A aba só aparece na vitrine se houver pelo menos uma moto ativa daquela marca.
//
// Logos recortados de uma arte única da rede, com fundo transparente, pensados para
// fundo escuro. `altura` é ajuste ótico: algumas marcas têm símbolo alto junto do nome.
import marcaAvelloz from "@/assets/marcas/avelloz.png";
import marcaBull from "@/assets/marcas/bull.png";
import marcaHaojue from "@/assets/marcas/haojue.png";
import marcaHonda from "@/assets/marcas/honda.png";
import marcaSbm from "@/assets/marcas/sbm.png";
import marcaShineray from "@/assets/marcas/shineray.png";
import marcaSuzuki from "@/assets/marcas/suzuki.png";
import marcaYamaha from "@/assets/marcas/yamaha.png";
import marcaZontes from "@/assets/marcas/zontes.png";

export type Marca = { id: string; nome: string; logo: string; altura?: string };

export const MARCAS: Marca[] = [
  { id: "shineray", nome: "Shineray", logo: marcaShineray },
  { id: "suzuki", nome: "Suzuki", logo: marcaSuzuki },
  { id: "honda", nome: "Honda", logo: marcaHonda },
  { id: "avelloz", nome: "Avelloz", logo: marcaAvelloz },
  { id: "zontes", nome: "Zontes", logo: marcaZontes, altura: "h-7 sm:h-8" },
  { id: "yamaha", nome: "Yamaha", logo: marcaYamaha },
  { id: "haojue", nome: "Haojue", logo: marcaHaojue },
  { id: "sbm", nome: "SBM", logo: marcaSbm },
  { id: "bull", nome: "Bull", logo: marcaBull, altura: "h-6 sm:h-7" },
];

const POR_ID = new Map(MARCAS.map((m) => [m.id, m]));

export function marcaPorId(id: string): Marca {
  return POR_ID.get(id) ?? { id, nome: id, logo: "" };
}

/** Posição da marca nas abas; marca desconhecida vai para o fim. */
export function ordemDaMarca(id: string): number {
  const i = MARCAS.findIndex((m) => m.id === id);
  return i === -1 ? MARCAS.length : i;
}
