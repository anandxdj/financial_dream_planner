import { build } from "esbuild";
import { resolve } from "node:path";

const root = process.cwd();
await build({
  absWorkingDir: root,
  entryPoints: [resolve(root, "src/server.ts"), resolve(root, "src/worker.ts"), resolve(root, "src/migrate.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  outdir: resolve(root, "dist"),
  sourcemap: true,
});
