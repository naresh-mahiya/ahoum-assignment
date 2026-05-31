# 🧘 Ahoum — Sessions Marketplace

> A production-grade, fully Dockerized sessions booking platform built with **Django REST Framework + React (TypeScript)**. Browse and book spiritual-wellness sessions as a **User**, or create and manage them as a **Creator**.

One command starts the whole stack behind Nginx — backend, frontend, PostgreSQL, and MinIO.

---

## ✨ Features

**Core**
- 🔐 **OAuth login** with **both Google _and_ GitHub** → JWT issued by the Django backend
- 🪪 **JWT access + refresh** flow with automatic, transparent token refresh on the client
- 👥 **Two roles** — User (browse/book) and Creator (create/manage). A user can **upgrade to Creator** at any time and still book sessions
- 📅 **Sessions catalog** with search, category filter, "free only" & "available only" toggles, and pagination
- 🎟️ **Booking flow** with capacity limits ("X seats left"), duplicate-prevention, and **time-based cancellation rules**
- 📊 **User dashboard** (upcoming / past / cancelled bookings + profile) and **Creator dashboard** (session CRUD, attendee lists, CSV export, revenue)
- ⚡ **Skeleton loaders**, toasts, empty states, error boundary, responsive mobile-first design

**Bonus**
- 💳 **Stripe Checkout** wired to paid-session bookings (PaymentIntent + webhook confirmation)
- 🪣 **MinIO** (S3-compatible) for cover-image & avatar uploads
- 🚦 **Rate limiting** on auth & booking endpoints (`django-ratelimit`) plus DRF throttling
- 🛠️ **Auto-seeded** superuser + demo data, health checks, and a `Makefile` of conveniences

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite 5 · TanStack Query 5 · Zustand · Tailwind 3 · Axios · Lucide |
| Backend | Django 5 · Django REST Framework · SimpleJWT · social-auth-app-django · django-filter · django-ratelimit |
| Database | PostgreSQL 16 |
| Storage | MinIO (S3-compatible) + boto3 |
| Payments | Stripe |
| Infra | Docker Compose · Nginx (reverse proxy + SPA host) · Gunicorn |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Configure environment
```bash
cp .env.example .env
```
The defaults work out of the box for a local demo. To enable real OAuth/Stripe, fill in the relevant keys (see [OAuth Setup](#-oauth-setup)).

### 2. Start everything
```bash
docker compose up --build
# or: make up
```
This builds and starts **db, backend, frontend, nginx, minio** (+ a one-shot `minio-init` that creates the bucket). On first boot the backend automatically:
1. waits for PostgreSQL,
2. runs migrations,
3. creates the admin superuser,
4. collects static files,
5. seeds demo categories, users, and sessions.

### 3. Open the app
| What | URL | Credentials |
|---|---|---|
| **Frontend** | http://localhost | — |
| **Django Admin** | http://localhost/admin | `admin@ahoum.com` / `adminpassword123` |
| **API root** | http://localhost/api/health/ | — |
| **MinIO Console** | http://localhost:9001 | `minioadmin` / `minioadmin123` |

> **No OAuth keys? No problem.** The Login page includes a **Demo login** (enabled while the backend runs with `DEBUG=True`). Enter any email, optionally tick "Sign in as a Creator", and you're in — so graders can exercise the full app without configuring Google/GitHub.

---

## 🔑 OAuth Setup (optional, for real sign-in)

### Google
1. Go to <https://console.cloud.google.com/> → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Authorized redirect URI: `http://localhost/auth/callback`
4. Put the client id/secret in `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `VITE_GOOGLE_CLIENT_ID`)

### GitHub
1. <https://github.com/settings/applications/new>
2. Homepage URL: `http://localhost`
3. Authorization callback URL: `http://localhost/auth/callback`
4. Put the client id/secret in `.env` (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `VITE_GITHUB_CLIENT_ID`)

> The frontend bakes `VITE_*` values at build time, so re-run `docker compose up --build` after changing them.

---

## 🎬 Demo Flows

**Browse & book as a User**
1. Open http://localhost → browse the catalog → open a session
2. Click **Sign In** → use Demo login (`user@demo.com`) or Google/GitHub
3. **Book now** on a free session → see it under **My Bookings → Upcoming**

**Create as a Creator**
1. From **My Bookings → Become a Creator** (or sign in with "as Creator")
2. **Creator Studio → Create new session** → fill the form → **Publish**
3. It now appears in the public catalog; view attendees & export CSV in **Bookings Overview**

**Paid session (Stripe test)**
1. As a creator, create a session with a price > 0 and set `STRIPE_*` keys in `.env`
2. As a user, **Book now → Continue to payment** → test card `4242 4242 4242 4242`, any future expiry, any CVC
3. Booking flips to **Confirmed / paid** via the Stripe webhook

---

## 🧪 Demo Accounts (pre-seeded)

| Email | Role | Notes |
|---|---|---|
| `user@demo.com` | User | has sample bookings |
| `creator@demo.com` | Creator | owns several sessions |
| `guru@demo.com` | Creator | owns paid sessions |
| `admin@ahoum.com` | Superuser | Django admin (`adminpassword123`) |

Use the **Demo login** on the sign-in page to enter as any of these. (Django-admin password for the demo users is `demopass123`.)

---

## 🏗️ Architecture

```
                       ┌────────────────────────────┐
   Browser  ──────────▶│   Nginx (reverse proxy)     │  :80
                       │  /        → frontend (SPA)   │
                       │  /api/    → backend (DRF)    │
                       │  /admin/  → backend          │
                       │  /static, /media → volumes   │
                       └───────┬──────────────┬───────┘
                               │              │
                  ┌────────────▼──┐   ┌───────▼─────────┐
                  │ frontend       │   │ backend          │
                  │ (Nginx + Vite  │   │ (Gunicorn/Django)│
                  │  build)        │   │  + SimpleJWT     │
                  └────────────────┘   └──┬───────────┬───┘
                                          │           │
                                 ┌────────▼───┐  ┌────▼──────┐
                                 │ PostgreSQL │  │   MinIO   │
                                 └────────────┘  └───────────┘
```

OAuth flow: the SPA redirects to Google/GitHub → returns to `/auth/callback?code=…` → the SPA POSTs the code to `/api/auth/oauth/exchange/` → Django exchanges it, creates/fetches the user, and returns a **JWT access + refresh** pair.

---

## 📚 API Reference (summary)

```
# Auth
POST   /api/auth/oauth/exchange/        Exchange OAuth code → JWT pair + user
POST   /api/auth/dev-login/             Dev-only password-free login (DEBUG only)
POST   /api/auth/token/refresh/         Refresh access token
POST   /api/auth/logout/                Blacklist refresh token
GET    /api/auth/me/                    Current user profile
PATCH  /api/auth/me/                    Update profile
POST   /api/auth/me/upload-avatar/      Upload avatar → MinIO
POST   /api/auth/become-creator/        Upgrade role → creator (returns fresh JWT)

# Sessions
GET    /api/sessions/                   List published (search, category, is_free, available_only, page)
POST   /api/sessions/                   Create (creator only)
GET    /api/sessions/{id}/              Detail
PATCH  /api/sessions/{id}/              Update (owner only)
DELETE /api/sessions/{id}/              Delete (owner only)
POST   /api/sessions/{id}/publish/      Publish a draft
POST   /api/sessions/{id}/cancel/       Cancel a session
GET    /api/sessions/my/                Creator's own sessions
GET    /api/sessions/categories/        List categories

# Bookings
POST   /api/bookings/                   Book a session
GET    /api/bookings/my/                Current user's bookings
DELETE /api/bookings/{id}/cancel/       Cancel a booking (time-rule enforced)
GET    /api/bookings/session/{id}/      Attendees for a session (owner only)

# Payments (bonus)
POST   /api/payments/create-intent/     Create Stripe PaymentIntent
POST   /api/payments/webhook/           Stripe webhook
GET    /api/payments/session/{id}/status/  Payment status

# Health
GET    /api/health/                     { status, db }
```

---

## 🧰 Makefile Commands

```bash
make up           # build + start the whole stack
make down         # stop containers
make clean        # stop + remove volumes (fresh slate)
make seed         # re-run the demo seeder
make migrate      # apply migrations
make test         # run the backend test suite
make logs         # tail all logs
make shell-backend / shell-db
```

---

## ✅ Testing

The backend ships with a test suite (auth, sessions, bookings — happy paths + auth/role failures):
```bash
make test
# or locally:  DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test
```

---

## 📁 Project Structure

```
ahoum/
├── docker-compose.yml + override   # one-command stack (override = dev hot-reload)
├── .env.example                    # all configuration
├── Makefile
├── nginx/                          # reverse proxy (api/admin/static/media/SPA)
├── backend/                        # Django + DRF
│   ├── config/settings/{base,development,production,test}.py
│   └── apps/{accounts,sessions_app,bookings,payments}/
└── frontend/                       # React + TS (Vite)
    └── src/{api,hooks,store,components,pages,lib,types}/
```

---

## 🔒 Notes & Conventions
- The Django app is named **`sessions_app`** to avoid clashing with `django.contrib.sessions`.
- Custom user model (`accounts.User`) uses **email as the login identifier**.
- List endpoints use `select_related` / `prefetch_related` to avoid N+1 queries.
- All secrets live in `.env` (gitignored); never hardcoded.
- Migrations are generated & applied automatically at container start.

---

_Built as the Ahoum SpiritualTech assignment — covering the full 100-point spec plus all three bonus tracks (Stripe, MinIO, rate limiting)._
