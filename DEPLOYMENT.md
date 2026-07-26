# Deployment Guide

This platform is a standard Next.js 14 (App Router) app with a MongoDB backend. It can be
deployed on Vercel, Render, Railway, a VPS, or any Node host.

---

## A. MongoDB

Use **MongoDB Atlas** (free tier works) or a self-managed MongoDB ≥ 6.

1. Create a cluster and a database user.
2. Whitelist your host IP (or `0.0.0.0/0` for managed platforms).
3. Copy the connection string into `MONGODB_URI` and append the DB name, e.g.
   `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/cutm_mentoring`.

---

## B. Deploy on Vercel (recommended)

1. Push this repo to GitHub/GitLab and **Import** it in Vercel.
2. In **Project → Settings → Environment Variables**, add every key from `.env.example`.
3. Deploy. Then run the seed once (locally against the same `MONGODB_URI`):
   ```bash
   npm run seed
   ```
   (or `npm run seed -- --demo` for sample data).
4. **Cron:** `vercel.json` already declares the two cron jobs. Because the endpoints are
   protected by `CRON_SECRET`, do one of:
   - Set `CRON_SECRET` in Vercel env and change the `vercel.json` paths to include it
     (`/api/cron/weekly?secret=YOURSECRET`), **or**
   - Keep the secret out of `vercel.json` and instead call the endpoints from an external
     scheduler (Section D) with the `Authorization: Bearer` header.

   Vercel Cron calls are same-origin; you may also relax the guard to accept Vercel's
   `x-vercel-cron` header if you prefer — see `src/app/api/cron/*/route.js`.

> Serverless note: cron handlers set `maxDuration = 300`. For very large institutions with
> thousands of mentors, prefer the always-on **worker** (Section E) or batch the run.

---

## C. Google Meet / Calendar (optional but recommended)

Without Google credentials the app generates a **fallback** Meet room link so everything
still works. For real, auto-provisioned Meet links + calendar invites:

1. Google Cloud Console → create a project → enable **Google Calendar API**.
2. Create a **Service Account**; create a JSON key.
3. Enable **Domain-Wide Delegation** on the service account and, in the Google Workspace
   Admin console, authorize its client ID for scope
   `https://www.googleapis.com/auth/calendar.events`.
4. Set env:
   - `GOOGLE_CLIENT_EMAIL` = service account email
   - `GOOGLE_PRIVATE_KEY` = the private key (keep the `\n` escapes, or wrap in quotes)
   - `GOOGLE_IMPERSONATE` = a real Workspace user (e.g. `mentoring@cutm.ac.in`)
   - `GOOGLE_CALENDAR_ID` = `primary` (or a shared calendar id)

---

## D. Trigger cron from an external scheduler

Any scheduler that can make an HTTP request works. Examples:

**cron-job.org / UptimeRobot**
```
URL:    https://YOUR_APP/api/cron/weekly
Header: Authorization: Bearer YOUR_CRON_SECRET
When:   Every Monday 08:00 (Asia/Kolkata)
```
Repeat for `/api/cron/monthly` on the 1st of each month.

**GitHub Actions** (`.github/workflows/cron.yml`)
```yaml
name: cutm-cron
on:
  schedule:
    - cron: '30 2 * * 1'   # 08:00 IST Monday (UTC+5:30)
    - cron: '30 2 1 * *'   # 08:00 IST on the 1st
jobs:
  fire:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -sf -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://YOUR_APP/api/cron/weekly" || true
          curl -sf -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://YOUR_APP/api/cron/monthly" || true
```

---

## E. Self-host on a VPS (always-on)

```bash
npm install
cp .env.example .env      # fill values
npm run build
npm run start             # serves on PORT (default 3000) behind Nginx

# In a second process (pm2 recommended):
ENABLE_INTERNAL_SCHEDULER=true npm run worker
```

Use a process manager (pm2/systemd) to keep both `npm run start` and `npm run worker`
alive, and put Nginx + HTTPS in front.

---

## F. First-run checklist

- [ ] `MONGODB_URI` reachable
- [ ] `JWT_SECRET` and `CRON_SECRET` set to strong random values
- [ ] `npm run seed` executed (admin exists)
- [ ] SMTP verified (send a test by provisioning a user)
- [ ] `APP_URL` set to the public HTTPS URL
- [ ] One cron trigger configured (Vercel / external / worker)
- [ ] (Optional) Google service account wired for Meet links
