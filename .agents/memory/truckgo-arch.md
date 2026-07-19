---
name: TruckGo platform architecture
description: Full-stack "Uber for trucks" platform — web app + driver mobile app sharing one API + DB — with live GPS tracking.
---

## Products
- **Customer web app** (`artifacts/truckgo-web`) — React/Vite, Astro-style dark Tailwind design
- **Driver mobile app** (`artifacts/truckgo-driver`) — Expo/React Native
- **Admin panel** — built into web app at `/admin`
- **API server** (`artifacts/api-server`) — Express + Drizzle + PostgreSQL

## Design language (Astro-style dark)
- Background: `240 20% 4%` (`#07080f`) — near-black navy, default `:root` (NOT light mode)
- Cards: `.glass-card` utility — `rgba(255,255,255,0.04)` + `backdrop-blur-16px` + `border: 1px solid rgba(255,255,255,0.08)`
- Accent: Amber `--primary: 28 90% 55%` (`#F48525`)
- Gradient text: `.gradient-text-amber` class in `index.css`
- Grid pattern: `body::before` with 48px grid lines
- Glow buttons: `.btn-glow` class adds amber shadow on hover
- All hardcoded `bg-white`, `bg-slate-50`, `text-slate-900` → replaced with dark equivalents (`text-white`, `bg-white/4`, etc.)
- **Leaflet dark override**: `.leaflet-tile-pane { filter: brightness(0.75) saturate(0.8) hue-rotate(195deg) }`

## Live GPS Tracking (fully implemented)
### DB
- `drivers` table: `current_lat DOUBLE PRECISION`, `current_lng DOUBLE PRECISION`, `last_location_at TIMESTAMP`
- Schema pushed to production DB

### API endpoints
- `PATCH /api/drivers/:id/location` — driver pushes `{ lat, lng }` → updates DB, returns `{ driverId, lat, lng, updatedAt }`
- `GET /api/bookings/:id/tracking` — returns `{ bookingId, status, driverLat, driverLng, lastLocationAt, driverName, driverPhone }`

### Driver mobile app (`artifacts/truckgo-driver/app/job/[id].tsx`)
- Uses `expo-location` (already installed as `~19.0.8`)
- `watchPositionAsync` with `timeInterval: 8000` and `distanceInterval: 10`
- Starts watching when `booking.status === 'in_progress'`, stops on any other status or unmount
- Calls `useUpdateDriverLocation` mutation from `@workspace/api-client-react`
- Shows green "Sharing live location" badge when tracking

### Customer web app (`artifacts/truckgo-web/src/components/LiveTrackingMap.tsx`)
- Lazy-loaded via `React.lazy` (Leaflet CSS doesn't block page)
- Uses `react-leaflet` + OpenStreetMap tiles (no API key)
- Polls `GET /bookings/:id/tracking` via `refetchInterval: 8000`
- Custom amber truck `DivIcon` for driver marker, green/red dots for pickup/dropoff
- Leaflet marker icons loaded from unpkg CDN (Vite default icon fix)
- Map shown in `booking-detail.tsx` only when status is `accepted` or `in_progress`
- PanToDriver component auto-pans map when driver coords update

## Auth
- SHA-256 password hash; role stored client-side in localStorage/AsyncStorage
- Admin: hardcoded `admin@truckgo.com` / `admin123`, `useAdminAuth` zustand store

## Seed credentials
| Role | Email | Password |
|---|---|---|
| Customer | alex@example.com | password123 |
| Driver | carlos@driver.com | password123 |
| Admin | admin@truckgo.com | admin123 |

## OpenAPI / Codegen
- Spec: `lib/api-spec/openapi.yaml`
- Regenerate: `pnpm --filter @workspace/api-spec run codegen`
- Generated hooks in `lib/api-client-react/src/generated/api.ts` (do NOT edit)
- Generated Zod schemas in `lib/api-zod/src/generated/api.ts` (do NOT edit)

## Key conventions
- CSS vars in `index.css` `:root` are dark by default (no `.dark` class needed on body)
- `body::before` provides the subtle 48px grid pattern (position: fixed, z-index: 0; `#root` has z-index: 1)
- All new glass cards use `.glass-card` utility class
- Leaflet must be lazy-loaded to avoid CSS ordering issues with Vite
