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
| **HoD** | Provisions Faculty Mentors, adds Students (manual **or Excel import**), maps mentors↔mentees |
| **Faculty Mentor** | Updates full student profile (academics, placements, activities, OBE), schedules meetings, records minutes, resolves issues |
| **Student Mentee** | Views academic/placement/activity profile, raises issues, sees scheduled meetings |

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

## 2. Quick start (local)

**Prerequisites:** Node.js ≥ 18.18, a MongoDB instance (local or MongoDB Atlas).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   → edit .env: set MONGODB_URI, JWT_SECRET, SMTP_*, SEED_ADMIN_*  (that's it)

# 3. Create the first Admin (add --demo for sample school/dept/mentor/students)
npm run seed            # or:  npm run seed -- --demo

# 4. Run
npm run dev             # http://localhost:3000
```

Log in at `/login` with the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`.
You will be asked to set a new password on first login.

> **“Edit credentials and it goes live.”** Everything the platform needs is in
> `.env.example`. Copy it to `.env`, fill in real values, and the app runs — no code changes.

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
└─ middleware.js             Route protection by role
scripts/
├─ seed.js                   Bootstrap admin (+ optional demo data)
└─ worker.js                 Optional self-hosted scheduler
```

---

## 7. Security notes

- Passwords hashed with bcrypt; sessions are signed JWTs in an httpOnly cookie.
- Route-level RBAC in `middleware.js`; API-level RBAC via `src/lib/apiGuard.js`.
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
