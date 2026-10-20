#!/bin/sh
# Erzeugt PRUEFSUMMEN.txt und das versionierte ZIP. Abhängigkeiten und Build-Caches werden nicht gepackt.
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./package.json').version")
find . -type f ! -path "*/node_modules/*" ! -path "./tools/parity/.cache/*" ! -path "./packages/reference/dist/*" ! -path "./apps/web/.next/*" ! -path "./apps/web/.test/*" ! -path "./packages/domain/dist/*" ! -name "*.tsbuildinfo" ! -name "next-env.d.ts" ! -name PRUEFSUMMEN.txt ! -name "*.zip" | LC_ALL=C sort | xargs sha256sum > PRUEFSUMMEN.txt
OUT=${1:-../healthos-$VERSION.zip}
rm -f "$OUT"
zip -qr "$OUT" . -x "*/node_modules/*" "node_modules/*" "tools/parity/.cache/*" "packages/reference/dist/*" "apps/web/.next/*" "apps/web/.test/*" "packages/domain/dist/*" "*.tsbuildinfo" "*.zip"
echo "$OUT ($(wc -l < PRUEFSUMMEN.txt) Dateien mit Prüfsumme)"
