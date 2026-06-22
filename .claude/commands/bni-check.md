---
description: Audit pending BNI 121 changes against the regression guard (auth, service worker, Supabase, deploy) before committing.
---

Run a regression audit of the BNI 121 CRM before this change ships. Follow these steps exactly.

1. **Load the rules.** Read `.claude/skills/bni121-regression-guard/SKILL.md` — it is the source of
   truth for every check below.

2. **Find what changed.** Run `git status` and `git diff` (and `git diff --cached`). If the user named
   specific files in `$ARGUMENTS`, scope to those. Note which changed files live under
   `1backup/BNI 121/` (the live deploy source) vs the stale repo root.

3. **Audit each changed file against the four domains.** For every applicable rule, report PASS / FAIL /
   N/A with the exact file:line evidence:

   - **Deploy layout** — Are edits in `1backup/BNI 121/`? Flag any change made only to the root copy
     (it will not ship). Flag any attempt to modify the deploy-root `index.html`.
   - **Auth & session** — If `login.html`, `admin.html`, `auth-guard.js`, or `bni-sidebar.js` changed:
     do all login paths set BOTH `bni_crm_auth` and `ht_admin_session`, and all logout paths clear
     BOTH? Is the session a 12h expiry timestamp (not `'1'`)? On a new internal page, is
     `auth-guard.js` in `<head>`? Did a public page wrongly gain the guard, or an internal page lose it?
   - **Service worker** — If `sw.js` or any cached asset changed: does `sw.js` still bypass `/rest/`,
     `/storage/`, `/bni-upload/`, `supabase.co`, `api.anthropic.com`, and non-GET? Was a cached
     `.js`/`.css`/asset or the fetch/CORE logic changed WITHOUT a `VERSION` bump (`bni-vN`)? HTML-only
     changes do not need a bump.
   - **Self-hosted Supabase** — Any new `sb.storage.*` call (forbidden — must use `bniUpload`/
     `bniDeleteUpload`)? Any in-browser Anthropic/API-key usage (forbidden — must use `bniAI`)? New
     table referenced without a committed `migrations_*.sql` + `web_anon` grant? A DB page missing the
     supabase-js CDN `<script>` before `supabase-config.js`? Swallowed fetch errors / silent empty
     renders / mock data?
   - **Data integrity** — IDs from `max+1` instead of `Date.now()`? Fields dropped on save? Dead/unwired
     controls?

4. **Verdict.** Print a short PASS/FAIL summary. For each FAIL give the file:line and the exact fix.
   If everything passes, confirm it is safe to commit and remind that **pushing to `main` triggers the
   live VPS deploy**. Do not commit or push unless the user explicitly asks.

$ARGUMENTS
