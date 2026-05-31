# Ahoum Sessions Marketplace

> Full-Stack Developer Intern Assignment — Ahoum SpiritualTech
>
> A sessions marketplace where users sign in via OAuth, browse spiritual wellness sessions, and book them. Creators can publish and manage their own sessions.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 |
| Auth | OAuth 2.0 (Google + GitHub) + JWT (SimpleJWT) |
| Storage | MinIO (S3-compatible) — bonus |
| Payments | Stripe (test mode) — bonus |
| Infrastructure | Docker Compose + Nginx reverse proxy |

---

## Quick Start (One Command)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ahoum

# 2. Create your .env file
cp .env.example .env
# OAuth credentials are optional — see "Demo Flow" below

# 3. Start everything
docker compose up --build
```

Visit **http://localhost** — the app is running.

> **No OAuth credentials?** Use the **"Enter Demo"** login on the login page.
> It works without any credentials when `DJANGO_DEBUG=True` (the default).

---

## Environment Variables

Copy `.env.example` to `.env`. The defaults work out of the box for Docker.

The only values you need to change to enable real OAuth logins:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

For Stripe payments (bonus, test mode):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

MinIO and PostgreSQL credentials have safe defaults in `.env.example`.

---

## OAuth Client Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** (Application type: Web application).
3. Add `http://localhost/auth/callback` to **Authorized redirect URIs**.
4. Copy the Client ID and Secret into `.env` as `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VITE_GOOGLE_CLIENT_ID`.

### GitHub OAuth

1. Go to GitHub → Settings → Developer Settings → OAuth Apps → **New OAuth App**.
2. Set **Homepage URL** to `http://localhost`.
3. Set **Authorization callback URL** to `http://localhost/auth/callback`.
4. Copy the Client ID and Secret into `.env` as `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `VITE_GITHUB_CLIENT_ID`.

> After setting credentials, rebuild: `docker compose up --build`

---

## Demo Flow (No OAuth Credentials Needed)

The backend exposes a development login endpoint when `DJANGO_DEBUG=True` (default). Evaluate all features without any OAuth setup.

**Seeded demo accounts (auto-created on first startup):**

| Email | Role |
|-------|------|
| `user@demo.com` | User |
| `creator@demo.com` | Creator |
| `guru@demo.com` | Creator |

**Step-by-step walkthrough:**

1. Open **http://localhost** — you see the session catalog with seeded sessions.
2. Click **Get started** → Login page.
3. In the **"or try the demo"** section, enter `creator@demo.com`, tick **"Sign in as a Creator"**, click **Enter Demo**.
4. You land on the **Creator Dashboard** — click **Create new session**, fill in the form, click **Save**. Then click **Publish**.
5. Click the Ahoum logo → catalog → your session appears.
6. Top-right menu → **Logout**.
7. Log in as `user@demo.com` (leave "Creator" unchecked).
8. Find the session → click it → **Session detail page** → click **Book Now**.
   - Free session: confirmed immediately.
   - Paid session: Stripe form appears — use test card `4242 4242 4242 4242`, any future expiry, any CVC.
9. Go to **Dashboard** → see your booking under **Upcoming**.
10. Log out → log back in as `creator@demo.com` → **Creator Dashboard** → **Bookings Overview** → see the attendee (with CSV export).

---

## Features Implemented

### Core (100 pts)

- **OAuth login** via Google and GitHub; backend issues JWT access + refresh tokens
- **Two roles**: User (browse & book) and Creator (create & manage sessions)
- Any user can self-upgrade to Creator from their dashboard
- **Session catalog**: paginated, searchable, filterable by category and free/paid
- **Session detail**: date/time, duration, capacity bar, price, creator info, tags
- **Booking flow**: capacity check, duplicate-booking prevention, confirmation
- **Booking cancellation** with configurable time-window guard
- **User Dashboard**: upcoming / past / cancelled bookings tabs; profile editor
- **Creator Dashboard**: full session CRUD, publish/cancel, per-session attendee list with CSV export, revenue stats
- **Profile page**: update name, bio; upload avatar (stored in MinIO)
- Role-based route protection (frontend + backend)
- JWT token refresh and blacklisting on logout

### Bonus (+15 pts)

- **Stripe** (test mode): PaymentIntent, Stripe Elements UI, webhook handler
- **MinIO** (S3-compatible): avatar uploads and session cover image uploads
- **Rate limiting**: `django-ratelimit` on auth and booking endpoints + DRF global throttle (60 req/min anonymous, 120/min authenticated)

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health/` | GET | No | Health check |
| `/api/auth/oauth/` | POST | No | Exchange OAuth code for JWT |
| `/api/auth/dev-login/` | POST | No | Demo login (DEBUG=True only) |
| `/api/auth/logout/` | POST | Yes | Blacklist refresh token |
| `/api/auth/me/` | GET/PATCH | Yes | Get / update profile |
| `/api/auth/me/avatar/` | POST | Yes | Upload avatar to MinIO |
| `/api/auth/become-creator/` | POST | Yes | Upgrade role to creator |
| `/api/sessions/` | GET | No | Public session catalog |
| `/api/sessions/<id>/` | GET | No | Session detail |
| `/api/sessions/` | POST | Creator | Create session |
| `/api/sessions/<id>/` | PATCH/DELETE | Owner | Edit / delete session |
| `/api/sessions/<id>/publish/` | POST | Owner | Publish a draft |
| `/api/sessions/<id>/cancel/` | POST | Owner | Cancel a session |
| `/api/sessions/my/` | GET | Creator | Creator's own sessions |
| `/api/sessions/cover-image/` | POST | Creator | Upload cover image |
| `/api/bookings/` | POST | User | Book a session |
| `/api/bookings/mine/` | GET | User | My bookings |
| `/api/bookings/<id>/cancel/` | DELETE | User | Cancel a booking |
| `/api/bookings/session/<id>/` | GET | Creator | Session attendees |
| `/api/payments/create-intent/` | POST | User | Create Stripe PaymentIntent |
| `/api/payments/status/<id>/` | GET | User | Payment status |
| `/api/payments/webhook/` | POST | No | Stripe webhook |

---

## Docker Services

| Service | Description | Port |
|---------|-------------|------|
| `nginx` | Reverse proxy — `/api/` → backend, `/` → frontend | **80** |
| `frontend` | React SPA (Vite build, served by Nginx) | internal |
| `backend` | Django + Gunicorn (4 workers) | internal |
| `db` | PostgreSQL 16 | internal |
| `minio` | Object storage (S3-compatible) | 9000 (API), 9001 (console) |

---

## Useful Commands

```bash
# Start
docker compose up --build

# Start in background
docker compose up --build -d

# Stop (keep data)
docker compose down

# Stop and wipe all data (fresh start)
docker compose down -v

# View logs
docker compose logs -f

# Re-seed demo data
docker compose exec backend python manage.py seed_data

# Run tests
docker compose exec backend python manage.py test

# Django Admin
# URL:      http://localhost/admin
# Email:    admin@ahoum.com
# Password: adminpassword123
```

---

## Project Structure

```
ahoum/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # User model, OAuth exchange, JWT, profile, avatar upload
│   │   ├── sessions_app/    # Session model, CRUD, filters, cover image upload
│   │   ├── bookings/        # Booking model, create/cancel/list views
│   │   └── payments/        # Stripe integration, MinIO client, Payment model
│   ├── config/              # Django settings (base / development / production)
│   ├── entrypoint.sh        # Auto-migrate, collect static, seed, start gunicorn
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/             # Axios API clients
│       ├── components/      # UI primitives, layout, session/booking forms
│       ├── hooks/           # React Query data hooks
│       ├── pages/           # Home, Login, AuthCallback, SessionDetail, Dashboards
│       ├── store/           # Zustand auth store (JWT persistence)
│       └── types/           # TypeScript interfaces
├── nginx/
│   └── nginx.conf           # Reverse proxy routing
├── docker-compose.yml       # All services
├── .env.example             # All environment variables documented
└── Makefile                 # Convenience aliases for docker compose commands
```

---

## Roles

| Role | Capabilities |
|------|-------------|
| **User** | Browse sessions, book sessions, view own bookings, edit profile |
| **Creator** | All User capabilities + create/edit/delete own sessions, view attendees |

Any user can upgrade to Creator role from their Dashboard (no re-login needed).

---

## Bonus Features

- **Stripe** (test mode): PaymentIntent flow wired to booking confirmation via webhook
- **MinIO / S3**: Avatar and session cover images uploaded to MinIO object storage
- **Rate Limiting**: `django-ratelimit` on auth/booking endpoints; DRF global throttle
