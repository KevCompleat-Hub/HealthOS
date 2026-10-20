// Lädt Referenz (eingefroren) und neuen TypeScript-Kern als Node-Module.
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const require = createRequire(import.meta.url);

export function loadModules() {
  const srcDir = process.env.DOMAIN_SRC || path.join(root, 'packages/domain/src');
  const out = path.join(root, 'tools/parity/.cache', process.env.DOMAIN_SRC ? `mutant-${path.basename(srcDir)}.cjs` : 'domain.cjs');
  mkdirSync(path.dirname(out), { recursive: true });
  buildSync({ entryPoints: [path.join(srcDir, 'index.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node20', outfile: out, logLevel: 'error' });
  const R = require(path.join(root, 'packages/reference/dist/reference-v5.cjs'));
  const N = require(out);
  R.__v2 = require(path.join(root, 'packages/reference/dist/reference-v2.cjs'));
  return { R, N, root };
}
