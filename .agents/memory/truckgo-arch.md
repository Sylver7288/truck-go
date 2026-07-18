---
name: TruckGo platform architecture
description: Key decisions and conventions for the TruckGo monorepo — web app, driver Expo app, API server, DB schema.
---

## Products
- **Customer web app** (`artifacts/truckgo-web`, React/Vite, previewPath `/`)
- **Driver mobile app** (`artifacts/truckgo-driver`, Expo, previewPath `/truckgo-driver/`)
- **API server** (`artifacts/api-server`, Express 5 + pino, port from `$PORT`)

## Auth
- Simple SHA-256 password hash (no JWT/sessions)
- Auth role stored client-side: `{ userId, role, name, email }`
- Web: localStorage via `useAuth` store (zustand)
- Mobile: AsyncStorage via `context/AuthContext.tsx` → `useAuth()`
- Login endpoint differentiates customer vs driver by `role` field in request

## Design tokens (both artifacts share these)
- Primary: amber `hsl(28,90%,55%)` → `#F48525`
- Secondary/Foreground: deep navy `hsl(222,47%,11%)` → `#0F1729`
- Background: light slate `hsl(210,20%,98%)` → `#F5F7FA`
- Font: Plus Jakarta Sans (web) / Inter (mobile)
- Radius: 8px

## API client
- Generated hooks in `lib/api-client-react/src/generated/api.ts` — never edit directly
- Regenerate: `pnpm --filter @workspace/api-spec run codegen`
- Mobile: call `setBaseUrl(...)` from `@workspace/api-client-react` at module level in `_layout.tsx`
- Query keys for cache invalidation: `getListDriverJobsQueryKey(id)`, `getGetBookingQueryKey(id)`, `getGetDriverStatsQueryKey(id)`, etc.

## DB
- Drizzle ORM + PostgreSQL
- Schema: `lib/db/src/schema/` (customers, drivers, truck_types, bookings, reviews)
- Push schema changes: `pnpm --filter @workspace/db run push`
- Seeded: 6 truck types, 3 customers, 4 drivers, sample bookings (password `password123` → sha256)

## OpenAPI spec
- `lib/api-spec/openapi.yaml` — source of truth for all routes
- Fixed: no `format: email` (causes zod error), no query param on listDriverJobs path (causes name collision)
- Operationids: login, registerCustomer, registerDriver, getDriver, listDriverJobs, getDriverStats, updateDriverStatus, acceptBooking, startBooking, completeBooking, cancelBooking, listBookings, createBooking, etc.

**Why:** Codegen is fragile — these two fixes took time to find; preserve them.

## Mutation call signatures (orval-generated)
- `useUpdateDriverStatus().mutate({ id, data: { status } })`
- `useAcceptBooking().mutate({ id, data: { driverId } })`
- `useStartBooking().mutate({ id })`
- `useCompleteBooking().mutate({ id })`
- `useCancelBooking().mutate({ id })`
