# Project Worklog — School Health Record Management System (SHRMS)

App: Next.js 16 App Router (single visible route `/`), TypeScript, Tailwind 4, shadcn/ui, Prisma + SQLite (`db/custom.db`), REST API routes under `src/app/api/**`.

Key conventions:
- BMI = weight(kg) / height(m)^2, rounded to 1 decimal — `calculateBMI()` in `src/lib/helpers.ts`.
- Academic year = April→March, e.g. "2025-2026" — `getCurrentAcademicYear()` in `src/lib/helpers.ts`.
- All dates stored/serialized as ISO strings (DOB seeded at UTC midnight).
- Auth: JWT (jose) in httpOnly cookie `shrm_session`; parents get short-lived scoped token (30 min) for file access.
- Shared types in `src/lib/types.ts`, constants in `src/lib/constants.ts`, helpers in `src/lib/helpers.ts`.

---
Task ID: 1
Agent: orchestrator (main)
Task: Project setup — inspect scaffold, install deps, define Prisma schema, push DB

Work Log:
- Inspected package.json, existing scaffold (shadcn/ui full set present), dev server running on :3000.
- Installed `bcryptjs@3` and `jose@6` for password hashing + JWT.
- Replaced `prisma/schema.prisma` with SHRMS schema: Student, HealthCheckup (unique admissionNumber+academicYear), Observation, Immunization, SpecialNeed (1:1), Attachment, Doctor, ActivityLog (all child tables cascade on student delete).
- Ran `bun run db:push` — DB in sync, Prisma Client generated.
- Wrote `src/lib/types.ts`, `src/lib/constants.ts`, `src/lib/helpers.ts` as shared foundation.

Stage Summary:
- Schema live in SQLite at db/custom.db. Shared types/constants/helpers ready for all agents.
- Demo parent credentials that MUST exist after seeding: Admission No "ADM001", DOB 2013-05-14 (Aarav Sharma).
- Doctor accounts to seed: admin/admin123 (role admin, name "Dr. Admin"), drmehta/doctor123 (name "Dr. Anita Mehta").

---
Task ID: 2-b
Agent: seed-agent (general-purpose subagent)
Task: Create prisma/seed.ts and run it to populate SQLite DB with realistic sample data

Work Log:
- Read worklog.md + prisma/schema.prisma to match every model field exactly; no changes to schema or src/.
- Wrote prisma/seed.ts (TypeScript, run via `bun prisma/seed.ts`): idempotent — wipes rows in FK-safe order (ActivityLog → Attachment → SpecialNeed → Immunization → Observation → HealthCheckup → Student → Doctor) before re-inserting.
- Seeded 2 doctor accounts with bcrypt (10 rounds, verified $2b$10$ hashes): admin/admin123 (role admin, "Dr. Admin"), drmehta/doctor123 ("Dr. Anita Mehta").
- Seeded 12 students ADM001–ADM012 across classes VI–X, sections A/B, 6M/6F, DOBs 2008–2013 all at UTC midnight. First student exactly per spec: ADM001 / Aarav Sharma / VI-A / Male / 2013-05-14 / O+ / Rajesh Sharma / +91 98765 43210.
- Health checkups: AY 2023-2024 (12 students), 2024-2025 (12), 2025-2026 (7 of 12 → 5 left pending for "Records Pending This Year"). Heights grow ~4–6 cm/yr, weights ~1.5–4 kg/yr, BMI computed in JS (Math.round(x*10)/10), eyesight mostly 6/6 with occasional 6/9 / 6/12, dental mostly Healthy with some Cavities / Minor Issues, age-appropriate BP strings, statuses: mostly Normal + Underweight (ADM003, ADM006), Obese (ADM007), Overweight (ADM010), Malnourished (ADM012), with nutritionRemarks; doctorName alternates Dr. Anita Mehta / Dr. Admin; checkupDate UTC midnight Jul–Sep of AY start year.
- Observations: 8 entries across 6 students (ADM001, ADM003 ×2, ADM007, ADM008 ×2, ADM010, ADM011), all with meaningful recommendations.
- Immunizations: 61 rows, 4–6 per student, vaccines from DPT Booster / MMR / Tdap / Typhoid / Hepatitis B / Chickenpox / Polio; doses 1st Dose / 2nd Dose / Booster; 9 future-dated nextDue values (2027 / 2032), rest null.
- SpecialNeed (1:1) for 4 students: ADM001 (penicillin + severe peanut allergy, EpiPen), ADM005 (mild asthma, inhaler), ADM008 (mild dyslexia, extra exam time), ADM011 (mild epilepsy, medication + seizure protocol); inapplicable fields null.
- 8 ActivityLog entries (actor admin/drmehta, role "doctor"), staggered over the last ~3 days (5–72 h ago).
- Ran `cd /home/z/my-project && bun prisma/seed.ts` twice — exits cleanly, second run proves idempotency (identical counts).

Stage Summary:
- DB populated at db/custom.db. Row counts: doctors 2, students 12, healthCheckups 31 (12/12/7 by AY), observations 8, immunizations 61, specialNeeds 4, activityLogs 8, attachments 0.
- Pending AY 2025-2026 checkups: ADM004, ADM006, ADM008, ADM010, ADM012 (5 students → dashboard metric meaningful).
- Working logins: doctors admin/admin123 & drmehta/doctor123; parent demo pair ADM001 + DOB 2013-05-14 intact.
- prisma/seed.ts is idempotent and safe to re-run any time.

---
Task ID: 3-b
Agent: general-purpose (chart components sub-agent)
Task: Build three reusable recharts chart components (growth, nutrition donut, checkups bar)

Work Log:
- Read worklog.md, src/lib/types.ts (GrowthPoint, DashboardStats shapes) and src/lib/constants.ts (nutrition status color mapping).
- Verified deps: recharts 2.15.4, React 19, tsconfig strict with `@/*` alias.
- Created `src/components/charts/growth-chart.tsx`: ComposedChart — Area (height, left Y-axis, blue #2563eb, gradient fill) + Line (weight, right Y-axis, emerald) + dashed BMI Line (amber, own hidden Y-axis with domain [10,30]); rotated "Height (cm)"/"Weight (kg)" axis labels, custom tooltip with units (cm/kg), Legend bottom.
- Created `src/components/charts/nutrition-pie.tsx`: donut PieChart (innerRadius 55, outerRadius 90, paddingAngle 3, cornerRadius 4), status→color map (Normal/Underweight/Overweight/Obese/Malnourished, fallback #3b82f6), tooltip "N student(s)", SVG <text> total + "students" centered in the hole, Legend bottom.
- Created `src/components/charts/checkups-bar.tsx`: grouped BarChart — "Checkups done" #2563eb and "Total students" #93c5fd, radius [6,6,0,0], maxBarSize 28, integer Y ticks, custom tooltip, Legend bottom.
- All three: "use client", ResponsiveContainer height 280, grid stroke #e5e7eb, custom typed tooltip components (no `any`), Tailwind `w-full` wrapper, empty state = min-h-[280px] centered "No data available yet".
- Verified: `tsc --noEmit` (no errors in project src), `eslint` on the three files (0 problems), SSR render smoke test with bun (all components + empty states render without crashing).

Stage Summary:
- Files created: src/components/charts/growth-chart.tsx, src/components/charts/nutrition-pie.tsx, src/components/charts/checkups-bar.tsx.
- Decisions: BMI plotted against its own hidden left-oriented Y-axis (domain [10,30]) because recharts domain is per-axis; nutrition tooltip pluralizes properly (1 student / N students); donut center total rendered as SVG <text> at 43%/57% height to compensate for bottom legend offset; components are fully self-contained (no shared chart utils) so they can be dropped into cards by the dashboard agent.

---
Task ID: 2-a
Agent: orchestrator (main)
Task: Backend — auth library, validation, all REST API routes

Work Log:
- Wrote src/lib/auth.ts: JWT (jose) doctor sessions in httpOnly cookie `shrm_session` (8h), parent tokens scoped to one admission number (30 min), activity logger.
- Wrote src/lib/validation.ts: zod schemas for login, students, checkups, observations, immunizations, special needs, parent verify.
- API routes: /api/auth/{login,logout,me}, /api/students (+ [admissionNumber] GET profile/PUT/DELETE), /api/checkups (+[id]), /api/observations (+[id]), /api/immunizations (+[id]), /api/special-needs (PUT upsert), /api/uploads (multipart, ext+size validated), /api/files/[id] (GET doctor-cookie OR parent-token ?t=; DELETE doctor), /api/parent/verify (rate-limited 10/10min per IP, generic 404 on mismatch), /api/dashboard (aggregates), /api/activity (paginated).
- BMI computed server-side via calculateBMI; one-checkup-per-student-per-AY enforced by DB unique (409 on conflict).
- Uploads stored on disk in ./upload (UPLOAD_DIR env swappable for S3/Cloudinary); src/lib/storage.ts holds dir/mime/ext helpers.

Stage Summary:
- Full REST API verified with curl: login sets cookie; students list/search/paginate/sort works; parent verify returns {token, profile}; file auth matrix correct (doctor 200 / scoped parent 200 / no-auth 401 / wrong scope 404).

---
Task ID: 3-a + 4 + 5
Agent: orchestrator (main)
Task: Frontend — app shell, landing, doctor portal, parent portal, print card

Work Log:
- Theme: globals.css primary switched to blue (oklch 0.546 0.245 262.881), custom scrollbars, print CSS (.print-area only content prints, .no-print hidden, @page margin).
- layout.tsx: SHRMS metadata + sonner Toaster.
- Root SPA at "/" only: src/components/shrms/app.tsx state machine (landing → doctor-login → doctor shell | parent portal), session restore via /api/auth/me, idle timeout 30 min (use-idle-timeout hook).
- Landing: portal cards (parent verify form + doctor portal CTA), sticky footer.
- Doctor shell: desktop fixed sidebar + mobile Sheet drawer, topbar, 3 pages (Dashboard, Students, Activity) + student profile view.
- Dashboard: 4 stat cards, NutritionPie + CheckupsBar charts, Recent Checkups + Follow-up lists (scrollable, clickable).
- Students: instant debounced search, class/section filters, sortable columns, pagination, Add Student modal.
- StudentDetail (shared doctor/parent): header card, tabs Overview (latest checkup summary + GrowthChart), Annual Checkups (table + CheckupModal with live BMI), Immunizations (ImmunizationModal with common vaccines + Other/custom), Observations (ObservationModal), Special Needs (6 textareas), Documents (upload/category/view/download/delete).
- Parent portal: read-only StudentDetail with 30-min scoped token for file URLs; print button.
- PrintDialog: printable health card (school header, info grid, checkup/immunization/observation tables, special needs, documents, signature footer) via window.print (Save as PDF).
- Fixed React hooks lint (setState-in-effect) with derived loading + async-callback-only effects; fixed dialog widths (sm:max-w-*), parent verify response shape {token, profile}.

Stage Summary:
- All golden paths verified with agent-browser: parent verify (good+bad DOB), read-only tabs, growth chart, print card; doctor login (drmehta+admin), dashboard charts, instant search, checkup create (BMI 17.3 auto-calc), duplicate-AY 409 toast, student create (ADM013), special needs save, PDF upload (Blood Test Report), file auth, activity log, sign-out; mobile 390px drawer nav OK.

---
Task ID: 6 (partial — data backfill)
Agent: orchestrator (main)
Task: Align seed with sandbox clock

Work Log:
- Sandbox date is Sept 2026 → current AY 2026-2027 had no checkups. Added scripts/backfill-current-ay.ts (idempotent upsert) creating 2026-2027 checkups for ADM001,2,3,5,7,9,11 from latest values (+4-7cm, +2-3.5kg, recomputed BMI).

Stage Summary:
- Dashboard now shows Pending=5, per-class coverage bars, nutrition distribution (7 Normal / 2 Underweight / 1 Obese / 1 Overweight / 1 Malnourished).

---
Task ID: 5-b
Agent: general-purpose (docs + deployment subagent)
Task: Create README.md, Dockerfile, .dockerignore, docker-compose.yml, .env.example (documentation + deployment files only; no source files touched)

Work Log:
- Read worklog.md, package.json, prisma/schema.prisma, src/lib/constants.ts, all src/app/api/** route handlers, src/lib/{auth,storage,helpers,db}.ts, prisma/seed.ts head, scripts/backfill-current-ay.ts head, next.config.ts to source every README claim (endpoints/auth matrix, cookie names/TTLs, rate-limit numbers, upload rules, model fields).
- README.md: full feature overview (two portals, auto-BMI checkups, immunizations, observations, special needs, uploads, printable PDF health card, dashboard charts, audit log, instant search, idle timeout, rate-limited parent access); tech-stack table; getting-started (db:push → seed → optional backfill-current-ay → dev); demo credentials table (ADM001/2013-05-14, admin/admin123, drmehta/doctor123); complete REST API reference (24 endpoints with method/auth/purpose verified against route files); schema summary (8 Prisma models — accurate count, not 7); security, uploads, PDF/print sections; Docker deployment; SQLite→PostgreSQL migration note (provider switch, DATABASE_URL, mode:"insensitive" on contains); roadmap checklist; project structure tree.
- Dockerfile: 3-stage oven/bun:1 build (deps: bun install --frozen-lockfile off package.json+bun.lock; builder: bunx prisma generate + bun run build → standalone; runner: .next/standalone + .next/static + public + prisma + node_modules overlays {prisma, @prisma, .prisma, .bin, bcryptjs} so db push/seed run offline). BuildKit heredoc COPY creates /usr/local/bin/docker-entrypoint.sh (mkdir db/upload → bunx prisma db push --accept-data-loss --skip-generate → seed gated on SEED_ON_START=true → exec bun .next/standalone/server.js) and /usr/local/bin/healthcheck.js (fetch /api/auth/me under bun — no wget/curl needed). Labels, NODE_ENV=production, HOSTNAME=0.0.0.0, PORT=3000, EXPOSE 3000, HEALTHCHECK every 30s.
- .dockerignore: node_modules/.next/.git, whole db + upload dirs (containers start fresh; seeded by entrypoint), .env* (secrets), logs, sandbox extras (examples/mini-services/skills/tests/.zscripts/Caddyfile/worklog.md).
- docker-compose.yml: service shrms — build ., 3000:3000, DATABASE_URL=file:/app/db/custom.db, JWT_SECRET=change-me-in-production, UPLOAD_DIR=/app/upload, SEED_ON_START="true" (with wipe-warning comment), NODE_ENV=production, named volumes shrms-db:/app/db + shrms-upload:/app/upload, restart unless-stopped, healthcheck (CMD bun /usr/local/bin/healthcheck.js).
- .env.example: DATABASE_URL (sqlite + commented postgres example), JWT_SECRET (with generation hint), UPLOAD_DIR, SEED_ON_START — each with explanatory comments.
- Verified without building: extracted both Dockerfile heredocs and ran `sh -n` (entrypoint) + bun parse (healthcheck) — both OK; parsed docker-compose.yml with js-yaml and asserted all env/volume/healthcheck values match the Dockerfile ENVs; scripted 15-point consistency grep across Dockerfile/compose (all OK). Did NOT run docker build or bun run build (forbidden); no TS changed so lint skipped.

Stage Summary:
- Files created: README.md, Dockerfile, .dockerignore, docker-compose.yml, .env.example. Zero modifications to existing source.
- Key decisions: oven/bun:1 chosen so bun.lock is honored (--frozen-lockfile) and no npm lockfile caveat; Prisma CLI + generated client + bcryptjs copied into the runner so the entrypoint's db push/seed never need network; SEED_ON_START defaults true (demo-friendly) but documented loudly as data-wiping on every start; healthcheck uses a tiny bun fetch script since the debian-based bun image has no wget/curl; README states 8 Prisma models (schema has 8 incl. ActivityLog).
