# Code994 Shop — Next.js Frontend

A frontend for a fashion / streetwear e-commerce reference site, built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS** and wired to the **`ShoppingBack`** .NET 8 API.

## Quick start

```bash
# 1. Start the backend first (separate terminal):
#    cd ../ShoppingBack/src/ECommerce.API && dotnet run
#
# 2. Then start the frontend:
npm install
cp .env.example .env.local       # edit if your API runs on a different URL
npm run dev
```

Open <http://localhost:3000>. The frontend expects the API at `NEXT_PUBLIC_API_URL` (default `http://localhost:5080`).

## Environment

| Variable               | Default                  | Notes                                      |
| ---------------------- | ------------------------ | ------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:5080`  | Base URL of the ECommerce.API backend.     |

## Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Start the dev server       |
| `npm run build`   | Production build           |
| `npm run start`   | Run the production build   |
| `npm run lint`    | Run ESLint                 |

## Pages

- `/` — Home (server-fetches featured + newest from API)
- `/shop` — Shop (page 1)
- `/shop/page/[num]` — Shop pagination
- `/product/[slug]` — Product detail (fetches variants + images from API)
- `/category/[slug]` — Category listing (uses backend `categorySlug` filter)
- `/brand/[slug]` — Brand listing (uses backend `brandSlug` filter)
- `/about` — Static content
- `/contact` — Contact form POSTs to `/api/contact`
- `/cart` — Cart synced with backend (`/api/cart` + checkout via `/api/orders`)

## Architecture

```
src/
├── app/                Next.js App Router pages
├── components/         Reusable UI (Header, MobileMenu, ShopView, CartProvider, …)
├── data/               Static reference data (category + brand taxonomy, color swatches)
└── lib/
    ├── api/            API endpoint helpers + fetch client (auth + X-Session-Id headers)
    ├── api-types.ts    TypeScript types matching the backend DTOs
    ├── api-mappers.ts  Map backend DTOs → existing front-end `Product` type
    ├── session.ts      LocalStorage helpers for JWT + guest cart session id
    ├── format.ts       Price formatting
    └── types.ts        Front-end shared types
```

- Server Components (home/shop/category/brand/product pages) call the API via `apiFetch` with `silent: true` so missing-API responses produce empty UI instead of 500 errors.
- The `CartProvider` calls the backend cart endpoints on every mutation. For guest sessions, the client generates a UUID and persists it in `localStorage` as `shoppingfront.sessionId`, then sends it as the `X-Session-Id` header on cart calls.
- Auth tokens (when the user is logged in) are stored in `localStorage` under `shoppingfront.token` and attached as `Authorization: Bearer ...` automatically.

## Connecting frontend ↔ backend

1. The backend's CORS allow-list (`ShoppingBack/src/ECommerce.API/appsettings.json` → `Cors:AllowedOrigins`) already includes `http://localhost:3000`.
2. `next.config.js` whitelists `localhost:5080` for `next/image` so backend-uploaded images render correctly.
3. Category and brand slugs are the AZ-derived slugs used by the backend (`geyimler`, `ayaqqabilar`, `aksesuarlar`, `wrangler`, …) — no manual translation layer needed.

If you see "Backend əlçatan deyil" anywhere in the UI, confirm the API is running on the URL set in `NEXT_PUBLIC_API_URL`.
