// Peças da vitrine usadas pela página inicial e pela página de cada moto: o modelo de
// exibição (Bike), o card com seletor de cor, o lightbox e os botões de WhatsApp.
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import { UNIDADE, whatsappUrl } from "@/config/unidade";
import { MARCAS, marcaPorId, type Marca } from "@/config/marcas";
import { coresResolvidas, estaEmEstoque, type Cor, type Moto } from "@/lib/motos";
import { nomeCompleto, slugDaMoto } from "@/lib/seo";

export type Bike = {
  id: string;
  marca: Marca;
  nome: string;
  /** Nome com a marca na frente, para a mensagem do WhatsApp: "Honda CG 160 Titan". */
  nomeCompleto: string;
  /** Endereço da página da moto: /motos/<slug>. */
  slug: string;
  categoria: string;
  descricao: string;
  specs: string[];
  selo?: string;
  destaque: boolean;
  posicaoDestaque?: number;
  emEstoque: boolean;
  /** Cores com as URLs das fotos já resolvidas; uma cor pode estar sem foto. */
  cores: Cor[];
};

export const paraBike = (m: Moto): Bike => {
  const marca = marcaPorId(m.marca);
  return {
    id: m.id,
    marca,
    nome: m.nome,
    nomeCompleto: nomeCompleto(m),
    slug: slugDaMoto(m),
    categoria: m.categoria,
    descricao: m.descricao,
    specs: m.specs,
    selo: m.selo,
    destaque: m.destaque,
    posicaoDestaque: m.posicaoDestaque,
    emEstoque: estaEmEstoque(m),
    cores: coresResolvidas(m),
  };
};

// A vitrine não exibe preço: o fabricante reajusta sem aviso e a condição final
// depende de entrada, prazo e análise de crédito. O botão de cada moto leva a
// conversa para o WhatsApp já dizendo o modelo e a cor escolhida.
export const linkCondicoes = (bike: Bike, cor?: Cor) =>
  whatsappUrl(
    `Olá! Vi no site da ${UNIDADE.nome} e quero ver as condições da ${bike.nomeCompleto}` +
      (cor ? ` na cor ${cor.nome}.` : "."),
  );

/** "Shineray, Suzuki, Honda e Avelloz" — na ordem das abas, só as marcas com moto. */
export function listaDeMarcas(bikes: Bike[]): string {
  const nomes = marcasPresentes(bikes).map((m) => m.nome);
  if (nomes.length <= 1) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

export function marcasPresentes(bikes: Bike[]): Marca[] {
  const ids = new Set(bikes.map((b) => b.marca.id));
  const conhecidas = MARCAS.filter((m) => ids.has(m.id));
  const outras = [...ids]
    .filter((id) => !MARCAS.some((m) => m.id === id))
    .map((id) => bikes.find((b) => b.marca.id === id)!.marca);
  return [...conhecidas, ...outras];
}

// Fundo claro de estúdio atrás das fotos, igual no card e no lightbox. Claro, e não
// escuro, porque os fabricantes não padronizam: a Honda entrega umas fotos recortadas
// (fundo transparente) e outras com fundo branco — a PCX preta e a azul, por exemplo —,
// e o painel aceita qualquer link. Com `mix-blend-multiply` na foto, o branco do fundo
// se funde com este cinza e as duas sortes de arquivo ficam iguais na vitrine.
export const STUDIO_BG =
  "bg-[radial-gradient(ellipse_at_50%_42%,_#ffffff_0%,_#ececec_58%,_#d6d6d6_100%)]";
export const FOTO = "mix-blend-multiply";

// Bolinha bicolor: meio a meio na diagonal.
export const fundoDaCor = (c: Cor) =>
  c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : c.hex;

export function BikeSpecs({ specs, className = "" }: { specs: string[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {specs.map((s) => (
        <li
          key={s}
          className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

export function Swatches({
  bike,
  ativa,
  onEscolher,
  className = "",
}: {
  bike: Bike;
  ativa: number;
  onEscolher: (i: number) => void;
  className?: string;
}) {
  if (bike.cores.length === 0) return null;
  return (
    <div
      role="group"
      aria-label={`Cores da ${bike.nome}`}
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
    >
      {bike.cores.map((c, i) => (
        <button
          key={`${c.nome}-${i}`}
          type="button"
          onClick={() => onEscolher(i)}
          aria-pressed={i === ativa}
          aria-label={c.nome}
          title={c.nome}
          // Alvo de toque de 36px; a bolinha visível tem 24px.
          className="group/cor grid h-9 w-9 place-items-center rounded-full"
        >
          <span
            className={`h-6 w-6 rounded-full transition ${
              i === ativa
                ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                : "ring-1 ring-white/25 group-hover/cor:ring-white/60"
            }`}
            style={{ background: fundoDaCor(c) }}
          />
        </button>
      ))}
    </div>
  );
}

export function FotoEmBreve({ bike, cor }: { bike: Bike; cor?: Cor }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 px-6 text-center">
      <span className="font-display text-lg font-extrabold uppercase tracking-[0.18em] text-neutral-400">
        {bike.marca.nome}
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Foto oficial em breve
      </p>
      {cor && (
        <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600">
          <span
            className="h-3 w-3 rounded-full ring-1 ring-black/15"
            style={{ background: fundoDaCor(cor) }}
          />
          {cor.nome}
        </span>
      )}
    </div>
  );
}

export function VerCondicoes({
  bike,
  cor,
  className = "",
}: {
  bike: Bike;
  cor?: Cor;
  className?: string;
}) {
  return (
    <a
      href={linkCondicoes(bike, cor)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark ${className}`}
    >
      Ver condições
      <span aria-hidden>→</span>
    </a>
  );
}

/** "● Em estoque" em verde. Some quando a loja desmarca no painel. */
export function EtiquetaEstoque({ bike, className = "" }: { bike: Bike; className?: string }) {
  if (!bike.emEstoque) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Em estoque
    </span>
  );
}

export function SeloMarca({ marca, className = "" }: { marca: Marca; className?: string }) {
  return marca.logo ? (
    <img
      src={marca.logo}
      alt={marca.nome}
      className={`w-auto object-contain opacity-80 ${className || "h-4"}`}
    />
  ) : (
    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {marca.nome}
    </span>
  );
}

export function BikeCard({
  bike,
  maisVendida,
  onAmpliar,
}: {
  bike: Bike;
  /** Só nos destaques: troca o selo do card por "Mais vendida". */
  maisVendida?: boolean;
  onAmpliar: (bike: Bike, cor: number) => void;
}) {
  const [ativa, setAtiva] = useState(0);
  const cor = bike.cores[ativa] ?? bike.cores[0];
  // Link de foto que parou de abrir (o fabricante trocou o arquivo) vira "foto em
  // breve" em vez de ícone de imagem quebrada.
  const [quebradas, setQuebradas] = useState<string[]>([]);
  const primeira = cor?.fotos[0];
  const foto = primeira && !quebradas.includes(primeira) ? primeira : undefined;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-card-hover">
      {/* Traço amarelo que cresce no pé do card no hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[3px] origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100"
      />
      <div className={`relative aspect-[16/11] overflow-hidden ${STUDIO_BG}`}>
        {foto ? (
          <button
            type="button"
            onClick={() => onAmpliar(bike, ativa)}
            aria-label={`Ampliar a ${bike.nome} na cor ${cor.nome}`}
            className="block h-full w-full cursor-zoom-in"
          >
            <img
              key={foto}
              src={foto}
              alt={`${bike.nomeCompleto} na cor ${cor.nome}`}
              width={860}
              height={550}
              loading="lazy"
              decoding="async"
              className={`h-full w-full object-contain px-4 pb-3 pt-9 transition duration-500 animate-in fade-in group-hover:-translate-y-1 group-hover:scale-[1.06] ${FOTO}`}
              onError={() => setQuebradas((q) => [...q, foto])}
            />
          </button>
        ) : (
          <FotoEmBreve bike={bike} cor={cor} />
        )}
        {/* Reflexo que atravessa a foto no hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
        />
        <span className="absolute left-3 top-3 rounded-md bg-black/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
          {bike.categoria}
        </span>
        {maisVendida ? (
          <span className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            Mais vendida
          </span>
        ) : (
          bike.selo && (
            <span className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
              {bike.selo}
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <SeloMarca marca={bike.marca} />
            <EtiquetaEstoque bike={bike} />
          </div>
          <h3 className="mt-2.5 font-display text-xl font-bold text-ink">
            <Link
              to="/motos/$slug"
              params={{ slug: bike.slug }}
              className="transition hover:text-primary"
            >
              {bike.nome}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none">
            {bike.descricao}
          </p>
        </div>

        {cor && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {bike.cores.length > 1 ? `${bike.cores.length} cores · ` : "Cor · "}
              <span className="font-semibold normal-case tracking-normal text-ink">{cor.nome}</span>
            </p>
            <Swatches bike={bike} ativa={ativa} onEscolher={setAtiva} className="-ml-1.5 mt-1" />
          </div>
        )}

        <BikeSpecs specs={bike.specs} />

        {/* Card estreito (4 colunas, página da moto) empilha os dois botões: lado a lado,
            "Ver condições" quebraria em duas linhas. */}
        <div className="@container mt-auto pt-1">
          <div className="flex flex-col-reverse gap-2 @min-[17rem]:flex-row">
            <Link
              to="/motos/$slug"
              params={{ slug: bike.slug }}
              aria-label={`Detalhes e ficha técnica da ${bike.nome}`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
            >
              Detalhes
            </Link>
            <VerCondicoes bike={bike} cor={cor} className="flex-1 whitespace-nowrap" />
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------------

export function Lightbox({
  bike,
  corInicial,
  fotoInicial,
  onClose,
}: {
  bike: Bike;
  corInicial: number;
  fotoInicial: number;
  onClose: () => void;
}) {
  const ZOOM = 2.4;
  const PAN_LIMIT = 220;
  const [visible, setVisible] = useState(false);
  const [corIndex, setCorIndex] = useState(corInicial);
  const [lbIndex, setLbIndex] = useState(fotoInicial);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const imgDrag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const cor = bike.cores[corIndex] ?? bike.cores[0];
  const imgs = cor?.fotos ?? [];

  const goTo = (delta: number) => {
    if (imgs.length < 2) return;
    setLbIndex((i) => (i + delta + imgs.length) % imgs.length);
  };

  const escolherCor = (i: number) => {
    setCorIndex(i);
    setLbIndex(0);
  };

  // Troca de foto ou de cor sempre reseta o zoom/pan da imagem anterior.
  useEffect(() => {
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }, [lbIndex, corIndex]);

  // Trava de scroll, foco inicial e devolução do foco ao elemento que abriu o lightbox.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const id = requestAnimationFrame(() => {
      setVisible(true);
      dialogRef.current?.focus();
    });
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, []);

  // Esc fecha, ←/→ navegam entre fotos, Tab fica preso dentro do modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        goTo(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgs.length, onClose]);

  const onImgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    imgDrag.current = { x: e.clientX, y: e.clientY, moved: false };
  };

  const onImgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = imgDrag.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    if (zoomed && drag.moved) {
      drag.x = e.clientX;
      drag.y = e.clientY;
      setPan((p) => ({
        x: Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, p.x + dx / ZOOM)),
        y: Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, p.y + dy / ZOOM)),
      }));
    }
  };

  const onImgPointerUp = () => {
    const drag = imgDrag.current;
    imgDrag.current = null;
    if (drag && !drag.moved) {
      setZoomed((z) => !z);
      setPan({ x: 0, y: 0 });
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:flex lg:items-center lg:justify-center lg:p-6 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${bike.nomeCompleto} — fotos e detalhes`}
        tabIndex={-1}
        className={`grid h-full w-full grid-rows-[auto_1fr] overflow-y-auto bg-card outline-none transition-all duration-300 lg:max-h-[88vh] lg:max-w-6xl lg:grid-cols-[1fr_380px] lg:grid-rows-1 lg:overflow-hidden lg:rounded-2xl lg:shadow-2xl ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div
          className={`relative flex flex-col p-4 sm:p-6 lg:h-full lg:overflow-hidden ${STUDIO_BG}`}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              <span aria-hidden>←</span> Voltar às motos
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur transition hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="relative py-2 lg:min-h-0 lg:flex-1">
            <div className="relative mx-auto aspect-[16/11] w-full lg:aspect-auto lg:h-full">
              {imgs.length > 0 ? (
                <div
                  onPointerDown={onImgPointerDown}
                  onPointerMove={onImgPointerMove}
                  onPointerUp={onImgPointerUp}
                  onPointerLeave={onImgPointerUp}
                  onPointerCancel={onImgPointerUp}
                  className={`h-full w-full touch-none select-none overflow-hidden ${
                    zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                  }`}
                >
                  <img
                    key={imgs[lbIndex]}
                    src={imgs[lbIndex]}
                    alt={`${bike.nomeCompleto} na cor ${cor.nome}`}
                    draggable={false}
                    className={`h-full w-full object-contain animate-in fade-in ${FOTO} ${zoomed ? "" : "transition-transform duration-300"}`}
                    style={{
                      transform: zoomed
                        ? `scale(${ZOOM}) translate(${pan.x}px, ${pan.y}px)`
                        : "scale(1)",
                    }}
                  />
                </div>
              ) : (
                <FotoEmBreve bike={bike} cor={cor} />
              )}
              {imgs.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(-1)}
                    aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/30 text-lg text-white backdrop-blur transition hover:bg-black/60"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    aria-label="Próxima foto"
                    className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/30 text-lg text-white backdrop-blur transition hover:bg-black/60"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>

          {imgs.length > 1 && (
            <div className="flex w-full shrink-0 justify-center gap-2 overflow-x-auto pt-2">
              {imgs.map((im, i) => (
                <button
                  key={im}
                  type="button"
                  onClick={() => setLbIndex(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-current={lbIndex === i}
                  className={`aspect-[4/3] h-16 shrink-0 overflow-hidden rounded-lg border bg-neutral-100 transition sm:h-20 ${
                    lbIndex === i
                      ? "border-primary ring-1 ring-primary/50"
                      : "border-black/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={im} alt="" className={`h-full w-full object-contain p-1 ${FOTO}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-6 lg:max-h-full lg:self-center lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <SeloMarca marca={bike.marca} className="h-5" />
                <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                  {bike.categoria}
                </span>
                <EtiquetaEstoque bike={bike} />
              </div>
              <h3 className="mt-4 font-display text-3xl font-bold text-ink">{bike.nome}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{bike.descricao}</p>
            </div>
            {cor && (
              <div className="border-y border-border py-5">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Cor ·{" "}
                  <span className="font-semibold normal-case tracking-normal text-ink">
                    {cor.nome}
                  </span>
                </p>
                <Swatches
                  bike={bike}
                  ativa={corIndex}
                  onEscolher={escolherCor}
                  className="-ml-1.5 mt-2"
                />
              </div>
            )}
            <BikeSpecs specs={bike.specs} />
            <div>
              <p className="text-sm text-muted-foreground">
                Preço, entrada e parcelas na hora, com um consultor da {UNIDADE.nomeCurto}.
              </p>
              <VerCondicoes bike={bike} cor={cor} className="mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
