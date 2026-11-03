// robots.txt gerado por loja: o endereço do sitemap muda conforme o site (o domínio de
// cada LP), então não dá para ser um arquivo fixo em public/.
import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/config/unidade";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            "# A LP inteira pode ser indexada, menos o painel de estoque.",
            "User-agent: *",
            "Allow: /",
            "Disallow: /admin",
            "",
            `Sitemap: ${SITE_URL}/sitemap.xml`,
            "",
          ].join("\n"),
          { headers: { "content-type": "text/plain; charset=utf-8" } },
        ),
    },
  },
});
