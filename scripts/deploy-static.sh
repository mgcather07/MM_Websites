#!/usr/bin/env bash
#
# Build the site as a static export and deploy it to Firebase Hosting.
# Use this after dropping new images in public/images/ (or any content change).
#
#   npm run deploy
#
set -euo pipefail
cd "$(dirname "$0")/.."

STASH=".static-build-stash"

# The /api/quote route can't be part of a static export, so move it aside for
# the build and always put it back (even if the build fails).
restore() {
  if [ -d "$STASH/api" ]; then
    mv "$STASH/api" src/app/api
    rmdir "$STASH" 2>/dev/null || true
  fi
}
trap restore EXIT

mkdir -p "$STASH"
[ -d src/app/api ] && mv src/app/api "$STASH/api"

# Build the admin (Vite) app into public/admin first, so the Next static export
# copies it into out/admin. Install deps on first run.
[ -d admin/node_modules ] || ( cd admin && npm install )
( cd admin && npm run build )

rm -rf out .next
STATIC_EXPORT=1 npm run build

restore
trap - EXIT

firebase deploy --only hosting --non-interactive
echo ""
echo "✔ Live at https://mm-websites.web.app"
