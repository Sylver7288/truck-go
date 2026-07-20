# Cargo Haul / TruckGo

Truck booking platform with a customer website, admin panel, driver mobile app, API server, and shared generated API/database packages.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: see `.env.example`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Customer website and admin panel: `artifacts/truckgo-web`
- Driver mobile app: `artifacts/truckgo-driver`
- API server: `artifacts/api-server`
- API contract: `lib/api-spec/openapi.yaml`
- Generated API client: `lib/api-client-react`
- Generated Zod schemas: `lib/api-zod`
- DB schema: `lib/db/src/schema`

## Architecture decisions

- Monorepo uses pnpm workspaces and TypeScript project references for shared packages.
- OpenAPI is the source of truth for generated React Query hooks and Zod schemas.
- Driver app uses Expo and configures API base URL from `EXPO_PUBLIC_DOMAIN`.
- Admin panel currently lives inside the main web app instead of a separate package.

## Product

- Customers can register, estimate/book truck moves, track bookings, chat/contact, and review trips.
- Drivers can sign in, view/accept/start/complete jobs, update status, and share live location.
- Admin users can access operational views inside the web app.

## Gotchas

- Use `corepack pnpm ...` on Windows if a global `pnpm` command is not available.
- Driver static build requires `EXPO_PUBLIC_DOMAIN` or a Replit domain env.
- `pnpm --filter @workspace/api-spec run codegen` regenerates generated client/schema files.
- The workspace has typecheck/build scripts but no test or lint scripts yet.

## Pointers

- See `README.md` for GitHub-facing setup and validation instructions.
