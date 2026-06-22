---
name: BNI 121 — Regression Guard
description: Pre-change checklist and root-cause catalog for the BNI 121 CRM (static HTML + self-hosted Supabase/PostgREST on a Hostinger VPS, client-side auth, service worker). Encodes every production bug already fixed so they are not reintroduced. Invoke before editing auth (login.html / admin.html / auth-guard.js / bni-sidebar.js), the service worker (sw.js), any Supabase / upload / AI call, or anything that ships to the deploy source.
type: pattern
tags: [bni121, auth, service-worker, supabase, postgrest, deploy, regression, hopetech]
---

# BNI 121 — Regression Guard

> Read this before touching auth, the service worker, Supabase/upload/AI calls, or the deploy source.
> Every rule below traces to a real production bug already fixed in this repo. Re-introducing any of
> them is a regression. Related: harvested [`quick-login-direct-auth`](../harvested/quick-login-direct-auth/SKILL.md)
> and the [`bni-ai-first-framework`](../bni-ai-first-framework/SKILL.md).

## Project shape (the facts that cause most bugs)

- **Static HTML site.** No build step. ~20 internal CRM pages + a few public pages.
- **Deploy source is `1backup/BNI 121/`**, deployed from `main`. A per-minute VPS cron
  (`deploy.sh`) redeploys when `main`'s commit SHA changes. **Push to `main` = production deploy.**
- **There are TWO copies of most files**: the repo root (stale/dev) and `1backup/BNI 121/` (live).
  Editing the root copy ships nothing. Always edit under `1backup/BNI 121/`.
- **Backend is self-hosted PostgREST** behind nginx (NOT hosted supabase.com). It has **no Storage
  API and no Auth API** — only the REST layer. Anything assuming hosted Supabase features will 405/404.
- **Auth is 100% client-side** (localStorage expiry timestamps). There is no server session.
- `index.html` at the deploy root is the **public hopetech.me landing page, owned outside this repo** —
  `deploy.sh` excludes it from rsync. Never expect changes to it to ship, never overwrite it.

---

## Domain 1 — Auth & session (most frequent breakage)

There are **two auth keys that must always move together**:

| Key | Set/checked by | Gates |
|-----|----------------|-------|
| `bni_crm_auth` | `auth-guard.js` (checks), `login.html` + `admin.html` (set) | All ~20 internal CRM pages |
| `ht_admin_session` | `admin.html` (checks + sets), `login.html` (sets) | The admin.html console |

**Rules:**

1. **Any login path must set BOTH keys; any logout must clear BOTH.** This is the single most
   repeated bug. `login.html`, `admin.html doLogin()`, `admin.html doLogout()`, and the sidebar
   Sign-out must stay in sync. Symptom of breaking it: log in on one surface, get bounced to
   `login.html` when navigating to another page (the original "login appears multiple times" report).
2. **Sessions are 12h ms-epoch expiry timestamps**, `String(Date.now() + SESSION_MS)` — never the
   legacy `'1'` flag. `auth-guard.js` rejects `'1'` so every device re-authenticates once. Keep
   `SESSION_MS = 12*60*60*1000` identical across `login.html` and `admin.html`.
3. **`auth-guard.js` must be loaded in `<head>`**, synchronously, on every internal page — so the
   redirect fires before first paint. It was once at the bottom of `<body>`, leaking a full render
   before the bounce. New internal pages MUST include `<script src="auth-guard.js"></script>` in `<head>`.
4. **`admin.html` must exist in the deploy source.** A stale live `admin.html` once exposed the
   sidebar outside the login gate and shipped a password-autofill backdoor. No `autocomplete` on the
   password field, no `ht_admin_pw` override, sidebar loads only AFTER auth (`showApp()`).
5. **Public pages stay open** — `index`, `about`, `my-card`, `scheduler` deliberately do NOT include
   `auth-guard.js`. Don't add it to them.
6. Existing users who logged in before an auth change keep their old keys until next login — expect
   one extra prompt after shipping an auth fix; that's not a new bug.

---

## Domain 2 — Service worker (`sw.js`)

Cache-first behavior silently masked write failures and served stale code. Guard rails:

1. **Never cache dynamic/backend traffic.** `sw.js` must `return` (bypass) early for:
   - `url.host` containing `supabase.co` or `api.anthropic.com`
   - `url.pathname` starting with `/rest/` (PostgREST), `/storage/`, or `/bni-upload/`
   - any non-`GET` request
   The classic bug: cache-first caching of `/rest/` GETs made every contact/board/sprint write
   look like it failed.
2. **Navigations are network-first, assets are cache-first.** Because of this, HTML changes ship
   immediately but **changed JS/CSS assets (`auth-guard.js`, `bni-sidebar.js`, `supabase-config.js`)
   require a `VERSION` bump** (`bni-vN` → `bni-v(N+1)`) or clients keep the old cached file.
3. **Only handle `http`/`https`** — guard `chrome-extension://` and others (Cache API throws on them).
4. Offline navigation fallback uses `ignoreSearch: true` so `login.html?next=…` matches the precached
   `/bni/login.html` (prevents an offline redirect loop for logged-out users).
5. Keep the `CORE` precache list in step with real page filenames.

**Decision rule:** changed only `.html`? No version bump needed. Changed any cached `.js`/`.css`/asset
or the `CORE`/fetch logic? Bump `VERSION`.

---

## Domain 3 — Self-hosted Supabase / PostgREST

The backend is REST-only. Assumptions from hosted Supabase break here.

1. **No Storage API.** `sb.storage.*` uploads hit `/storage/v1/*` → nginx **405**. Use the
   server-side helpers in `supabase-config.js`: `bniUpload` / `bniDeleteUpload` (backed by
   `bni_upload_service.py` on port 18803 behind nginx `/bni-upload/`). Never reintroduce `sb.storage`.
2. **AI calls go server-side.** Use `bniAI` (proxies Anthropic through `bni_upload_service.py`).
   Never prompt for an API key in the browser or call `api.anthropic.com` from client JS.
3. **A `PGRST205` "table not found" means the table is missing on the VPS, not a code bug.** Ship a
   `migrations_*.sql` that creates it AND grants `web_anon` (e.g. `bni_proposals`). After any DDL,
   PostgREST needs a schema-cache reload to see new columns/tables.
4. **Every page using the DB must include the supabase-js CDN `<script>` before `supabase-config.js`.**
   Missing it → `window.sb` undefined → page stuck on "Loading…". (Hit on `proposals.html`.)
5. **Surface fetch errors; never silently render empty.** An empty list must be distinguishable from
   a failed load. No mock data, no silent fallback.

---

## Domain 4 — Data integrity (frontend)

1. **Generate record IDs from timestamps** (`Date.now()`), never `max(id)+1` over a possibly-stale
   client list — `max+1` collided and silently overwrote existing rows via upsert (`tracker.html`).
2. Don't drop fields on save (e.g. `website`/`specialty` were being lost). Round-trip the full record.
3. Wire every control on first pass — no dead buttons / "and N more" placeholders that do nothing.

---

## Before you ship — checklist

- [ ] Edited files are under **`1backup/BNI 121/`** (not the stale repo root)?
- [ ] Auth change keeps **both** `bni_crm_auth` and `ht_admin_session` in sync (login AND logout)?
- [ ] New internal page includes `auth-guard.js` in `<head>`? (Public page → intentionally omitted?)
- [ ] `sw.js` still bypasses `/rest/`, `/storage/`, `/bni-upload/`, supabase.co, anthropic, non-GET?
- [ ] Changed a cached asset or `sw.js` logic → bumped `VERSION` (`bni-vN`)?
- [ ] No `sb.storage` and no in-browser Anthropic key — used `bniUpload`/`bniAI`?
- [ ] New table → migration with `web_anon` grant committed?
- [ ] DB page includes supabase-js CDN before `supabase-config.js`?
- [ ] Errors surfaced, not swallowed; IDs timestamp-based?
- [ ] Ready to **push to `main`** (that triggers the live deploy)?
