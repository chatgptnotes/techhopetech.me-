---
name: BNI Chapter — Be AI-First Implementation Protocol
description: BNI-domain specialisation of the Be AI-First framework. 4-phase sequence (Learn → Wire → Automate → Scale + Step 0 Discovery + Governance) for transforming a BNI chapter's weekly operations using the bni121 platform as the reference implementation. Each phase has BNI-specific deliverables, gates, and agent menus. Invoke when onboarding a new chapter or scoping an automation engagement for an existing chapter.
type: pattern
tags: [bni, bni121, chapter-ops, ai-first, supabase, drip-worker, gcal, zoom, referrals, palms, hopetech]
---

# BNI Chapter — Be AI-First Implementation Protocol

> Sister skill to [`be-ai-first-framework`](../be-ai-first-framework/SKILL.md). That one is generic across sectors; **this one is BNI-specific** — every example, agent, and gate is anchored to chapter weekly ops and the bni121 platform.
>
> Pre-existing harvested skill [`bni-crm-build-pitfalls`](../harvested/bni-crm-build-pitfalls/SKILL.md) covers technical gotchas while building the platform — read both together when onboarding a new chapter.

---

## Problem

BNI chapter Leadership Teams (LT) rotate annually and inherit a tangle of WhatsApp groups, paper visitor slips, manual member-trackers, and screenshots of attendance. Symptoms we see in every chapter:

- Visitors never get a follow-up — chapter loses 60–80% of conversions
- 1-2-1s happen but get logged days later, if at all — PALMS scores rot
- Referrals get spoken in the meeting but never written down — credit lost
- The new LT spends Q1 rebuilding spreadsheets the previous LT also rebuilt
- "AI" in the chapter = one member using ChatGPT for marketing copy, nobody else

The Be AI-First framework, applied with `bni121` as the platform, fixes this in a 10-week sprint and leaves the chapter with a reusable Business Brain that survives LT rotation.

---

## BNI-specific phase map

| Phase | Weeks | BNI deliverable | Gate |
|-------|-------|----------------|------|
| 0  PRE-ENGAGEMENT | Before Day 1 | Chapter readiness scorecard | Member roster + tool inventory + 1 LT Champion |
| 1  LEARN | 1–2 | Capability Map for BNI workflows | LT has 10+ Claude hours each on real chapter work |
| 2  WIRE | 3–5 | bni121 tenant deployed + populated | Members / referrals / 1-2-1s / attendance live in Supabase |
| 3  AUTOMATE | 6–10 | 6+ BNI agents in production | Visitor, 1-2-1, referral, follow-up, PALMS, sub-finder agents live |
| 4  SCALE | 11+ | Chapter Performance Dashboard | Attendance %, PALMS, conversion ratios reviewed weekly |

---

## Step 0 — Pre-Engagement Discovery (BNI version)

**Goal:** Score the chapter's current state and pick a Champion before Day 1.

### BNI tool & workflow audit

| Workflow | Today (typical chapter) | Where data lives |
|----------|-------------------------|------------------|
| Member roster | BNI Connect + Excel + Treasurer's notebook | three places |
| Visitor capture | Paper slip handed to Visitor Host | binder, sometimes scanned |
| Referral tracking | Spoken in meeting, slip handed over | manual log, often lost |
| 1-2-1 scheduling | WhatsApp DMs + Google Calendar | DMs, no log |
| Attendance | Roll call + manual mark | secretary's spreadsheet |
| Substitute finding | WhatsApp blast | "anyone free Wednesday?" |
| Weekly meeting agenda | Email from LT | inbox |
| PALMS reporting | Manual entry into BNI Connect | end-of-period scramble |

### Tasks
- Pull member roster from BNI Connect → CSV
- List every tool the LT uses (BNI Connect, WhatsApp groups, Zoom, Google Calendar, Excel, Drive)
- Score AI literacy of LT (President / VP / Secretary-Treasurer / Membership / Visitor Host / Education) on 0–5
- Identify the **AI Champion** — usually Education Coordinator or Secretary-Treasurer (curious, weekly-cadence role)
- Note cultural resistance: any older members who'll push back on automation? Plan for them.

### Gate (must pass before Phase 1)
- [ ] Member roster exported as CSV
- [ ] Tool inventory complete (≥6 tools listed with active-user counts)
- [ ] AI Champion named, agreed by President + VP
- [ ] Top 5 chapter pain-points documented (visitor follow-up, 1-2-1 logging, etc.)

**Deliverable:** *Chapter Readiness Scorecard* — one page, signed by President.

---

## Phase 1 — LEARN (Weeks 1–2)

**Goal:** LT Champion + 1–2 secondary Champions hit personal AI fluency on **real chapter work**.

### Daily practice (Champions)
- 1 hour/day on Claude.ai or Claude Code, doing actual chapter tasks:
  - Draft this week's visitor follow-up emails (real names from last meeting)
  - Summarise last 4 weeks of meeting minutes into a member newsletter
  - Generate 1-2-1 questions tailored to a member's profession
  - Draft a substitute-finder WhatsApp message
  - Convert PALMS spreadsheet into a chapter health summary
- Log 3 "aha moments" per week — tasks where AI saved 30+ minutes of LT time

### Weekly share-back
- 30-min slot at the LT meeting (not the chapter meeting): each Champion demos one win
- Consolidate into a chapter `What AI Can Do for BNI` doc

### Deploy `ironbark` early
- Every Champion session auto-harvests reusable prompts
- By end of Phase 1, the chapter has a starter prompt library — these become Phase 3 agents

### Gate
- [ ] Each Champion has 10+ hours hands-on
- [ ] Capability Map written: "AI handles this well" (drafts, summaries, follow-ups) vs. "AI needs a human" (induction speeches, member resignations, conflict)
- [ ] President signs off on Capability Map

**Deliverable:** *BNI Capability Map* — 2-column doc with realistic per-task time savings (e.g., "visitor follow-up: 15 min → 2 min").

---

## Phase 2 — WIRE (Weeks 3–5)

**Goal:** Stand up the chapter's Business Brain. Reference implementation = `bni121`.

### Knowledge structuring (markdown-first)
Convert these to markdown / Notion. **No Word/PDF as primary source.**
- BNI core values & code of ethics (chapter-adapted)
- Weekly meeting agenda template
- Visitor-host script
- Member induction SOP
- Substitute-finder SOP
- Referral handoff SOP
- 1-2-1 question bank (by profession category)
- Education-slot library
- Chapter org chart with LT roles, decision authority, term dates

### Live data connections (the bni121 wiring pattern)

| Data source | Integration | bni121 component |
|-------------|-------------|------------------|
| Member roster | Supabase `members` table | `dashboard.html`, `teams.html` |
| Visitors | Supabase `visitors` table + `members-met.html` | `members-met.html` |
| Referrals | Supabase `referrals` table | `referrals.html` |
| Proposals | Supabase `proposals` table | `proposals.html` |
| 1-2-1s | Supabase + Google Calendar | `scheduler.html`, `gcal_worker.py` |
| Zoom calls | Zoom webhook → Supabase | `zoom_webhook.py`, `zoom-completed.html` |
| Drip messages | Supabase `drips` + worker | `drip_worker.py`, `templates.html`, `followup.html` |
| Personal cards | Supabase `cards` | `my-card.html` |

Wire all of the above into **one Supabase project** with multi-tenant scoping (one tenant per chapter). Reference the harvested `Auto-Tenant Fetch Wrapper` pattern so every API call carries `tenant_id` automatically — see `bni-crm-build-pitfalls` for the gotchas.

### Single source of truth (per data type)
- Members → Supabase `members` (NOT BNI Connect, NOT WhatsApp, NOT Excel)
- Schedule → Google Calendar (mirrored to Supabase by `gcal_worker.py`)
- Templates → Supabase `templates` (NOT individual member's drafts folder)

### Gate
- [ ] Chapter Context File written (1–2 pages) covering chapter mission, LT roles, weekly cadence
- [ ] At least 3 live data sources connected (Supabase + Google Calendar + Zoom is the minimum)
- [ ] All SOPs in markdown
- [ ] LT can log into the bni121 tenant and see their real members

**Deliverable:** A working *Chapter Business Brain* — bni121 deployment with real data flowing.

---

## Phase 3 — AUTOMATE (Weeks 6–10)

**Goal:** Ship 6+ BNI agents to production, each with a scoring checklist and human-in-loop gate.

### BNI agent menu (priority order)

| # | Agent | Pulls from | Acts on | bni121 page |
|---|-------|-----------|---------|-------------|
| 1 | **Visitor Follow-up Agent** | `visitors` (last 7 days) | Drafts personalised email + WhatsApp; LT approves before send | `members-met.html`, `drip_worker.py` |
| 2 | **1-2-1 Scheduler Agent** | `members` × `members` matrix; Google Calendar | Suggests 3 highest-leverage 1-2-1s for each member this week | `scheduler.html`, `gcal_worker.py` |
| 3 | **Referral Reminder Agent** | `referrals` (status = pending > 7 days) | Drafts nudge to giver and receiver | `referrals.html`, `followup.html` |
| 4 | **PALMS Reporter Agent** | `referrals` + `1-2-1s` + `attendance` + `visitors` + `testimonials` | Weekly per-member PALMS summary; flags traffic-lights | `dashboard.html` |
| 5 | **Substitute Finder Agent** | `members` + Google Calendar conflicts | Drafts targeted DM to likely-available subs (not blast) | `templates.html` |
| 6 | **Weekly Agenda Agent** | Past 4 weeks' minutes + member rotation | Drafts next week's agenda + education slot brief | `templates.html` |
| 7 | **Visitor-of-Promise Agent** | `visitors` + LinkedIn enrichment | Briefs the inviting member on the visitor before the meeting | `members-met.html` |
| 8 | **Member-Health Agent** | `attendance` + `1-2-1s` + `referrals` (90 days) | Flags members likely to drop out before they do | `dashboard.html` |

### Closed-loop rules (apply to ALL agents)
- Output passes a scoring checklist before send / action — see harvested `Zero-Hardcode Bottom-Up Integration Protocol`
- Agent logs each iteration into Supabase: input, output, who-approved, what-changed
- Quality threshold per agent (e.g., visitor email must include: visitor's first name, member who invited, specific business benefit, soft CTA — score < 4/4 → loop back)
- LT weekly 15-min retro: which agents earned trust, which need prompt refinement
- All revised prompts stored in Supabase `prompt_library` (also harvested by ironbark to `~/.claude/skills/`)

### Gate
- [ ] ≥1 live agent in each LT role's domain (Visitor Host, Membership, Secretary-Treasurer have agents)
- [ ] Every agent has a documented scoring checklist in markdown
- [ ] Closed-loop review = standing 15-min on weekly LT meeting
- [ ] At least 4 weeks of agent output history in Supabase for audit

**Deliverable:** 6+ live agents + chapter Skills Library v1.

---

## Phase 4 — SCALE (Week 11+)

**Goal:** Replace LT manual reporting with an Intelligence Layer. Track chapter performance by leverage, not effort.

### Intelligence layer (replaces LT busywork)
- **Daily 8am brief** to LT WhatsApp/email: yesterday's referrals, today's 1-2-1s, this week's visitors, members at risk
- **Weekly chapter health dashboard** — President sees exceptions only; auto-summary of attendance %, PALMS, traffic lights
- **Meeting minutes → tasks pipeline:** Zoom recording → transcript → action items → assigned in `tracker.html`
- Recurring member questions ("when's the next visitor day?", "what's the dress code?") → routed to Business Brain → LT only handles novel ones

### Chapter-specific token-max metrics
- **Chapter AI Leverage Ratio** = tasks completed per week / hours of LT input
  - Quarterly target: 2× → 5× → 10×
- **LT Time Saved per Week** = before-vs-after stopwatch on the 10 audited workflows
- **Conversion ratio improvement** = visitors → returning visitors → applications → inducted members (track each gate, attribute lift to specific agents)
- **PALMS lift per member** = average score improvement since AI agents went live

### Continuous expansion
- Re-run Learn → Wire → Automate on the next 10 BNI workflows: testimonials capture, Power-Team meetings, mentor matching, induction-speech drafting, anniversary tracking, etc.
- Build out the `prompt_library` — every refined prompt is reusable across BNI chapters using bni121
- Annual LT rotation handover = export Skills Library + Business Brain → next LT inherits everything

### Gate
- [ ] Chapter AI Leverage Ratio tracked and improving QoQ
- [ ] Daily intelligence brief auto-sent and reviewed by LT
- [ ] Skills Library has ≥20 reusable prompts across all 6+ agents

---

## Governance & Change Management (BNI specifics)

### Roles
- **AI Ops Lead** = the Champion identified in Step 0 (typically Education Coordinator). Owns the Business Brain, Skills Library, and quality scores.
- **Human-in-loop reviewer per agent type:**
  - Visitor outputs → Visitor Host
  - Referral nudges → giver and receiver members
  - PALMS / health flags → Membership Coordinator
  - Public/external messages → President signs off until trust ≥ 9/10
- **LT rotation handoff:** outgoing AI Ops Lead does a 1-hour transfer with incoming, walks through Skills Library, agent log history, and prompt-library access.

### Recurring rituals
- **Weekly 15-min AI Retro** — embed inside the existing LT meeting, not a new meeting
- **Monthly prompt audit** — any prompt with < 80% approval rate gets refined or retired
- **Quarterly 90-day review** with the chapter at large — share Leverage Ratio + time saved (members will renew faster when they see numbers)

### Data privacy & safety (HARD rules — BNI is high-trust)
- **Member contact data classification:** internal-only by default; never paste into external AI APIs without an approved tool list
- **Visitor data:** treat as "lead data under DPA" — never share across chapters without consent
- **Referral content:** reviewed by giver before any agent-drafted outreach is sent on their behalf
- **Recordings (Zoom):** transcripts stay in Supabase; no third-party speech APIs without LT approval
- **Approved AI tool list** maintained in Supabase `approved_tools` — adding a tool requires LT vote

---

## Slash command form

Drop these into `~/.claude/commands/` for one-line invocation. Pattern stolen from harvested `Custom Slash Command — Encode Multi-Step Protocols`.

```markdown
# ~/.claude/commands/bni-discover.md

We are kicking off a Be AI-First engagement for chapter: **$ARGUMENTS**

Run Step 0 (BNI version). Output ONLY:

1. Chapter Readiness Scorecard template (markdown)
2. Tool inventory CSV (columns: tool, monthly_cost, active_users, ai_ready, status)
3. LT AI literacy scoring sheet (rows: President, VP, Secretary-Treasurer, Membership, Visitor Host, Education, Mentor)
4. AI Champion shortlist (criteria: weekly cadence, curious, owns data already)
5. Top-5 chapter pain-points capture form

Do NOT propose agents yet. Do NOT design Supabase schema yet. Wait for the LT to fill the templates.

Start now.
```

```markdown
# ~/.claude/commands/bni-wire.md

We are starting Phase 2 (WIRE) for BNI chapter: **$ARGUMENTS**

Pre-condition: confirm Phase 1 cleared (Capability Map signed by President). If not, stop and tell user to run /bni-learn first.

Then propose, in this order:
1. SOP markdown migration list (which BNI SOPs, which order)
2. Chapter Context File draft (1–2 pages)
3. bni121 tenant deployment plan (Supabase project, RLS policies, seed data)
4. The 3 live data sources to connect first (default: Supabase members + Google Calendar + Zoom)

When done, say: "Phase 2 plan complete — awaiting LT sign-off."
```

```markdown
# ~/.claude/commands/bni-agent.md

Build a new BNI agent for chapter: **$ARGUMENTS**

Follow the closed-loop rules:
1. State the agent's job in one sentence.
2. List its data inputs (Supabase tables / Google Calendar / Zoom transcripts).
3. Define the scoring checklist (4–6 binary criteria).
4. Define the human-in-loop reviewer (which LT role).
5. Define the failure mode (what counts as score < threshold → loop back).
6. Implement the agent (Python worker pattern: see drip_worker.py / gcal_worker.py).
7. Add a DATA SOURCE traceability comment.

Do NOT ship without the scoring checklist.
```

Add similar `/bni-learn`, `/bni-automate`, `/bni-scale`, `/bni-review` commands as the chapter scales.

---

## Reference implementation — the bni121 codebase

| Need | File |
|------|------|
| Multi-tenant Supabase config | `1backup/BNI 121/supabase-config.js` |
| Drip / follow-up worker | `1backup/BNI 121/drip_worker.py` + `install-drip-worker.sh` |
| Google Calendar sync | `1backup/BNI 121/gcal_worker.py`, `gcal_auth.py`, `add-gcal-event-id-column.sql` |
| Zoom integration | `1backup/BNI 121/zoom_webhook.py`, `install-zoom-webhook.sh` |
| GitHub webhook (LT issue tracking) | `1backup/BNI 121/github_webhook.py` |
| Member seeding | `1backup/BNI 121/seed_bm_members_apr2026.sql`, `seed_missing_team_members.sql` |
| Dedupe contacts | `1backup/BNI 121/dedupe_contacts.sql` |
| Migration runner | `1backup/BNI 121/migrations_apply.sql` |
| Templates / drips UI | `templates.html`, `followup.html` |
| Member dashboard | `dashboard.html`, `tracker.html` |
| Public scheduler | `scheduler.html` (Google Calendar embed) |

**PWA install** — `manifest.json` + `sw.js` already wired; chapter members can add to home screen.

---

## Engagement packages (chapter pricing)

| Package | Weeks | Deliverable | Best for |
|---------|-------|-------------|----------|
| Chapter Discovery Sprint | Week 0 | Readiness Scorecard | LT considering AI adoption |
| Learn + Wire Sprint | 1–5 | bni121 tenant live with real data | New chapter or LT rotation |
| Automate Sprint | 6–10 | 6+ agents in production | Chapters serious about PALMS lift |
| Chapter Scale Retainer | 11+ | Daily briefs + Health Dashboard | Region-leader chapters |

DrmHope's "Enterprise software. Shipped in 6 weeks." promise applies — fixed scope, fixed timeline.

---

## When to invoke this skill

- Onboarding a new BNI chapter to bni121
- Starting an AI-First engagement with an existing chapter
- LT rotation: incoming team needs to inherit prompt library + agent ownership
- Quoting a BNI region (multiple chapters at once) — same skill, applied per chapter
- Auditing an in-flight chapter rollout — walk the test harness for the current phase

## When NOT to invoke

- Generic non-BNI client engagement → use [`be-ai-first-framework`](../be-ai-first-framework/SKILL.md)
- One-off bni121 platform bug → use the harvested `bni-crm-build-pitfalls` instead
- LT just wants ChatGPT licences without the framework → say no; framework is what makes it stick

---

## Why it works for BNI specifically

| Without protocol | With protocol |
|-----------------|---------------|
| Visitors lost in WhatsApp threads | Visitor Follow-up Agent drafts within 24h, LT approves |
| 1-2-1s tracked in DMs, never logged | Scheduler Agent logs to Supabase, attaches to PALMS |
| Annual LT rotation = full reset | Skills Library + Business Brain inherited |
| PALMS scramble at quarter-end | Auto-aggregated weekly, traffic-lights surfaced |
| "AI is helping somehow" | Chapter Leverage Ratio + Time-Saved tracked QoQ |

---

## Source documents

- Client-facing PDF (12 pages): `~/Desktop/HopeTech_AI_First_Framework.pdf`
- PDF generator (re-runnable): `1backup/BNI 121/build_aifirst_guide.py`
- Generic framework skill: `.claude/skills/be-ai-first-framework/SKILL.md`
- Build-time gotchas: `.claude/skills/harvested/bni-crm-build-pitfalls/SKILL.md`
- Original framework reference: `~/Downloads/be_ai_first_guide.pdf`
- Live deployment: `https://bni121.vercel.app`
