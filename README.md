# Mattheos Selections

Storefront and admin panel for Mattheos Selections — Greek honey, olive oil and superfoods, sold from Stockholm.
Next.js 16 (App Router, JavaScript), React-Bootstrap, MongoDB (Mongoose), Cloudinary image uploads and Klarna payments.
The storefront is available in English, Swedish and Greek.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in the values (incl. GOOGLE_CLIENT_ID and ADMIN_EMAIL)
npm run create-admin -- --email you@example.com --name "Your Name"   # the admin account for ADMIN_EMAIL
npm run dev               # http://localhost:3000 (storefront) · /admin (admin panel)
```

| Script                 | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Development server                            |
| `npm run build` / `start` | Production build / server                  |
| `npm run lint`         | ESLint (Next.js + React Compiler rules)       |
| `npm run create-admin` | Create an admin account from the command line |

Environment variables are documented in [`.env.example`](.env.example) (MongoDB, JWT secret, Cloudinary, Klarna,
Google sign-in and the admin allow-list).

## Architecture

```
src/
├── app/                  Routes only: pages, layouts and API route handlers
│   ├── [lang]/           Storefront pages (server-rendered per language for SEO)
│   ├── admin/            Admin pages — thin wrappers around the admin views
│   └── api/              REST API — the single HTTP entry point to the backend
├── components/           UI, grouped by feature (common, layout, product, cart, shop, home, auth, admin/…)
├── services/             Client-side API layer: GetApiData (axios) + one module per domain
├── hooks/                Reusable React hooks (data loading, URL state, forms, cart…)
├── context/              Shared client state (cart, auth, UI overlays, wishlist, catalogue, admin session)
├── constants/            App-wide constants (shop filters & sorting, status labels)
├── config/               Business configuration (contact details, shipping, navigation)
├── utils/                Pure helpers (formatting, validation, URLs, errors, localisation)
├── i18n/                 Locales, dictionaries (en / sv / el) and the translation provider
├── server/               Server-only code — never imported by client components
│   ├── domain/           Business logic and data access (products, orders, users, payments, stock…)
│   ├── http/             API route helpers: withApi, JSON errors, body parsing, revalidation
│   ├── auth/             Sessions (httpOnly JWT cookie), Google sign-in, admin allow-list, current user
│   ├── models/           Mongoose models
│   ├── validation.js     Request schemas (zod)
│   └── klarna.js · cloudinary.js · db.js · search.js · utils.js
└── proxy.js              Locale redirects and the optimistic admin gate
```

### How data flows

- **Browser → API.** Every client-side call goes through a service function (`src/services/*.js`), which uses
  `GetApiData(endpoint, method, payload, secured)` from `services/api.js`. That one function owns the base URL,
  headers, credentials and error normalisation (failures reject with an `ApiError` carrying `code`, `message`
  and `fieldErrors`).
- **API → domain.** Route handlers in `src/app/api` are thin: `withApi` checks the session and role, `parseBody`
  validates the JSON body with zod, and the handler calls a `src/server/domain` function.
- **Server components → domain.** Storefront pages render their first view on the server by calling the same
  domain functions the API uses (no HTTP round-trip to itself), so SEO-relevant content is in the HTML and both
  paths always return identical data.
- **Filtering and pagination happen on the server.** The shop, search overlay, admin lists and cart all request
  exactly the page and filters they need; filter option counts (facets) come from the API as well.
- **Authentication.** The session is an httpOnly, SameSite=Lax JWT cookie that JavaScript cannot read.
  `AuthHeader()` adds `X-Requested-With`, which secured API routes require (CSRF protection); cross-site
  requests and non-JSON bodies are rejected. Roles are re-checked against the database on every request.
- **Admin sign-in is Google only.** The Sign in with Google button returns a signed ID token; the API verifies it
  (signature, audience = `GOOGLE_CLIENT_ID`, verified email) and lets the account in only when its email is listed
  in `ADMIN_EMAIL` and belongs to an active admin account in the database. Otherwise the page shows
  "… is not associated with an admin account". Password sign-in is storefront-only and never opens the panel.

### API

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/login` · `POST /api/auth/register` · `POST /api/auth/logout` · `GET /api/auth/me` |
| Admin auth | `POST /api/admin/auth/google` (Sign in with Google — the only way into the panel) |
| Catalogue (public) | `GET /api/products` — `locale, q, category, price, sizes, stock=in, featured, ids, sort, page, pageSize, facets` |
| Checkout | `POST /api/checkout` (→ Klarna payment session) · `POST /api/checkout/confirm` · `POST /api/klarna/authorization` · `POST /api/klarna/notification` |
| Admin | `/api/admin/products[/:id]` · `/api/admin/categories[/:id]` · `/api/admin/orders[/:id]` · `/api/admin/users[/:id][/orders]` · `GET /api/admin/stats[/orders]` · `POST /api/admin/uploads/signature` |

Errors are always `{ "error": { "code", "message", "fieldErrors?" } }` with a matching HTTP status.

### Adding a feature

1. Business logic and queries → a function in `src/server/domain/<area>.js`.
2. Request schema → `src/server/validation.js`.
3. Endpoint → `src/app/api/.../route.js` wrapped in `withApi(handler, { auth })`.
4. Client call → a function in `src/services/<area>.js` using `GetApiData`.
5. UI → a component that loads data with `useApiQuery` (and `useUrlParams` for list filters), reusing the shared
   building blocks (`AdminTable`, `FilterBar`, `QueryState`, `TextField`, `useFormState`…).

## Payments and stock (Klarna)

Payments use **Klarna Payments**, like the WooCommerce shop (plugin "Klarna Payments for WooCommerce"): a regular
checkout form, then Klarna's payment options (Pay now, Pay later, Pay over time) in Klarna's widget.

1. The customer enters their contact details and delivery address, picks the delivery country (which sets the
   shipping fee) and can add a note.
2. `POST /api/checkout` re-prices the cart from the database, keeps it with those details and opens a Klarna
   payment session for the customer's country; the modal shows Klarna's payment options and widget.
3. The customer approves the payment in Klarna's pop-up. The modal sends the authorization to
   `POST /api/checkout/confirm`, and Klarna also sends it to `/api/klarna/authorization`. Whichever arrives first
   takes the items out of stock and places the order at Klarna (so it's never placed twice). If an item sold out in
   the meantime, the authorization is released and nothing is charged.
4. The customer passes through Klarna's redirect page and lands back on the shop with `?payment=success&order=…`.
5. The money is only **reserved** at checkout (payment status *Authorized*). Marking the order as *Shipped* in the
   admin **captures** it (*Paid*); cancelling voids the reservation, or refunds a captured payment.

If Klarna places an order under review, its timeline says so and Klarna's decision arrives at
`/api/klarna/notification`: a rejected order is cancelled and its items return to stock. Klarna only calls the two
callback URLs on an HTTPS domain. The payment session is opened for the customer's country with the SEK amount,
like the WooCommerce shop: the shop's Klarna account accepts customers in the other delivery countries too (if
Klarna refuses a country, the checkout says Klarna isn't available there yet). Set `KLARNA_API_KEY` — a Klarna API
key (`klarna_live_api_…`) from the Klarna Merchant Portal, the same Klarna account as the WooCommerce shop; older
`KLARNA_USERNAME` + `KLARNA_PASSWORD` credentials work too, the client identifier (`klarna_live_client_…`) does not —
and `KLARNA_API_URL` (`https://api.playground.klarna.com` for testing, `https://api.klarna.com` live). Prices include
Swedish VAT at `storeConfig.vatRate` (`src/config/site.js`).
