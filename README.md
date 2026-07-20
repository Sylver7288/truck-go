# Cargo Haul / TruckGo

Cargo Haul is a pnpm workspace for a truck booking platform. It includes a customer web app, an admin panel, a driver mobile app, an Express API, shared generated API clients, Zod schemas, and a Drizzle/PostgreSQL database package.

## Apps

- `artifacts/truckgo-web` - React/Vite customer website and admin panel.
- `artifacts/truckgo-driver` - Expo/React Native driver app.
- `artifacts/api-server` - Express API server.
- `artifacts/mockup-sandbox` - Vite mockup sandbox.

## Shared Packages

- `lib/api-spec` - OpenAPI source and Orval code generation config.
- `lib/api-client-react` - generated React Query API client.
- `lib/api-zod` - generated Zod schemas.
- `lib/db` - Drizzle schema and database connection.
- `scripts` - workspace utility scripts.

## Requirements

- Node.js 24 recommended. Node 22 also works for local checks in this workspace.
- Corepack enabled.
- pnpm 11.15.1, declared in `package.json`.
- PostgreSQL for API/database workflows.

## Setup

```bash
corepack enable
corepack pnpm install
```

Copy the environment template and fill in local values:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string for API and Drizzle.
- `PORT` - API/dev server port, commonly `5000`.
- `BASE_PATH` - Vite base path, usually `/`.
- `VITE_API_PROXY_TARGET` - API server target for local web/admin requests, usually `http://localhost:5001`.
- `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` - demo admin panel credentials for the web app.
- `EXPO_PUBLIC_DOMAIN` - public API/deployment host used by the driver app.

## Common Commands

```bash
corepack pnpm run dev
corepack pnpm run typecheck
corepack pnpm run build
corepack pnpm --filter @workspace/api-server run dev
corepack pnpm --filter @workspace/truckgo-web run dev
corepack pnpm --filter @workspace/truckgo-driver run dev
corepack pnpm --filter @workspace/api-spec run codegen
corepack pnpm --filter @workspace/db run push
```

On Windows or environments without a global `pnpm` shim, use `corepack pnpm ...` as shown above.

The local full-stack dev setup runs the API on port `5001` and the web/admin app on port `5000`. The web Vite server proxies `/api/*` to `VITE_API_PROXY_TARGET`, so the customer site and admin panel can use the same relative API paths as production.

## Build Notes

The driver static build requires a domain value because Expo manifests embed bundle URLs. For a local build check, this is enough:

```powershell
$env:EXPO_PUBLIC_DOMAIN='localhost:3000'
$env:REACT_NATIVE_PACKAGER_HOSTNAME='localhost'
corepack pnpm --filter @workspace/truckgo-driver run build
```

For a real deployment, use the actual public host in `EXPO_PUBLIC_DOMAIN`, `REPLIT_INTERNAL_APP_DOMAIN`, or `REPLIT_DEV_DOMAIN`.

## Validation

The workspace currently has TypeScript and build checks, but no lint or test scripts.

```bash
corepack pnpm run typecheck
corepack pnpm -r --if-present run build
```

## Security Notes

- Do not commit `.env` files or production secrets.
- Admin credentials are read from `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` and are intended for demo/admin-gate usage only.
- The API currently uses simple SHA-256 password hashing in the scaffold. Replace it with a password hashing algorithm such as Argon2 or bcrypt before production use.
