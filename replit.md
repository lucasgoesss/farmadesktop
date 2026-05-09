# FarmaSystem — Gestão de Farmácia

Sistema completo de gestão para farmácias: PDV, estoque, medicamentos controlados, financeiro e muito mais.
Suporta dois modos de execução: **web** (Postgres) e **desktop** (Electron + SQLite, offline-first).

## Run & Operate

### Modo Web (padrão)
- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, proxy at /api)
- `pnpm --filter @workspace/farmacia run dev` — Frontend Vite (port via $PORT)
- `pnpm run dev:web` — atalho: inicia api-server + frontend em paralelo

### Modo Desktop (Electron)
- `pnpm run dev:desktop` — build + abre janela Electron com API local SQLite
- `pnpm run build:desktop` — build completo + empacota com electron-builder
- Requer ambiente gráfico (Linux/macOS/Windows com display) — não roda no Replit diretamente

### Utilitários
- `pnpm run typecheck` — typecheck completo em todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regeração dos hooks e schemas Zod
- `pnpm --filter @workspace/db run push` — aplica schema no Postgres (dev)
- `pnpm --filter @workspace/db run push:sqlite` — aplica schema no SQLite local
- `pnpm --filter @workspace/db run generate:sqlite` — gera migrations SQLite
- `pnpm --filter @workspace/db run migrate:sqlite` — aplica migrations SQLite
- Seed Postgres: `cd lib/db && pnpm exec tsx src/seed.ts`
- Envs obrigatórias (web): `DATABASE_URL` — string de conexão Postgres
- Envs desktop: `SQLITE_PATH` (default `~/.farmasystem/farmasystem.db`), `API_PORT` (default 8081)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React + Vite, Wouter (routing), shadcn/ui, Tailwind CSS v4, Recharts
- **API**: Express 5, Pino (logging)
- **DB web**: PostgreSQL + Drizzle ORM (node-postgres)
- **DB desktop**: SQLite via LibSQL (`@libsql/client`) + Drizzle ORM — sem Postgres, offline-first
- **Desktop shell**: Electron 35
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS/ESM bundle)

## Where things live

```
lib/
  api-spec/openapi.yaml              — Source of truth for all API contracts
  api-client-react/src/generated/    — Generated React Query hooks + types (do not edit)
  db/
    src/
      index.ts                       — Postgres Drizzle connection (web mode)
      index-sqlite.ts                — LibSQL Drizzle connection (desktop mode)
      schema/                        — 10 Drizzle Postgres schemas + sync_outbox
      schema-sqlite/                 — 11 Drizzle SQLite schemas (mirror + sync_outbox)
      migrate-sqlite.ts              — Migration bootstrap script for SQLite
    drizzle.config.ts                — drizzle-kit config (Postgres)
    drizzle.sqlite.config.ts         — drizzle-kit config (SQLite/LibSQL)
    drizzle/sqlite/                  — Generated SQLite migrations (after generate:sqlite)

artifacts/
  api-server/
    src/routes/                      — Express route handlers (one file per domain)
    build.mjs                        — esbuild bundle for web (Postgres)
    build-desktop.mjs                — esbuild bundle for desktop (LibSQL alias)
    dist/                            — Web build output
    dist-desktop/                    — Desktop build output (SQLite)
  farmacia/src/pages/                — All 13 page components
  desktop/
    src/main.ts                      — Electron main process
    src/preload.ts                   — Electron contextBridge preload
    build-api-desktop.mjs            — Builds api-server with @workspace/db → SQLite alias
    electron-builder.yml             — Packaging config (Linux AppImage/deb, macOS dmg, Win NSIS)
```

## Architecture decisions

- **Contract-first API**: OpenAPI spec is the single source of truth; hooks and schemas are generated from it
- **Dual DB drivers**: `@workspace/db` (default export) → Postgres; `@workspace/db/sqlite` → LibSQL. Desktop esbuild aliases the former to the latter at build time — route handlers are unchanged
- **Offline-first outbox**: `sync_outbox` table exists in both Postgres and SQLite schemas. Future sync worker reads `status='pending'` rows and retries with exponential back-off
- All numeric fields in Postgres use `numeric` type; routes `parseFloat(String(...))` before returning (compatible with SQLite `real` which returns JS `number`)
- Express 5 wildcard routes use `/{*splat}`, async handlers typed as `Promise<void>`
- Frontend uses Wouter for routing with `import.meta.env.BASE_URL` as base path
- Session secret stored in `SESSION_SECRET` env var

## Desktop dev workflow (on a local machine)

```bash
# 1. Install deps
pnpm install

# 2. (First run only) Bootstrap SQLite schema
SQLITE_PATH=./farmasystem.db pnpm --filter @workspace/db run push:sqlite

# 3. Build API server bundle with SQLite driver
node artifacts/desktop/build-api-desktop.mjs

# 4. Start frontend dev server (separate terminal)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/farmacia run dev

# 5. Build and start Electron (separate terminal)
pnpm --filter @workspace/desktop run build
API_PORT=8081 FRONTEND_PORT=5173 pnpm --filter @workspace/desktop run start

# Or use the convenience script (does steps 3-5 sequentially):
pnpm run dev:desktop
```

## Product modules

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | / | KPI cards, vendas recentes, mais vendidos |
| PDV / Vendas | /pdv | Frente de caixa com carrinho e pagamentos |
| Estoque | /estoque | Lotes com vencimento colorido, entradas |
| Produtos | /produtos | Catálogo completo, flags controlado |
| Clientes | /clientes | Cadastro, pontos fidelidade, histórico |
| Fornecedores | /fornecedores | Card view com contatos, CRUD |
| Receitas | /receitas | Receituário médico com CRM |
| Controlados | /controlados | Log ANVISA, retenção de receita |
| Compras | /compras | Ordens de compra (pendente→recebido) |
| Financeiro | /financeiro | Fluxo de caixa, contas a pagar/receber |
| Relatórios | /relatorios | Gráficos Recharts, ranking, baixo estoque |
| Usuários | /usuarios | Gestão de usuários e perfis |
| Configurações | /configuracoes | Dados da farmácia, notificações |

## User preferences

- Language: Portuguese (pt-BR) throughout UI
- No emojis in the UI
- Deep red brand color (#C62828, sidebar #B71C1C)

## Gotchas / Pendências

- **Electron binary**: não roda no Replit (sem display). Em produção local, `pnpm install` baixa o binário automaticamente
- **SQLite driver**: usa `@libsql/client` (LibSQL, pure JS/WASM) em vez de `better-sqlite3` — sem compilação nativa, funciona em qualquer plataforma
- **sync_outbox**: estrutura criada, worker de sync ainda não implementado. TODO: criar `lib/sync-worker/` com retry loop
- **Login**: tela de login é mock — sem autenticação real. TODO: adicionar Replit Auth ou Clerk
- **PORT**: api-server aceita PORT env var (default 8080 para web, 8081 para desktop)
- Numeric DB fields (Postgres) retornam strings do Drizzle — sempre `parseFloat(String(value))` nas rotas

## Pointers

- Ver skill `pnpm-workspace` para estrutura do monorepo, TypeScript e detalhes de pacotes
- Seed script em `lib/db/src/seed.ts`, rodar de `lib/db` com `pnpm exec tsx src/seed.ts`
