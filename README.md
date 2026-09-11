# 🏫 SHRMS — School Health Record Management System

A complete, production-ready health records platform for schools. **SHRMS** tracks every student's annual health checkups (with automatic BMI), immunizations, doctor observations and special needs, and lets parents securely view — and print — their child's health card, all from a single-page web app.

Built as a **single Next.js 16 application**: one visible route (`/`) serving a two-portal SPA, with a REST API under `/api` — no separate Express server required.

---

## ✨ Features

| Area | What you get |
| --- | --- |
| 👨‍⚕️ **Doctor / Admin portal** | JWT-authenticated (httpOnly cookie) dashboard, student registry, checkups, immunizations, observations, special needs, documents and audit trail |
| 👪 **Parent portal** | **No account needed** — enter Admission Number + Date of Birth to get a read-only view of the child's full health record for 30 minutes |
| 🩺 **Annual health checkups** | Height, weight, **auto-computed BMI**, eyesight (L/R), dental health, blood pressure, nutritional status + remarks, examining doctor; one checkup per student per academic year (enforced in the DB) |
| 💉 **Immunizations** | Vaccine, date, dose (1st/2nd/3rd/Booster/Annual), next-due date, remarks — with quick-pick common vaccines |
| 📝 **Observations** | Free-text medical observations with recommendations, tagged by academic year |
| ♿ **Special needs** | One-per-student record: allergies, chronic illness, disabilities, learning difficulties, medication, emergency notes |
| 📎 **Document uploads** | PDF / JPG / PNG up to 5 MB per file, categorized (medical report, blood test, X-ray, prescription, vaccination certificate) |
| 🖨️ **Printable health card** | Print-optimized student health card (school header, checkup/immunization/observation tables, special needs, documents, signature footer) via the browser print dialog → **Save as PDF** |
| 📊 **Dashboard** | Stat cards + recharts visuals: nutrition donut, per-class checkup coverage bars, growth chart (height/weight/BMI), recent checkups and follow-up lists |
| 🧾 **Activity audit log** | Every create/update/delete is logged (actor, role, action, details, timestamp) and viewable with pagination |
| 🔎 **Instant search** | Debounced search across name/admission number with class & section filters, sortable columns, pagination |
| ⏱️ **Session hygiene** | 30-min idle auto-logout, 8-hour JWT expiry, 30-min scoped parent tokens for file access |
| 🛡️ **Rate-limited parent access** | 10 verify attempts per IP per 10 minutes, generic "not found" response on mismatch (no user enumeration) |

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16** (App Router — single-page UI at `/`, REST API routes under `/api`, replacing a separate Express server) |
| Language | **TypeScript 5** |
| Styling / UI | **Tailwind CSS 4** + **shadcn/ui** (Radix primitives) |
| ORM / DB | **Prisma ORM** + **SQLite** (dev; portable to PostgreSQL — see below) |
| Auth | **JWT via `jose`** stored in httpOnly cookies (`shrm_session`), passwords hashed with **bcryptjs** |
| Charts | **recharts** |
| Toasts | **sonner** |
| Validation | **zod** (every request body) |
| Runtime | Node 20+ or **Bun** |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** or **[Bun](https://bun.sh)** (examples below use Bun; `npm`/`npx` work identically)

### Install & run

```bash
# 1. Install dependencies
bun install            # or: npm install

# 2. Configure environment (see .env.example)
cp .env.example .env   # DATABASE_URL, JWT_SECRET; UPLOAD_DIR optional

# 3. Create/sync the SQLite database
bun run db:push        # prisma db push --accept-data-loss

# 4. Seed realistic demo data (12 students, 3 academic years of checkups, …)
bun prisma/seed.ts

# 5. (optional) Backfill current-academic-year checkups so the dashboard
#    coverage chart reflects an in-progress checkup cycle
bun scripts/backfill-current-ay.ts

# 6. Start the dev server
bun run dev

# 7. Open the app
#    http://localhost:3000
```

### Production build

`bun run build` produces the **Next.js standalone output** (`.next/standalone/server.js`) with static assets and `public/` copied in — the same artifact the Docker image ships.

---

## 🔑 Demo Credentials

| Portal | Credential | Notes |
| --- | --- | --- |
| **Parent** (landing page) | Admission No `ADM001` · DOB `2013-05-14` | No account needed — grants a 30-min read-only session for *Aarav Sharma* |
| **Doctor (admin role)** | `admin` / `admin123` | "Dr. Admin" |
| **Doctor** | `drmehta` / `doctor123` | "Dr. Anita Mehta" |

Other seeded students: `ADM002`–`ADM012` (DOB ranges 2008–2013, all at UTC midnight — see `prisma/seed.ts`).

---

## 🌐 REST API Reference

All endpoints live under `/api` of the single Next.js app. Doctor-authenticated routes require the httpOnly `shrm_session` cookie; parent file access uses a short-lived scoped token passed as `?t=`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Public | Doctor login → sets 8 h httpOnly JWT cookie |
| `POST` | `/api/auth/logout` | Doctor cookie | Clears the session cookie |
| `GET` | `/api/auth/me` | Public | Session restore → current doctor or `{ user: null }` |
| `GET` | `/api/students` | Doctor | List students — `?q=` instant search, `&class=`, `&section=`, `&page=`, `&pageSize=`, `&sort=`, `&dir=` |
| `POST` | `/api/students` | Doctor | Create a student |
| `GET` | `/api/students/:admissionNumber` | Doctor | Full profile (checkups, observations, immunizations, special needs, documents) |
| `PUT` | `/api/students/:admissionNumber` | Doctor | Update a student |
| `DELETE` | `/api/students/:admissionNumber` | Doctor | Delete a student (cascades all child records) |
| `POST` | `/api/checkups` | Doctor | Create annual checkup — **BMI computed server-side**; one per student per academic year (409 on duplicate) |
| `PUT` | `/api/checkups/:id` | Doctor | Update checkup (BMI recomputed) |
| `DELETE` | `/api/checkups/:id` | Doctor | Delete checkup |
| `POST` | `/api/observations` | Doctor | Add observation + recommendation |
| `PUT` | `/api/observations/:id` | Doctor | Update observation |
| `DELETE` | `/api/observations/:id` | Doctor | Delete observation |
| `POST` | `/api/immunizations` | Doctor | Add immunization record |
| `PUT` | `/api/immunizations/:id` | Doctor | Update immunization |
| `DELETE` | `/api/immunizations/:id` | Doctor | Delete immunization |
| `PUT` | `/api/special-needs` | Doctor | Upsert the (1-per-student) special-needs record |
| `POST` | `/api/uploads` | Doctor | Multipart document upload (PDF/JPG/PNG, ≤ 5 MB) |
| `GET` | `/api/files/:id` | Doctor cookie **or** parent token `?t=` | Stream a stored document (token must match its admission number) |
| `DELETE` | `/api/files/:id` | Doctor | Delete document (disk + DB row) |
| `POST` | `/api/parent/verify` | Public · rate-limited | Admission No + DOB → `{ token, profile }` (30-min token scoped to that student; 10 attempts/IP/10 min, generic 404 on mismatch) |
| `GET` | `/api/dashboard` | Doctor | Aggregated stats: totals, nutrition distribution, per-class coverage, pending checkups, recent + follow-up lists |
| `GET` | `/api/activity` | Doctor | Paginated audit log (`?page=`, `&pageSize=`) |
| `GET` | `/api` | Public | Placeholder hello-world |

---

## 🗄️ Database Schema (Prisma models)

Eight models in `prisma/schema.prisma`; all child tables cascade on student delete.

| Model | Key fields |
| --- | --- |
| **Student** | `admissionNumber` (PK), `studentName`, `class`, `section`, `gender`, `dob`, `bloodGroup`, `parentName`, `phone`, timestamps |
| **HealthCheckup** | `admissionNumber` + `academicYear` (**unique pair**), `checkupDate`, `height` (cm), `weight` (kg), `bmi`, `eyesightLeft/Right`, `dentalHealth`, `bloodPressure`, `nutritionalStatus`, `nutritionRemarks`, `doctorName` |
| **Observation** | `admissionNumber`, `academicYear`, `observation`, `recommendation` |
| **Immunization** | `admissionNumber`, `vaccine`, `date`, `dose`, `nextDue?`, `remarks?` |
| **SpecialNeed** | `admissionNumber` (**unique** — 1:1), `allergies`, `chronicIllness`, `disabilities`, `learningDifficulties`, `medication`, `emergencyNotes` |
| **Attachment** | `admissionNumber`, `filename`, `storedName`, `fileUrl`, `category`, `uploadedDate` |
| **Doctor** | `username` (unique), `password` (bcrypt hash), `name`, `role` (`admin` \| `doctor`) |
| **ActivityLog** | `actor`, `role`, `action`, `details`, `createdAt` (indexed) |

Conventions: BMI = `weight(kg) / height(m)²` rounded to 1 decimal (`calculateBMI`); academic years run **April → March** (e.g. `2025-2026`); all dates are stored/serialized as ISO strings.

---

## 🔐 Security

- **Passwords** — bcrypt-hashed with **10 salt rounds**; never stored or logged in plaintext.
- **Sessions** — JWT (HS256, signed with `JWT_SECRET` via `jose`) in an **httpOnly** cookie `shrm_session`; expires after **8 hours**; SameSite=Lax.
- **Idle timeout** — 30 minutes of inactivity auto-signs the user out (client hook + session restore check).
- **Parent access** — no accounts; verification issues a **30-minute JWT scoped to a single admission number**, used only for that student's file URLs. Verify endpoint is **rate-limited (10 attempts / IP / 10 min)** and returns a generic "not found" on mismatch (no account/record enumeration).
- **Input validation** — every request body/query is parsed with **zod** schemas before touching the DB.
- **SQL-injection safe** — all queries go through **Prisma's parameterized** query builder; no raw SQL string concatenation.
- **Uploads** — extension + MIME allow-list (PDF/JPG/PNG) and a 5 MB size cap enforced server-side.
- **Audit trail** — every create/update/delete writes an **ActivityLog** entry (actor, action, details, timestamp).

---

## 📎 File Uploads

- Documents are stored on **local disk** under `./upload` (override with `UPLOAD_DIR`), with metadata in the `Attachment` table.
- Allowed types: **PDF, JPG, PNG** — max **5 MB** per file.
- Downloads are streamed through `/api/files/:id` so access is always authorized (doctor cookie **or** scoped parent token) — files are never served statically.
- To use object storage instead, swap `src/lib/storage.ts` for an **S3 / Cloudinary** adapter — the rest of the app only depends on the upload/serve semantics implemented in `/api/uploads` and `/api/files/:id`.

---

## 🖨️ PDF / Printing

The student health card (school header, info grid, checkup / immunization / observation tables, special needs, documents, signature footer) is rendered in a print dialog with a dedicated **`.print-area`** print stylesheet (everything else hidden, `@page` margins set). Clicking **Print** opens the browser print dialog — choose **"Save as PDF"** to export the health card. No server-side PDF library needed.

---

## 🐳 Deployment (Docker)

The image is a **multi-stage build on `oven/bun:1`** (understands `bun.lock` natively) that ships the **Next.js standalone output**:

```bash
# Build & run with Docker Compose (recommended)
docker compose up -d --build

# …or plain Docker
docker build -t shrms .
docker run -d -p 3000:3000 \
  -e DATABASE_URL=file:/app/db/custom.db \
  -e JWT_SECRET=change-me-in-production \
  -v shrms-db:/app/db -v shrms-upload:/app/upload \
  --name shrms shrms
```

Then open **http://localhost:3000**.

**How the container boots** (`docker-entrypoint.sh`):

1. `bunx prisma db push --accept-data-loss --skip-generate` — syncs the schema to the SQLite file (idempotent).
2. If `SEED_ON_START=true` → runs `bun prisma/seed.ts` (⚠️ the seed **wipes and re-creates demo data**, so keep it `true` for demos and set `false` once you have real data).
3. `exec`s the standalone server on port **3000**.

**Environment variables (container)** — `DATABASE_URL`, `JWT_SECRET` (**change it!**), `UPLOAD_DIR`, `SEED_ON_START`, `NODE_ENV=production`. **Volumes** — `/app/db` (SQLite persistence) and `/app/upload` (documents). A `HEALTHCHECK` polls `GET /api/auth/me`.

> The app is a single container (UI + API + SQLite). For horizontal scaling or managed infrastructure, migrate to PostgreSQL (below) and move uploads to object storage.

---

## 🐘 From SQLite to PostgreSQL

The schema is portable; migration is a four-step change:

1. **Switch the datasource** in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Update `DATABASE_URL`** to a Postgres connection string, e.g.
   `DATABASE_URL=postgresql://user:password@host:5432/shrms?schema=public`
3. **Push or migrate**: `bun run db:push` (or adopt versioned migrations with `bun run db:migrate`), then re-seed with `bun prisma/seed.ts`.
4. **Case-insensitive search** — SQLite's `contains` is case-insensitive by default, Postgres is not: add `mode: "insensitive"` to the `contains` filters in the students search (`src/app/api/students/route.ts`).

Everything else (JWT auth, uploads via `UPLOAD_DIR`, API routes) is database-agnostic.

---

## 🗺️ Future Roadmap

- [ ] Multi-school support (one deployment → many schools)
- [ ] Nurse accounts with limited permissions
- [ ] SMS / email notifications to parents
- [ ] Dedicated parent login accounts (beyond Admission No + DOB)
- [ ] Appointment scheduling for follow-ups
- [ ] QR code on the printable health card (scan → parent view)
- [ ] Advanced analytics & report exports
- [ ] Multi-language UI
- [ ] Mobile app
- [ ] Offline sync for field checkup camps

---

## 📁 Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # 8 models (SQLite; portable to PostgreSQL)
│   └── seed.ts                # idempotent demo-data seeder
├── scripts/
│   └── backfill-current-ay.ts # optional: current-AY checkup backfill for demos
├── db/                        # SQLite database file (custom.db)
├── upload/                    # uploaded documents (local disk storage)
├── src/
│   ├── app/
│   │   ├── api/…              # REST API route handlers (auth, students, checkups, …)
│   │   ├── layout.tsx
│   │   └── page.tsx           # single-page UI entry (renders <ShrmsApp />)
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── shrms/             # app shell, landing, doctor portal, parent portal,
│   │   │                      #   student detail, modals, printable health card
│   │   └── charts/            # recharts: growth chart, nutrition donut, checkups bar
│   ├── hooks/                 # use-idle-timeout, use-mobile, use-toast
│   └── lib/                   # auth (JWT), db, validation (zod), helpers (BMI,
│                              #   academic year), constants, storage, types
├── Dockerfile                 # multi-stage (oven/bun) → standalone output
├── docker-compose.yml         # volumes for /app/db + /app/upload, healthcheck
├── .env.example               # DATABASE_URL, JWT_SECRET, UPLOAD_DIR, SEED_ON_START
└── package.json               # dev / build / db scripts
```

---

*SHRMS — School Health Record Management System · Next.js 16 · Prisma · SQLite · shadcn/ui*
