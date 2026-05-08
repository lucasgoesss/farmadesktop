# FarmaSystem — Gestão de Farmácia

Sistema completo de gestão para farmácias: PDV, estoque, medicamentos controlados, financeiro e muito mais.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxy at /api)
- `pnpm --filter @workspace/farmacia run dev` — run the frontend (Vite, port from $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Seed DB: `cd lib/db && pnpm exec tsx src/seed.ts`
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter (routing), shadcn/ui, Tailwind CSS v4, Recharts
- API: Express 5, Pino (logging)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Source of truth for all API contracts
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks (do not edit)
- `lib/api-client-react/src/generated/api.schemas.ts` — Generated TypeScript types
- `lib/db/src/schema/` — 10 Drizzle schema files (users, products, customers, suppliers, stock, sales, prescriptions, controlled, purchases, financial)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/farmacia/src/pages/` — All 13 page components
- `artifacts/farmacia/src/components/` — Layout, sidebar, header, and shadcn UI components

## Architecture decisions

- Contract-first API: OpenAPI spec is the single source of truth; hooks and schemas are generated from it
- All numeric fields in Postgres use `numeric` type; routes `parseFloat(String(...))` before returning
- Express 5 wildcard routes use `/{*splat}`, async handlers typed as `Promise<void>`
- Frontend uses Wouter for routing with `import.meta.env.BASE_URL` as base path
- Session secret stored in `SESSION_SECRET` env var (managed by Replit secrets)

## Product

- **Dashboard** — KPI cards (daily revenue, sales, low stock, expiring), recent sales, top products
- **PDV / Vendas** — Point-of-sale with barcode scan, shopping cart, PIX/card/cash/convenio payment
- **Estoque** — Stock lots with expiry dates (color-coded), entry form, movement history
- **Produtos** — Full product catalog, controlled flags, barcode, CRUD
- **Clientes** — Customer registry, loyalty points, purchase history
- **Fornecedores** — Supplier card view with contact info, CRUD
- **Receitas** — Medical prescription registry with doctor CRM
- **Controlados** — ANVISA-class controlled medication dispensation log, retention tracking
- **Compras** — Purchase orders with status workflow (pendente → confirmado → recebido)
- **Financeiro** — Cashflow summary, accounts payable/receivable, transaction CRUD
- **Relatórios** — Sales charts (Recharts), top products ranking, low stock table, PDF export stubs
- **Usuários** — User management with role badges (admin/gerente/farmacêutico/atendente)
- **Configurações** — Pharmacy settings (name, CNPJ, license, address), notification toggles

## User preferences

- Language: Portuguese (pt-BR) throughout UI
- No emojis in the UI
- Deep red brand color (#C62828, sidebar #B71C1C)

## Gotchas

- Always rebuild the API server after route changes: restart the `artifacts/api-server: API Server` workflow
- The login page (`/login`) is a mock — no real auth; submit any credentials to enter
- `lib/db/src/seed.ts` is the canonical seed file; run from `lib/db` package with tsx
- Numeric DB fields come back as strings from Drizzle — always `parseFloat(String(value))` in routes

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
