// Painel de SEO — camada 1 (diagnóstico). Lê o próprio estoque e lista o que impede
// cada página de moto de disputar a busca, do mais grave ao mais leve, com um botão
// que abre o formulário direto no campo que resolve. Num site de catálogo quase todo
// problema de SEO é conteúdo incompleto, e quem preenche é a loja: a entrega útil é a
// lista de pendências, não um relatório.
//
// A camada 2 (posição no Google, cliques, páginas indexadas) depende do Search Console
// e de algumas semanas de site no ar; o espaço dela fica reservado no fim da página.
import { useEffect, useMemo, useState } from "react";

import { marcaPorId } from "@/config/marcas";
import { UNIDADE_ID, UNIDADES, type UnidadeId } from "@/config/unidade";
import { TODAS_AS_UNIDADES, urlDaFoto, type ItemFicha, type Moto } from "@/lib/motos";
import {
  DESCRICAO_MAX,
  DESCRICAO_MIN,
  TEXTO_PAGINA_MIN,
  TITULO_MAX,
  TITULO_MIN,
  aberturaAutomatica,
  caminhoDaMoto,
  descricaoAutomatica,
  descricaoEfetiva,
  diagnosticar,
  diagnosticarLoja,
  nota,
  slugDaMoto,
  tituloAutomatico,
  tituloEfetivo,
  type Achado,
  type CampoSeo,
  type Nivel,
} from "@/lib/seo";

const COR_NIVEL: Record<Nivel, string> = {
  alta: "bg-red-500",
  media: "bg-amber-400",
  baixa: "bg-neutral-500",
};
const ROTULO_NIVEL: Record<Nivel, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };

function corDaNota(n: number) {
  if (n >= 85) return "border-emerald-500/50 text-emerald-300";
  if (n >= 60) return "border-amber-400/50 text-amber-300";
  return "border-red-500/50 text-red-300";
}

/** Descobre, no navegador, quais fotos cadastradas não abrem mais. */
function useFotosQuebradas(motos: Moto[]): Set<string> {
  const [quebradas, setQuebradas] = useState<Set<string>>(new Set());
  const urls = useMemo(
    () => [...new Set(motos.flatMap((m) => m.cores.flatMap((c) => c.fotos)).filter(Boolean))],
    [motos],
  );
  useEffect(() => {
    let vivo = true;
    const ruins = new Set<string>();
    urls.forEach((foto) => {
      const url = urlDaFoto(foto);
      const marcar = () => {
        ruins.add(foto);
        if (vivo) setQuebradas(new Set(ruins));
      };
      if (!url) return marcar();
      const img = new Image();
      img.onerror = marcar;
      img.src = url;
    });
    return () => {
      vivo = false;
    };
  }, [urls]);
  return quebradas;
}

export function PainelSeo({
  motos,
  aoCorrigir,
}: {
  motos: Moto[];
  aoCorrigir: (moto: Moto, campo: CampoSeo) => void;
}) {
  const quebradas = useFotosQuebradas(motos);
  const ativas = motos.filter((m) => m.ativo);

  const linhas = ativas
    .map((m) => {
      const achados = diagnosticar(m, ativas);
      m.cores.forEach((c) => {
        const ruins = c.fotos.filter((f) => quebradas.has(f));
        if (ruins.length)
          achados.unshift({
            nivel: "alta",
            campo: "cores",
            mensagem: `${c.nome || "Uma cor"}: ${ruins.length === 1 ? "a foto não abre" : `${ruins.length} fotos não abrem`} (link quebrado).`,
          });
      });
      return { moto: m, achados, nota: nota(achados) };
    })
    .sort((a, b) => a.nota - b.nota);

  const media = linhas.length
    ? Math.round(linhas.reduce((s, l) => s + l.nota, 0) / linhas.length)
    : 0;
  const contar = (n: Nivel) =>
    linhas.reduce((s, l) => s + l.achados.filter((a) => a.nivel === n).length, 0);

  if (motos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        O diagnóstico lê o estoque do painel. Importe o catálogo do projeto na aba Estoque para
        começar.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        <div className={`rounded-xl border bg-card p-5 ${corDaNota(media)}`}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Nota média
          </p>
          <p className="mt-2 font-display text-4xl font-bold">{media}</p>
          <p className="mt-1 text-xs text-muted-foreground">de 100, nas {linhas.length} páginas</p>
        </div>
        {(["alta", "media", "baixa"] as Nivel[]).map((n) => (
          <div key={n} className="rounded-xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${COR_NIVEL[n]}`} /> Prioridade{" "}
              {ROTULO_NIVEL[n].toLowerCase()}
            </p>
            <p className="mt-2 font-display text-4xl font-bold text-ink">{contar(n)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {n === "alta"
                ? "resolver antes de divulgar"
                : n === "media"
                  ? "o que mais sobe a página"
                  : "acabamento"}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          As lojas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TODAS_AS_UNIDADES.map((u) => {
            const achados = diagnosticarLoja(u);
            return (
              <div key={u} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-ink">{UNIDADES[u].nome}</p>
                {achados.length === 0 ? (
                  <p className="mt-2 text-sm text-emerald-300">Tudo certo.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {achados.map((a) => (
                      <ItemAchado key={a.mensagem} achado={a} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Estes dados ficam no código (src/config/unidade.ts), não no painel.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Páginas das motos — da mais fraca para a mais forte
        </h2>
        <ul className="space-y-2">
          {linhas.map(({ moto, achados, nota: n }) => (
            <LinhaSeo
              key={moto.id}
              moto={moto}
              achados={achados}
              nota={n}
              aoCorrigir={(campo) => aoCorrigir(moto, campo)}
            />
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-dashed border-border p-6">
        <p className="font-display text-lg font-bold text-ink">
          Monitoramento — posição no Google, cliques e páginas indexadas
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Liga depois que os sites tiverem algumas semanas no ar e estiverem cadastrados no Google
          Search Console. Antes disso não há histórico para mostrar — aberto agora, este quadro
          nasceria vazio.
        </p>
      </section>
    </div>
  );
}

function ItemAchado({ achado, aoCorrigir }: { achado: Achado; aoCorrigir?: () => void }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        title={`Prioridade ${ROTULO_NIVEL[achado.nivel].toLowerCase()}`}
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${COR_NIVEL[achado.nivel]}`}
      />
      <span className="flex-1 text-muted-foreground">{achado.mensagem}</span>
      {aoCorrigir && (
        <button
          type="button"
          onClick={aoCorrigir}
          className="shrink-0 rounded border border-border px-2 py-0.5 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          Corrigir
        </button>
      )}
    </li>
  );
}

function LinhaSeo({
  moto,
  achados,
  nota: n,
  aoCorrigir,
}: {
  moto: Moto;
  achados: Achado[];
  nota: number;
  aoCorrigir: (campo: CampoSeo) => void;
}) {
  const [aberta, setAberta] = useState(n < 60);
  const naLojaDesteSite = moto.unidades.includes(UNIDADE_ID);
  return (
    <li className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className="flex w-full flex-wrap items-center gap-3 p-3 text-left"
      >
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border font-display text-sm font-bold ${corDaNota(n)}`}
        >
          {n}
        </span>
        <span className="min-w-[160px] flex-1">
          <span className="block text-sm font-semibold text-ink">
            {marcaPorId(moto.marca).nome} · {moto.nome}
          </span>
          <span className="block text-xs text-muted-foreground">/motos/{slugDaMoto(moto)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {(["alta", "media", "baixa"] as Nivel[]).map((nv) => {
            const q = achados.filter((a) => a.nivel === nv).length;
            return q ? (
              <span key={nv} className="inline-flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${COR_NIVEL[nv]}`} />
                {q}
              </span>
            ) : null;
          })}
          {achados.length === 0 && <span className="text-emerald-300">sem pendências</span>}
        </span>
        <span aria-hidden className="text-muted-foreground">
          {aberta ? "▴" : "▾"}
        </span>
      </button>
      {aberta && (
        <div className="border-t border-border px-4 py-3">
          {achados.length > 0 ? (
            <ul className="space-y-2">
              {achados.map((a, i) => (
                <ItemAchado key={i} achado={a} aoCorrigir={() => aoCorrigir(a.campo)} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-emerald-300">Página completa.</p>
          )}
          {naLojaDesteSite && (
            <a
              href={caminhoDaMoto(moto)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-muted-foreground underline transition hover:text-primary"
            >
              Abrir a página →
            </a>
          )}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------------
// Campos de SEO dentro do formulário da moto
// ---------------------------------------------------------------------------------

const entrada =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary";

function Contador({ n, min, max }: { n: number; min: number; max: number }) {
  const ok = n >= min && n <= max;
  return (
    <span className={`text-xs ${ok ? "text-emerald-300" : "text-amber-300"}`}>
      {n} caracteres · ideal {min}–{max}
    </span>
  );
}

export function CamposSeo({
  moto,
  todas,
  aoMudar,
}: {
  moto: Moto;
  todas: Moto[];
  aoMudar: (campo: Partial<Moto>) => void;
}) {
  const lojaDaPrevia: UnidadeId = moto.unidades.includes(UNIDADE_ID)
    ? UNIDADE_ID
    : (moto.unidades[0] ?? UNIDADE_ID);
  const titulo = tituloEfetivo(moto, lojaDaPrevia);
  const descricao = descricaoEfetiva(moto, lojaDaPrevia);
  const achados = diagnosticar(moto, todas);
  const ficha: ItemFicha[] = moto.ficha ?? [];
  const texto = moto.textoPagina ?? "";

  return (
    <div className="mt-8 rounded-xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-ink">Página da moto e Google</h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${corDaNota(nota(achados))}`}
        >
          Nota {nota(achados)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Tudo aqui é opcional: o que ficar em branco é gerado automaticamente. Os campos que mais
        pesam são o texto da página e a abertura de cada loja.
      </p>

      {achados.length > 0 && (
        <ul className="mt-4 space-y-1.5 rounded-lg bg-secondary/50 p-3">
          {achados.map((a, i) => (
            <ItemAchado key={i} achado={a} />
          ))}
        </ul>
      )}

      <div className="mt-5" id="campo-slug">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Endereço da página
        </p>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">/motos/</span>
          <input
            value={moto.slug ?? ""}
            onChange={(e) => aoMudar({ slug: e.target.value })}
            placeholder={slugDaMoto({ ...moto, slug: undefined })}
            className={entrada}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Mudar o endereço de uma página que já está no Google faz ela perder a posição. Na dúvida,
          deixe em branco.
        </p>
      </div>

      <div className="mt-5" id="campo-tituloSeo">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Título no Google
        </p>
        <input
          value={moto.tituloSeo ?? ""}
          onChange={(e) => aoMudar({ tituloSeo: e.target.value })}
          placeholder={tituloAutomatico(moto, lojaDaPrevia)}
          className={entrada}
        />
        <Contador n={titulo.length} min={TITULO_MIN} max={TITULO_MAX} />
      </div>

      <div className="mt-5" id="campo-descricaoSeo">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Descrição no Google
        </p>
        <textarea
          value={moto.descricaoSeo ?? ""}
          rows={3}
          onChange={(e) => aoMudar({ descricaoSeo: e.target.value })}
          placeholder={descricaoAutomatica(moto, lojaDaPrevia)}
          className={entrada}
        />
        <Contador n={descricao.length} min={DESCRICAO_MIN} max={DESCRICAO_MAX} />
      </div>

      <div className="mt-4 rounded-lg bg-white p-4 text-left">
        <p className="text-[11px] text-neutral-500">Prévia no Google</p>
        <p className="mt-1 truncate text-xs text-emerald-800">
          {UNIDADES[lojaDaPrevia].siteUrl.replace("https://", "")}
          {caminhoDaMoto(moto)}
        </p>
        <p className="truncate text-lg leading-snug text-[#1a0dab]">{titulo}</p>
        <p className="line-clamp-2 text-sm text-neutral-700">{descricao}</p>
      </div>

      <div className="mt-5" id="campo-textoPagina">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Texto da página
        </p>
        <textarea
          value={texto}
          rows={8}
          onChange={(e) => aoMudar({ textoPagina: e.target.value })}
          placeholder="Para quem é a moto, como ela anda na cidade e na estrada, consumo, conforto, o que ela tem que as concorrentes não têm… Parágrafos separados por uma linha em branco."
          className={entrada}
        />
        <span
          className={`text-xs ${texto.trim().length >= TEXTO_PAGINA_MIN ? "text-emerald-300" : "text-amber-300"}`}
        >
          {texto.trim().length} caracteres · ideal {TEXTO_PAGINA_MIN} ou mais
        </span>
      </div>

      <div className="mt-5" id="campo-textoPorLoja">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Abertura de cada loja
        </p>
        <p className="mb-2 text-xs text-muted-foreground">
          O primeiro parágrafo da página, diferente em cada site. Fale da loja, da cidade, de quem
          compra essa moto ali. Sem ele, as duas páginas saem quase iguais e o Google mostra só uma.
        </p>
        <div className="space-y-3">
          {moto.unidades.map((u) => (
            <label key={u} className="block">
              <span className="text-xs font-semibold text-ink">{UNIDADES[u].cidade}</span>
              <textarea
                value={moto.textoPorLoja?.[u] ?? ""}
                rows={3}
                onChange={(e) =>
                  aoMudar({ textoPorLoja: { ...moto.textoPorLoja, [u]: e.target.value } })
                }
                placeholder={aberturaAutomatica(moto, u)}
                className={`${entrada} mt-1`}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5" id="campo-ficha">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Ficha técnica
        </p>
        <div className="space-y-2">
          {ficha.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={f.rotulo}
                onChange={(e) =>
                  aoMudar({
                    ficha: ficha.map((x, j) => (j === i ? { ...x, rotulo: e.target.value } : x)),
                  })
                }
                placeholder="Motor"
                className={`${entrada} w-2/5`}
              />
              <input
                value={f.valor}
                onChange={(e) =>
                  aoMudar({
                    ficha: ficha.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)),
                  })
                }
                placeholder="162,7 cc, flex"
                className={entrada}
              />
              <button
                type="button"
                onClick={() => aoMudar({ ficha: ficha.filter((_, j) => j !== i) })}
                aria-label="Remover linha"
                className="shrink-0 rounded border border-border px-2 text-xs text-muted-foreground transition hover:text-red-300"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => aoMudar({ ficha: [...ficha, { rotulo: "", valor: "" }] })}
            className="rounded-lg border border-dashed border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            + Linha na ficha
          </button>
        </div>
      </div>
    </div>
  );
}
