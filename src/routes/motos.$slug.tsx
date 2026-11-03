// Página própria de cada moto: /motos/honda-cg-160-titan.
//
// Existe por SEO: quem procura moto pesquisa pelo modelo e pela cidade ("Bros 160
// Guanhães"), e uma página única com todas as motos não disputa nenhuma dessas buscas.
// Cada página tem título, descrição e endereço próprios, a abertura da loja (o texto que
// diferencia esta loja das outras da rede), o texto longo, a ficha técnica e os
// dados estruturados que dizem ao Google que é um produto vendido por uma concessionária.
//
// A moto só aparece se estiver marcada para a loja (campo `unidades`).
import { useState } from "react";
import { Link, createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { SITE_URL, UNIDADE } from "@/config/unidade";
import { Footer, Nav, SectionHeading } from "@/components/layout";
import {
  BikeCard,
  BikeSpecs,
  EtiquetaEstoque,
  FOTO,
  FotoEmBreve,
  Lightbox,
  STUDIO_BG,
  SeloMarca,
  Swatches,
  VerCondicoes,
  paraBike,
  type Bike,
} from "@/components/vitrine";
import { urlDaFoto, type Moto } from "@/lib/motos";
import {
  aberturaEfetiva,
  caminhoDaMoto,
  descricaoEfetiva,
  nomeCompleto,
  slugDaMoto,
  tituloEfetivo,
} from "@/lib/seo";
import { carregarVitrine } from "@/servidor/estoque";

// Endereços que já foram ao ar e mudaram (a moto trocou de marca no catálogo). Apontam
// para o id da moto: o endereço novo sai do nome atual, então continua certo mesmo se a
// loja renomear a moto no painel.
const ENDERECOS_ANTIGOS: Record<string, string> = {
  "shineray-storm-200": "storm200",
};

export const Route = createFileRoute("/motos/$slug")({
  loader: async ({ params }) => {
    const { motos } = await carregarVitrine();
    const moto = motos.find((m) => slugDaMoto(m) === params.slug);
    if (!moto) {
      const mudou = motos.find((m) => m.id === ENDERECOS_ANTIGOS[params.slug]);
      if (mudou)
        throw redirect({
          to: "/motos/$slug",
          params: { slug: slugDaMoto(mudou) },
          statusCode: 301,
        });
      throw notFound();
    }
    const mesmaMarca = motos.filter((m) => m.marca === moto.marca && m.id !== moto.id);
    const mesmaCategoria = motos.filter(
      (m) => m.categoria === moto.categoria && m.marca !== moto.marca,
    );
    return { moto, relacionadas: [...mesmaMarca, ...mesmaCategoria].slice(0, 4) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const m = loaderData.moto;
    const url = `${SITE_URL}${caminhoDaMoto(m)}`;
    const titulo = tituloEfetivo(m, UNIDADE.id);
    const descricao = descricaoEfetiva(m, UNIDADE.id);
    const imagens = fotosAbsolutas(m);
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(imagens[0]
          ? [
              { property: "og:image", content: imagens[0] },
              { name: "twitter:image", content: imagens[0] },
              { property: "og:image:alt", content: nomeCompleto(m) },
            ]
          : []),
        { name: "twitter:title", content: titulo },
        { name: "twitter:description", content: descricao },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(dadosEstruturados(m, url, descricao, imagens)),
        },
      ],
    };
  },
  component: PaginaMoto,
  notFoundComponent: MotoNaoEncontrada,
});

/** Fotos com endereço absoluto — o Google e o WhatsApp não resolvem caminho relativo. */
function fotosAbsolutas(m: Moto): string[] {
  return m.cores
    .flatMap((c) => c.fotos)
    .map(urlDaFoto)
    .filter(Boolean)
    .map((u) => (/^https?:\/\//.test(u) ? u : `${SITE_URL}${u}`));
}

function dadosEstruturados(m: Moto, url: string, descricao: string, imagens: string[]) {
  const nome = nomeCompleto(m);
  const marca = paraBike(m).marca.nome;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Motorcycle",
      name: nome,
      brand: { "@type": "Brand", name: marca },
      category: m.categoria,
      description: descricao,
      url,
      ...(imagens.length ? { image: imagens } : {}),
      color: m.cores.map((c) => c.nome).join(", "),
      itemCondition: "https://schema.org/NewCondition",
      ...(m.ficha?.length
        ? {
            additionalProperty: m.ficha.map((f) => ({
              "@type": "PropertyValue",
              name: f.rotulo,
              value: f.valor,
            })),
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: UNIDADE.nome, item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Motos", item: `${SITE_URL}/#linha` },
        { "@type": "ListItem", position: 3, name: nome, item: url },
      ],
    },
  ];
}

/** Parágrafos separados por linha em branco no painel. */
const paragrafos = (texto: string) =>
  texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

function PaginaMoto() {
  const { moto, relacionadas } = Route.useLoaderData();
  const bike = paraBike(moto);
  const [corIndex, setCorIndex] = useState(0);
  const [fotoIndex, setFotoIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{ bike: Bike; cor: number; foto: number } | null>(null);
  const cor = bike.cores[corIndex] ?? bike.cores[0];
  const fotos = cor?.fotos ?? [];
  const [quebradas, setQuebradas] = useState<string[]>([]);
  const escolhida = fotos[fotoIndex] ?? fotos[0];
  const foto = escolhida && !quebradas.includes(escolhida) ? escolhida : undefined;
  const texto = moto.textoPagina?.trim() ? paragrafos(moto.textoPagina) : [moto.descricao];
  const escolherCor = (i: number) => {
    setCorIndex(i);
    setFotoIndex(0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <nav aria-label="Você está em" className="border-b border-border">
        <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-3 text-xs text-muted-foreground lg:px-8">
          <li>
            <Link to="/" className="transition hover:text-primary">
              Início
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <a href="/#linha" className="transition hover:text-primary">
              Motos
            </a>
          </li>
          <li aria-hidden>›</li>
          <li>{bike.marca.nome}</li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-ink">
            {bike.nome}
          </li>
        </ol>
      </nav>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:px-8 lg:py-14">
          <div>
            <div className={`relative aspect-[16/11] overflow-hidden rounded-2xl ${STUDIO_BG}`}>
              {foto ? (
                <button
                  type="button"
                  onClick={() => setLightbox({ bike, cor: corIndex, foto: fotoIndex })}
                  aria-label={`Ampliar a ${bike.nome} na cor ${cor.nome}`}
                  className="block h-full w-full cursor-zoom-in"
                >
                  <img
                    key={foto}
                    src={foto}
                    alt={`${bike.nomeCompleto} na cor ${cor.nome}`}
                    width={860}
                    height={550}
                    className={`h-full w-full object-contain p-6 animate-in fade-in ${FOTO}`}
                    onError={() => setQuebradas((q) => [...q, foto])}
                  />
                </button>
              ) : (
                <FotoEmBreve bike={bike} cor={cor} />
              )}
              <span className="absolute left-4 top-4 rounded-md bg-black/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                {bike.categoria}
              </span>
              {bike.selo && (
                <span className="absolute right-4 top-4 rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                  {bike.selo}
                </span>
              )}
            </div>
            {fotos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {fotos.map((f, i) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFotoIndex(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-current={fotoIndex === i}
                    className={`aspect-[4/3] h-20 shrink-0 overflow-hidden rounded-lg border bg-neutral-100 transition ${
                      fotoIndex === i
                        ? "border-primary ring-1 ring-primary/50"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={f} alt="" className={`h-full w-full object-contain p-1 ${FOTO}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <SeloMarca marca={bike.marca} className="h-6" />
                <EtiquetaEstoque bike={bike} />
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                {bike.nomeCompleto}
              </h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-primary">
                0 km na {UNIDADE.nome}
              </p>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {aberturaEfetiva(moto, UNIDADE.id)}
              </p>
            </div>

            {cor && (
              <div className="border-y border-border py-5">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {bike.cores.length > 1 ? `${bike.cores.length} cores · ` : "Cor · "}
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

            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="font-display text-lg font-bold text-ink">
                Preço, entrada e parcelas na hora.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Um consultor da {UNIDADE.nomeCurto} responde pelo WhatsApp com a simulação para a
                cor escolhida.
              </p>
              <VerCondicoes bike={bike} cor={cor} className="mt-5" />
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:px-8 lg:py-20">
            <div>
              <SectionHeading kicker="Sobre a moto" title={`Conheça a ${bike.nome}.`} />
              <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
                {texto.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            {moto.ficha && moto.ficha.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Ficha técnica</h2>
                <dl className="mt-5 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {moto.ficha.map((f) => (
                    <div
                      key={f.rotulo}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4 px-4 py-3 text-sm"
                    >
                      <dt className="text-muted-foreground">{f.rotulo}</dt>
                      <dd className="font-medium text-ink">{f.valor}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground/70">
                  Dados do fabricante. Podem variar conforme a versão.
                </p>
              </div>
            )}
          </div>
        </section>

        {bike.cores.length > 1 && (
          <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <h2 className="font-display text-2xl font-bold text-ink">
              A {bike.nome} em {bike.cores.length} cores
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {bike.cores.map((c, i) => (
                <button
                  key={`${c.nome}-${i}`}
                  type="button"
                  onClick={() => {
                    escolherCor(i);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/50"
                >
                  <div className={`aspect-[16/11] ${STUDIO_BG}`}>
                    {c.fotos[0] ? (
                      <img
                        src={c.fotos[0]}
                        alt={`${bike.nomeCompleto} na cor ${c.nome}`}
                        loading="lazy"
                        className={`h-full w-full object-contain p-3 transition group-hover:scale-105 ${FOTO}`}
                      />
                    ) : (
                      <FotoEmBreve bike={bike} cor={c} />
                    )}
                  </div>
                  <p className="px-3 py-2.5 text-sm font-semibold text-ink">{c.nome}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {relacionadas.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10 lg:py-20">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-bold text-ink">
                  Outras motos na {UNIDADE.nomeCurto}
                </h2>
                <a
                  href="/#linha"
                  className="text-sm font-semibold text-muted-foreground transition hover:text-primary"
                >
                  Ver todas as motos →
                </a>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relacionadas.map((m) => (
                  <BikeCard
                    key={m.id}
                    bike={paraBike(m)}
                    onAmpliar={(b, c) => setLightbox({ bike: b, cor: c, foto: 0 })}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

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

function MotoNaoEncontrada() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Moto não encontrada</h1>
        <p className="mt-3 text-muted-foreground">
          Este modelo não está mais na vitrine da {UNIDADE.nomeCurto}. Veja as motos disponíveis ou
          fale com a loja.
        </p>
        <a
          href="/#linha"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Ver as motos →
        </a>
      </main>
      <Footer />
    </div>
  );
}
