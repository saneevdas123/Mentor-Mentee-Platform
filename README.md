# CUTM Mentor–Mentee Platform

A production-oriented **Mentor–Mentee management system** for **Centurion University of
Technology and Management**, built with **Next.js (App Router) + MongoDB (Mongoose)**.
Designed so that printed reports map directly onto **NAAC**, **NIRF** and **NBA**
requirements, and structured to be integrated with an ERP later.

---

## 1. What it does

**Role hierarchy (each level provisions the next):**

```
ADMIN ──► DEAN ──► HoD ──► FACULTY MENTOR ──► STUDENT MENTEE
```

| Role | Can do |
|------|--------|
| **Admin** | Adds Schools, provisions Deans, monitors everything, prints reports |
| **Dean** | Adds Departments (with programmes), provisions HoDs |
| **HoD** | Provisions Faculty Mentors, adds Students (manual **or Excel import**), maps mentors↔mentees, defines **CBCS baskets** & per-student **credit plans**, decides **branch-change** requests |
| **Faculty Mentor** | Updates full student profile, runs the **mentoring workspace** (credit tracker, gradesheet review, counselling, branch-change counselling), schedules meetings, records minutes, resolves issues |
| **Student Mentee** | Views profile & **credit tracker**, uploads **gradesheet PDFs** on request, reads counselling notes, raises issues, requests **branch change** (1st year) |

**CBCS credit tracking & academic counselling**
- HoDs define **baskets** (credit buckets) and set **basket-wise credit requirements** per student.
- Students upload **gradesheet PDFs**; the system parses course/credit/grade rows and maps each course to a basket (auto-mapped via a learned course→basket memory; the mentor verifies).
- A per-student **Credit Tracker** shows earned/remaining credits per basket, overall completion, a time-to-completion projection, and what to take next.
- Mentors record **credit counselling** (which subjects/credits to take) and **branch-change counselling** (1st-year students) — every interaction is logged.
- **Downloadable interaction report** (Excel, per-student or per-mentor) covering counselling, branch-change, and gradesheet activity.

**Automation**
- **Weekly** announcement email to mentors + mentees with an auto-created **Google Meet** link.
- **Monthly** parent meeting email to parents with a Google Meet link.
- **Minutes of Meeting** auto-generated and stored for every meeting (editable + finalizable + printable).
- Every announcement is logged for the governance audit trail.

**Accreditation reporting (print / save-as-PDF)**
- **NAAC** — Mentor:Mentee ratio (2.3.3), mentoring activity & minutes (5.1), student progression (Criterion 5), mentor-wise mentee list.
- **NIRF** — Graduation Outcomes: placement %, higher-studies %, median salary, on-time graduation, recruiters.
- **NBA** — OBE: CGPA distribution, PO/CO attainment, at-risk intervention.

---

## 2. Quick start

### Option A — one command, fully working demo (recommended for a PoC)

Requires Docker. This starts MongoDB **with persistent storage** and the app, and
loads a populated demo so management sees real data immediately:

```bash
docker compose up --build      # → http://localhost:3000
```

Because MongoDB uses a named volume, **your data survives restarts** — stop and start
the stack as often as you like without losing anything. Demo logins (all use password
`Cutm@1234`, except the admin):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cutm.ac.in` | `Admin@12345` |
| Dean | `dean.soet@cutm.ac.in` | `Cutm@1234` |
| HoD | `hod.cse@cutm.ac.in` | `Cutm@1234` |
| Mentor | `mentor.cse@cutm.ac.in` | `Cutm@1234` |

Demo accounts are **not** forced to change their password, so these keep working.

### Option B — local Node (no Docker)

**Prerequisites:** Node.js ≥ 18.18 and a MongoDB instance (local or Atlas).

```bash
npm install
npm run setup          # creates .env and a strong, STABLE JWT secret for you
#   → edit .env: point MONGODB_URI at your database
npm run demo           # setup + a fully populated demo   (or: npm run seed for admin only)
npm run dev            # → http://localhost:3000
```

> **Why `npm run setup`?** It generates and persists `JWT_SECRET`. A missing or
> changing secret is the classic cause of users getting silently signed out (which
> looks like "my data disappeared"). Setting it once and keeping it fixed prevents that.

The real Admin (`SEED_ADMIN_EMAIL`) is asked to set a new password on first login;
this is a one-time security step, not a recurring one.

> **“Edit credentials and it goes live.”** Everything the platform needs is in
> `.env.example`. Copy it to `.env` (or run `npm run setup`), fill in real values, and the app runs — no code changes.

---

## 3. Environment variables

All variables are documented inline in **`.env.example`**. The essentials:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Session signing secret (`openssl rand -base64 48`) |
| `APP_URL` | Public URL (used in emails & meet links) |
| `SMTP_*`, `MAIL_FROM` | Email delivery (weekly/monthly/credentials mails) |
| `GOOGLE_*` | (Optional) Service account for real Google Meet links |
| `CRON_SECRET` | Protects the `/api/cron/*` automation endpoints |
| `SEED_ADMIN_*` | First admin created by `npm run seed` |

**Fail-soft design:** if SMTP or Google credentials are missing, the app still runs —
emails are logged to the console and a fallback Meet room link is generated — so you can
demo before wiring production credentials.

---

## 4. Automation — how the weekly/monthly jobs fire

The scheduling logic lives in `src/lib/scheduler.js` and is exposed through protected
endpoints:

- `GET /api/cron/weekly`  → schedules + notifies weekly mentoring meetings
- `GET /api/cron/monthly` → schedules + notifies monthly parent meetings

Both require `Authorization: Bearer <CRON_SECRET>` (or `?secret=<CRON_SECRET>`).
Add `?dryRun=true` to test without sending emails or creating calendar events.

Pick **one** trigger:

1. **Vercel Cron** (recommended on Vercel) — see `vercel.json`. Set the secret in the URL via a project env or rewrite. See `DEPLOYMENT.md`.
2. **External scheduler** (GitHub Actions / cron-job.org / server crontab) hitting the two URLs.
3. **Bundled worker** for a always-on Node host: `npm run worker` (uses `node-cron`).

See **`DEPLOYMENT.md`** for full deployment and Google Meet setup instructions.

---

## 5. Excel import

HoD dashboard → **Students → Download Template**, fill it, then **Import Excel**.
- Students are matched to mentors by the **MentorEmail** column.
- Optionally issues student login credentials (emailed) during import.
- Import is idempotent: re-importing updates existing students by RegistrationNo.

---

## 6. Project structure

```
src/
├─ app/
│  ├─ login/                 Login + first-login password change
│  ├─ admin | dean | hod | mentor | student/   Role dashboards
│  ├─ reports/naac|nirf|nba/ Printable accreditation reports
│  └─ api/                   REST API (auth, schools, departments, users,
│                            students, mapping, issues, meetings, minutes,
│                            announcements, reports, cron)
├─ components/               Shell, UI primitives, ProfileEditor, ReportHeader
├─ lib/                      db, auth, rbac, mailer, googleMeet, scheduler,
│                            minutes, excel, analytics, provision, apiGuard
├─ models/                   Mongoose models (User, School, Department,
│                            StudentProfile, Mapping, Issue, Meeting,
│                            Minutes, Announcement)
└─ proxy.js                  Session + role redirects (middleware.js re-exports for Next 15)
scripts/
├─ seed.js                   Bootstrap admin (+ optional demo data)
└─ worker.js                 Optional self-hosted scheduler
```

---

## 7. Security notes

- Passwords hashed with bcrypt; sessions are signed JWTs in an httpOnly cookie.
- Route-level RBAC in `proxy.js` (7-day `cutm_session` cookie); API-level RBAC via `src/lib/apiGuard.js`.
- All data queries are scoped to the signed-in user's school/department.
- First-login forced password change for every provisioned account.
- Change `JWT_SECRET`, `CRON_SECRET`, and the seed admin password before going live.

---

## 8. Scope & honest status

This is a complete, deployable **foundation** implementing every flow described above.
Before an institution-wide production rollout you should still: wire real SMTP + a Google
Workspace service account, add file-storage for proof documents (offer letters,
certificates) — the schema has URL fields ready for an S3/GCS integration — and layer in
your ERP sync. The data model is intentionally aligned to the accreditation metrics so
these additions are incremental, not structural.

**On gradesheet parsing:** the PDF reader works on **text-based** gradesheets (not scanned
images) and is deliberately conservative — it auto-maps courses to baskets where it can and
flags the rest for the mentor to confirm during review. Because CUTM gradesheet layouts vary,
treat the parser as an accelerator with a human verification step, not a black box; every
mapping is editable, and confirmed course→basket mappings are remembered for future uploads.
Gradesheet PDFs are stored inline in MongoDB for a self-contained deployment; for very large
installations switch `Gradesheet.fileData` to GridFS or object storage.
