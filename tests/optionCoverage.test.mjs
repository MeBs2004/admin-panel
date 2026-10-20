import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Every Customize option — and every individual value of every
// enumerated option — must visibly change the live preview. This is the
// guard against "I changed it on the left and nothing happened".
test("every customization option (and every enum value) changes the live preview", async () => {
  const outfile = join(mkdtempSync(join(tmpdir(), "nf-audit-")), "audit.mjs");
  await build({
    entryPoints: [join(here, "entries/coverage.entry.jsx")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    jsx: "automatic",
    loader: { ".png": "dataurl", ".jpg": "dataurl", ".svg": "dataurl", ".gif": "dataurl" },
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "error",
    banner: { js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);' },
  });
  const { audit } = await import(pathToFileURL(outfile).href);
  const { checked, failures } = audit();
  assert.ok(checked > 150, `expected to exercise 150+ option values, got ${checked}`);
  assert.deepEqual(failures, [], `options with no visible effect in the preview:\n  ${failures.join("\n  ")}`);
});
