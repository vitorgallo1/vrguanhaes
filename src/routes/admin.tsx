// Painel de estoque da loja de Guanhães. Uma página só, protegida por
// senha, igual nos dois sites: os dois editam a mesma lista (ver estoque.server.ts).
//
// A lista inteira fica em memória enquanto se edita e vai para o servidor num
// "Salvar" explícito. É o modelo certo para um painel de um usuário só: dá para
// reordenar, mexer em três motos e desistir de tudo sem deixar meio caminho gravado.
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MARCAS, marcaPorId } from "@/config/marcas";
import { UNIDADES, type UnidadeId } from "@/config/unidade";
import {
  FOTOS_DO_PROJETO,
  LIMITE_CORES,
  LIMITE_DESTAQUES,
  LIMITE_FOTOS_POR_COR,
  TODAS_AS_UNIDADES,
  ehUrlExterna,
  estaEmEstoque,
  normalizarHex,
  novoId,
  ordenar,
  ordenarDestaques,
  problemas,
  urlDaFoto,
  type Cor,
  type Moto,
} from "@/lib/motos";
import { CamposSeo, PainelSeo } from "@/components/painel-seo";
import { CATALOGO_BASE } from "@/data/catalogo";
import { calcularNovidades, haNovidades } from "@/lib/novidades";
import { diagnosticar, nota, type CampoSeo } from "@/lib/seo";
import {
  entrar,
  estadoDoPainel,
  importarCatalogoBase,
  sair,
  salvarEstoque,
} from "@/servidor/estoque";

export const Route = createFileRoute("/admin")({
  component: Painel,
  loader: async () => estadoDoPainel(),
  head: () => ({
    meta: [
      { title: "Estoque — painel" },
      // O painel não tem por que aparecer em busca.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const corVazia = (): Cor => ({ nome: "", hex: "#777777", fotos: [""] });

const motoVazia = (): Moto => ({
  id: novoId(),
  marca: MARCAS[0].id,
  nome: "",
  categoria: "",
  descricao: "",
  specs: ["", "", ""],
  cores: [corVazia()],
  destaque: false,
  emEstoque: true,
  unidades: [...TODAS_AS_UNIDADES],
  ativo: true,
  ordem: 0,
});

/**
 * Mantém as Mais vendidas numeradas de 1 a N, sem buracos: quem acabou de entrar vai
 * para o fim, quem saiu perde o número.
 */
function numerarDestaques(lista: Moto[]): Moto[] {
  const posicao = new Map(ordenarDestaques(lista).map((m, i) => [m.id, i + 1]));
  return lista.map((m) =>
    m.destaque
      ? m.posicaoDestaque === posicao.get(m.id)
        ? m
        : { ...m, posicaoDestaque: posicao.get(m.id) }
      : m.posicaoDestaque === undefined
        ? m
        : { ...m, posicaoDestaque: undefined },
  );
}

type FiltroLoja = "todas" | UnidadeId;

function Painel() {
  const inicial = Route.useLoaderData();
  const [logado, setLogado] = useState(inicial.logado);
  const [motos, setMotos] = useState<Moto[]>(inicial.motos);
  const [salvo, setSalvo] = useState<Moto[]>(inicial.motos);
  const [editando, setEditando] = useState<Moto | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loja, setLoja] = useState<FiltroLoja>("todas");
  const [aba, setAba] = useState<"estoque" | "seo">("estoque");
  const [foco, setFoco] = useState<CampoSeo | null>(null);
  const [trouxeNovidades, setTrouxeNovidades] = useState(false);

  const sujo = useMemo(() => JSON.stringify(motos) !== JSON.stringify(salvo), [motos, salvo]);
  const destaques = motos.filter((m) => m.destaque).length;
  // O que o catálogo do projeto tem e o estoque salvo ainda não (motos, fotos, cores).
  const novidades = useMemo(() => calcularNovidades(motos), [motos]);

  // Fechar a aba com alteração não salva é o jeito mais fácil de perder meia hora de
  // cadastro. O aviso do navegador é feio, mas é o único que funciona aqui.
  useEffect(() => {
    if (!sujo) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sujo]);

  const salvar = useCallback(async (lista: Moto[]) => {
    setSalvando(true);
    setErro(null);
    try {
      const r = await salvarEstoque({ data: { motos: lista } });
      setMotos(r.motos);
      setSalvo(r.motos);
      setTrouxeNovidades(false);
      setRecado("Estoque salvo. Já está no ar nos dois sites.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para salvar.");
    } finally {
      setSalvando(false);
    }
  }, []);

  if (!logado) {
    return (
      <Login
        configurado={inicial.configurado}
        aoEntrar={async () => {
          const estado = await estadoDoPainel();
          setLogado(estado.logado);
          setMotos(estado.motos);
          setSalvo(estado.motos);
        }}
      />
    );
  }

  const visiveis = ordenar(motos).filter((m) => loja === "todas" || m.unidades.includes(loja));
  const grupos = [...new Set(visiveis.map((m) => m.marca))].map((marca) => ({
    marca,
    motos: visiveis.filter((m) => m.marca === marca),
  }));

  // Sobe/desce dentro da própria marca: a vitrine ordena por marca primeiro.
  const mover = (moto: Moto, passo: number) => {
    const irmas = ordenar(motos).filter((m) => m.marca === moto.marca);
    const de = irmas.findIndex((m) => m.id === moto.id);
    const para = de + passo;
    if (para < 0 || para >= irmas.length) return;
    [irmas[de], irmas[para]] = [irmas[para], irmas[de]];
    const novaOrdem = new Map(irmas.map((m, i) => [m.id, i + 1]));
    setMotos(motos.map((m) => (novaOrdem.has(m.id) ? { ...m, ordem: novaOrdem.get(m.id)! } : m)));
  };

  const ativas = motos.filter((m) => m.ativo);
  const notaMedia = ativas.length
    ? Math.round(ativas.reduce((t, m) => t + nota(diagnosticar(m, ativas)), 0) / ativas.length)
    : null;

  const editar = (m: Moto, campo: CampoSeo | null = null) => {
    setFoco(campo);
    setEditando(m);
  };

  const alterar = (id: string, campo: Partial<Moto>) =>
    setMotos(numerarDestaques(motos.map((m) => (m.id === id ? { ...m, ...campo } : m))));

  // Troca a posição de uma moto com a vizinha dentro das Mais vendidas.
  const moverDestaque = (id: string, passo: number) => {
    const fila = ordenarDestaques(motos);
    const de = fila.findIndex((m) => m.id === id);
    const para = de + passo;
    if (de < 0 || para < 0 || para >= fila.length) return;
    [fila[de], fila[para]] = [fila[para], fila[de]];
    const posicao = new Map(fila.map((m, i) => [m.id, i + 1]));
    setMotos(
      motos.map((m) => (posicao.has(m.id) ? { ...m, posicaoDestaque: posicao.get(m.id) } : m)),
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4">
          <div className="mr-auto">
            <h1 className="font-display text-xl font-bold text-ink">Painel — Guanhães</h1>
            <p className="text-xs text-muted-foreground">
              {motos.length} moto{motos.length === 1 ? "" : "s"} • {destaques}/{LIMITE_DESTAQUES} em
              destaque
              {sujo && " — alterações não salvas"}
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            Ver a vitrine
          </a>
          <button
            type="button"
            onClick={async () => {
              await sair();
              setLogado(false);
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:text-ink"
          >
            Sair
          </button>
          <button
            type="button"
            disabled={!sujo || salvando}
            onClick={() => salvar(motos)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-cta transition hover:bg-primary-dark disabled:opacity-40"
          >
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-5">
          {(
            [
              ["estoque", "Estoque"],
              ["seo", notaMedia === null ? "SEO" : `SEO · nota ${notaMedia}`],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAba(id)}
              aria-pressed={aba === id}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                aba === id
                  ? "border-primary text-ink"
                  : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {inicial.armazenamento === "arquivo-local" && (
          <Aviso tom="neutro">
            Rodando fora do Netlify: o estoque está indo para <code>.dados/estoque.json</code>, aqui
            na máquina. Em produção vai para o Netlify Blobs.
          </Aviso>
        )}
        {erro && <Aviso tom="erro">{erro}</Aviso>}
        {recado && !sujo && <Aviso tom="ok">{recado}</Aviso>}
        {trouxeNovidades && sujo && (
          <Aviso tom="ok">
            Novidades trazidas para a lista. Revise e clique em <strong>Salvar alterações</strong>{" "}
            para colocar no ar.
          </Aviso>
        )}
        {aba === "estoque" && motos.length > 0 && haNovidades(novidades) && (
          <Aviso tom="neutro">
            <p className="font-semibold text-ink">
              O catálogo do projeto tem novidades que não estão no estoque salvo.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {novidades.motosNovas.length > 0 && (
                <li>
                  {novidades.motosNovas.length} moto{novidades.motosNovas.length === 1 ? "" : "s"}{" "}
                  nova{novidades.motosNovas.length === 1 ? "" : "s"}:{" "}
                  {novidades.motosNovas.join(", ")}
                </li>
              )}
              {novidades.fotosNovas > 0 && (
                <li>
                  {novidades.fotosNovas} cor{novidades.fotosNovas === 1 ? "" : "es"} que estava
                  {novidades.fotosNovas === 1 ? "" : "m"} sem foto ganha
                  {novidades.fotosNovas === 1 ? "" : "m"} foto
                </li>
              )}
              {novidades.coresNovas > 0 && (
                <li>
                  {novidades.coresNovas} cor{novidades.coresNovas === 1 ? "" : "es"} nova
                  {novidades.coresNovas === 1 ? "" : "s"} com foto em motos que já estão no estoque
                </li>
              )}
              {novidades.fotosTrocadas > 0 && (
                <li>
                  {novidades.fotosTrocadas} foto{novidades.fotosTrocadas === 1 ? "" : "s"} da Yamaha
                  trocada{novidades.fotosTrocadas === 1 ? "" : "s"} por versões maiores
                </li>
              )}
              {novidades.destaquesNovos.length > 0 && (
                <li>Mais vendidas: {novidades.destaquesNovos.join(", ")}</li>
              )}
              {novidades.mudaramDeAba.length > 0 && (
                <li>Mudam de aba: {novidades.mudaramDeAba.join(", ")}</li>
              )}
            </ul>
            <p className="mt-2">
              Nada do que já está no estoque é apagado. As motos novas entram fora das Mais
              vendidas.
            </p>
            <button
              type="button"
              onClick={() => {
                setMotos(novidades.motos);
                setTrouxeNovidades(true);
                setRecado(null);
              }}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark"
            >
              Trazer para o estoque
            </button>
          </Aviso>
        )}

        {aba === "seo" ? (
          <PainelSeo motos={motos} aoCorrigir={(m, campo) => editar(m, campo)} />
        ) : motos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-lg font-bold text-ink">O estoque está vazio.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Enquanto estiver assim, a vitrine mostra o catálogo que veio no projeto — as{" "}
              {CATALOGO_BASE.length} motos da loja, com as fotos por cor. Dá para começar do zero ou
              partir desse catálogo e editar o que quiser.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  const r = await importarCatalogoBase();
                  setMotos(r.motos);
                  setSalvo(r.motos);
                  setRecado("Catálogo do projeto importado.");
                }}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark"
              >
                Importar o catálogo do projeto
              </button>
              <button
                type="button"
                onClick={() => editar(motoVazia())}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
              >
                Cadastrar do zero
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Loja
              </span>
              {(["todas", ...TODAS_AS_UNIDADES] as FiltroLoja[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setLoja(u)}
                  aria-pressed={loja === u}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    loja === u
                      ? "border-primary bg-primary/10 text-ink"
                      : "border-border text-muted-foreground hover:text-ink"
                  }`}
                >
                  {u === "todas" ? "Todas" : UNIDADES[u].cidade}
                </button>
              ))}
              <button
                type="button"
                onClick={() => editar(motoVazia())}
                className="ml-auto rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark"
              >
                + Nova moto
              </button>
            </div>

            {destaques > 0 && (
              <section className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Mais vendidas · ordem no site
                </h2>
                <ol className="mt-3 flex flex-wrap gap-2">
                  {ordenarDestaques(motos).map((m, i, fila) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-3 pr-1 text-xs font-semibold text-ink"
                    >
                      <span className="text-primary">{i + 1}.</span> {m.nome}
                      <button
                        type="button"
                        onClick={() => moverDestaque(m.id, -1)}
                        disabled={i === 0}
                        aria-label={`Passar ${m.nome} para antes`}
                        className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:text-primary disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moverDestaque(m.id, 1)}
                        disabled={i === fila.length - 1}
                        aria-label={`Passar ${m.nome} para depois`}
                        className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:text-primary disabled:opacity-30"
                      >
                        →
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-xs text-muted-foreground">
                  Marque ou desmarque no botão “Mais vendida” de cada moto (até {LIMITE_DESTAQUES}).
                </p>
              </section>
            )}

            <div className="space-y-8">
              {grupos.map(({ marca, motos: lista }) => (
                <section key={marca}>
                  <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {marcaPorId(marca).nome} · {lista.length}
                  </h2>
                  <ul className="space-y-2">
                    {lista.map((m, i) => (
                      <Linha
                        key={m.id}
                        moto={m}
                        primeira={i === 0}
                        ultima={i === lista.length - 1}
                        podeDestacar={m.destaque || destaques < LIMITE_DESTAQUES}
                        aoSubir={() => mover(m, -1)}
                        aoDescer={() => mover(m, 1)}
                        aoAlternar={() => alterar(m.id, { ativo: !m.ativo })}
                        aoEstoque={() => alterar(m.id, { emEstoque: !estaEmEstoque(m) })}
                        aoDestacar={() => alterar(m.id, { destaque: !m.destaque })}
                        aoEditar={() => editar(m)}
                        aoRemover={() => setMotos(motos.filter((x) => x.id !== m.id))}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </main>

      {editando && (
        <Formulario
          moto={editando}
          foco={foco}
          todas={motos}
          categorias={[...new Set(motos.map((m) => m.categoria).filter(Boolean))]}
          podeDestacar={
            editando.destaque ||
            motos.filter((m) => m.destaque && m.id !== editando.id).length < LIMITE_DESTAQUES
          }
          aoCancelar={() => setEditando(null)}
          aoConfirmar={(nova) => {
            setMotos((lista) => {
              if (lista.some((x) => x.id === nova.id)) {
                const antiga = lista.find((x) => x.id === nova.id)!;
                // Trocou de marca: vai para o fim da marca nova.
                const ordem =
                  antiga.marca === nova.marca ? nova.ordem : proximaOrdem(lista, nova.marca);
                return numerarDestaques(
                  lista.map((x) => (x.id === nova.id ? { ...nova, ordem } : x)),
                );
              }
              return numerarDestaques([
                ...lista,
                { ...nova, ordem: proximaOrdem(lista, nova.marca) },
              ]);
            });
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

const proximaOrdem = (lista: Moto[], marca: string) =>
  Math.max(0, ...lista.filter((m) => m.marca === marca).map((m) => m.ordem)) + 1;

function Aviso({ tom, children }: { tom: "ok" | "erro" | "neutro"; children: React.ReactNode }) {
  const cor =
    tom === "erro"
      ? "border-red-500/40 text-red-200"
      : tom === "ok"
        ? "border-emerald-500/40 text-emerald-200"
        : "border-border text-muted-foreground";
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${cor}`}>{children}</div>;
}

function Login({ configurado, aoEntrar }: { configurado: boolean; aoEntrar: () => void }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setEnviando(true);
          setErro(null);
          const r = await entrar({ data: { senha } });
          setEnviando(false);
          if (r.ok) aoEntrar();
          else setErro(r.erro);
        }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card"
      >
        <h1 className="font-display text-2xl font-bold text-ink">Estoque das lojas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Painel de quem cadastra as motos de Guanhães.
        </p>
        <label className="mt-6 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Senha
          <input
            type="password"
            value={senha}
            autoFocus
            onChange={(e) => setSenha(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-primary"
          />
        </label>
        {!configurado && (
          <p className="mt-3 text-xs text-amber-300">
            A variável PAINEL_SENHA ainda não foi definida no Netlify.
          </p>
        )}
        {erro && <p className="mt-3 text-xs text-red-300">{erro}</p>}
        <button
          type="submit"
          disabled={enviando || !senha}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark disabled:opacity-40"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

const fundoDaCor = (c: Cor) =>
  c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : c.hex;

function Linha({
  moto,
  primeira,
  ultima,
  podeDestacar,
  aoSubir,
  aoDescer,
  aoAlternar,
  aoEstoque,
  aoDestacar,
  aoEditar,
  aoRemover,
}: {
  moto: Moto;
  primeira: boolean;
  ultima: boolean;
  podeDestacar: boolean;
  aoSubir: () => void;
  aoDescer: () => void;
  aoAlternar: () => void;
  aoEstoque: () => void;
  aoDestacar: () => void;
  aoEditar: () => void;
  aoRemover: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const capa = urlDaFoto(moto.cores.flatMap((c) => c.fotos).find(Boolean) ?? "");

  return (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 ${
        moto.ativo ? "" : "opacity-55"
      }`}
    >
      <div className="grid shrink-0 gap-1">
        <button
          type="button"
          onClick={aoSubir}
          disabled={primeira}
          aria-label="Subir na vitrine"
          className="h-6 w-6 rounded border border-border text-xs text-muted-foreground transition hover:text-primary disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={aoDescer}
          disabled={ultima}
          aria-label="Descer na vitrine"
          className="h-6 w-6 rounded border border-border text-xs text-muted-foreground transition hover:text-primary disabled:opacity-30"
        >
          ↓
        </button>
      </div>

      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-neutral-200">
        {capa ? (
          <img src={capa} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
        ) : (
          <span className="grid h-full place-items-center text-[10px] text-muted-foreground">
            sem foto
          </span>
        )}
      </div>

      <div className="min-w-[180px] flex-1">
        <p className="text-sm font-semibold text-ink">{moto.nome || "(sem nome)"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{moto.categoria || "sem categoria"}</span>
          <span className="flex items-center gap-1">
            {moto.cores.map((c, i) => (
              <span
                key={i}
                title={c.nome}
                className={`h-3 w-3 rounded-full ring-1 ring-white/25 ${
                  c.fotos.some(Boolean) ? "" : "opacity-40"
                }`}
                style={{ background: fundoDaCor(c) }}
              />
            ))}
          </span>
          <span>
            {TODAS_AS_UNIDADES.filter((u) => moto.unidades.includes(u))
              .map((u) => UNIDADES[u].cidade)
              .join(" + ") || "nenhuma loja"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={aoDestacar}
        disabled={!podeDestacar}
        title={
          podeDestacar ? "Mostrar em “Mais vendidas”" : `Já há ${LIMITE_DESTAQUES} em destaque`
        }
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-30 ${
          moto.destaque ? "border-primary/60 text-primary" : "border-border text-muted-foreground"
        }`}
      >
        {moto.destaque
          ? `★ Mais vendida${moto.posicaoDestaque ? ` nº ${moto.posicaoDestaque}` : ""}`
          : "☆ Mais vendida"}
      </button>

      <button
        type="button"
        onClick={aoEstoque}
        title="Etiqueta “Em estoque” no card e na página da moto"
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          estaEmEstoque(moto)
            ? "border-emerald-500/50 text-emerald-300"
            : "border-border text-muted-foreground"
        }`}
      >
        {estaEmEstoque(moto) ? "● Em estoque" : "○ Sem estoque"}
      </button>

      <button
        type="button"
        onClick={aoAlternar}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          moto.ativo
            ? "border-emerald-500/50 text-emerald-300"
            : "border-border text-muted-foreground"
        }`}
      >
        {moto.ativo ? "Na vitrine" : "Escondida"}
      </button>

      <button
        type="button"
        onClick={aoEditar}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
      >
        Editar
      </button>

      {confirmando ? (
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={aoRemover}
            className="rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Remover mesmo
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="text-xs text-muted-foreground underline"
          >
            cancelar
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-red-500/50 hover:text-red-300"
        >
          Remover
        </button>
      )}
    </li>
  );
}

function Formulario({
  moto,
  foco,
  todas,
  categorias,
  podeDestacar,
  aoCancelar,
  aoConfirmar,
}: {
  moto: Moto;
  /** Campo que o painel de SEO mandou corrigir: o formulário abre rolado até ele. */
  foco: CampoSeo | null;
  todas: Moto[];
  categorias: string[];
  podeDestacar: boolean;
  aoCancelar: () => void;
  aoConfirmar: (m: Moto) => void;
}) {
  const [rascunho, setRascunho] = useState<Moto>({
    ...moto,
    specs: [...moto.specs, "", "", ""].slice(0, 3),
    cores: (moto.cores.length ? moto.cores : [corVazia()]).map((c) => ({
      ...c,
      fotos: c.fotos.length ? [...c.fotos] : [""],
    })),
  });
  const [corPrevia, setCorPrevia] = useState(0);
  const mudar = (campo: Partial<Moto>) => setRascunho((r) => ({ ...r, ...campo }));
  const mudarCor = (i: number, campo: Partial<Cor>) =>
    mudar({ cores: rascunho.cores.map((c, j) => (j === i ? { ...c, ...campo } : c)) });
  const erros = problemas(rascunho);

  useEffect(() => {
    if (!foco) return;
    const el = document.getElementById(`campo-${foco}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
    el.classList.add("ring-2", "ring-primary/60", "rounded-lg");
    const t = setTimeout(() => el.classList.remove("ring-2", "ring-primary/60"), 2400);
    return () => clearTimeout(t);
  }, [foco]);

  const limpo = (): Moto => ({
    ...rascunho,
    cores: rascunho.cores
      .map((c) => ({ ...c, fotos: c.fotos.map((f) => f.trim()).filter(Boolean) }))
      .filter((c) => c.nome.trim() || c.fotos.length > 0),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="mx-auto grid max-w-5xl gap-6 rounded-2xl border border-border bg-card p-6 lg:grid-cols-[1.3fr_1fr] lg:p-8">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            {moto.nome ? `Editar ${moto.nome}` : "Nova moto"}
          </h2>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Campo rotulo="Marca (decide a aba)">
              <select
                value={rascunho.marca}
                onChange={(e) => mudar({ marca: e.target.value })}
                className={entrada}
              >
                {MARCAS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Nome">
              <input
                value={rascunho.nome}
                autoFocus
                onChange={(e) => mudar({ nome: e.target.value })}
                placeholder="CG 160 Titan"
                className={entrada}
              />
            </Campo>
          </div>

          <Campo rotulo="Categoria">
            <input
              value={rascunho.categoria}
              list="categorias"
              onChange={(e) => mudar({ categoria: e.target.value })}
              placeholder="Street, Trail, Scooter, Cub..."
              className={entrada}
            />
            <datalist id="categorias">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Campo>

          <Campo id="campo-descricao" rotulo="Descrição do card">
            <textarea
              value={rascunho.descricao}
              rows={3}
              onChange={(e) => mudar({ descricao: e.target.value })}
              className={entrada}
            />
          </Campo>

          <Campo id="campo-specs" rotulo="Destaques técnicos (até 3, viram as tags do card)">
            <div className="grid gap-2 sm:grid-cols-3">
              {rascunho.specs.map((s, i) => (
                <input
                  key={i}
                  value={s}
                  onChange={(e) =>
                    mudar({ specs: rascunho.specs.map((x, j) => (j === i ? e.target.value : x)) })
                  }
                  placeholder={["160cc", "Freio ABS", "Painel digital"][i]}
                  className={entrada}
                />
              ))}
            </div>
          </Campo>

          <Campo
            id="campo-cores"
            rotulo={`Cores (até ${LIMITE_CORES}) — a primeira é a que o card abre mostrando`}
          >
            <div className="space-y-3">
              {rascunho.cores.map((c, i) => (
                <EditorDeCor
                  key={i}
                  cor={c}
                  indice={i}
                  total={rascunho.cores.length}
                  aoMudar={(campo) => mudarCor(i, campo)}
                  aoSubir={() => {
                    if (i === 0) return;
                    const cores = [...rascunho.cores];
                    [cores[i - 1], cores[i]] = [cores[i], cores[i - 1]];
                    mudar({ cores });
                  }}
                  aoRemover={() => {
                    mudar({ cores: rascunho.cores.filter((_, j) => j !== i) });
                    setCorPrevia(0);
                  }}
                  aoVer={() => setCorPrevia(i)}
                />
              ))}
              {rascunho.cores.length < LIMITE_CORES && (
                <button
                  type="button"
                  onClick={() => mudar({ cores: [...rascunho.cores, corVazia()] })}
                  className="rounded-lg border border-dashed border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  + Adicionar cor
                </button>
              )}
              <datalist id="fotos-do-projeto">
                {FOTOS_DO_PROJETO.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Foto: link da imagem no site do fabricante (botão direito na foto da cor → “copiar
                endereço da imagem”), ou o nome de um arquivo do projeto, como{" "}
                <code>shi175-1.webp</code>. Cor sem foto aparece como “foto em breve”.
              </p>
            </div>
          </Campo>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Campo rotulo="Selo (opcional)">
              <input
                value={rascunho.selo ?? ""}
                onChange={(e) => mudar({ selo: e.target.value })}
                placeholder="Lançamento"
                className={entrada}
              />
            </Campo>
            <Campo rotulo="Lojas">
              <div className="mt-1 flex flex-wrap gap-4">
                {TODAS_AS_UNIDADES.map((u) => (
                  <label key={u} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={rascunho.unidades.includes(u)}
                      onChange={(e) =>
                        mudar({
                          unidades: e.target.checked
                            ? [...rascunho.unidades, u]
                            : rascunho.unidades.filter((x) => x !== u),
                        })
                      }
                      className="h-4 w-4 accent-[var(--color-primary,#f0bc04)]"
                    />
                    {UNIDADES[u].cidade}
                  </label>
                ))}
              </div>
            </Campo>
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={rascunho.destaque}
                disabled={!podeDestacar}
                onChange={(e) => mudar({ destaque: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-primary,#f0bc04)]"
              />
              Entre as {LIMITE_DESTAQUES} mais vendidas
              {!podeDestacar && (
                <span className="text-xs text-muted-foreground">
                  (já há {LIMITE_DESTAQUES} — tire outra antes)
                </span>
              )}
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={rascunho.ativo}
                onChange={(e) => mudar({ ativo: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-primary,#f0bc04)]"
              />
              Aparece na vitrine
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={estaEmEstoque(rascunho)}
                onChange={(e) => mudar({ emEstoque: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-primary,#f0bc04)]"
              />
              Em estoque (mostra a etiqueta no site)
            </label>
          </div>

          <CamposSeo moto={rascunho} todas={todas} aoMudar={mudar} />

          {erros.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-amber-300">
              {erros.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={erros.length > 0}
              onClick={() => aoConfirmar(limpo())}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark disabled:opacity-40"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={aoCancelar}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:text-ink"
            >
              Cancelar
            </button>
            <span className="self-center text-xs text-muted-foreground">
              Ainda falta salvar no fim.
            </span>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Como vai aparecer
          </p>
          <PreviaDoCard moto={rascunho} cor={corPrevia} aoTrocarCor={setCorPrevia} />
        </div>
      </div>
    </div>
  );
}

function EditorDeCor({
  cor,
  indice,
  total,
  aoMudar,
  aoSubir,
  aoRemover,
  aoVer,
}: {
  cor: Cor;
  indice: number;
  total: number;
  aoMudar: (campo: Partial<Cor>) => void;
  aoSubir: () => void;
  aoRemover: () => void;
  aoVer: () => void;
}) {
  const bicolor = cor.hex2 !== undefined;
  return (
    <div className="rounded-lg border border-border p-3" onFocus={aoVer}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={normalizarHex(cor.hex) || "#777777"}
          onChange={(e) => aoMudar({ hex: e.target.value })}
          aria-label="Cor da bolinha"
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent"
        />
        {bicolor && (
          <input
            type="color"
            value={normalizarHex(cor.hex2 ?? "") || "#000000"}
            onChange={(e) => aoMudar({ hex2: e.target.value })}
            aria-label="Segunda cor da bolinha"
            className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent"
          />
        )}
        <input
          value={cor.nome}
          onChange={(e) => aoMudar({ nome: e.target.value })}
          placeholder="Nome da cor — Vermelho Metálico"
          className={`${entrada} min-w-[160px] flex-1`}
        />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={bicolor}
            onChange={(e) => aoMudar({ hex2: e.target.checked ? "#000000" : undefined })}
          />
          bicolor
        </label>
        <button
          type="button"
          onClick={aoSubir}
          disabled={indice === 0}
          title="Tornar a cor principal"
          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-primary disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={aoRemover}
          disabled={total === 1}
          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-red-300 disabled:opacity-30"
        >
          remover
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {cor.fotos.map((f, j) => (
          <div key={j} className="flex items-center gap-2">
            <input
              value={f}
              list="fotos-do-projeto"
              onChange={(e) =>
                aoMudar({ fotos: cor.fotos.map((x, k) => (k === j ? e.target.value : x)) })
              }
              placeholder={
                j === 0 ? "https://... foto de perfil nesta cor" : "https://... outro ângulo"
              }
              className={entrada}
            />
            <EstadoDaFoto foto={f} />
          </div>
        ))}
        {cor.fotos.length < LIMITE_FOTOS_POR_COR && (
          <button
            type="button"
            onClick={() => aoMudar({ fotos: [...cor.fotos, ""] })}
            className="text-xs text-muted-foreground underline transition hover:text-primary"
          >
            + outro ângulo
          </button>
        )}
      </div>
    </div>
  );
}

const entrada =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary";

function Campo({
  rotulo,
  children,
  id,
}: {
  rotulo: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mt-4 transition" id={id}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {rotulo}
      </p>
      {children}
    </div>
  );
}

/** Diz se o link responde. Um link quebrado descoberto aqui não vira card torto lá. */
function EstadoDaFoto({ foto }: { foto: string }) {
  const [estado, setEstado] = useState<"vazio" | "carregando" | "ok" | "quebrada">("vazio");
  const url = urlDaFoto(foto);

  useEffect(() => {
    if (!foto) return setEstado("vazio");
    if (!url) return setEstado("quebrada");
    setEstado("carregando");
    const img = new Image();
    img.onload = () => setEstado("ok");
    img.onerror = () => setEstado("quebrada");
    img.src = url;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [foto, url]);

  const rotulo = {
    vazio: "",
    carregando: "…",
    ok: "✓",
    quebrada: "não carregou",
  }[estado];

  return (
    <span
      className={`w-24 shrink-0 text-right text-xs ${
        estado === "quebrada" ? "text-red-300" : "text-emerald-300"
      }`}
    >
      {rotulo}
      {estado === "ok" && !ehUrlExterna(foto) ? " projeto" : ""}
    </span>
  );
}

function PreviaDoCard({
  moto,
  cor,
  aoTrocarCor,
}: {
  moto: Moto;
  cor: number;
  aoTrocarCor: (i: number) => void;
}) {
  const atual = moto.cores[cor] ?? moto.cores[0];
  const foto = atual ? urlDaFoto(atual.fotos.find(Boolean) ?? "") : "";
  const marca = marcaPorId(moto.marca);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="relative aspect-[16/11] bg-[radial-gradient(ellipse_at_50%_42%,_#ffffff_0%,_#ececec_58%,_#d6d6d6_100%)]">
        {foto ? (
          <img
            src={foto}
            alt=""
            className="h-full w-full object-contain px-4 pb-3 pt-9 mix-blend-multiply"
          />
        ) : (
          <span className="grid h-full place-items-center text-xs uppercase tracking-[0.2em] text-neutral-500">
            foto em breve
          </span>
        )}
        {moto.categoria && (
          <span className="absolute left-3 top-3 rounded-md bg-black/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
            {moto.categoria}
          </span>
        )}
        {moto.selo && (
          <span className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
            {moto.selo}
          </span>
        )}
      </div>
      <div className="p-5">
        {marca.logo ? (
          <img src={marca.logo} alt={marca.nome} className="h-4 w-auto opacity-80" />
        ) : (
          <span className="text-xs text-muted-foreground">{marca.nome}</span>
        )}
        <h3 className="mt-2.5 font-display text-lg font-bold text-ink">
          {moto.nome || "Nome da moto"}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {moto.descricao || "A descrição aparece aqui."}
        </p>
        <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
          Cor ·{" "}
          <span className="font-semibold normal-case tracking-normal text-ink">
            {atual?.nome || "—"}
          </span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {moto.cores.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => aoTrocarCor(i)}
              aria-label={c.nome || `Cor ${i + 1}`}
              className={`h-6 w-6 rounded-full ${
                i === cor
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  : "ring-1 ring-white/25"
              }`}
              style={{ background: fundoDaCor({ ...c, hex: normalizarHex(c.hex) || "#777777" }) }}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {moto.specs.filter(Boolean).map((s) => (
            <span
              key={s}
              className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              {s}
            </span>
          ))}
        </div>
        <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
          Ver condições →
        </span>
      </div>
    </div>
  );
}
