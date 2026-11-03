// Animações de entrada por rolagem e contadores. Sem biblioteca: um IntersectionObserver
// só para a página inteira, ligado por <AnimacoesDaPagina />.
//
// Como usar: qualquer elemento com data-reveal="up|left|right|zoom" entra quando aparece
// na tela; o atraso vem de style={{ "--d": "120ms" }}. O conteúdo só fica escondido depois
// que este componente marca <html class="anim"> — com JS desligado ou no SSR, tudo aparece.
import { useEffect, useRef, useState, type CSSProperties } from "react";

export function AnimacoesDaPagina() {
  useEffect(() => {
    const raiz = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    raiz.classList.add("anim");
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    const observar = () =>
      document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    observar();
    // A vitrine troca de marca sem recarregar: os cards novos também precisam entrar.
    const mo = new MutationObserver(observar);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      raiz.classList.remove("anim");
    };
  }, []);
  return null;
}

/** Atraso em escada para listas: atraso(i) => { "--d": "80ms" } */
export const atraso = (i: number, passo = 80) => ({ "--d": `${i * passo}ms` }) as CSSProperties;

/**
 * Número que conta até o valor quando aparece. Aceita texto com prefixo e sufixo
 * ("+193", "+15 anos", "9,7/10", "24h"): só a primeira parte numérica anima.
 */
export function Contador({ valor, className }: { valor: string; className?: string }) {
  const m = valor.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const [texto, setTexto] = useState(valor);

  useEffect(() => {
    if (!m || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, antes, num, depois] = m;
    const decimal = num.includes(",") ? "," : num.includes(".") ? "." : "";
    const casas = decimal ? num.split(decimal)[1].length : 0;
    const alvo = parseFloat(num.replace(",", "."));
    const formatar = (v: number) =>
      antes + (casas ? v.toFixed(casas).replace(".", decimal) : Math.round(v)) + depois;
    setTexto(formatar(0));
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const inicio = performance.now();
      // Escreve direto no elemento: re-renderizar o React a cada quadro pesa no celular.
      const passo = (t: number) => {
        const p = Math.min((t - inicio) / 1400, 1);
        el.textContent = formatar(alvo * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <span ref={ref} className={className}>
      {texto}
    </span>
  );
}
