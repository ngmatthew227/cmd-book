#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required"
  exit 1
fi

echo "→ Applying Prisma migrations…"
prisma migrate deploy

echo "→ Starting cmd-book…"
exec "$@"
