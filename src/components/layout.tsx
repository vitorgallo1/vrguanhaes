// Cabeçalho, rodapé e título de seção — iguais na página inicial e na página de cada
// moto. Os links da navegação apontam para "/#secao", então funcionam de qualquer página.
import { useEffect, useRef, useState } from "react";

import { TEM_WHATSAPP, UNIDADE, whatsappUrl } from "@/config/unidade";
import logoVRHorizontal from "@/assets/logohorizontal.png";

export const WHATSAPP = whatsappUrl();

export const NAV_LINKS = [
  { href: "/#destaques", label: "Mais vendidas" },
  { href: "/#linha", label: "Motos" },
  { href: "/#financiamento", label: "Financiamento" },
  { href: "/#experiencia", label: "Experiência" },
  { href: "/#visite", label: "Visite" },
];

// Uma arte só para os dois lugares onde a marca aparece (nav e rodapé).
// A variante "horizontal" (nav) recebe um recuo negativo à esquerda para o monograma
// encostar na margem; no rodapé o logo alinha com o parágrafo abaixo dele.
export function Logo({ variant = "default" }: { variant?: "default" | "horizontal" }) {
  const isHorizontal = variant === "horizontal";
  return (
    <a
      href="/#top"
      className={isHorizontal ? "flex items-center -ml-4 md:-ml-6" : "flex items-center"}
      aria-label={UNIDADE.nome}
    >
      <img
        src={logoVRHorizontal}
        alt={UNIDADE.nome}
        width={262}
        height={36}
        className={
          isHorizontal
            ? "h-9 w-auto max-w-full object-contain md:h-10"
            : "h-8 w-auto max-w-full object-contain md:h-9"
        }
      />
    </a>
  );
}

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rolou, setRolou] = useState(false);
  const barra = useRef<HTMLSpanElement>(null);
  // Fundo mais sólido depois que a página rola, e a barra amarela de progresso.
  useEffect(() => {
    const aoRolar = () => {
      const y = window.scrollY;
      setRolou(y > 24);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      barra.current?.style.setProperty("--p", String(total > 0 ? y / total : 0));
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  return (
    <header
      id="top"
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        rolou ? "border-border bg-background/90" : "border-transparent bg-background/40"
      }`}
    >
      <span
        ref={barra}
        aria-hidden
        className="scroll-progress absolute inset-x-0 bottom-[-1px] h-[2px] bg-primary"
      />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo variant="horizontal" />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative py-1 transition after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:text-primary hover:after:origin-left hover:after:scale-x-100"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-cta transition hover:bg-primary-dark sm:inline-flex"
          >
            Fale conosco
            <span aria-hidden>→</span>
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border text-ink transition hover:border-primary/40 hover:text-primary md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border bg-background px-5 py-4 text-sm font-medium text-muted-foreground md:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 transition hover:bg-secondary hover:text-primary"
            >
              {l.label}
            </a>
          ))}
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-cta transition hover:bg-primary-dark"
          >
            Fale conosco
            <span aria-hidden>→</span>
          </a>
        </nav>
      )}
    </header>
  );
}

// Cada seção "eyebrow + título" da página reusa o mesmo par de estilos —
// centralizado aqui pra não divergir seção a seção.
export function SectionHeading({
  kicker,
  title,
  icon: Icon,
  className = "",
}: {
  kicker: string;
  title: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={className} data-reveal="up">
      {Icon ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/60 py-1 pl-1.5 pr-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15">
            <Icon className="h-3 w-3" aria-hidden />
          </span>
          {kicker}
        </span>
      ) : (
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          <span aria-hidden className="kicker-line h-px w-8 bg-primary" />
          {kicker}
        </p>
      )}
      <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background text-muted-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="max-w-sm text-sm font-medium text-ink/80">
            A {UNIDADE.nome} é uma unidade franqueada do Grupo VR, referência em varejo
            motociclístico no Brasil.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Navegação</p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm font-semibold text-ink">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="transition hover:text-primary">
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Contato</p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm font-semibold text-ink">
            <span>{UNIDADE.endereco.curto}</span>
            {TEM_WHATSAPP ? (
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary transition hover:brightness-110"
              >
                {UNIDADE.whatsapp.exibicao}
              </a>
            ) : (
              <span>{UNIDADE.whatsapp.exibicao}</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Horário</p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm font-semibold text-ink">
            {UNIDADE.horario.map((linha) => (
              <span key={linha}>{linha}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border px-5 py-5 lg:px-8">
        <p className="text-xs font-semibold leading-relaxed text-ink/85">
          © {new Date().getFullYear()} VR Multimarcas. Todos os direitos reservados.
          <br />
          <span className="text-primary">
            {UNIDADE.razaoSocial} • <span className="whitespace-nowrap">CNPJ {UNIDADE.cnpj}</span>
          </span>
        </p>
      </div>
    </footer>
  );
}
