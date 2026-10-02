# CivicPulse

**Report it once. Let AI handle the rest.**

CivicPulse is a civic-issue reporting platform. Citizens report local problems (garbage, potholes,
drainage, streetlights, and more) with a photo and a location; AI-assisted duplicate detection
helps surface similar existing reports so communities rally behind one report instead of
fragmenting across many; public servants triage, assign and resolve issues within their
jurisdiction; administrators manage the platform, approve staff, and monitor analytics.

This is a hackathon project. **CivicPulse is not affiliated with any real
government body.** Any municipality or department names you see in demo data are placeholders.

---

## Table of contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Setup — backend](#setup--backend)
6. [Setup — frontend](#setup--frontend)
7. [MongoDB setup](#mongodb-setup)
8. [Hugging Face setup](#hugging-face-setup)
9. [Image storage (Cloudinary) setup](#image-storage-cloudinary-setup)
10. [Environment variables](#environment-variables)
11. [Running locally](#running-locally)
12. [Demo data](#demo-data)
13. [Testing](#testing)
14. [Deployment](#deployment)
15. [Security](#security)
16. [API overview](#api-overview)
17. [AI duplicate-detection architecture](#ai-duplicate-detection-architecture)
18. [Internationalization](#internationalization)
19. [Maps](#maps)
20. [Known limitations](#known-limitations)
21. [Future scope](#future-scope)

---

## Features

**Citizens**
- Register / log in, report an issue with a photo, description, and location (current location,
  search, click-on-map, or drag-to-correct)
- AI-assisted duplicate detection shows a possible match before a new report is created
- Browse nearby issues as a list or on a map, upvote, and track your own reports
- Full notification lifecycle (report submitted, duplicate found, assigned, status changed, action
  update, resolved)
- 12-language UI (see [Internationalization](#internationalization)), light/dark theme

**Public servants**
- Register, wait for admin approval, then get a jurisdiction (municipality + department + wards)
- Dashboard, a transparent rule-based priority queue, assign/accept issues, post public updates or
  internal notes, resolve with evidence — all enforced server-side against their jurisdiction
- Jurisdiction map view

**Administrators**
- Approve/reject/suspend public servants and assign their jurisdiction
- Manage municipalities and departments
- Full issue management: assign/reassign, override priority, moderate (hide/flag), view AI-suggested
  duplicate candidates
- Platform analytics (reports by category/municipality/department/priority, trend over time, average
  resolution time) with real charts, duplicate-detection funnel analytics, audit log, AI
  configuration (model names + duplicate-detection weights — never the API key)

## Architecture

```
          Citizen / Public Servant / Admin (Next.js app)
                            |  HTTPS, cookie-based JWT
                            v
                    Express API (Node/TS)
         +--------------+--------------+---------------+
         v              v              v               v
     MongoDB         Hugging Face   Local disk      OpenStreetMap
  (Mongoose models)  (image/text     (uploaded       (Leaflet tiles +
                       AI, optional)  images)         Nominatim geocoding)
```

CivicPulse does **not** train any model. Hugging Face provides pre-trained image classification and
embedding endpoints; the backend combines their output with geographic proximity and category
matching into a single, transparent duplicate-confidence score — and a citizen always makes the
final call (confirm vs. create new). See [AI duplicate-detection architecture](#ai-duplicate-detection-architecture).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, TanStack Query, Leaflet / react-leaflet, Recharts |
| Backend | Node.js, Express, TypeScript, Mongoose (MongoDB) |
| Auth | JWT in an httpOnly cookie, bcrypt password hashing |
| AI | Hugging Face Inference API (image classification, image & text embeddings) |
| Maps | OpenStreetMap tiles via Leaflet, Nominatim for geocoding — no API key required |
| Validation | Zod on every mutating endpoint |

## Project structure

```
backend/
  src/
    config/        env loading, DB connection
    models/        Mongoose schemas (User, Issue, Municipality, Department, Notification, ...)
    controllers/    request handlers, grouped by area (auth, issue, publicServant, admin, ...)
    services/       business logic (PriorityService, DuplicateDetectionService, AuditService, ...)
    middleware/     auth, validation, rate limiting, error handling
    routes/         Express routers
    validators/     Zod schemas
    scripts/        seed:admin / seed:municipalities / seed:demo
frontend/
  src/
    app/            Next.js App Router pages, one folder per route
    components/     shared UI primitives (Button, Card, Toast, ConfirmDialog, map components, ...)
    features/       feature-grouped UI (landing page, dashboard, issues, staff, admin)
    services/       typed API clients per area
    lib/            api client, i18n, validators, status/priority metadata
    locales/        <lang>/common.json translation dictionaries (12 languages)
```

## Setup — backend

```bash
cd backend
npm install
cp .env.example .env     # then fill in the values — see Environment variables below
npm run dev               # starts on http://localhost:5000
```

## Setup — frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev               # starts on http://localhost:3000
```

## MongoDB setup

Any MongoDB 6+ instance works — local, Docker, or a free [MongoDB Atlas](https://www.mongodb.com/atlas)
cluster. Set `MONGODB_URI` in `backend/.env`. Indexes (geospatial, status/category/municipality/
department/assignedTo/createdAt/upvoteCount on Issue; email/role/accountStatus on User; a unique
userId+issueId compound index on Vote) are declared directly on the Mongoose schemas and are created
automatically the first time the app connects.

## Hugging Face setup

1. Create a free account and an access token at <https://huggingface.co/settings/tokens>.
2. Set `HUGGINGFACE_API_KEY` in `backend/.env`.
3. The default model names in `.env.example` work out of the box; an administrator can change them
   later at `/admin/ai-configuration` without redeploying.
4. **If you skip this step**, the app still works end-to-end — duplicate detection simply falls back
   to location + category matching only, and issue reporting never fails because of it (see
   [Known limitations](#known-limitations)).

## Image storage (Cloudinary) setup

Image uploads currently write to local disk (`backend/uploads`, served at `/uploads`) via
`services/StorageService.ts`, so the app runs with **zero storage configuration**. The
`CLOUDINARY_*` variables are reserved for production: local disk storage is fine for a demo but
doesn't survive most PaaS redeploys, so before a real deployment, swap
`StorageService.saveBase64Image` for a Cloudinary (or S3) upload keeping the same
`{ url, buffer }` return contract — nothing else in the codebase needs to change.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full, commented list. Never commit
a real `.env` file.

```
# backend/.env
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_URL=
API_PUBLIC_URL=

HUGGINGFACE_API_KEY=
HF_IMAGE_MODEL=
HF_IMAGE_EMBEDDING_MODEL=
HF_TEXT_EMBEDDING_MODEL=

CLOUDINARY_CLOUD_NAME=      # optional, see note above
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

DUPLICATE_SEARCH_RADIUS_METERS=
IMAGE_SIMILARITY_WEIGHT=
TEXT_SIMILARITY_WEIGHT=
LOCATION_WEIGHT=
CATEGORY_WEIGHT=
DUPLICATE_THRESHOLD=

SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_DEMO_PASSWORD=
```

```
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running locally

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev

# one-time, terminal 3 (after both are configured)
cd backend
npm run seed:admin            # creates your first ADMIN account
npm run seed:municipalities   # creates a starter municipality + departments
npm run seed:demo             # optional: demo citizens, officers and issues
```

Then open <http://localhost:3000>.

## Demo data

`npm run seed:demo` (backend) creates clearly-labelled sample data so the product can be explored
immediately:
- 6 demo citizens, 3 pre-approved demo public servants (one per seeded department), and 1 demo
  servant left `PENDING` so the admin approval screen has something to review
- ~20 issues spread across 8 categories, 3 placeholder Indian cities, and every status from
  `REPORTED` through `RESOLVED`, each with a realistic timeline

Every demo account uses an `@civicpulse.demo` email and a name prefixed `Demo …`, and the script
prints the shared demo password on completion. **Delete or don't run this script for anything other
than a local demo.**

## Testing

Automated tests were **not executed as part of this build** — this environment has no outbound
network access, so `npm install` cannot fetch dependencies or reach a MongoDB instance here. What
*was* verified:
- Every backend and frontend TypeScript/TSX file was parsed with the TypeScript compiler
  (`ts.transpileModule`) to catch syntax errors — all files pass.
- Manual code review of every security-sensitive path (role checks, ownership checks, rate limits,
  input validation) — see [Security](#security).

Before relying on this in a real demo or deployment, run, in order:
```bash
cd backend && npm install && npm run build   # tsc --noEmit equivalent + compiles to dist/
cd frontend && npm install && npm run build  # next build (includes type-check + lint)
```
and exercise the end-to-end scenarios by hand once a MongoDB instance is reachable. A
`backend/package.json` test script slot exists for adding Jest/Supertest coverage — none is
included here to avoid shipping untested, unexecuted test code.

## Deployment

A reasonable low-effort deployment:
- **Backend**: any Node host (Render, Railway, Fly.io, a small VPS). Set all backend env vars; point
  `CLIENT_URL` at your deployed frontend origin for CORS.
- **Frontend**: Vercel (first-class Next.js support) or any Node host. Set `NEXT_PUBLIC_API_URL` to
  your deployed backend's `/api` URL.
- **Database**: MongoDB Atlas free tier.
- **Images**: switch `StorageService` to Cloudinary or S3 first (see above) — local disk storage
  will not persist across most platforms' redeploys/restarts.

## Security

- Passwords hashed with bcrypt; never returned by any API.
- JWT stored in an httpOnly, sameSite cookie (secure in production); not accessible to JS.
- Every mutating endpoint validated with Zod; unknown fields on profile updates are rejected
  (`.strict()`), closing the obvious role-escalation path.
- Role and ownership enforced **server-side** on every route — `requireRole('ADMIN')` /
  `requireApprovedServant` / jurisdiction checks, never trusting a client-sent role or ID. Citizens
  cannot reach public-servant or admin routes (401/403); public servants cannot reach admin routes
  or touch issues outside their assigned jurisdiction.
- `express-mongo-sanitize` strips `$`/`.` operator injection from user input before it reaches
  Mongoose queries.
- `helmet` sets standard security headers; CORS is locked to `CLIENT_URL` with credentials.
- Rate limiting: auth routes, issue-report/duplicate-confirm routes, and a general ceiling across
  all of `/api`.
- Uploaded images are validated by **magic bytes**, not the client-supplied `Content-Type` or file
  extension; non-image payloads and oversized files (>5MB) are rejected before anything is written
  to disk. Nothing uploaded is ever executed.
- `HUGGINGFACE_API_KEY` is read only from the server environment. It is never stored in the
  database, never included in any API response (the AI-configuration endpoint exposes only an
  `apiKeyConfigured: boolean`), and never shipped to the frontend bundle.
- Production error responses omit stack traces; only the message is sent.
- Audit log redacts anything that looks like a password/token/secret before writing it.

## API overview

All endpoints are under `/api`. Representative groups:

| Group | Base | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, logout, me — rate-limited |
| Issues (citizen) | `/api/issues` | report, get, upvote, nearby, my-reports, search, duplicate/confirm |
| Users | `/api/users` | `/me`, `/me/language` |
| Notifications | `/api/notifications` | list, mark read, mark all read |
| Public servant | `/api/public-servant` | dashboard, priority-queue, issues (list/detail/status/assign/accept/update/resolve), profile — jurisdiction-enforced |
| Admin | `/api/admin` | users, public-servants (approve/reject/suspend), issues (assign/status/priority/moderate), municipalities, departments, ai-configuration, priority-configuration, duplicate-analytics, analytics, audit-logs |

## AI duplicate-detection architecture

```
        Citizen submits a report (photo + text + location)
                          |
        +-----------------+------------------+
        v                 v                  v
  Hugging Face       Hugging Face       MongoDB geospatial
  image embedding    text embedding     search (nearby,
  (pre-trained)       (pre-trained)      unresolved issues)
        |                 |                  |
        +--------+--------+---------+--------+
                  v                  v
          image/text similarity   category match
                  |                  |
                  +--------+---------+
                           v
              weighted duplicate-confidence score
           (weights configurable by an administrator)
                           |
                           v
                  shown to the citizen as a
                  POSSIBLE match, never a certainty
                           |
                +----------+-----------+
                v                      v
      Citizen confirms (same)   Citizen rejects (different)
                |                      |
        upvote existing issue    new issue is created
     (recorded as CONFIRMED)    (recorded as REJECTED)
```

No model is trained by CivicPulse. Hugging Face supplies pre-trained inference only; the backend's
own code (`PriorityService`, `DuplicateDetectionService`) combines those outputs with deterministic,
inspectable rules. If Hugging Face is unavailable, misconfigured, rate-limited, or returns a
malformed response, duplicate detection degrades to location + category matching — it never
fabricates a result, and issue reporting itself never fails because of it.

Admin analytics explicitly separate **AI-suggested** duplicates from **citizen-confirmed** ones —
see `/admin/ai-configuration` → Duplicate detection, and `/admin/analytics`.

## Internationalization

12 languages: English, Hindi, Marathi, Bengali, Gujarati, Tamil, Telugu, Kannada, Malayalam,
Punjabi, Assamese, Odia — `frontend/src/locales/<code>/common.json`, one dictionary per language,
all with identical key coverage (currently ~110 keys). The language picker in the top bar persists
the choice to `localStorage` immediately and, for signed-in users, to their account
(`PATCH /api/users/me/language`) so it follows them across devices. Switching is instant (no network
request) since all dictionaries are bundled.

**Coverage note:** the architecture is complete and every dictionary has full key parity, but
translated strings currently cover global navigation, authentication, the landing page, status/
priority labels, and common states/notifications — the highest-traffic surfaces. Several
deeper/less-visited screens (e.g. most of admin analytics, audit logs) still render in English.
Extending coverage is mechanical: add a key to `locales/en/common.json` and its 11 counterparts,
then call `t('your.key')` where needed. Translations were produced for structural completeness and
should get a native-speaker review pass before a real public launch.

## Maps

OpenStreetMap tiles via Leaflet/react-leaflet (no API key, no cost):
- **Citizens**: `/nearby` has a List/Map toggle; the report flow's location step offers current
  location, free-text search (Nominatim), click-to-place, and a draggable marker, with
  lat/lng/address always shown and location-permission denial handled gracefully.
- **Public servants**: `/public-servant/map`, filterable by status/category, scoped to their issue
  list.
- **Admins**: `/admin/map`, same filters, platform-wide.

Marker popups show the photo (if any), category, a short description, status badge, upvote count,
and a "View issue" link. Nominatim (geocoding) is called directly from the browser, which is fine
for light/demo use under OSM's usage policy; a production deployment should proxy these calls
through the backend with a proper `User-Agent` or switch to a paid geocoding provider.

## Known limitations

- **No automated test suite was executed** (see Testing above) — this sandbox has no network access
  to install dependencies or reach a database.
- **Translation coverage is partial** (see Internationalization above): global chrome and the
  landing page are fully translated; many deeper admin/public-servant screens are not yet.
- Several older citizen-facing pages (`/report`, `/my-reports`, `/nearby`, `/issues/[id]`,
  `/dashboard`) were built before the shared design-token system and use fixed light-theme Tailwind
  classes (`bg-white`, `text-gray-900`, etc.) rather than the `bg-surface`/`text-fg` tokens the rest
  of the app uses. They remain fully readable in both themes (dark text never sits on a dark
  background) but don't visually switch with the dark-mode toggle the way newer pages do. Bringing
  them onto the shared tokens is a contained, mechanical follow-up (swap class names, no logic
  changes) — deliberately not done in bulk here per the "smallest safe refactor" guidance, since it
  touches a lot of markup that could not be visually verified in this sandbox.
- Public-servant-to-public-servant reassignment is admin-only right now; a servant can accept an
  unassigned issue but not hand it to a colleague directly (admin can).
- Nominatim geocoding is called client-side; fine for a demo, should be proxied for production (see
  Maps above).
- No automated accessibility audit tool (e.g. axe) was run — ARIA labels, focus states, and
  semantic structure were added by hand and reviewed in source, not in a live browser.
- Analytics export (CSV/PDF) is not implemented.

## Future scope

- Full translation coverage + native-speaker review
- Bring remaining citizen pages onto the shared design-token system
- Servant-to-servant reassignment from the servant's own UI
- CSV/PDF export for analytics and audit logs
- Swap local-disk image storage for Cloudinary/S3 before any real deployment
- A real Jest/Supertest + mongodb-memory-server suite covering the scenarios in `Testing`
- Server-proxied geocoding with caching
