# Ahoum Sessions Marketplace

A full-stack Sessions Marketplace web application built with React + Django REST Framework, PostgreSQL, MinIO, and Docker.

## Tech Stack

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **Backend**: Django + Django REST Framework
- **Database**: PostgreSQL 16
- **Auth**: OAuth (Google + GitHub) → Backend issues JWT tokens
- **Object Storage**: MinIO (S3-compatible) — bonus feature
- **Payments**: Stripe (test mode) — bonus feature
- **Infrastructure**: Docker Compose (frontend, backend, db, nginx, minio)

---

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ahoum
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then edit `.env` and fill in:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (or GitHub equivalents)
- `VITE_GOOGLE_CLIENT_ID` / `VITE_GITHUB_CLIENT_ID`
- `DJANGO_SECRET_KEY` (any long random string)

All other values (DB, MinIO, Stripe test keys) work as-is from `.env.example`.

### 3. Start everything with one command

```bash
docker-compose up --build
```

The app will be available at **http://localhost**

---

## OAuth Client Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add Authorized redirect URI: `http://localhost/api/accounts/oauth/google/callback/`
4. Copy Client ID and Secret into `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   VITE_GOOGLE_CLIENT_ID=...
   ```

### GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Set **Authorization callback URL**: `http://localhost/api/accounts/oauth/github/callback/`
3. Copy Client ID and Secret into `.env`:
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   VITE_GITHUB_CLIENT_ID=...
   ```

---

## Demo Flow

### 1. Login
- Visit `http://localhost`
- Click **Sign in with Google** (or GitHub)
- You will be redirected back and logged in with a JWT token

### 2. Browse Sessions (User role)
- The home page shows all available sessions
- Click any session to view details
- Click **Book Now** to book the session
- View your bookings in the **User Dashboard**

### 3. Create a Session (Creator role)
- In the **Creator Dashboard**, click **Create Session**
- Fill in title, description, price, date, capacity
- (Bonus) Upload a cover image — stored in MinIO
- Your session appears in the public catalog immediately

### 4. View Bookings (Creator role)
- Creator Dashboard shows all bookings for your sessions
- See attendee details and booking status

### 5. Payment (Bonus — Stripe test mode)
- Use card number `4242 4242 4242 4242`, any future date, any CVC
- Booking is confirmed after successful payment

---

## Project Structure

```
ahoum/
├── backend/              # Django + DRF
│   ├── apps/
│   │   ├── accounts/     # OAuth, JWT, user profiles
│   │   ├── sessions_app/ # Sessions CRUD
│   │   ├── bookings/     # Booking flow
│   │   └── payments/     # Stripe + MinIO
│   ├── config/           # Django settings (base/dev/prod)
│   └── entrypoint.sh     # Runs migrations + seeds data
├── frontend/             # React + Vite + TypeScript
│   └── src/
│       ├── pages/        # Login, Catalog, Dashboard, etc.
│       ├── components/   # UI components
│       ├── hooks/        # Data-fetching hooks
│       └── store/        # Auth state (Zustand)
├── nginx/                # Reverse proxy config
├── docker-compose.yml    # Orchestrates all services
└── .env.example          # All required environment variables
```

---

## API Endpoints (key ones)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/` | Health check |
| GET | `/api/accounts/oauth/google/` | Start Google OAuth |
| GET | `/api/accounts/oauth/github/` | Start GitHub OAuth |
| GET | `/api/sessions/` | List all sessions |
| POST | `/api/sessions/` | Create session (Creator) |
| POST | `/api/bookings/` | Book a session |
| GET | `/api/bookings/my/` | My bookings |
| POST | `/api/payments/checkout/` | Stripe checkout |

---

## Roles

| Role | Capabilities |
|------|-------------|
| **User** | Browse sessions, book sessions, view own bookings, edit profile |
| **Creator** | All User capabilities + create/edit/delete own sessions, view bookings for their sessions |

Role is set on the profile page or during first login (user selects their role).

---

## Bonus Features Implemented

- **MinIO / S3 Uploads**: Session cover images stored in MinIO (S3-compatible)
- **Stripe Payments** (test mode): Payment required before booking is confirmed
- **Rate Limiting**: Applied to auth and booking endpoints

---

## Default Admin

After `docker-compose up --build`, an admin account is auto-created:
- URL: `http://localhost/admin/`
- Email: `admin@ahoum.com`
- Password: `adminpassword123`

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables with descriptions.
