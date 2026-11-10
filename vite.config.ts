import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      // `@nav` resolves to the Next.js implementation through tsconfig (for
      // Next.js itself and for tsc); the Vite runtime needs React Router's.
      // The built-in alias plugin runs before vite-tsconfig-paths.
      "@nav": fileURLToPath(
        new URL("./src/lib/navigation/react-router.tsx", import.meta.url)
      ),
    },
  },
});
