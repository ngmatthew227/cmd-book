#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required"
  exit 1
fi

echo "→ Applying Prisma migrations…"

# Capture deploy output; non-empty DBs created via `db push` need a one-time baseline.
set +e
deploy_out=$(prisma migrate deploy 2>&1)
deploy_status=$?
set -e
printf "%s\n" "$deploy_out"

if [ "$deploy_status" -eq 0 ]; then
  :
elif printf "%s" "$deploy_out" | grep -q "P3005"; then
  echo "→ Existing schema detected; baselining initial migration…"
  prisma migrate resolve --applied 20250904000000_init
  prisma migrate deploy
else
  exit "$deploy_status"
fi

echo "→ Starting cmd-book…"
exec "$@"
