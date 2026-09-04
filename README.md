# cmd-book

Local-first command library. Store terminal/code snippets, copy them with one click, and sync automatically when you're back online.

## Stack

- Next.js (App Router) + Tailwind CSS + shadcn-style UI
- PostgreSQL + Prisma
- Auth.js (email/password + optional GitHub OAuth)
- Dexie.js (IndexedDB) for offline-first reads/writes
- Serwist service worker for PWA asset caching

> **Note:** Serwist currently requires Webpack. Scripts use `next dev --webpack` / `next build --webpack`.

## Quick start

1. Copy env and fill values:

```bash
cp .env.example .env
```

2. Install and push the schema:

```bash
npm install
npm run db:push
```

3. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret for Auth.js sessions |
| `AUTH_URL` | Yes | App origin, e.g. `http://localhost:3000` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | No | Enable GitHub OAuth when set |

## Sync protocol

1. UI reads/writes IndexedDB via Dexie (`cmd-book-${userId}`).
2. Each record tracks `syncStatus`: `synced | pending_insert | pending_update | pending_delete`.
3. When online, the client POSTs pending changes to `/api/commands/sync` and pulls remote updates newer than `lastSyncedAt`.
4. Conflicts use **Last-Write-Wins** on `updatedAt`.

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production
- `npm run db:push` — push Prisma schema
- `npm run db:studio` — Prisma Studio
