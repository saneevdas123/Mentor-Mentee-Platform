# CUTM Mentor–Mentee Platform — End-to-End Manual Testing Guide

Use this document to walk the **entire platform flow by hand** and confirm that every role, screen, and click path works. It is written so someone who has **never used the platform** can still run the tests.

Mark each step **Pass / Fail / Blocked** as you go. A sign-off checklist is at the end.

---

## 1. What this platform is (read this first)

**CUTM Mentoring** is the campus Mentor–Mentee system for **Centurion University of Technology and Management**. It is **not** the university ERP. It does not replace admissions, fees, or the exam portal.

It is the place where:

- **HoDs** assign faculty mentors to students
- **Mentors** counsel mentees, track CBCS credits, review gradesheets, hold meetings, and write minutes
- **Students** see their credit plan, upload gradesheet PDFs, read counselling notes, raise issues, and (in 1st year) request a branch change
- **Admin / Dean / HoD / IQAC** print **NAAC**, **NIRF**, and **NBA** style reports from live data instead of rebuilding Excel files

There is **no public signup**. Every account is created by the level above:

```
ADMIN  creates  DEAN
DEAN   creates  HoD
HoD    creates  Faculty Mentor  and  Student
HoD    maps     Mentor  ↔  Mentee
```

After that, day-to-day work is:

```
Student uploads gradesheet
        ↓
Mentor reviews courses → maps each course to a CBCS basket → verifies
        ↓
Credit Tracker updates (earned / remaining / what to take next)
        ↓
Mentor records counselling  ·  Student acknowledges
        ↓
Meetings + minutes + issues stay in the system
        ↓
Admin / Dean / HoD print NAAC · NIRF · NBA reports
```

**Data is scoped.** A Dean only sees their school. An HoD only sees their department. A Mentor only sees mapped mentees. A Student only sees themselves.

---

## 2. Who does what

| Role | Home URL | Main job |
|------|----------|----------|
| **Administrator** | `/admin` | Add Schools, provision Deans, open campus-wide reports |
| **Dean** | `/dean` | Add Departments (with programmes), provision HoDs, open school reports |
| **Head of Department** | `/hod` | Provision Mentors, add/import Students, map mentor↔mentee, define CBCS baskets, set per-student credit plans, set learner policy, decide branch-change requests |
| **Faculty Mentor** | `/mentor` | Edit mentee profiles, run the mentoring workspace (credits, gradesheets, counselling, branch counselling), schedule meetings, edit minutes, respond to issues |
| **Student Mentee** | `/student` | View profile & credit tracker, upload gradesheet PDFs, acknowledge counselling, raise issues, request branch change (sem 1–2 only) |

---

## 3. How to start (pick one path)

The app should already be running at **http://localhost:3000** (`npm run dev` or `docker compose up`).

### Path A — Demo data (fastest, recommended first pass)

Use this if the database was seeded with `npm run demo` or Docker demo.

Demo accounts **skip** first-login password change. Password for Dean / HoD / Mentor / Students is `Cutm@1234`.

| Role | Email | Password | What you will see |
|------|-------|----------|-------------------|
| Admin | `admin@cutm.ac.in` | `Admin@12345` | School of Engineering & Technology already exists |
| Dean | `dean.soet@cutm.ac.in` | `Cutm@1234` | CSE department already exists |
| HoD | `hod.cse@cutm.ac.in` | `Cutm@1234` | Mentors, 4 students, mappings, baskets, credit plans |
| Mentor | `mentor.cse@cutm.ac.in` | `Cutm@1234` | 4 mentees + a scheduled weekly meeting |
| Student (on track) | `aarav@cutm.ac.in` | `Cutm@1234` | CGPA 8.4, placement at TCS, a counselling note |
| Student (high risk) | `diya@cutm.ac.in` | `Cutm@1234` | CGPA 6.1, 2 backlogs, HIGH risk |
| Student (advanced) | `ishaan@cutm.ac.in` | `Cutm@1234` | CGPA 9.1, higher studies (IIT) |
| Student (1st year) | `kiara@cutm.ac.in` | `Cutm@1234` | Semester 1 — **use this for branch change** |

If your local seed used different `SEED_ADMIN_*` values from `.env`, use those for Admin instead.

### Path B — Greenfield (full “create everything” flow)

Use this on an empty database (or after `npm run seed` with **no** `--demo`). You will create a **new** school / department / people so you prove provisioning works, not only that demo data loads.

Use unique emails (for example `dean.test@cutm.ac.in`) so you do not clash with demo accounts.

---

## 4. How to record results

Copy this legend into your notes:

| Mark | Meaning |
|------|---------|
| **P** | Pass — UI, data, and toast/redirect matched the expected result |
| **F** | Fail — write the exact click, what you saw, and a screenshot if possible |
| **B** | Blocked — could not run (no SMTP, no PDF, missing seed, etc.) |
| **N/A** | Not applicable on this environment |

Also note:

- Browser + viewport (desktop Chrome, phone Safari, etc.)
- Whether SMTP / Google Meet are configured (if not, emails go to the **server console** and Meet uses a **fallback link** — that is still a pass if the meeting is created)

---

## 5. Shared chrome (test on every role)

These controls exist on every signed-in dashboard (`Shell`).

| Where | What to click | Expected |
|-------|----------------|----------|
| Left sidebar (desktop) | Brand **CUTM Mentoring** | Goes to `/` — if you are still logged in, `/` redirects you back to your role home |
| Left sidebar | Each nav item | Active item gets a highlight pip; content changes |
| Left sidebar footer | **Sign out** | POST logout, land on `/login`, session cookie gone |
| Top bar (mobile) | Hamburger **Open menu** | Drawer opens; body scroll locked |
| Drawer | Backdrop or **Close** | Drawer closes |
| Top-right avatar | Hover or click | Panel shows name + role label |
| Avatar panel | **Sign out** | Same as sidebar sign out |
| Any modal | Backdrop / close | Modal closes; unsaved form is discarded |

**Role labels you should see in the sidebar / avatar:**

- Administrator · Dean · Head of Department · Faculty Mentor · Student Mentee

---

# PHASE 0 — Public site, login, session

Open a **private/incognito** window so leftover cookies do not confuse results.

## 0.1 Landing page (`/`)

You are not logged in.

| # | Click / action | Expected |
|---|----------------|----------|
| 0.1.1 | Open `http://localhost:3000` | Landing page: hero “One place for credits, counselling, and mentoring meetings.” Ticker bar scrolls campus-style messages. |
| 0.1.2 | Header **Sign in** | Goes to `/login` |
| 0.1.3 | Hero **Sign in to your account** | Goes to `/login` |
| 0.1.4 | Hero **See how it works** | Smooth-scrolls to `#how` (header offset, not hidden under sticky bar) |
| 0.1.5 | Nav: **What you get** / **How it works** / **Tips** / **FAQ** | Each jumps to the matching section |
| 0.1.6 | FAQ first item | Already open. Click **+** on another question — it expands. Click again — it collapses (plus rotates). |
| 0.1.7 | Footer **Sign in** and yellow CTA **Sign in** | Both go to `/login` |
| 0.1.8 | Footer “On this page” links | Same hash scroll as header |
| 0.1.9 | Shrink to phone width | Hamburger **☰** appears. Open menu, tap a section, menu closes and page scrolls. **Escape** also closes the menu. |
| 0.1.10 | While logged in, visit `/` again | Auto-redirect to that role’s home (`/admin`, `/dean`, `/hod`, `/mentor`, or `/student`) |

## 0.2 Login page (`/login`)

| # | Click / action | Expected |
|---|----------------|----------|
| 0.2.1 | Open `/login` | Split layout on desktop (CUTM logo + “Sign in”). Mobile shows logo above the form. Copy: “Use the credentials sent to your email.” Footer: “No public signup.” |
| 0.2.2 | Header **CUTM Mentoring** or **Back to home** | Returns to `/` |
| 0.2.3 | Eye icon on password | Toggles show/hide. `aria-label` switches Hide / Show. |
| 0.2.4 | Submit empty form | Browser required validation on Email + Password |
| 0.2.5 | Wrong password (`admin@cutm.ac.in` + `wrong`) | Red callout: **Invalid credentials.** Stay on login. |
| 0.2.6 | Unknown email | Same **Invalid credentials.** (do not leak “user not found”) |
| 0.2.7 | Valid demo Admin | Button shows **Signing in…** then redirect to `/admin` |
| 0.2.8 | Valid demo Dean / HoD / Mentor / Student | Land on `/dean` / `/hod` / `/mentor` / `/student` |

## 0.3 First-login password change (Path B only)

Demo accounts skip this. After you **provision** a new Dean/HoD/Mentor (or import a student with credentials), that person **must** change password.

| # | Click / action | Expected |
|---|----------------|----------|
| 0.3.1 | Log in with the **temp password** shown in the provision modal (or emailed / printed in the server console) | Form switches to **Set a new password** — “This is your first login. Please choose a secure password.” |
| 0.3.2 | New password shorter than 8 characters | Blocked (min 8) or API: “New password must be at least 8 characters.” |
| 0.3.3 | Valid new password → **Save & continue** | Redirect to that role’s home. Next login uses the **new** password. Temp password no longer works. |

## 0.4 Session & route lock

Stay logged in as **Student** (`aarav@cutm.ac.in`).

| # | Action | Expected |
|---|--------|----------|
| 0.4.1 | Visit `/admin` | Redirect to `/login?denied=1` (or login). Student must **not** see Admin. |
| 0.4.2 | Visit `/dean`, `/hod`, `/mentor`, `/reports` | Same denial |
| 0.4.3 | Visit `/student` | Allowed |
| 0.4.4 | Sign out, then visit `/hod` | Redirect to `/login?next=/hod` |
| 0.4.5 | Log in as HoD after that | Session works; you should land on HoD home (middleware may not auto-follow `next` — if you land on `/hod` or `/login` then click through, note actual behaviour) |

Repeat the lock from the other side: as **Admin**, `/admin` works; Admin is also allowed on `/dean`, `/hod`, `/mentor`, `/student`, `/reports` by design (higher roles can open lower dashboards). Confirm Admin can open `/hod` without a 403.

---

# PHASE 1 — Provisioning chain (the “generate the platform” flow)

This is the **core campus setup**. Run Path B with **new** names if you want a clean proof. On demo data you can still add a **second** school / department so you do not break the existing CSE demo.

Work in **two browsers** (or one normal + one incognito) so you can stay Admin in A and log in as the new person in B.

## 1.1 Admin — add a School

1. Log in as **Admin** → you land on **Overview**.
2. Confirm four stat cards: **Schools**, **Deans**, **Departments**, **Students**.
3. Tab bar: **Schools** (default) and **Deans**.

| # | Click / action | Expected |
|---|----------------|----------|
| 1.1.1 | Schools table | Columns: Name, Code, Campus, Dean, Depts, Students. Demo: **School of Engineering & Technology / SOET / Bhubaneswar**. |
| 1.1.2 | **+ Add School** | Modal: “Create a school so you can assign a Dean next.” |
| 1.1.3 | Submit empty | Name and Code are required |
| 1.1.4 | Fill **School name** `School of Management`, **Code** `SOM`, **Campus** `Paralakhemundi`, optional Description → **Create school** | Toast **School created**. Modal closes. New row in the table. Dean column shows amber **No dean**. Depts / Students = 0. Stat **Schools** increments. |
| 1.1.5 | Add the **same code again** | Error toast (duplicate). School is not created twice. |

## 1.2 Admin — provision a Dean

1. Click tab **Deans**.
2. Click **+ Provision Dean**.

| # | Click / action | Expected |
|---|----------------|----------|
| 1.2.1 | School dropdown | Lists all schools, including the one you just created |
| 1.2.2 | Choose **School of Management**, name `Dr. Test Dean`, email `dean.som.test@cutm.ac.in`, optional Employee ID → **Create & email credentials** | Toast **Dean provisioned**. Modal switches to credentials: Email + **Temp password** (format like `Cutm-9F3A21`). Copy both. |
| 1.2.3 | **Done** | Dean appears in the table. School column = School of Management. Last login = amber **Never**. |
| 1.2.4 | On **Schools** tab | That school’s Dean column now shows **Dr. Test Dean** (not “No dean”). |
| 1.2.5 | Duplicate email | Toast: a user with this email already exists. |
| 1.2.6 | If SMTP is not set | Account still created. Check the **terminal running `npm run dev`** for the credentials email body. |

## 1.3 New Dean first login + add a Department

In browser B:

1. Open `/login`, sign in with the temp password.
2. Complete **0.3** password change.
3. Land on `/dean` — **School Dashboard**.

| # | Click / action | Expected |
|---|----------------|----------|
| 1.3.1 | Stats | Departments, HoDs, Students — all 0 for a new school |
| 1.3.2 | Tabs | **Departments** and **HoDs** |
| 1.3.3 | Dean must **not** see Admin’s other schools | Only this school’s empty lists |
| 1.3.4 | **+ Add Department** | Modal: name, code, optional Programme / Level (UG, PG, PhD) / Duration / Intake |
| 1.3.5 | Name `Business Administration`, Code `BA`, Programme `BBA`, Level `UG`, Duration `3`, Intake `60` → **Create department** | Toast **Department created**. Row: HoD = amber **No HoD**. Programmes = BBA. Students = 0. |
| 1.3.6 | Switch to Admin Overview | **Departments** stat increased. School row Depts = 1. |

## 1.4 Dean — provision an HoD

| # | Click / action | Expected |
|---|----------------|----------|
| 1.4.1 | Tab **HoDs** → **+ Provision HoD** | Department dropdown lists **Business Administration** |
| 1.4.2 | Name `Dr. Test Hod`, email `hod.ba.test@cutm.ac.in` → **Create & email credentials** | Temp password shown. Toast **HoD provisioned**. Last login **Never**. |
| 1.4.3 | Departments tab | HoD column now shows **Dr. Test Hod**. |

## 1.5 New HoD first login + provision a Mentor

Browser B: log out Dean, log in as the new HoD, change password, land on `/hod`.

| # | Click / action | Expected |
|---|----------------|----------|
| 1.5.1 | Page | **Department Dashboard**. Stats: Faculty Mentors, Students, **Mentor : Mentee** (NAAC 2.3.3), Unmapped. |
| 1.5.2 | Tabs | **Mentors**, **Students**, **Mapping**, **Learner Policy**, **Branch Changes** |
| 1.5.3 | Sidebar | **Overview**, **Credit Baskets**, **NAAC / NIRF / NBA Report** |
| 1.5.4 | Mentors empty state | “No mentors yet.” **Add first mentor** |
| 1.5.5 | **Add mentor** | Fields: Full name, Email, optional Employee ID, Designation |
| 1.5.6 | Name `Prof. Test Mentor`, email `mentor.ba.test@cutm.ac.in`, Designation `Assistant Professor` → **Create & email credentials** | Modal **Mentor created** with temp password. Toast **Mentor provisioned**. Card shows 0 mentees + **Never logged in**. |

## 1.6 HoD — add a Student (manual)

1. Tab **Students**.
2. Empty state offers **Import Excel**. Also click **Add student**.

| # | Field | Example value |
|---|--------|----------------|
| | Registration No * | `2601BA099` |
| | Roll No | `BA-26-099` |
| | Full name * | `Test Mentee` |
| | Email | `mentee.ba.test@cutm.ac.in` |
| | Programme | `BBA` |
| | Batch | `2026-2029` |
| | Current semester | `1` (so branch change is allowed later) |
| | Category | `GEN` |
| | Parent email | `parent.test@example.com` |
| | Parent phone | `9876543210` |

| # | Click / action | Expected |
|---|----------------|----------|
| 1.6.1 | **Add student** | Toast **Student added**. Table row: Unmapped amber badge, Risk LOW, Credit plan button. |
| 1.6.2 | Yellow banner | “1 student without a mentor” + **Map now** |
| 1.6.3 | Stat **Unmapped** | 1 (amber) |
| 1.6.4 | Duplicate Registration No | Error toast; no second row |
| 1.6.5 | **Template** (Students card) | Downloads `.xlsx` with sheet **Students** + **Instructions** |
| 1.6.6 | **Export** | Downloads current students as Excel |

> Manual **Add student** creates the **profile**. Student **login** is issued when you **Import Excel** with “Issue login credentials” checked, or when you later import that email. If this student cannot log in yet, that is expected until credentials are issued — record it and use **Import** (Phase 9) or a demo student for student-side tests.

## 1.7 HoD — map Mentor ↔ Mentee

| # | Click / action | Expected |
|---|----------------|----------|
| 1.7.1 | Tab **Mapping** (badge shows unmapped count) | Yellow “1 unmapped” + **Map students** |
| 1.7.2 | **Map students** | Wide modal. Mentor dropdown. Student list with **All** / **Unmapped (n)** filters. |
| 1.7.3 | Submit with no students ticked | Button disabled or toast “Select a mentor and students” |
| 1.7.4 | Choose Prof. Test Mentor, tick Test Mentee → **Map 1 selected** | Toast **Mapped 1 students**. Mapping table: mentor, student, reg no, CGPA, risk. Unmapped = 0 (green). Ratio becomes `1 : 1`. |
| 1.7.5 | Map the same student to another mentor (if you add a second mentor) | Mapping updates to the new mentor (student should not stay on two active mentors). Note actual behaviour. |

---

# PHASE 2 — HoD academic setup (CBCS)

Credits **do not count** until: baskets exist → a credit plan is saved for the student → a gradesheet is uploaded → the mentor **verifies** course→basket mapping.

## 2.1 Credit Baskets

Sidebar → **Credit Baskets**.

Demo CSE already has: Foundation Core, Program Core, Program Elective, Skill Enhancement, Project / Internship, Open Elective.

On a **new** department, the list is empty.

| # | Click / action | Expected |
|---|----------------|----------|
| 2.1.1 | Empty state | “No baskets yet” — explains Foundation Core / Program Core |
| 2.1.2 | Form **Add basket** — Name `Foundation Core`, Code `FC`, Credits `24`, Order `1`, Aliases `Foundation, Basic Sciences` → **Add basket** | Toast **Basket added**. Card shows name, code badge, `24 cr`, alias chips. |
| 2.1.3 | Add at least 3 baskets (e.g. Program Core 60, Skill Enhancement 20) | Count in the header updates. Order sorts the list. |
| 2.1.4 | **Edit** on a basket | Form title becomes **Edit basket**, amber **Editing** badge, page scrolls to the form. Change aliases → **Save changes**. Toast **Basket updated**. **Cancel** restores add mode. |
| 2.1.5 | **Remove** | Browser confirm: “Remove this basket? Historical records keep their labels.” Confirm → toast **Basket removed**. |

Aliases matter: when a gradesheet PDF says “Discipline Core”, the parser can auto-map to Program Core if that alias exists.

## 2.2 Per-student credit plan

Overview → **Students** → on a row click **Credit plan**.

| # | Click / action | Expected |
|---|----------------|----------|
| 2.2.1 | No baskets yet | Yellow: “No baskets exist yet. Add baskets under **Credit Baskets** first.” Save disabled. |
| 2.2.2 | Baskets exist | Lines pre-filled from basket default credits. **Total required** sums them. |
| 2.2.3 | Change one basket’s required credits, set Credits/semester `20`, Expected semesters `8` → **Save plan** | Toast **Credit plan saved**. Modal closes. |
| 2.2.4 | Re-open Credit plan | Values persist. |
| 2.2.5 | On demo student **Aarav Sahoo** | Plan already exists (158 credits typical). Confirm totals match baskets. |

Until a plan is saved, the student’s Credit Tracker shows: *“No credit plan has been set for you yet…”*

## 2.3 Learner Policy (NAAC 2.2.1)

Overview → **Learner Policy**.

| # | Click / action | Expected |
|---|----------------|----------|
| 2.3.1 | Page loads | Mode dropdown: Absolute / Percentile / Hybrid. Thresholds: Slow CGPA, Advanced CGPA, percentiles, attendance, CO/PO. Checkboxes: backlogs, attendance, attainment. Policy note + Ratified by. |
| 2.3.2 | Demo | Hybrid, Slow below 6.0, Advanced ≥ 8.0, attendance 75, ratified “Academic Council (demo)” |
| 2.3.3 | Change a number → **Save policy** | Toast **Learner policy saved**. “Saved” label appears. |
| 2.3.4 | **Learner Excel** | Downloads `.xlsx` of classified learners for the department. |

This policy drives the **Slow / Average / Advanced** badge on the mentor’s mentee list.

---

# PHASE 3 — Mentor dashboard

Log in as **Prof. C. Mentor** (`mentor.cse@cutm.ac.in` / `Cutm@1234`) for a rich demo, **or** as your new test mentor after they change password.

## 3.1 Overview chrome

| # | Check | Expected |
|---|--------|----------|
| 3.1.1 | Title | **Mentor Dashboard** |
| 3.1.2 | Stats | My Mentees, At Risk (red if any HIGH), Open Issues, Draft Minutes |
| 3.1.3 | Demo mentees | Aarav, Diya, Ishaan, Kiara. Diya is HIGH risk → yellow “1 mentee is marked high risk”. |
| 3.1.4 | Learner badges | Aarav/Ishaan likely Advanced; Diya Slow (backlogs + low CGPA + low attendance). Kiara Average/Advanced. |
| 3.1.5 | **Learner Excel** / **Interactions Excel** | Both download. Interactions covers counselling + branch + gradesheet activity. |
| 3.1.6 | Empty mentor (new dept, no map) | “No mentees assigned yet. Ask your HoD to map students to you.” |
| 3.1.7 | Phone width | Cards instead of table; **Mentoring** + **Profile** buttons stack. |

## 3.2 Edit mentee profile

On a mentee row click **Profile**.

| Tab | What to test | Expected |
|-----|----------------|----------|
| **Basic** | Name, email, phone, programme, batch, semester, category, parents | Registration No is **disabled**. Save works. |
| **Academics** | **+ Add semester** — Sem `6`, Year `2025-26`, SGPA `8.2`, CGPA `8.4`, Backlogs `0`, Att% `88`, Status `PASS` | Row appears. ✕ deletes it. 10th/12th % and On-time graduation save. |
| **Placements** | **+ Add placement** — Type Placement, Company `Infosys`, CTC `5`, Status `OFFERED` | Also try Higher Studies / Entrepreneurship (feeds NIRF). |
| **Activities** | Add a HACKATHON / NATIONAL row | Feeds NAAC participation %. |
| **NBA / OBE** | Add CO `2.5` / PO `2.4` | Feeds NBA attainment averages. |
| **Mentoring** | Set Risk **HIGH**, Status **ACTIVE** | Mentor dashboard **At Risk** increments. NBA at-risk count increments after refresh. |

Click **Save profile** → toast **Profile updated**. Re-open and confirm persistence.

Student’s **Full profile** is **read-only** — they must not be able to change risk or CGPA themselves.

## 3.3 Mentoring workspace (the heart of the product)

Click **Mentoring** on a mentee (start with **Aarav** or your test student).

Wide modal. Sub-tabs: **Credits** · **Gradesheets** · **Counselling** · **Branch**.

Top-right **Interaction Excel** downloads that student’s interaction log.

### 3.3.1 Credits tab

| # | Click / action | Expected |
|---|----------------|----------|
| 3.3.1 | Learning level card | Badge Advanced / Average / Slow. “Why:” basis text. Suggested support if Slow. |
| 3.3.2 | If HoD never saved policy | “Using default criteria — ask HoD to set the learner policy.” |
| 3.3.3 | **Override** | Tabs Advanced / Average / Slow. Reason box. **Save override** → toast **Learner level updated**, label “mentor override”. |
| 3.3.4 | **Revert to automatic** | Toast **Reverted to automatic**. Override label gone. |
| 3.3.5 | Credit Tracker | Overall %, earned/required, On track or At risk of delay, remaining, est. semesters left, per-basket bars, “focus next on” recommendations. |
| 3.3.6 | No plan | Yellow “No credit plan…” (fix in HoD Students → Credit plan). |
| 3.3.7 | **Ask for gradesheet** | Toast **Gradesheet request sent to student**. Student later sees a yellow banner on Credits. |

Progress uses **verified** gradesheets only. Unverified uploads do not inflate earned credits.

### 3.3.2 Gradesheets tab

| # | Click / action | Expected |
|---|----------------|----------|
| 3.3.8 | None uploaded | Yellow empty + **Ask student for gradesheet** |
| 3.3.9 | After student upload (Phase 4) | Row: title, sem, credits, course count, status badge `NEEDS REVIEW` or `VERIFIED` |
| 3.3.10 | **PDF** | Opens stored PDF in a new tab |
| 3.3.11 | **Review** | Nested modal: course table (code, title, credits, grade). Failed grades show a red badge and should **not** earn credit. Unmapped rows are yellow. |
| 3.3.12 | Leave a basket as “Select…” | Footer: “n course(s) still need a basket”. **Verify & apply credits** disabled. |
| 3.3.13 | Map every course → **Verify & apply credits** | Toast **Gradesheet verified — credits updated**. Status VERIFIED. Credit Tracker numbers go up. |
| 3.3.14 | Re-upload a sheet with a course you already mapped | That course should auto-select the remembered basket (learned course→basket memory). |
| 3.3.15 | Photo-scan / image-only PDF | Conservative parse: warning and/or zero rows. Mentor can still open PDF. Do **not** treat empty parse as a crash. |

### 3.3.3 Counselling tab

| # | Click / action | Expected |
|---|----------------|----------|
| 3.3.16 | **Pre-fill from tracker** | Type becomes Credit counselling; subject “Credit plan — subjects to take next”; recommendation rows from remaining baskets. |
| 3.3.17 | Type | Credit counselling, Academic, Career, Personal, General |
| 3.3.18 | Mode | In person, Online, Phone, Email |
| 3.3.19 | **+ Add row** / **×** | Add/remove subject-credit rows (basket, credits, course codes) |
| 3.3.20 | Fill subject + advice → **Save counselling record** | Toast **Counselling note recorded**. Appears in History with date + kind badge. |
| 3.3.21 | Demo Aarav | History already has “Welcome mentoring session”. |

### 3.3.4 Branch tab (mentor counselling)

Use **Kiara Mohanty** (sem 1) after she submits a request in Phase 5.

| # | Click / action | Expected |
|---|----------------|----------|
| 3.3.22 | Sem 6 mentee (Aarav) | Soft note: branch change is for first-year (sem 1–2). |
| 3.3.23 | Status `REQUESTED` → **Counsel this request** | Remarks box. **Counsel & recommend** or **Counsel & don’t recommend**. |
| 3.3.24 | After counsel | Status RECOMMENDED / NOT RECOMMENDED. “Awaiting HoD/Dean decision.” HoD Branch Changes tab now shows the request under **Ready for decision**. |

Close the workspace (X / backdrop). Mentee list should refresh (learner/risk).

---

# PHASE 4 — Student dashboard

Log in as **Aarav** first (rich profile), then **Kiara** (branch change), then **Diya** (risk / backlogs).

## 4.1 Overview

| # | Click / action | Expected |
|---|----------------|----------|
| 4.1.1 | Stats | CGPA, Live Backlogs, Placements count, Open Issues |
| 4.1.2 | Aarav | CGPA 8.4, backlogs 0 (green), placements ≥ 1 (TCS) |
| 4.1.3 | Diya | Backlogs 2 (red), CGPA 6.1 |
| 4.1.4 | Profile card | Name, reg no, programme, batch, semester, email, phone, status |
| 4.1.5 | **Full profile** | Read-only ProfileEditor. All six tabs visible. **No** Save button. |
| 4.1.6 | Next meeting banner (Aarav / mentor demo) | “Weekly Mentoring — Sec A” + **Join meet** (`https://meet.google.com/lookup/cutm-demo`) opens a new tab |
| 4.1.7 | Student with no profile | “Your profile has not been set up yet. Please contact your HoD.” |

## 4.2 Academics tab

| # | Expected |
|---|----------|
| 4.2.1 | Table of semester results if the mentor added them (Sem, Year, SGPA, CGPA, Backlogs, Att%, Status badge). |
| 4.2.2 | Empty: “No semester results recorded yet.” |

## 4.3 Credits tab (student academics)

| # | Click / action | Expected |
|---|----------------|----------|
| 4.3.1 | Credit progress | Same tracker as mentor (plan required). |
| 4.3.2 | After mentor **Ask for gradesheet** | Yellow **Gradesheet requested** banner. |
| 4.3.3 | Upload | Choose a **text-based** PDF (not a camera photo). Optional semester. **Upload & parse**. Button shows **Uploading…**. |
| 4.3.4 | Success | Toast **Gradesheet uploaded & parsed** or **Uploaded — some rows need mentor review**. Row appears with status NEEDS REVIEW. **PDF** link works. |
| 4.3.5 | No file | Toast **Choose a PDF**. |
| 4.3.6 | Credits earned on student view | Stay 0 (or previous verified total) until mentor verifies. |
| 4.3.7 | **From your mentor** | Counselling notes. Aarav has a welcome note. **Acknowledge** → toast **Acknowledged**; button becomes “Acknowledged”. Mentor history shows “acknowledged”. |

## 4.4 Issues tab

| # | Click / action | Expected |
|---|----------------|----------|
| 4.4.1 | **Raise issue** | Modal: Subject, Category (Academic, Attendance, Placement, Financial, Psychological, Hostel, Other), Priority (Low–Urgent), Description. |
| 4.4.2 | Submit | Toast **Issue submitted to your mentor**. Card appears with status OPEN. |
| 4.4.3 | Mentor side (Phase 6) | After mentor replies, student sees the thread (`MentorName: message`) and updated status. |
| 4.4.4 | Open Issues stat | Increments until RESOLVED / CLOSED. |

## 4.5 Meetings tab

| # | Expected |
|---|----------|
| 4.5.1 | Upcoming list with date/type and **Join** if `meetLink` exists; else “No link yet”. |
| 4.5.2 | Past meetings table after a meeting’s datetime has passed. |
| 4.5.3 | Student **cannot** schedule meetings (no Schedule button). |

---

# PHASE 5 — Branch change (full loop)

Actors: **Kiara** (student, sem 1) → **Mentor** → **HoD**.

| # | Who | Click / action | Expected |
|---|-----|----------------|----------|
| 5.1 | Kiara | Credits → Branch change → **Request change** | Modal: requested programme + reason. |
| 5.2 | Kiara | Programme `B.Tech ECE`, reason `Interested in electronics` → **Submit request** | Toast **Branch-change request submitted**. Status REQUESTED. **Withdraw** is visible. |
| 5.3 | Kiara | **Withdraw** | Toast **Request withdrawn**. Status WITHDRAWN. Can request again. |
| 5.4 | Kiara | Submit a **second** request (do not withdraw) | One open request. Button **Request change** hidden while open. |
| 5.5 | Aarav (sem 6) | Credits → Branch change | “Available only in first year (semester 1–2).” No request button. |
| 5.6 | Mentor | Mentoring → Kiara → **Branch** → **Counsel this request** → remarks → **Counsel & recommend** | Toast **Counselling recorded**. Student sees mentor remarks. |
| 5.7 | HoD | Overview → **Branch Changes** | Three sections: **Ready for decision**, **Awaiting mentor counselling**, **Decided**. Kiara is in Ready. Shows current → requested, CGPA, reason, mentor remarks. |
| 5.8 | HoD | Optional remarks → **Approve** | Toast **Request approved**. Student + mentor see APPROVED + decision remarks. |
| 5.9 | Repeat with another 1st-year student (or re-seed) | **Reject** | Status REJECTED. |
| 5.10 | HoD | A request still `REQUESTED` | Listed under **Awaiting mentor counselling** / “With mentor”. Approve buttons **not** shown yet. |

---

# PHASE 6 — Meetings, minutes, issues (mentor)

Stay logged in as Mentor.

## 6.1 Schedule a meeting

Tab **Meetings**.

| # | Click / action | Expected |
|---|----------------|----------|
| 6.1.1 | Demo | Upcoming: **Weekly Mentoring — Sec A**, Join link works, status SCHEDULED. |
| 6.1.2 | **Schedule meeting** | Title *, Type (Weekly mentoring / Monthly parent / Ad-hoc), Date & time *, Agenda optional. |
| 6.1.3 | Weekly mentoring, future datetime, agenda `Credit review` → **Schedule & notify** | Toast **Meeting scheduled & invites sent**. Card appears with **Join**. |
| 6.1.4 | Type **Monthly parent** | Invites go to **parent emails** (console if no SMTP). Meeting still created. |
| 6.1.5 | Student Meetings tab | Same new meeting + Join. |
| 6.1.6 | Minutes tab | A **Draft** minutes row is auto-created for the new meeting. |
| 6.1.7 | Past meetings | After you use a **past** datetime (or wait), the meeting moves to the Past table. |

## 6.2 Minutes of meeting

Tab **Minutes**.

| # | Click / action | Expected |
|---|----------------|----------|
| 6.2.1 | Draft row → **Edit** | Wide modal: title, held-on, attendance n/n, Agenda, Discussion, Decisions. Attendee checkboxes. |
| 6.2.2 | Tick attendees, write discussion → **Save draft** | Toast **Minutes saved**. Stays Draft (amber). |
| 6.2.3 | **Finalize** | Toast **Minutes finalized**. Badge green. Button becomes **View**. |
| 6.2.4 | **Print** | Browser print dialog. Minutes should be readable (sidebar hidden via `no-print`). |
| 6.2.5 | Stat **Draft Minutes** | Decrements after finalize. |

## 6.3 Respond to issues

Tab **Issues** (badge shows open count).

| # | Click / action | Expected |
|---|----------------|----------|
| 6.3.1 | After student raised an issue | Yellow “n issue(s) waiting”. Card: subject, student, category, priority, description. |
| 6.3.2 | **Respond** | Shows description + thread. Message * + Status (Open, In progress, Resolved, Escalated, Closed). |
| 6.3.3 | Reply + **In progress** → **Send response** | Toast **Response sent**. Student sees the reply. |
| 6.3.4 | Second reply + **Resolved** | Open Issues stat drops. Student Open Issues drops. |

---

# PHASE 7 — Accreditation reports

Open as **Admin**, then repeat as **Dean** and **HoD**. Numbers must be **scoped** (HoD sees department only; Admin sees campus).

Each role has sidebar: **NAAC Report**, **NIRF Report**, **NBA Report**.

Also visit `/reports` while logged in as HoD/Dean/Admin: three cards linking to `/reports/naac`, `/reports/nirf`, `/reports/nba`. Student visiting `/reports` must be denied.

## 7.1 NAAC

| # | Check | Expected |
|---|--------|----------|
| 7.1.1 | Header | CUTM logo, IQAC line, “Generated on …” timestamp |
| 7.1.2 | A. Mentoring (2.3.3) | Mentors, Students, Mapped, **Mentor : Mentee Ratio** (highlighted), Coverage % |
| 7.1.3 | B. Activity (5.1) | Mentoring meetings, parent meetings, minutes recorded, at-risk count |
| 7.1.4 | C. Progression (5) | Placed %, higher studies %, scholarships %, activities % |
| 7.1.5 | D. Mentor-wise list | Mentor name, Emp. ID, mentee count (demo mentor CSE-101, 4 mentees) |
| 7.1.6 | **Print / Save as PDF** | Print dialog. Back button hidden when embedded in the dashboard. |
| 7.1.7 | After you map a new student / finalize minutes / add a placement | Refresh the report — numbers move. |

## 7.2 NIRF

| # | Check | Expected |
|---|--------|----------|
| 7.2.1 | GPH | Placement %, higher studies %, entrepreneurship %, combined GPH highlighted |
| 7.2.2 | GMS | Median / max / min salary LPA (Aarav’s 4.5 LPA feeds this on demo) |
| 7.2.3 | GUE | On-time graduation %, live-backlog count (Diya feeds backlogs) |
| 7.2.4 | Recruiters | Company names from placement records (e.g. TCS) |

## 7.3 NBA

| # | Check | Expected |
|---|--------|----------|
| 7.3.1 | Average CGPA, pass % (no live backlogs) |
| 7.3.2 | CGPA buckets 9–10 / 8–9 / 7–8 / 6–7 / &lt;6 (Ishaan in 9–10, Aarav 8–9, Diya 6–7) |
| 7.3.3 | Average CO / PO attainment |
| 7.3.4 | At-risk HIGH count and % (Diya; plus anyone you set HIGH) |

Signatures at the bottom: Mentoring Coordinator, Head of Department, IQAC Coordinator.

---

# PHASE 8 — Excel import (HoD)

Use a **new** RegistrationNo so you do not confuse demo students. Import is **idempotent**: same RegistrationNo **updates** the existing student.

1. HoD → Students → **Import** (or empty-state **Import Excel**).
2. In the modal click **Download template**.
3. Open the file. Read sheet **Instructions**.
4. On sheet **Students**:
   - **Delete the sample row** (or it becomes a real student `2201CSE001` / Sample Student).
   - Add a row:

| Column | Value |
|--------|--------|
| RegistrationNo | `2601CSE777` |
| Name | `Import Testee` |
| Email | `import.testee@cutm.ac.in` |
| Programme | `B.Tech CSE` |
| Batch | `2026-2030` |
| CurrentSemester | `1` |
| ParentEmail | `parent.import@example.com` |
| MentorEmail | `mentor.cse@cutm.ac.in` |

5. Save as `.xlsx`.
6. Leave **Issue login credentials to students** checked.
7. Choose file → **Upload & import**.

| # | Expected |
|---|----------|
| 8.1 | Summary tiles: Created, Updated, Mapped, Credentials |
| 8.2 | Created ≥ 1, Mapped 1 (MentorEmail matched), Credentials 1 |
| 8.3 | Row errors listed as `Row n: …` if a column is wrong |
| 8.4 | Student appears in the table, already mapped to Prof. C. Mentor |
| 8.5 | Re-import same file | Created 0, Updated 1 (idempotent) |
| 8.6 | Wrong MentorEmail | Student created, stays Unmapped, error or mapped = 0 |
| 8.7 | Log in as `import.testee@cutm.ac.in` with emailed/console temp password | First-login password change, then `/student` |
| 8.8 | Uncheck credentials and import another row | Student profile exists, no login until you import again with the box checked |

---

# PHASE 9 — Weekly / monthly automation

These are **not** buttons in the UI. They are protected URLs.

You need `CRON_SECRET` from `.env` / `.env.local`.

In a terminal (do **not** put the real secret in tickets or screenshots):

```bash
# Dry run — no emails, no calendar events
curl -s "http://localhost:3000/api/cron/weekly?secret=YOUR_CRON_SECRET&dryRun=true"
curl -s "http://localhost:3000/api/cron/monthly?secret=YOUR_CRON_SECRET&dryRun=true"
```

| # | Action | Expected |
|---|--------|----------|
| 9.1 | No secret / wrong secret | `{ "error": "Unauthorized" }` status 401 |
| 9.2 | Weekly dry run | JSON `ok: true`, `task: WEEKLY_MENTORING`, counts of mentors/meetings that **would** be created |
| 9.3 | Monthly dry run | `task` for monthly parent meetings |
| 9.4 | Live run **without** `dryRun` (staging only) | Meetings appear on mentor + student dashboards; minutes drafts created; console or SMTP shows mail; Meet link is Google or fallback |
| 9.5 | Repeat weekly immediately | Should not spam duplicate meetings for the same slot (note actual idempotence) |

---

# PHASE 10 — Negative, security, and “does it stay in its lane”

| # | Action | Expected |
|---|--------|----------|
| 10.1 | Student opens `/api/users?role=DEAN` in the browser | 401/403, not a dean list |
| 10.2 | Mentor A (only one in demo) — after you create a second mentor and map a private mentee | Mentor A must **not** see Mentor B’s mentees |
| 10.3 | Dean of SOM must not see CSE students | Empty or SOM-only lists |
| 10.4 | Closed modal + refresh | No half-saved school/dean |
| 10.5 | XSS in issue subject `<script>alert(1)</script>` | Shown as text, no alert |
| 10.6 | Upload `.exe` as gradesheet | Rejected (PDF only) |
| 10.7 | Upload `.csv` as student import | Rejected (`.xlsx`) |
| 10.8 | Sign out on one tab, click a protected action on another | Redirect to login, no data leak |
| 10.9 | Bookmark `/admin` after logout | Login gate |
| 10.10 | Password field never appears in page source as plaintext after login | Cookie `cutm_session` is httpOnly (Application → Cookies in DevTools) |

---

# PHASE 11 — Suggested “happy path” in one sitting (90 minutes)

Run this story on **demo data** so every screen has something to show. Tick as you go.

1. [ ] Landing → Sign in → Admin Overview stats look sane  
2. [ ] Admin NAAC / NIRF / NBA each load and print  
3. [ ] Sign out → Dean → Departments + HoDs listed; reports load  
4. [ ] Sign out → HoD → Mentors (1), Students (4), Mapping (4), Unmapped 0  
5. [ ] HoD Credit Baskets — 6 baskets; edit one alias and save  
6. [ ] HoD Students → Aarav **Credit plan** — totals save  
7. [ ] HoD Learner Policy — save without breaking numbers  
8. [ ] Sign out → Mentor → 4 mentees; Diya HIGH risk  
9. [ ] Mentor → Diya **Profile** → add a semester result → save  
10. [ ] Mentor → Aarav **Mentoring** → Credits tracker visible → **Ask for gradesheet**  
11. [ ] Sign out → Aarav → Credits banner → upload a text PDF → status NEEDS REVIEW  
12. [ ] Mentor → Aarav Gradesheets → Review → map baskets → Verify → tracker % increases  
13. [ ] Mentor → Counselling → pre-fill → save note  
14. [ ] Aarav → Acknowledge the new note  
15. [ ] Aarav → Raise issue (Academic / High)  
16. [ ] Mentor → Issues → Respond In progress, then Resolved  
17. [ ] Mentor → Schedule ad-hoc meeting tomorrow → Join link → Minutes draft → Save → Finalize → Print  
18. [ ] Kiara → Request branch change → Mentor counsel & recommend → HoD Approve  
19. [ ] Mentor → download Interactions Excel and Learner Excel  
20. [ ] HoD → Import template (one new row) → student appears mapped  
21. [ ] Cron weekly `dryRun=true` returns 200  
22. [ ] Student cannot open `/admin`  
23. [ ] Sign out from avatar and from sidebar  

If all 23 pass, the **platform generation flow + weekly mentoring loop** is working.

---

# PHASE 12 — What “good” looks like after a full greenfield run

You should be able to point a reviewer at this chain with **new** people (not only demo):

```
Admin adds School
   → provisions Dean (temp password)
Dean logs in, changes password
   → adds Department + programme
   → provisions HoD
HoD logs in, changes password
   → adds baskets
   → provisions Mentor
   → adds / imports Students
   → maps Mentor ↔ Students
   → saves each Credit plan
   → sets Learner policy
Mentor logs in, changes password
   → edits profiles
   → asks for gradesheet
Student logs in, changes password
   → uploads PDF
Mentor verifies gradesheet
   → credit tracker updates
   → writes counselling
Student acknowledges
   → raises issue / joins meeting
Mentor minutes + issue response
HoD decides branch change (1st year)
Admin/Dean/HoD print NAAC · NIRF · NBA
```

If any arrow is broken, the accreditation story is incomplete even if individual pages “look fine”.

---

## Sign-off

| Area | P/F | Notes |
|------|-----|-------|
| Landing + login + first password | | |
| RBAC / session | | |
| Admin school + dean | | |
| Dean department + HoD | | |
| HoD mentor + student + map | | |
| Baskets + credit plan + learner policy | | |
| Excel import / export / template | | |
| Mentor profile editor | | |
| Credit tracker | | |
| Gradesheet upload + parse + verify | | |
| Counselling + acknowledge | | |
| Branch change loop | | |
| Meetings + Meet link + minutes | | |
| Issues thread | | |
| NAAC / NIRF / NBA print | | |
| Cron dry run | | |
| Mobile shell | | |

**Tester:** _________________  
**Date:** _________________  
**Build / URL:** `http://localhost:3000`  
**Data set:** Demo / Greenfield / Mixed  
**SMTP configured:** Yes / No (console fallback)  
**Google Meet configured:** Yes / No (fallback link)  

---

## Known honest limits (do not mark these as product bugs)

From the platform README — treat as **documented behaviour**:

- Gradesheet parser works on **text PDFs**, not scanned images. Mentor verification is required.
- Without SMTP, credential and meeting emails are **logged to the server console**.
- Without Google Workspace, Meet links are a **fallback room**, not a real Calendar event.
- Proof-document file storage (offer letters, certificates) is schema-ready, not a full S3 flow yet.
- This is mentoring + IQAC evidence, **not** the ERP.

---

## Quick URL map

| URL | Who |
|-----|-----|
| `/` | Public landing (redirects if logged in) |
| `/login` | Sign in + first password |
| `/admin` | Admin |
| `/dean` | Dean |
| `/hod` | HoD |
| `/hod` + sidebar Credit Baskets | HoD baskets |
| `/mentor` | Mentor |
| `/student` | Student |
| `/reports` | Report picker (Admin / Dean / HoD) |
| `/reports/naac` `/reports/nirf` `/reports/nba` | Printable reports |
| `/api/students/template` | Excel template download |
| `/api/cron/weekly` `/api/cron/monthly` | Automation (secret required) |
