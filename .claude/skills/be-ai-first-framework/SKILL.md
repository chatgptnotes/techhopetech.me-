---
name: Be AI-First Framework — HopeTech Client Implementation Protocol
description: 4-phase mandatory sequence (Learn → Wire → Automate → Scale, plus Step 0 Discovery and Governance) for running a HopeTech AI-transformation engagement. Each phase has a target deliverable and a test-harness gate. Invoke at the start of any new client AI-first engagement, or when scoping a Discovery Sprint.
type: pattern
tags: [hopetech, drmhope, bettroi, ai-first, client-engagement, framework, automation, agents, claude, claude-code, ironbark]
---

# Be AI-First Framework — HopeTech Client Implementation Protocol

## Problem

Most "AI transformation" engagements drift. The team buys ChatGPT licences, runs a workshop, builds one demo, and stalls. Reasons we've seen across 100+ DrmHope engagements:

- **No conviction layer** — leadership signs the cheque before champions have used the tools on real work
- **No data layer** — agents are wired to PDFs, Word docs, and tribal memory instead of a structured Business Brain
- **One-off agents** — built without scoring checklists or human-in-loop gates, so they get distrusted and abandoned
- **No leverage measurement** — "AI is helping" but nobody can quantify it, so the budget gets cut at the next review

Result: a slide deck, not a shipped business transformation.

## Solution — The 4-Phase Protocol (+ Step 0 + Governance)

Force this exact phase order. **Never skip. Never reorder.** Each phase ends in a verifiable deliverable and a test-harness gate; you must clear the gate before starting the next phase.

| Phase | Weeks | Goal | Gate |
|-------|-------|------|------|
| 0  PRE-ENGAGEMENT | Before Day 1 | Assess readiness | Tool inventory, top-10 workflow map, AI Champion list |
| 1  LEARN | 1–2 | Build conviction | Capability Map signed by leadership, 10+ Champion hours |
| 2  WIRE | 3–5 | Build the Business Brain | Company Context File + 3 live data sources |
| 3  AUTOMATE | 6–10 | Ship agents per department | ≥1 live agent per dept, all with scoring checklists |
| 4  SCALE | 11+ | Token-max economics | AI Leverage Ratio tracked, Skills Library ≥20 prompts |

---

## Step 0 — Pre-Engagement Discovery (Before Day 1)

**Goal:** Assess client readiness and map current state.

### Tasks
- List every tool in use (CRM, email, PM, finance, HR, comms) with monthly cost + active users
- Rate each tool: AI-ready (has API/integration layer)? Redundant? Blocking?
- List top 5 workflows by **volume** and top 5 by **time-cost**
- For each workflow: rule-based vs. judgement-required; where the data lives
- Rate AI literacy per dept (0–5); identify 1–2 AI Champions per team

### Gate (must pass before Phase 1)
- [ ] Complete tool inventory with API/integration status
- [ ] Top 10 workflows documented with time-cost estimates
- [ ] At least one AI Champion identified per department

**Deliverable:** signed *Capability & Readiness Report* (1–2 pages).

---

## Phase 1 — LEARN (Weeks 1–2)

**Goal:** Build personal conviction in AI tools BEFORE designing any system.

### Tasks
- Each Champion: 1-hour daily hands-on with Claude.ai / Claude Code on **REAL** work — no toy examples
- Champions document 3 "aha moments" per week (tasks where AI saved 30+ minutes)
- Weekly 30-min cross-dept share-back; consolidate into a "What AI Can Do" doc
- Flag 3 processes per dept that AI could handle immediately
- Deploy `ironbark` in client tenant — every Champion session auto-harvests reusable skills

### Gate
- [ ] Every Champion has 10+ hours of hands-on
- [ ] Capability Map written and reviewed by leadership
- [ ] 10+ real tasks tested with AI

**Deliverable:** *Capability Map* — two-column doc ("AI handles this well" vs. "AI needs a human here") with realistic time-saving estimates per task type.

---

## Phase 2 — WIRE (Weeks 3–5)

**Goal:** Build the Business Brain — all company knowledge in AI-legible format.

### Tasks
- Convert SOPs, process guides, onboarding docs to **markdown** (or Notion). No Word/PDF as primary source.
- Single structured pricing file (tiers, discounts, exceptions)
- Org chart: name, role, responsibilities, tools, decision authority
- Top 10 recurring client questions with standard answers
- Write a 1–2 page **Company Context File** — AI reads this before every task
- Connect ≥3 live data sources (CRM via API/Zapier/Make/n8n; Slack/Teams summarisation; Drive/SharePoint folder)
- Establish single source of truth per data type
- Apply data hygiene: archive stale docs, agree naming convention, tag with dept + last-reviewed date

### Gate
- [ ] Company Context File written and approved
- [ ] ≥3 live data sources connected and tested
- [ ] All SOPs in markdown / structured format

**Deliverable:** A working *Business Brain* — one repo or one Notion workspace, version-controlled.

**Reference pattern:** `bni121.vercel.app` — Supabase (Postgres + Auth + Storage) + Python webhook workers for Zoom / GitHub / Google Calendar + markdown SOP layer. Re-use this wiring pattern.

---

## Phase 3 — AUTOMATE (Weeks 6–10)

**Goal:** Deploy agents per department with closed-loop feedback.

### Per-department agent menu

| Dept | Agents to ship |
|------|---------------|
| Marketing | Content brief → first draft; competitor monitor; lead-magnet generator; social scheduler |
| Sales | Lead research; proposal drafter; follow-up sequencer; meeting summariser |
| Delivery / Ops | Project status summariser; SOP runner; client onboarding checklist; scope-creep detector |
| Finance / Admin / Compliance | Invoice generator; expense categoriser; weekly P&L; contract & risk-flag agent |

### Closed-loop rules (apply to EVERY agent)
- Output passes a scoring checklist before delivery / action
- Agent logs each iteration: what changed and why
- Minimum quality threshold per agent — below threshold loops back for revision
- Weekly review: which agents improved, which need prompt refinement
- Store all revised prompts in the internal AI Skills Library (harvested by `ironbark`)

### Gate
- [ ] ≥1 live agent in every department
- [ ] Every agent has a documented scoring checklist
- [ ] Closed-loop review meeting on the recurring calendar

**Deliverable:** 4–6 live agents + AI Skills Library v1.

**Reference agents we've shipped:** `zeroriskagent.com` (compliance), `aiinmail.com` (email AI), `moving-estimator` (vision agent: room scan → container size), `jotform-dashboard` (approval tracker).

---

## Phase 4 — SCALE (Week 11+)

**Goal:** Token maxing — multiply output without adding headcount.

### Tasks
- **Intelligence Layer:** AI-generated daily briefing 8am; AI dashboard summary replaces weekly reports; route recurring questions to the Business Brain; meeting notes → action items → tasks pipeline
- **Token-Max Economics:**
  - AI Leverage Ratio = tasks completed per week / hours of human input
  - Quarterly target: 2x → 5x → 10x
  - Cost-per-task = (AI subscription + human review time) / tasks completed
  - Reinvest saved time into higher-value work
- **Continuous expansion:** Re-run Learn → Wire → Automate on the next 10 processes
- AI fluency in every future job description; hire for judgment, not execution
- Quarterly audit: retire agents that aren't cost-effective; upgrade those that are

### Gate
- [ ] AI Leverage Ratio tracked, improving QoQ
- [ ] Intelligence dashboard live, reviewed daily by leadership
- [ ] AI Skills Library has ≥20 reusable prompts / agent templates

**Optional:** migrate to `claude-code-deepseek-backend` for inference cost reduction.

---

## Governance & Change Management (continuous)

### Roles
- **AI Ops Lead** — owns the Business Brain, agent library, and quality standards
- **Human-in-Loop reviewer per dept** — for all customer-facing outputs
- Leadership reviews AI Leverage Ratio metrics monthly

### Recurring rituals
- Weekly 15-min AI Retro: what broke, what improved, what to automate next
- Monthly prompt audit
- Quarterly 90-day review: time-per-task, error rate, satisfaction

### Data privacy & safety (HARD rules)
- Define data classes AI can access: public / internal / confidential / restricted
- **Never** feed personal financial or PHI data into external AI APIs without DPA in place
- Customer-facing outputs reviewed by a human until trust ≥ 9/10
- Document approved AI tools; require IT/ops sign-off before adding new ones

---

## Slash Command Form

Encode the full protocol as a Claude Code slash command so any HopeTech engineer can trigger a phase consistently. Drop into `~/.claude/commands/aifirst-<phase>.md`:

```markdown
# ~/.claude/commands/aifirst-discover.md

We are starting a Be AI-First Discovery Sprint with client: **$ARGUMENTS**

Follow Step 0 strictly. Output ONLY:

1. Tool inventory template (CSV columns: tool, monthly_cost, active_users, ai_ready, status)
2. Workflow mapping template (CSV columns: workflow, dept, volume_per_week, hours_per_week, rule_or_judgement, data_location)
3. AI literacy scoring sheet (rows: dept, columns: 0–5)
4. AI Champion shortlist template

Do NOT propose agents yet. Do NOT design integrations yet. Wait for the user to fill in the templates.

Start now.
```

```markdown
# ~/.claude/commands/aifirst-wire.md

We are starting Phase 2 (WIRE) for: **$ARGUMENTS**

Pre-condition gate: confirm with the user that Phase 1 has cleared (Capability Map signed). If not, refuse and tell them to run /aifirst-learn first.

Then propose, in this order:
1. Markdown migration plan (which SOPs, which order)
2. Company Context File draft (1–2 pages)
3. Live data connection plan (which 3 sources, which integration tool: API, Zapier, Make, or n8n)

When done, say: "Phase 2 plan complete — awaiting client sign-off."
```

Add similar commands for `/aifirst-learn`, `/aifirst-automate`, `/aifirst-scale`. Each must include a **gate phrase** that prevents skipping ahead.

---

## Production Stack We Standardise On

| Layer | What we use | Reference repo |
|-------|-------------|----------------|
| LLM | Claude (Sonnet / Opus / Haiku); Claude Code for engineering | — |
| Cost optimisation | `claude-code-deepseek-backend` (open source) | github.com/chatgptnotes/claude-code-deepseek-backend |
| Skill harvesting | `ironbark` self-improving learning loop | github.com/chatgptnotes/ironbark |
| Frontend | Next.js 15, React + TS, Vite, Tailwind | Linkist-01, DrmHope, bni121 |
| Backend | Supabase (Postgres + Auth + Storage), Python workers, Node webhooks | bni121 |
| Hosting | Vercel; Hostinger for OpenClaw; on-prem when regulated | openclaw-for-hostinger |
| Mobile | React Native | VisionClawRN, HealthPlus-mobile-app |
| Industrial | PLC AI patterns | plcautopilot, EcoLogic-PLC-Assistant, factorypulse, autopaneldesign |
| Healthcare | Clinical-grade patterns (PHI/PII gates by default) | hopehospital, vivahgmc, Digihealthtwin, nabh.online |

---

## Portfolio Evidence (cite to client during pitch)

- **Enterprise AI:** `drmhope.com` — "Enterprise software. Shipped in 6 weeks." 100+ enterprise AI projects
- **CRM / ops:** `bni121.vercel.app` (multi-tenant chapter CRM); `Linkist-01` (Next.js 15 + Stripe NFC e-commerce)
- **Healthcare:** `hopehospital.com`, `vivahgmc.com`, `Digihealthtwin`, `HealthPlus`, `nabh.online`
- **Industrial:** `plcautopilot.com`, `EcoLogic-PLC-Assistant`, `autopaneldesign.com`, `factorypulse.site`
- **Compliance / agents:** `zeroriskagent.com`, `aiinmail.com`, `moving-estimator`, `VisionClawRN`, `jotform-dashboard`
- **Internal moats:** `ironbark`, `claude-code-deepseek-backend`

Source of truth: `github.com/chatgptnotes`.

---

## Engagement Packages (for Discovery quoting)

| Package | Weeks | Deliverable | Pricing model |
|---------|-------|-------------|---------------|
| Discovery Sprint | Week 0 | Capability & Readiness Report | On request |
| Learn + Wire Sprint | 1–5 | Working Business Brain | Fixed-scope quote |
| Automate Sprint | 6–10 | 4–6 live agents + Skills Library v1 | Per-agent retainer |
| Scale Retainer | 11+ | Intelligence layer + AI Leverage Ratio dashboard | Monthly retainer |

The DrmHope public promise applies: **fixed scope, fixed timeline, no surprises**.

---

## When to Invoke This Skill

- Starting a new client AI-transformation engagement (any sector)
- Scoping a Discovery Sprint quote
- Building a service / methodology page on `hopetech.me/services/ai-first`
- Generating the client-facing PDF leave-behind: run `python "1backup/BNI 121/build_aifirst_guide.py"` → `~/Desktop/HopeTech_AI_First_Framework.pdf`
- Auditing an in-flight engagement: walk the test harness for the current phase; if any gate fails, hold the next phase

## When NOT to Invoke

- Pure software-build engagements with no transformation scope (use a normal SOW)
- Single-agent tactical builds (use the agent-build pattern, not the full framework)
- Internal HopeTech work (this is a *client* protocol)

---

## Why It Works

| Without protocol | With protocol |
|-----------------|---------------|
| Workshop, demo, stall | Verifiable deliverable per phase |
| Champions never use it on real work | 10+ hours hands-on before any system design |
| Agents wired to PDFs and tribal memory | Markdown Business Brain + 3 live data sources |
| One-off agents that get distrusted | Scoring checklists + human-in-loop gates baked in |
| "AI is helping" — no proof | AI Leverage Ratio tracked QoQ |

---

## Source Documents

- Client-facing PDF (12 pages): `~/Desktop/HopeTech_AI_First_Framework.pdf`
- PDF generator: `1backup/BNI 121/build_aifirst_guide.py` (reportlab; re-runs idempotently)
- Original framework reference: `~/Downloads/be_ai_first_guide.pdf`
