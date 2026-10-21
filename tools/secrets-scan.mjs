// Sucht vor jedem Release nach versehentlich eingecheckten Geheimnissen. Exit-Status 1 bei Fund.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SKIP = new Set(['node_modules', '.next', '.test', 'dist', '.cache', '.git']);
const RULES = [
  [/sb_secret_[A-Za-z0-9_-]{10,}/, 'Supabase Secret Key'],
  [/sk-ant-[A-Za-z0-9_-]{10,}/, 'Anthropic API-Schlüssel'],
  [/-----BEGIN (RSA |EC |)PRIVATE KEY-----/, 'privater Schlüssel'],
  [/eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, 'JWT (möglicher Service-Schlüssel)'],
  [/(SUPABASE_SERVICE_ROLE_KEY|ANTHROPIC_API_KEY)\s*=\s*['"]?[A-Za-z0-9_-]{16,}/, 'Schlüssel mit Wert'],
];
const hits = [];
const walk = d => readdirSync(d).forEach(f => { if (SKIP.has(f)) return; const p = path.join(d, f); const s = statSync(p);
  if (s.isDirectory()) return walk(p); if (s.size > 2_000_000 || /\.(png|zip|woff2?)$/.test(f)) return;
  const t = readFileSync(p, 'utf8'); for (const [re, name] of RULES) if (re.test(t) && !/secrets-scan\.mjs$/.test(p)) hits.push(`${path.relative(root, p)}: ${name}`); });
walk(root);
console.log(hits.length ? `FUND:\n${hits.join('\n')}` : 'Keine Geheimnisse gefunden.');
process.exit(hits.length ? 1 : 0);
