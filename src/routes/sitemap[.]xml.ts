// Sitemap desta loja: a página inicial e a página de cada moto que está na vitrine dela.
// Lido do estoque na hora, então moto nova cadastrada no painel entra sozinha.
import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/config/unidade";
import { caminhoDaMoto } from "@/lib/seo";
import { carregarVitrine } from "@/servidor/estoque";

const url = (loc: string, prioridade: string) => `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${prioridade}</priority>
  </url>`;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { motos } = await carregarVitrine();
        const corpo = [
          url(`${SITE_URL}/`, "1.0"),
          ...motos.map((m) => url(`${SITE_URL}${caminhoDaMoto(m)}`, "0.8")),
        ].join("\n");
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corpo}
</urlset>
`,
          { headers: { "content-type": "application/xml; charset=utf-8" } },
        );
      },
    },
  },
});
