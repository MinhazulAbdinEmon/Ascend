# Ascend

A competitive self-improvement platform. Track anything — coding, gym, study, reading, trading — earn XP, keep streaks, climb an original rank ladder, and build a GitHub-style heatmap of your real-life grind.

> "I am building my ranked profile in real life."

## Stack (strict MERN)

- **Frontend:** React (Vite), Tailwind CSS v4, React Router, Axios, Context API
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT (HTTP-only cookies), bcryptjs, express-validator

## Project structure

```
ascend/
├── server/          # Express + MongoDB API
│   └── src/
│       ├── config/        # db connection
│       ├── models/        # Mongoose schemas (User, Skill, Task, Completion, DailyStats, Season)
│       ├── controllers/   # route logic
│       ├── routes/        # endpoint definitions
│       ├── middleware/    # auth guard, validation, error handling
│       ├── utils/         # game config (XP, ranks), cookie/token helpers
│       ├── app.js         # express app (middleware + routes)
│       └── server.js      # entry point (env, db, listen)
└── client/          # React app
    └── src/
        ├── api/           # axios instance
        ├── context/       # AuthContext
        ├── components/    # Navbar, Sidebar, ProtectedRoute, ...
        ├── layouts/       # AppLayout (sidebar + navbar shell)
        └── pages/         # Landing, Login, Register, Dashboard, ...
```

## Getting started

### 1. Database (MongoDB Atlas — free)

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Database Access → create a database user with a password
3. Network Access → allow your IP (or 0.0.0.0/0 while developing)
4. Copy the connection string (`mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/ascend`) into `server/.env` as `MONGO_URI`

### 2. Backend

```bash
cd server
npm install
npm run dev              # http://localhost:5000  (health check: /api/health)
```

### 3. Frontend

```bash
cd client
npm install
npm run dev              # http://localhost:5173  (proxies /api to :5000)
```

## Game system

Three separate progression systems (see `server/src/utils/gameConfig.js` for all numbers):

1. **Lifetime level** — from total XP, never goes down. Level L is reached at `100*(L-1)²` XP.
2. **Competitive rank** — from `rankRating` (everyone starts at 1000 = Grinder). A weekly
   performance score (consistency 40%, XP 25%, focus 15%, improvement 10%, streak 10%) is
   compared to the expected score for your rating at the end of each Mon–Sun week:
   `ratingChange = round((weeklyScore - expected) * K)`. Rank can fall.
   Thresholds: Rookie <900 · Grinder 900 · Focused 1100 · Disciplined 1300 · Elite 1500 ·
   Prime 1700 · Spartan 1900 · Sovereign 2200.
3. **Duel rating** — future 1v1 Elo, fully separate (model stubbed in `models/DuelRating.js`).

XP: Easy 10 · Medium 25 · Hard 50 · Deep work 75, with small multipliers
(proof link 1.2x, note 1.05x; streak up to 1.2x at 30 days).

Anti-abuse: 300 XP/day cap · per-difficulty daily caps (easy 60, medium 125, hard 200) ·
half XP after 6 completions/day · once per day for daily/repeatable missions; once per week for weekly missions · spam-title rejection ·
`requiresProof` missions demand focus minutes, a note, or a link.

Heatmap intensity: 0 tasks = empty · 1 = low · 2–4 = medium · 5+ = high.

## Deployment (free tier friendly)

The app deploys as three pieces: database on **MongoDB Atlas**, API on **Render**, frontend on **Vercel**.

### 1. Database — MongoDB Atlas
1. Create a free M0 cluster, a database user, and allow access from `0.0.0.0/0`
   (Render's IPs change, so IP allowlisting isn't practical on the free tier).
2. Copy the connection string and add `/ascend` before the `?` (database name).

### 2. API — Render (render.com)
1. Push this repo to GitHub first.
2. Render → New → Web Service → connect the repo.
3. Settings: **Root Directory** `server` · **Build** `npm install` · **Start** `npm start`.
4. Environment variables:
   - `MONGO_URI` = your Atlas string
   - `JWT_SECRET` = a long random string (do NOT reuse the dev one)
   - `NODE_ENV` = `production`  ← required: enables secure cross-site cookies
   - `CLIENT_URL` = your Vercel URL once you have it, e.g. `https://ascend-xyz.vercel.app`
5. Health check path: `/api/health`.
6. Note your API URL, e.g. `https://ascend-api.onrender.com`.

### 3. Frontend — Vercel (vercel.com)
1. Vercel → New Project → same repo → **Root Directory** `client` (framework auto-detects Vite).
2. Environment variable: `VITE_API_URL` = `https://YOUR-RENDER-URL.onrender.com/api`.
3. Deploy, copy the Vercel URL, and put it into Render's `CLIENT_URL` (then redeploy the API).

`client/vercel.json` already handles SPA routing (deep links like /profile won't 404).

### Gotchas already handled in code
- `app.set('trust proxy', 1)` — without it, secure cookies fail behind Render's proxy
- Cookies use `sameSite: 'none'` + `secure` in production (frontend and API are on different domains)
- `CLIENT_URL` accepts a comma-separated list if you want localhost AND production allowed
- Free Render services sleep after inactivity — first request takes ~30s to wake. Normal.

## Build phases

- [x] Phase 1 — setup, backend server, MongoDB, auth (register/login/logout/me), frontend shell, auth pages, protected routes
- [x] Phase 2 — Skill CRUD, Task CRUD, Skills + Missions pages, dashboard mission list
- [x] Phase 3 — completion engine: XP multipliers + caps, DailyStats, streaks, weekly score, rating updates
- [x] Phase 4 — heatmap, profile page, dashboard/heatmap/profile/weekly stats APIs
- [x] Phase 5 — weekly + season leaderboards, season system, proof flow
- [x] Phase 6 — mobile polish, user timezones, in-app guide, deployment readiness


## Focus timer and productivity statistics

Open **Statistics** for the last 7 or 30 days of timer-recorded focus: daily minutes,
productive hours, totals, averages, and recent sessions. Charts use the profile timezone
and split sessions across midnight. Manually entered mission proof minutes are separate.

Focus and break timers support presets and custom durations (1–180 minutes), pause,
resume, and discard. The server stores the active session so navigation and reloads do
not reset it. Completed focus sessions save automatically and idempotently. Breaks,
pauses, and discarded sessions do not add productivity minutes or award mission XP.
Complete missions separately to earn XP under the existing rating rules.

An in-app notification and a loud, repeating eight-second alarm announce completion. The timer includes a volume slider, Test alarm, and Silence controls. Sound is scheduled on the browser audio clock and does not wait for the save request. After refreshing, use Test alarm to re-enable audio. Desktop notifications are
optional via the timer's enable button and depend on browser permission/support. Keep
the app open for alerts; an overdue timer is finalized at its original deadline when you
return, without counting extra time while the app was closed. Breaks start only when
chosen by the user.

Restart the API after updating to load `/api/focus` and the new FocusSession model.
Run `npm --prefix server run test:focus` for isolated timer/statistics integration tests
(including duplicate completion, pause exclusion, midnight, and DST).


## Daily mission board

Daily and repeatable missions can be completed once per local day. They stay crossed
out after completion; **Create another** opens a new mission with the same settings
for another round. Daily eligibility resets at local midnight, immediately after
11:59 PM, using the profile timezone. Open mission boards refresh on rollover and
when returning to the tab. History and earned XP are preserved. Non-repeatable weekly
and one-time missions retain their weekly/lifetime completion periods.

The Missions page includes completion/proof controls and a live hours/minutes/seconds
countdown for the day. Duplicate completion requests are blocked by a unique period
index; the index excludes legacy records so existing history is preserved.
