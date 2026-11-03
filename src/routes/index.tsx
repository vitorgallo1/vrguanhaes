import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MAPS_EMBED_URL, TELEFONE_HREF, TEM_WHATSAPP, UNIDADE, SITE_URL } from "@/config/unidade";
import { carregarVitrine } from "@/servidor/estoque";
import { ordenarDestaques } from "@/lib/motos";
import { marcaPorId, ordemDaMarca } from "@/config/marcas";
import { Footer, Nav, SectionHeading, WHATSAPP } from "@/components/layout";
import { Contador, atraso } from "@/components/animacoes";
import {
  BikeCard,
  Lightbox,
  SeloMarca,
  listaDeMarcas,
  marcasPresentes,
  paraBike,
  type Bike,
} from "@/components/vitrine";
import {
  ArrowRight,
  CalendarClock,
  Compass,
  DollarSign,
  LayoutGrid,
  MessageCircle,
  Percent,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import heroBike from "@/assets/hero-bike.jpg";
// PENDENTE: foto da fachada desta loja. Esta é de outra unidade da rede.
import fachadaVR from "@/assets/fachada-vr.webp";
import bancoItau from "@/assets/bancos/itau.svg";
import bancoBradesco from "@/assets/bancos/bradesco.svg";
import bancoSantander from "@/assets/bancos/santander.svg";
import bancoBB from "@/assets/bancos/bb.svg";
import bancoSicredi from "@/assets/bancos/sicredi.svg";
import bancoCaixa from "@/assets/bancos/caixa.svg";
// PNG e não SVG: são os arquivos que a loja forneceu. Recortados no limite da arte e
// exportados a 96px de altura (4x do tamanho de exibição), fundo branco — igual ao do
// quadrinho que os envolve, então some.
import bancoPorto from "@/assets/bancos/portobank.png";
import bancoPan from "@/assets/bancos/pan.png";

export const Route = createFileRoute("/")({
  head: ({ loaderData }) => ({
    meta: [{ property: "og:url", content: `${SITE_URL}/` }],
    // Canônica: o site responde no domínio próprio e no endereço do Netlify, e sem
    // isto o Google trata os dois como páginas concorrentes.
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(dadosDaLoja(loaderData?.motos.map((m) => m.marca) ?? [])),
      },
    ],
  }),
  component: Index,
  // A vitrine vem do estoque salvo no painel /admin, já filtrada para esta loja.
  // Enquanto ninguém cadastrou nada, o servidor devolve o catálogo que veio no projeto.
  loader: async () => carregarVitrine(),
});

// Concessionária de motos (schema.org/MotorcycleDealer): é o que o Google usa para ligar
// o site à loja física na busca local. Campos ainda pendentes ficam de fora em vez de
// irem com texto provisório.
function dadosDaLoja(marcasDaVitrine: string[]) {
  const temEndereco = !/em breve/i.test(UNIDADE.endereco.linha1);
  // As marcas que a vitrine desta loja mostra agora, na ordem das abas.
  const marcas = [...new Set(marcasDaVitrine)]
    .sort((a, b) => ordemDaMarca(a) - ordemDaMarca(b))
    .map((id) => marcaPorId(id).nome);
  return {
    "@context": "https://schema.org",
    "@type": "MotorcycleDealer",
    name: UNIDADE.nome,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/og-${UNIDADE.id}.jpg`,
    brand: marcas.map((name) => ({ "@type": "Brand", name })),
    legalName: UNIDADE.razaoSocial,
    taxID: UNIDADE.cnpj,
    parentOrganization: { "@type": "Organization", name: "Grupo VR" },
    address: {
      "@type": "PostalAddress",
      ...(temEndereco
        ? { streetAddress: UNIDADE.endereco.rua, postalCode: UNIDADE.endereco.cep }
        : {}),
      addressLocality: UNIDADE.cidade,
      addressRegion: UNIDADE.uf,
      addressCountry: "BR",
    },
    ...(TEM_WHATSAPP ? { telephone: `+${UNIDADE.whatsapp.e164}` } : {}),
    ...(UNIDADE.funcionamento
      ? {
          openingHoursSpecification: UNIDADE.funcionamento.map((f) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: f.dias.map((d) => `https://schema.org/${d}`),
            opens: f.abre,
            closes: f.fecha,
          })),
        }
      : {}),
  };
}

function Index() {
  const { motos } = Route.useLoaderData();
  const bikes = useMemo(() => motos.map(paraBike), [motos]);
  const [lightbox, setLightbox] = useState<{ bike: Bike; cor: number; foto: number } | null>(null);
  const ampliar = (bike: Bike, cor: number, foto = 0) => setLightbox({ bike, cor, foto });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero bikes={bikes} />
      <FaixaDeMarcas bikes={bikes} />
      <Stats />
      <Destaques bikes={bikes} onAmpliar={ampliar} />
      <Lineup bikes={bikes} onAmpliar={ampliar} />
      <Financing />
      <Experience />
      <Services />
      <Visit />
      <Footer />
      {lightbox && (
        <Lightbox
          bike={lightbox.bike}
          corInicial={lightbox.cor}
          fotoInicial={lightbox.foto}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

// Linhas de velocidade do hero: posições fixas (não aleatórias) para o SSR e o
// navegador desenharem igual.
const LINHAS_DE_VELOCIDADE = [
  { top: 18, w: 22, t: 1.8, d: 0 },
  { top: 27, w: 34, t: 1.4, d: 0.6 },
  { top: 39, w: 18, t: 2.1, d: 1.1 },
  { top: 48, w: 40, t: 1.6, d: 0.3 },
  { top: 57, w: 26, t: 1.9, d: 1.4 },
  { top: 66, w: 30, t: 1.5, d: 0.9 },
  { top: 74, w: 20, t: 2.2, d: 0.2 },
  { top: 83, w: 36, t: 1.7, d: 1.7 },
];

function Hero({ bikes }: { bikes: Bike[] }) {
  const marcas = marcasPresentes(bikes);
  return (
    <section className="relative isolate -mt-16 overflow-hidden pt-16">
      {/* Fundo desenhado (sem foto de cidade grande): preto com luz dourada, piso em
          grade com perspectiva, faixas diagonais e granulado. A moto entra por cima. */}
      <div aria-hidden className="hero-fundo absolute inset-0 -z-20" />
      <div aria-hidden className="hero-piso absolute inset-x-0 bottom-0 -z-20 h-[45%]" />
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -right-32 top-[18%] -z-10 h-[420px] w-[420px] rounded-full bg-primary/30 blur-[110px] lg:right-[6%] lg:h-[620px] lg:w-[620px]"
      />
      <div
        aria-hidden
        className="speed-lines pointer-events-none absolute inset-0 -z-10 hidden lg:block"
      >
        {LINHAS_DE_VELOCIDADE.map((l, i) => (
          <i
            key={i}
            style={
              {
                top: `${l.top}%`,
                width: `${l.w}%`,
                "--t": `${l.t}s`,
                "--d": `${l.d}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="mx-auto grid max-w-[1400px] items-center gap-6 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-x-4 lg:gap-y-0 lg:px-6 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-3xl lg:col-start-1 lg:row-start-1 lg:self-end">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-primary/40 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur sm:text-[11px]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Grupo VR • {UNIDADE.cidade}/{UNIDADE.uf}
          </span>
          <h1 className="mt-5 font-display text-[34px] font-bold leading-[1.05] tracking-tight text-white sm:mt-6 sm:text-[56px] lg:text-[66px]">
            <span className="block overflow-hidden pb-1">
              <span className="animate-rise block [animation-delay:.1s]">Sua próxima moto</span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="text-shimmer animate-rise block [animation-delay:.25s]">
                está mais perto do que você imagina.
              </span>
            </span>
          </h1>
        </div>

        <div className="relative z-10 order-3 max-w-3xl lg:order-none lg:col-start-1 lg:row-start-3">
          <p className="animate-rise max-w-lg lg:mt-6 text-[15px] leading-relaxed text-white/75 [animation-delay:.45s] sm:mt-6 sm:text-lg">
            {listaDeMarcas(bikes)} no mesmo showroom. Escolha o modelo, a cor, e veja as condições
            direto no WhatsApp.
          </p>
          <div className="animate-rise mt-6 grid grid-cols-1 gap-3 [animation-delay:.6s] sm:mt-9 sm:flex sm:flex-wrap sm:items-center">
            <a
              href="#linha"
              className="btn-shine group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-cta transition hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-[0_12px_30px_-10px_hsl(47_97%_48%/0.7)]"
            >
              Ver as motos
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20"
            >
              <span className="h-2 w-2 animate-ping-soft rounded-full bg-emerald-400" />
              Falar no WhatsApp
            </a>
          </div>
        </div>

        {/* Moto em estúdio, com a borda dissolvida no preto. No celular vem depois dos
            botões, menor; no computador fica à direita, grande. */}
        <div className="relative order-2 -mx-5 -my-4 sm:mx-0 lg:order-none sm:my-0 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:-mr-10 lg:self-center">
          <div className="animate-rise [animation-delay:.35s]">
            <img
              src={heroBike}
              alt="Moto naked azul em estúdio, iluminada por trás com luz dourada"
              width={1600}
              height={1200}
              fetchPriority="high"
              className="hero-moto relative mx-auto aspect-[4/3] w-[92%] max-w-[720px] object-cover sm:w-full"
            />
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[15%] bottom-[8%] h-6 rounded-[50%] bg-primary/30 blur-2xl"
          />
        </div>

        <dl className="animate-rise order-4 grid lg:order-none grid-cols-3 gap-x-4 border-t border-white/15 pt-5 text-left [animation-delay:.75s] sm:max-w-xl sm:gap-x-6 sm:pt-6 lg:col-start-1 lg:row-start-4 lg:mt-10">
          {[
            // Contados da própria vitrine: mudou o estoque no painel, muda aqui.
            { k: `${marcas.length}`, u: "marcas", v: "no showroom" },
            { k: `${bikes.length}`, u: "modelos", v: "0 km" },
            { k: "8", u: "bancos", v: "no financiamento" },
          ].map((s) => (
            <div key={s.v}>
              <dt className="font-display text-2xl font-bold leading-none text-white sm:text-3xl">
                <Contador valor={s.k} />{" "}
                <span className="text-sm font-semibold text-white/80 sm:text-xl">{s.u}</span>
              </dt>
              <dd className="mt-1.5 text-[10px] uppercase tracking-widest text-white/55 sm:text-xs">
                {s.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <a
        href="#destaques"
        aria-label="Rolar para as motos"
        className="absolute bottom-6 left-1/2 hidden h-10 w-6 -translate-x-1/2 rounded-full border-2 border-white/30 transition hover:border-primary lg:block"
      >
        <span className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 rounded-full bg-primary [animation:vr-cue_1.6s_infinite]" />
      </a>
    </section>
  );
}

// Faixa com os logos das marcas da vitrine, rolando sozinha. Lista duplicada para o
// loop não ter emenda; a segunda cópia é escondida dos leitores de tela.
function FaixaDeMarcas({ bikes }: { bikes: Bike[] }) {
  const marcas = marcasPresentes(bikes).filter((m) => m.logo);
  if (marcas.length < 3) return null;
  const volta = [...marcas, ...marcas, ...marcas];
  return (
    <section
      aria-label="Marcas do showroom"
      className="relative border-y border-border bg-surface py-6"
    >
      <div className="mask-x overflow-hidden">
        <div className="marquee items-center gap-16 pr-16 [--dur:40s]">
          {[0, 1].map((copia) => (
            <div key={copia} aria-hidden={copia === 1} className="flex items-center gap-16">
              {volta.map((m, i) => (
                <img
                  key={`${m.id}-${i}`}
                  src={m.logo}
                  alt={copia === 0 && i < marcas.length ? m.nome : ""}
                  className={`w-auto shrink-0 object-contain opacity-50 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 ${m.altura ?? "h-6 sm:h-7"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { k: "+193", v: "Lojas Grupo VR", d: "Presente em 12 estados do Brasil" },
    { k: "+15 anos", v: "De mercado", d: "Tradição e credibilidade no setor" },
    { k: "9,7/10", v: "Satisfação", d: "Avaliação dos nossos clientes" },
    { k: "24h", v: "Aprovação de crédito", d: "Financiamento sem burocracia" },
  ];
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-border px-5 py-10 sm:grid-cols-4 sm:divide-x lg:px-8">
        {items.map((s, i) => (
          <div
            key={s.v}
            data-reveal="up"
            style={atraso(i, 100)}
            className={`group px-2 py-3 sm:px-6 ${i > 0 ? "sm:pl-8" : ""}`}
          >
            <p className="font-display text-3xl font-bold text-primary transition-transform duration-300 group-hover:-translate-y-0.5 sm:text-4xl">
              <Contador valor={s.k} />
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">{s.v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------
// Seções da vitrine
// ---------------------------------------------------------------------------------

function Destaques({
  bikes,
  onAmpliar,
}: {
  bikes: Bike[];
  onAmpliar: (bike: Bike, cor: number) => void;
}) {
  const lista = ordenarDestaques(bikes).slice(0, 6);
  if (lista.length === 0) return null;
  return (
    <section id="destaques" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:py-20 lg:px-10 lg:py-24">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            kicker="Destaques da loja"
            title={
              <>
                As TOP {lista.length} mais vendidas
                <br className="hidden sm:block" /> da VR.
              </>
            }
            className="max-w-2xl"
          />
          <p className="max-w-sm text-muted-foreground">
            Os modelos que mais se destacam no momento. Escolha a cor e peça as condições — a
            resposta vem no WhatsApp.
          </p>
        </header>
        {/* No celular, uma fileira que desliza para o lado: seis cards empilhados
            empurrariam o catálogo para muito longe. */}
        <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {lista.map((b, i) => (
            <div
              key={b.id}
              data-reveal="up"
              style={atraso(i % 3, 110)}
              className="flex w-[84%] shrink-0 snap-center sm:w-auto"
            >
              <BikeCard bike={b} maisVendida onAmpliar={onAmpliar} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
          Deslize para ver as {lista.length} →
        </p>
      </div>
    </section>
  );
}

function AbaMarca({
  id,
  ativa,
  aoEscolher,
  rotulo,
  children,
}: {
  id: string;
  ativa: string;
  aoEscolher: (id: string) => void;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => aoEscolher(id)}
      aria-pressed={ativa === id}
      aria-label={rotulo}
      className={`inline-flex h-12 shrink-0 items-center gap-2.5 rounded-full border px-5 text-sm font-semibold transition ${
        ativa === id
          ? "border-primary bg-primary/10 text-ink shadow-[0_0_24px_-6px_hsl(47_97%_48%/0.6)] ring-1 ring-primary/40"
          : "border-border bg-surface text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Lineup({
  bikes,
  onAmpliar,
}: {
  bikes: Bike[];
  onAmpliar: (bike: Bike, cor: number) => void;
}) {
  const marcas = useMemo(() => marcasPresentes(bikes), [bikes]);
  // Abre na primeira marca (Shineray), não em "Todas": com todas as marcas abertas a
  // lista fica comprida demais. "Todas" continua disponível, como última aba.
  const [escolhida, setFiltro] = useState<string>(() => marcas[0]?.id ?? "todas");
  const filtro =
    escolhida === "todas" || marcas.some((m) => m.id === escolhida)
      ? escolhida
      : (marcas[0]?.id ?? "todas");
  const topoRef = useRef<HTMLDivElement>(null);

  const grupos = marcas
    .filter((m) => filtro === "todas" || m.id === filtro)
    .map((m) => ({ marca: m, bikes: bikes.filter((b) => b.marca.id === m.id) }));

  const escolher = (id: string) => {
    setFiltro(id);
    // Quem clica na aba com a lista já rolada quer ver o começo da marca, não o meio
    // da marca anterior.
    const topo = topoRef.current;
    if (topo && topo.getBoundingClientRect().top < 0) {
      topo.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="linha" className="scroll-mt-16">
      <div className="mx-auto max-w-[1700px] px-5 pt-14 sm:pt-20 lg:px-10 lg:pt-24">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            kicker="Catálogo — linha 2026"
            title="Escolha pela marca."
            className="max-w-xl"
          />
          <p className="max-w-sm text-muted-foreground">
            Toque numa marca para ver só os modelos dela. Em cada moto, escolha a cor e veja as
            condições.
          </p>
        </header>
      </div>

      <div ref={topoRef} className="scroll-mt-16" />
      {/* Abas presas logo abaixo do cabeçalho: dá para trocar de marca sem voltar ao topo.
          No celular a fileira rola de lado; no computador quebra linha, porque com oito
          marcas a última aba ficaria escondida atrás de uma rolagem que o mouse não vê. */}
      <div className="sticky top-16 z-30 mt-10 border-y border-border bg-background/90 backdrop-blur-md">
        <div
          role="group"
          aria-label="Filtrar por marca"
          className="mx-auto flex max-w-[1700px] gap-2 overflow-x-auto px-5 py-3 [mask-image:linear-gradient(90deg,#000_85%,transparent)] [scrollbar-width:none] lg:flex-wrap lg:px-10 lg:[mask-image:none]"
        >
          {marcas.map((m) => {
            const total = bikes.filter((b) => b.marca.id === m.id).length;
            return (
              <AbaMarca
                key={m.id}
                ativa={filtro}
                aoEscolher={escolher}
                id={m.id}
                rotulo={`${m.nome} (${total} modelos)`}
              >
                {m.logo ? (
                  <img
                    src={m.logo}
                    alt=""
                    className={`w-auto object-contain ${m.altura ?? "h-4 sm:h-5"}`}
                  />
                ) : (
                  m.nome
                )}
                <span className="text-xs font-medium text-muted-foreground">{total}</span>
              </AbaMarca>
            );
          })}
          <AbaMarca
            ativa={filtro}
            aoEscolher={escolher}
            id="todas"
            rotulo={`Todas as marcas (${bikes.length} modelos)`}
          >
            Todas
            <span className="text-xs font-medium text-muted-foreground">{bikes.length}</span>
          </AbaMarca>
        </div>
      </div>

      <div className="mx-auto max-w-[1700px] px-5 pb-14 sm:pb-20 lg:px-10 lg:pb-24">
        {grupos.map(({ marca, bikes: lista }) => (
          <div key={marca.id} className="pt-10">
            <div data-reveal="left" className="flex items-center gap-4 border-b border-border pb-4">
              <SeloMarca marca={marca} className="h-6 sm:h-7" />
              <span className="text-sm text-muted-foreground">
                {lista.length} modelo{lista.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lista.map((b, i) => (
                <div key={b.id} data-reveal="up" style={atraso(i % 4, 90)} className="flex">
                  <BikeCard bike={b} onAmpliar={onAmpliar} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 flex flex-col items-center gap-3">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
          >
            Não achou o modelo? Pergunte no WhatsApp
            <span aria-hidden>→</span>
          </a>
          <p className="max-w-2xl text-center text-xs text-muted-foreground/70">
            Valores e condições sob consulta, sujeitos a análise de crédito e a alteração sem aviso
            prévio. Imagens ilustrativas, fornecidas pelos fabricantes; cores e itens podem variar
            conforme a versão.
          </p>
        </div>
      </div>
    </section>
  );
}

const EXPERIENCE_FEATURES = [
  {
    icon: LayoutGrid,
    t: "Curadoria multimarcas",
    d: "Trabalhamos com as principais fabricantes — você escolhe pelo modelo, não pela marca.",
  },
  {
    icon: Compass,
    t: "Test-ride sem compromisso",
    d: "Reserve, pilote e sinta. Se não for a sua moto, a gente encontra outra.",
  },
  {
    icon: MessageCircle,
    t: "Atendimento humano",
    d: "Zero robô, zero enrolação. Fala com gente que respira duas rodas.",
  },
];

function Experience() {
  return (
    <section id="experiencia" className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div data-reveal="left" className="group relative order-2 lg:order-1">
          {/* PENDENTE: foto da fachada desta loja. Esta é de outra unidade da rede — por
              isso o alt fala da rede, para não afirmar o que a imagem não mostra. */}
          <div className="overflow-hidden rounded-xl border border-border shadow-card">
            <img
              src={fachadaVR}
              alt="Fachada de uma loja da rede VR Multimarcas, com motos expostas na vitrine"
              width={1600}
              height={1069}
              loading="lazy"
              className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-105"
            />
          </div>
          <div className="animate-float absolute -bottom-6 -right-4 hidden max-w-[240px] rounded-xl border border-primary/30 bg-card/95 p-4 shadow-card-hover backdrop-blur sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Padrão VR
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cada loja segue o mesmo protocolo de excelência e curadoria do Grupo VR.
            </p>
          </div>
        </div>
        <div className="order-1 max-w-lg lg:order-2">
          <SectionHeading
            kicker="A experiência VR"
            title="Comprar moto pode ser simples de verdade."
          />
          <p data-reveal="up" className="mt-5 text-muted-foreground">
            Nada de pressão, letra miúda ou aquele papo de vendedor. Aqui você conversa com quem
            pilota, testa antes de decidir e sai com a moto certa pra você.
          </p>
          <ul className="mt-8 space-y-5">
            {EXPERIENCE_FEATURES.map((f, i) => (
              <li key={f.t} data-reveal="right" style={atraso(i, 120)} className="group flex gap-4">
                <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-ink">{f.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const items = [
    {
      t: "Oficina certificada",
      d: "Mecânicos treinados, peças originais e diagnóstico digital. Sua moto volta melhor do que entrou.",
    },
    {
      t: "Seminovos com procedência",
      d: "Toda moto usada passa por 47 pontos de inspeção antes de entrar no showroom.",
    },
    {
      t: "Acessórios e equipamentos",
      d: "Capacetes, roupas e acessórios das principais marcas para pilotar com segurança.",
    },
    {
      t: "Documentação inclusa",
      d: "Transferência, emplacamento e primeira revisão — a gente cuida de tudo pra você.",
    },
  ];
  return (
    <section id="servicos" className="mx-auto max-w-7xl px-5 py-14 sm:py-20 lg:px-8 lg:py-24">
      <SectionHeading kicker="Serviços" title="Muito além da venda." className="mb-12 max-w-2xl" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <div key={s.t} data-reveal="up" style={atraso(i, 110)} className="relative h-full">
            <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card transition duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-card-hover">
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-primary/0 blur-3xl transition duration-700 group-hover:bg-primary/25"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-3 select-none font-display text-7xl font-black leading-none text-primary/10 transition duration-500 group-hover:-translate-x-2 group-hover:translate-y-2 group-hover:text-primary/30"
              >
                0{i + 1}
              </span>
              <h3 className="font-display text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
            {i < items.length - 1 && (
              <span
                aria-hidden
                className="absolute left-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-border lg:block"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const FINANCING_STATS = [
  { icon: CalendarClock, k: "Até 48x", v: "Prazo estendido" },
  { icon: Wallet, k: "Entrada", v: "A partir de 10%" },
  { icon: Zap, k: "24h", v: "Aprovação rápida" },
  { icon: Percent, k: "0%", v: "De burocracia" },
];

// `size` é ajuste ótico: a arte do Banco PAN tem a marca pequena dentro do próprio
// quadro, então na altura padrão ela lê menor que as vizinhas.
const BANK_PARTNERS: { name: string; logo: string; size?: string }[] = [
  { name: "Itaú", logo: bancoItau },
  { name: "Bradesco", logo: bancoBradesco },
  { name: "Santander", logo: bancoSantander },
  { name: "Banco do Brasil", logo: bancoBB },
  { name: "Sicredi", logo: bancoSicredi },
  { name: "Caixa", logo: bancoCaixa },
  { name: "PortoBank", logo: bancoPorto },
  { name: "Banco PAN", logo: bancoPan, size: "h-6 sm:h-7" },
];

function Financing() {
  return (
    <section id="financiamento" className="relative overflow-hidden py-14 sm:py-20 lg:py-24">
      <img
        src={heroBike}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 hidden h-full w-full object-cover object-[48%_55%] opacity-15 [mask-image:linear-gradient(90deg,transparent,black_35%,black_75%,transparent)] lg:block"
      />
      <div aria-hidden className="absolute inset-0 bg-background/90" />
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[110px]"
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <SectionHeading
            kicker="Financiamento"
            title="Sua moto cabe no orçamento."
            icon={DollarSign}
          />
          <p data-reveal="up" className="mt-5 max-w-md text-muted-foreground">
            Trabalhamos com todos os principais bancos e financeiras. Análise em poucas horas,
            entrada facilitada e o prazo que fecha na sua rotina.
          </p>
          <div className="mt-6 h-px w-10 bg-primary" aria-hidden />
          <div data-reveal="up" style={atraso(2)} className="mt-6">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Financeiras parceiras
            </p>
            <div className="mt-3 rounded-xl border border-primary/25 bg-background/70 p-4 backdrop-blur-sm shadow-card">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {BANK_PARTNERS.map((b, i) => (
                  <span
                    key={b.name}
                    data-reveal="zoom"
                    style={atraso(i, 60)}
                    className="flex h-11 items-center justify-center rounded-lg bg-white px-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_hsl(47_97%_48%/0.6)]"
                    title={b.name}
                  >
                    <img
                      src={b.logo}
                      alt={b.name}
                      loading="lazy"
                      className={`w-auto max-w-full object-contain ${b.size ?? "h-5 sm:h-6"}`}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          data-reveal="right"
          className="borda-luz rounded-2xl border border-primary/25 bg-background/70 p-5 backdrop-blur-sm shadow-card"
        >
          <div className="divide-y divide-border/60">
            {[FINANCING_STATS.slice(0, 2), FINANCING_STATS.slice(2, 4)].map((row, i) => (
              <div key={i} className="grid grid-cols-2 divide-x divide-border/60">
                {row.map((f) => (
                  <div key={f.v} className="group flex flex-col items-center px-5 py-4 text-center">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary transition duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      <f.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <p className="mt-3 font-display text-2xl font-bold text-ink">
                      <Contador valor={f.k} />
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {f.v}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine group mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-cta transition hover:-translate-y-0.5 hover:brightness-105"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/15">
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
            Simular financiamento agora
          </a>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
            Análise rápida, <span className="text-primary">gratuita e sem burocracia.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// Sem seção de depoimentos por enquanto: os que existem na rede são de clientes de
// outras lojas. Volta quando Guanhães tiver os seus — o layout (grade de 4
// cartões com aspas) é o mesmo da LP de Biguaçu.

function Visit() {
  return (
    <section id="visite" className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <SectionHeading
            kicker="Venha nos visitar"
            title="Um café, uma volta e a sua próxima moto."
          />
          <p data-reveal="up" className="mt-5 max-w-md text-muted-foreground">
            Nosso showroom foi feito pra você passar tempo. Chega, escolhe, testa. Sem pressa e sem
            pressão.
          </p>
          <div data-reveal="up" style={atraso(2)} className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Endereço
              </p>
              <p className="mt-2 text-sm">
                {UNIDADE.endereco.linha1}
                <br />
                {UNIDADE.endereco.linha2}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Horário</p>
              <p className="mt-2 text-sm">
                {UNIDADE.horario.map((linha, i) => (
                  <span key={linha}>
                    {i > 0 && <br />}
                    {linha}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                WhatsApp
              </p>
              {TEM_WHATSAPP ? (
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-sm font-semibold text-primary hover:underline"
                >
                  {UNIDADE.whatsapp.exibicao}
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{UNIDADE.whatsapp.exibicao}</p>
              )}
            </div>
          </div>
          <div
            data-reveal="zoom"
            className="mt-8 overflow-hidden rounded-xl border border-border shadow-card"
          >
            <iframe
              title={`Mapa até a ${UNIDADE.nome}`}
              src={MAPS_EMBED_URL}
              width="100%"
              height="260"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block grayscale-[15%]"
            />
          </div>
        </div>
        <div
          data-reveal="right"
          className="borda-luz relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-card-hover lg:p-10"
        >
          <div
            aria-hidden
            className="animate-glow pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
          />
          <p className="font-display text-sm font-bold text-primary">Pronto pra pilotar?</p>
          <h3 className="mt-3 font-display text-3xl font-bold leading-tight text-ink">
            Fale com um consultor VR agora mesmo.
          </h3>
          <p className="mt-4 text-sm text-muted-foreground">
            Respondemos em minutos. Simulação, test-ride e reserva sem sair do sofá.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine relative inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-cta transition hover:-translate-y-0.5 hover:bg-primary-dark"
            >
              Chamar no WhatsApp
              <span aria-hidden>→</span>
            </a>
            {TELEFONE_HREF && (
              <a
                href={TELEFONE_HREF}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-4 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
              >
                Ligar para a loja
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
