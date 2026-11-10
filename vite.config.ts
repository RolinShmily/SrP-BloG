import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vite refuses to transform files that live in `public/`, including the
 * dynamic `import("/pagefind/pagefind.js")` Pagefind requires. In dev, serve
 * that one module verbatim so search works against the index produced by the
 * last `pnpm build` (pagefind has no dev-server mode of its own).
 */
function servePagefindModule(): Plugin {
  return {
    name: "serve-pagefind-module",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0];
        if (pathname !== "/pagefind/pagefind.js") return next();

        const filePath = path.join(server.config.publicDir, "pagefind/pagefind.js");
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/javascript; charset=utf-8");
          res.end("// No Pagefind index yet; run `pnpm build` once.\n");
          return;
        }

        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths(), servePagefindModule()],
});
