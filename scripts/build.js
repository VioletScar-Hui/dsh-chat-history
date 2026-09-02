/**
 * @violet/dsh-chat-history 构建脚本（bun）。
 *
 *  - host:  src/index.js → lib/index.js（ESM，外部化 @deepseek-ai/*）
 *  - client: src/client/index.js → lib/client.js
 *    （CJS + window.__ModuleLoader__.load({ id, factory }) 包裹，
 *     与 dsh-preview / taskboard-plugin 一致）
 */
import { build } from "bun";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST_ENTRY = join(ROOT, "src", "index.js");
const CLIENT_ENTRY = join(ROOT, "src", "client", "index.js");
const OUT_HOST = join(ROOT, "lib", "index.js");
const OUT_CLIENT = join(ROOT, "lib", "client.js");
const PKG_ID = "@violet/dsh-chat-history";

mkdirSync(join(ROOT, "lib"), { recursive: true });

const hostResult = await build({
  entrypoints: [HOST_ENTRY],
  format: "esm",
  target: "node",
  external: ["@deepseek-ai/*", "node:*"],
  outdir: join(ROOT, "lib"),
  naming: "index.js",
  sourcemap: "none",
  minify: false
});
if (!hostResult.success) {
  console.error("host build failed", hostResult.logs);
  process.exit(1);
}
console.log("host → lib/index.js");

const clientTmpDir = join(ROOT, "lib", ".client-tmp");
const clientResult = await build({
  entrypoints: [CLIENT_ENTRY],
  format: "cjs",
  target: "browser",
  define: { "process.env.NODE_ENV": '"production"' },
  external: [
    "react",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "react-dom",
    "react-dom/client",
    "react-dom/server",
    "@deepseek-ai/*"
  ],
  outdir: clientTmpDir,
  sourcemap: "none",
  minify: false
});
if (!clientResult.success) {
  console.error("client build failed", clientResult.logs);
  process.exit(1);
}

let bundle = "";
for (const out of clientResult.outputs) {
  if (out.kind === "entry-point" && out.path.endsWith(".js")) {
    bundle = readFileSync(out.path, "utf8");
  }
}
if (!bundle) {
  console.error("client build produced no entry JS");
  process.exit(1);
}

const wrapped = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(PKG_ID)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${bundle
  .split("\n")
  .map((line) => `\t\t${line}`)
  .join("\n")}
\t\treturn module.exports;
\t}
});
`;
writeFileSync(OUT_CLIENT, wrapped, "utf8");
rmSync(clientTmpDir, { recursive: true, force: true });
console.log(`client → lib/client.js (${(wrapped.length / 1024).toFixed(1)} KB)`);
