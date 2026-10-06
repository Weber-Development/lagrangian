// Fails when the minified, gzipped bundles grow past the budgets the README promises.
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const dist = new URL("../dist/", import.meta.url).pathname;
const cases = [
  ["everything", `export * from "${dist}index.js";`, 8448],
  ["spring + value", `export { spring, value } from "${dist}index.js";`, 2560],
  ["animate + draggable", `export { animate, draggable } from "${dist}index.js";`, 4352],
  ["world", `export { World } from "${dist}index.js";`, 4864],
];
let failed = false;
for (const [name, contents, budget] of cases) {
  const result = await build({
    stdin: { contents, resolveDir: dist },
    bundle: true,
    minify: true,
    treeShaking: true,
    format: "esm",
    write: false,
  });
  const size = gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
  const ok = size <= budget;
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${size} B min+gzip (budget ${budget} B)`);
}
if (failed) process.exit(1);
