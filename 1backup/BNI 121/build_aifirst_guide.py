"""Build the HopeTech-branded "Be AI-First" framework PDF.

Outputs to ~/Desktop/HopeTech_AI_First_Framework.pdf by default. Override via
   python build_aifirst_guide.py <output.pdf>

Content is anchored to HopeTech's actual shipped portfolio (drmhope.com, bni121,
Linkist, ironbark, plcautopilot, zeroriskagent, moving-estimator, etc.) — every
phase carries concrete evidence from a real repo, not generic claims.
"""
import os
import sys

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# HopeTech / Bettroi palette (mirrors 1backup/BNI 121/build_portfolio_deck.py + about.html)
NAVY = colors.HexColor("#0F172A")
BLUE = colors.HexColor("#2563EB")
INDIGO = colors.HexColor("#4F46E5")
VIOLET = colors.HexColor("#7C3AED")
EMERALD = colors.HexColor("#10B981")
AMBER = colors.HexColor("#F59E0B")
PINK = colors.HexColor("#DB2777")
SLATE = colors.HexColor("#475569")
LIGHT = colors.HexColor("#F1F5F9")
RULE = colors.HexColor("#E2E8F0")

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

BRAND = "HopeTech"
DOMAIN = "hopetech.me"
FOOTER = f"{BRAND}  ·  {DOMAIN}  ·  AI-First Framework"


def make_styles():
    base = getSampleStyleSheet()
    return {
        "h1": ParagraphStyle("H1", parent=base["Heading1"], fontName="Helvetica-Bold",
                             fontSize=22, leading=26, textColor=NAVY, spaceAfter=8),
        "h2": ParagraphStyle("H2", parent=base["Heading2"], fontName="Helvetica-Bold",
                             fontSize=14, leading=18, textColor=INDIGO,
                             spaceBefore=10, spaceAfter=6),
        "h3": ParagraphStyle("H3", parent=base["Heading3"], fontName="Helvetica-Bold",
                             fontSize=11, leading=14, textColor=BLUE,
                             spaceBefore=8, spaceAfter=4),
        "body": ParagraphStyle("Body", parent=base["Normal"], fontName="Helvetica",
                               fontSize=10, leading=14, textColor=NAVY, spaceAfter=3),
        "bullet": ParagraphStyle("Bullet", parent=base["Normal"], fontName="Helvetica",
                                 fontSize=10, leading=14, textColor=NAVY,
                                 leftIndent=14, spaceAfter=2),
        "italic": ParagraphStyle("Italic", parent=base["Normal"], fontName="Helvetica-Oblique",
                                 fontSize=10, leading=14, textColor=SLATE, spaceAfter=4),
        "check": ParagraphStyle("Check", parent=base["Normal"], fontName="Helvetica",
                                fontSize=10, leading=14, textColor=NAVY,
                                leftIndent=10, spaceAfter=2),
        "tag": ParagraphStyle("Tag", parent=base["Normal"], fontName="Helvetica-Bold",
                              fontSize=9, leading=11, textColor=colors.white),
        "ev_title": ParagraphStyle("EvT", parent=base["Normal"], fontName="Helvetica-Bold",
                                   fontSize=9, leading=11, textColor=EMERALD, spaceAfter=2),
        "ev_body": ParagraphStyle("EvB", parent=base["Normal"], fontName="Helvetica",
                                  fontSize=9, leading=12, textColor=NAVY, spaceAfter=2),
    }


def page_chrome(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(INDIGO)
    canvas_obj.setLineWidth(0.6)
    canvas_obj.line(MARGIN, 14 * mm, PAGE_W - MARGIN, 14 * mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(SLATE)
    canvas_obj.drawString(MARGIN, 10 * mm, FOOTER)
    canvas_obj.drawRightString(PAGE_W - MARGIN, 10 * mm, f"Page {doc.page}")
    canvas_obj.restoreState()


def phase_band(number, title, weeks, color, S):
    cells = [[
        Paragraph(f'<font color="white" size="11"><b>STEP {number}</b></font>', S["body"]),
        Paragraph(f'<font color="white" size="16"><b>{title}</b></font>', S["body"]),
        Paragraph(f'<font color="white" size="10"><i>{weeks}</i></font>', S["body"]),
    ]]
    tbl = Table(cells, colWidths=[26 * mm, CONTENT_W - 26 * mm - 36 * mm, 36 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return tbl


def goal_line(text, S):
    return Paragraph(f'<font color="{SLATE.hexval()}"><i>Goal: {text}</i></font>', S["italic"])


def section_head(text, S):
    return Paragraph(text, S["h3"])


def bullets(items, S):
    return [Paragraph(f"• &nbsp; {it}", S["bullet"]) for it in items]


def test_harness(items, S):
    rows = [[Paragraph(f"&#9745; &nbsp; {it}", S["check"])] for it in items]
    tbl = Table(rows, colWidths=[CONTENT_W])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("LINEABOVE", (0, 0), (-1, 0), 0.6, INDIGO),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return tbl


def evidence(label, body, S):
    """Inline evidence callout: emerald-accented box with a 'From our portfolio' header."""
    inner = [
        Paragraph(f'<font color="{EMERALD.hexval()}"><b>From our portfolio &nbsp;·&nbsp; {label}</b></font>', S["ev_title"]),
        Paragraph(body, S["ev_body"]),
    ]
    tbl = Table([[inner]], colWidths=[CONTENT_W])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, EMERALD),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return tbl


def deliverable(title, body, color, S):
    inner = [
        Paragraph(f'<font color="{color.hexval()}"><b>{title}</b></font>', S["body"]),
        Paragraph(body, S["body"]),
    ]
    tbl = Table([[inner]], colWidths=[CONTENT_W])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("LINEBEFORE", (0, 0), (0, -1), 3, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return tbl


# ---- PAGES ----------------------------------------------------------------

def cover(S):
    panel = Table(
        [
            [Paragraph('<font color="white" size="34"><b>Be AI-First</b></font>', S["body"])],
            [Spacer(1, 2 * mm)],
            [Paragraph('<font color="white" size="16">Client Implementation Framework</font>', S["body"])],
            [Spacer(1, 4 * mm)],
            [Paragraph('<font color="#CBD5E1" size="11"><i>HopeTech engagement methodology  ·  Automate 60–80% of workflows</i></font>', S["body"])],
        ],
        colWidths=[CONTENT_W],
    )
    panel.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 22),
        ("RIGHTPADDING", (0, 0), (-1, -1), 22),
        ("TOPPADDING", (0, 0), (-1, -1), 28),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 28),
    ]))

    flow = [Spacer(1, 18 * mm), panel, Spacer(1, 10 * mm)]
    flow.append(Paragraph("<b>HopeTech</b>  ·  AI-native software studio", S["body"]))
    flow.append(Paragraph("Dr. BK Murali · Biji Thomas  ·  India + UAE  ·  hopetech.me", S["italic"]))
    flow.append(Spacer(1, 5 * mm))
    flow.append(Paragraph(
        "HopeTech is an AI-native software studio. We have shipped <b>247+ products since 2024</b> "
        "across healthcare, industrial automation, CRM, voice AI, and compliance — including "
        "<b>100+ enterprise AI deployments</b> through our DrmHope practice. This framework is the "
        "delivery playbook behind that portfolio: four phases, each ending in a verifiable deliverable.",
        S["body"]))
    flow.append(Spacer(1, 8 * mm))

    # Portfolio strip — six representative shipped products
    strip = [
        ("DrmHope", "drmhope.com — enterprise AI in 6 weeks", BLUE),
        ("BNI 121", "bni121.vercel.app — chapter CRM", INDIGO),
        ("Linkist NFC", "Linkist-01 — Next.js + Stripe", VIOLET),
        ("ZeroRiskAgent", "zeroriskagent.com — compliance AI", EMERALD),
        ("PLC Autopilot", "plcautopilot.com — industrial AI", AMBER),
        ("ironbark", "Claude Code skill harvester", PINK),
    ]
    cells = [[
        Table(
            [[Paragraph(f'<font color="white" size="9"><b>{name}</b></font>', S["tag"])],
             [Paragraph(f'<font color="white" size="7">{caption}</font>', S["tag"])]],
            colWidths=[(CONTENT_W - 10) / 6],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), c),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]),
        )
        for (name, caption, c) in strip
    ]]
    flow.append(Table(cells, colWidths=[CONTENT_W / 6] * 6,
                      style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 1),
                                        ("RIGHTPADDING", (0, 0), (-1, -1), 1)])))

    flow.append(Spacer(1, 8 * mm))
    pillars = [
        ("Medical-grade rigour", EMERALD),
        ("Shipped in 6 weeks", BLUE),
        ("Doctor-led, not VC-led", INDIGO),
        ("Continuous deploy on day one", VIOLET),
    ]
    cells = [[
        Table([[Paragraph(f'<font color="white" size="9"><b>{label}</b></font>', S["tag"])]],
              colWidths=[(CONTENT_W - 18) / 4],
              style=TableStyle([
                  ("BACKGROUND", (0, 0), (-1, -1), c),
                  ("LEFTPADDING", (0, 0), (-1, -1), 8),
                  ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                  ("TOPPADDING", (0, 0), (-1, -1), 8),
                  ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
              ]))
        for (label, c) in pillars
    ]]
    flow.append(Table(cells, colWidths=[(CONTENT_W) / 4] * 4,
                      style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 2),
                                        ("RIGHTPADDING", (0, 0), (-1, -1), 2)])))
    flow.append(Spacer(1, 8 * mm))
    flow.append(Paragraph(
        f'<font color="{SLATE.hexval()}"><b>Ready to begin?</b> &nbsp; Book a 90-minute Discovery Session at '
        f'<font color="{BLUE.hexval()}">hopetech.me/contact</font></font>', S["body"]))
    flow.append(PageBreak())
    return flow


def at_a_glance(S):
    rows = [
        ["1  LEARN", "Weeks 1–2", "Build conviction. Use AI daily. Map capabilities.", BLUE],
        ["2  WIRE", "Weeks 3–5", "Structure company knowledge. Connect live data.", INDIGO],
        ["3  AUTOMATE", "Weeks 6–10", "Deploy agents per department. Implement closed loops.", VIOLET],
        ["4  SCALE", "Week 11+", "Token max. Multiply output. Replace headcount with leverage.", EMERALD],
    ]
    data = [[Paragraph(f'<font color="white"><b>{r[0]}</b></font>', S["body"]),
             Paragraph(f'<i>{r[1]}</i>', S["body"]),
             Paragraph(r[2], S["body"])] for r in rows]
    tbl = Table(data, colWidths=[36 * mm, 30 * mm, CONTENT_W - 66 * mm])
    style = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
    ]
    for i, r in enumerate(rows):
        style.append(("BACKGROUND", (0, i), (0, i), r[3]))
        style.append(("BACKGROUND", (1, i), (-1, i), LIGHT))
    tbl.setStyle(TableStyle(style))

    flow = [Paragraph("Framework at a Glance", S["h1"]),
            Paragraph("Four phases, each ending in a verifiable deliverable — and each backed by a real HopeTech project.", S["italic"]),
            Spacer(1, 6 * mm), tbl, Spacer(1, 8 * mm)]
    flow.append(Paragraph("How this document is organised", S["h2"]))
    flow.append(Paragraph(
        "Part A is the framework — Step 0 (discovery) plus the four phases plus a governance section. "
        "Each phase carries an inline <b>evidence box</b> citing a real shipped HopeTech project, so you "
        "can verify our claims by visiting the live URL.", S["body"]))
    flow.append(Paragraph(
        "Part B is HopeTech's delivery model: engagement packages anchored to our DrmHope &lsquo;6-week ship&rsquo; "
        "promise, the production stack we standardise on, and a portfolio gallery of representative work.",
        S["body"]))
    flow.append(PageBreak())
    return flow


def step_0(S):
    flow = [phase_band("0", "PRE-ENGAGEMENT DISCOVERY", "Before Day 1", SLATE, S),
            Spacer(1, 4 * mm),
            goal_line("Assess client readiness and map their current state.", S),
            section_head("Tools &amp; Workflow Audit", S)]
    flow += bullets([
        "List every tool in use: CRM, email, project management, finance, HR, comms",
        "Document monthly cost and active users per tool",
        "Rate each tool: is it AI-ready (has an API or integration layer)?",
        "Flag tools that are redundant, under-used, or blocking automation",
    ], S)
    flow.append(section_head("Workflow Mapping", S))
    flow += bullets([
        "List the top 5 workflows by volume (tasks done most often)",
        "List the top 5 workflows by time cost (tasks that eat the most hours)",
        "For each workflow, mark: rule-based (automatable) vs. judgement-required (human-in-loop)",
        "Identify where data lives for each workflow (spreadsheet, email, CRM, memory)",
    ], S)
    flow.append(section_head("Team Readiness", S))
    flow += bullets([
        "Rate AI literacy per department (0 = never used AI, 5 = uses AI daily)",
        "Identify 1–2 natural &lsquo;AI Champions&rsquo; per team — curious, not necessarily technical",
        "Note any cultural resistance or prior bad experiences with automation",
    ], S)
    flow.append(Spacer(1, 4 * mm))
    flow.append(test_harness([
        "You have a complete tool inventory with API/integration status",
        "Top 10 workflows are documented with time-cost estimates",
        "At least one AI Champion is identified per department",
    ], S))
    flow.append(Spacer(1, 3 * mm))
    flow.append(evidence(
        "DrmHope discovery template",
        "Our DrmHope practice has run this exact discovery on 100+ enterprise engagements before "
        "shipping software in 6 weeks. The Capability &amp; Readiness Report is a HopeTech deliverable, "
        "not a slide. See drmhope.com.",
        S))
    flow.append(PageBreak())
    return flow


def step_1(S):
    flow = [phase_band("1", "LEARN", "Weeks 1–2", BLUE, S),
            Spacer(1, 4 * mm),
            goal_line("Build personal conviction in AI tools before designing any system.", S),
            section_head("Daily Practice (Champions)", S)]
    flow += bullets([
        "Each AI Champion: 1-hour daily hands-on session with Claude.ai, Claude Code, or equivalent",
        "Use the tool on REAL work tasks — do not use demo or toy examples",
        "Document 3 &lsquo;aha moments&rsquo; per week: tasks where AI saved 30+ minutes",
        "Screenshot or record examples to share with the team",
    ], S)
    flow.append(section_head("Team Share-Back (Weekly)", S))
    flow += bullets([
        "30-minute cross-department meeting: each champion shares one discovery",
        "Consolidate findings into a shared &lsquo;What AI Can Do&rsquo; doc",
        "Flag 3 processes per department that AI could handle immediately",
    ], S)
    flow.append(section_head("Deliverable: Capability Map", S))
    flow += bullets([
        "A two-column document: &lsquo;AI handles this well&rsquo; vs. &lsquo;AI needs a human here&rsquo;",
        "Include realistic time-saving estimates per task type",
        "Use this map to prioritise the WIRE and AUTOMATE phases",
    ], S)
    flow.append(Spacer(1, 4 * mm))
    flow.append(test_harness([
        "Every AI Champion has completed 10+ hours of hands-on sessions",
        "Capability Map document is written and reviewed by leadership",
        "At least 10 real tasks have been tested with AI tools",
    ], S))
    flow.append(Spacer(1, 3 * mm))
    flow.append(evidence(
        "ironbark — our self-improving learning loop",
        "We don&rsquo;t just teach AI fluency — we instrument it. <b>ironbark</b> "
        "(github.com/chatgptnotes/ironbark) is HopeTech&rsquo;s open-source loop that harvests reusable "
        "skills from every Claude Code session and shares them across our engagements. Your Champions "
        "graduate with a real skills library, not just notes.",
        S))
    flow.append(PageBreak())
    return flow


def step_2(S):
    flow = [phase_band("2", "WIRE", "Weeks 3–5", INDIGO, S),
            Spacer(1, 4 * mm),
            goal_line("Build the Business Brain — all company knowledge in AI-legible format.", S),
            section_head("Knowledge Structuring", S)]
    flow += bullets([
        "Convert all SOPs, process guides, and onboarding docs to markdown or Notion pages",
        "Document pricing — tiers, discounts, exceptions — in a single structured file",
        "Map org chart: name, role, responsibilities, tools used, decision authority",
        "Document top 10 recurring client/customer questions with standard answers",
        "Create a &lsquo;Company Context File&rsquo;: 1–2 page brief that AI reads before every task",
    ], S)
    flow.append(section_head("Live Data Connections", S))
    flow += bullets([
        "Connect CRM (HubSpot / Zoho / Salesforce) to AI layer via API, Zapier, or Make",
        "Pipe Slack / Teams key channels into a summarisation workflow",
        "Set up a shared cloud folder (Google Drive / SharePoint) that AI agents can read",
        "Establish one &lsquo;single source of truth&rsquo; per data type (one pricing doc, one client list, etc.)",
        "Document each connection: what data flows, update frequency, access credentials location",
    ], S)
    flow.append(section_head("Data Hygiene Rules", S))
    flow += bullets([
        "Archive or delete outdated documents — AI will use them if they exist",
        "Agree on a naming convention for all files going forward",
        "Tag documents with department and last-reviewed date",
    ], S)
    flow.append(Spacer(1, 4 * mm))
    flow.append(test_harness([
        "Company Context File is written and approved by leadership",
        "At least 3 live data sources are connected and tested",
        "All SOPs are in markdown / structured format — no Word docs or PDFs as primary source",
    ], S))
    flow.append(Spacer(1, 3 * mm))
    flow.append(evidence(
        "BNI 121 — multi-tenant chapter CRM",
        "<b>bni121.vercel.app</b> is a HopeTech-built business-networking ops platform: Supabase "
        "(Postgres + Auth + Storage), Python webhook workers for Zoom / GitHub / Google Calendar, "
        "and a markdown-first SOP layer. The same wiring pattern lifts a manual chapter into an "
        "AI-readable Business Brain in days, not months.",
        S))
    flow.append(PageBreak())
    return flow


def step_3(S):
    flow = [phase_band("3", "AUTOMATE", "Weeks 6–10", VIOLET, S),
            Spacer(1, 4 * mm),
            goal_line("Deploy AI agents per department with closed-loop feedback.", S),
            section_head("Marketing", S)]
    flow += bullets([
        "Content brief → first draft agent (blog, LinkedIn post, email campaign)",
        "Competitor monitoring agent — weekly digest of competitor moves",
        "Lead magnet generation agent (guides, checklists, landing page copy)",
        "Social media scheduling agent — drafts + schedules from a content calendar",
    ], S)
    flow.append(section_head("Sales", S))
    flow += bullets([
        "Lead research agent — enriches new contacts before first call",
        "Proposal drafting agent — pulls from pricing doc + client context file",
        "Follow-up sequence generator — personalised emails per prospect",
        "Meeting summary agent — notes + action items from call transcript",
    ], S)
    flow.append(section_head("Delivery / Operations", S))
    flow += bullets([
        "Project status summariser — reads task manager, generates client update email",
        "SOP execution agent — step-by-step runner for repeatable delivery tasks",
        "Client onboarding checklist agent — ensures nothing is missed",
        "Scope creep detector — flags tasks outside original brief for review",
    ], S)
    flow.append(section_head("Finance / Admin / Compliance", S))
    flow += bullets([
        "Invoice generation agent — pulls data from project records",
        "Expense categorisation agent — sorts receipts into correct budget lines",
        "Weekly P&amp;L summary agent — aggregates figures into an executive brief",
        "Contract renewal &amp; risk-flag agent — flags contracts and compliance gaps in 30/60/90 days",
    ], S)
    flow.append(section_head("Closed-Loop Implementation (All Agents)", S))
    flow += bullets([
        "Every agent output passes through a scoring checklist before delivery or action",
        "Agent logs each iteration: what changed and why",
        "Set a minimum quality threshold per agent — output below threshold loops back for revision",
        "Weekly review meeting: which agents improved, which need prompt refinement",
        "Store all revised prompts in the internal AI Skills Library for reuse",
    ], S)
    flow.append(Spacer(1, 3 * mm))
    flow.append(test_harness([
        "At least one agent is live and running in every department",
        "Every agent has a documented test harness / scoring checklist",
        "Closed-loop review meeting is on the calendar and recurring",
    ], S))
    flow.append(Spacer(1, 3 * mm))
    flow.append(evidence(
        "Live agents we&rsquo;ve already shipped",
        "<b>zeroriskagent.com</b> — compliance &amp; risk agent.&nbsp;&nbsp; "
        "<b>aiinmail.com</b> — Python email-AI pipeline.&nbsp;&nbsp; "
        "<b>moving-estimator</b> — vision agent that scans a room and estimates truck/container "
        "size.&nbsp;&nbsp; <b>jotform-dashboard</b> — JotForm approval-tracker agent. Each ships "
        "with a scoring checklist baked in.",
        S))
    flow.append(PageBreak())
    return flow


def step_4(S):
    flow = [phase_band("4", "SCALE", "Week 11+", EMERALD, S),
            Spacer(1, 4 * mm),
            goal_line("Token maxing — multiply output without adding headcount.", S),
            section_head("Intelligence Layer (Replace Middle Management Reporting)", S)]
    flow += bullets([
        "Replace daily stand-up emails with an AI-generated daily briefing (auto-sent 8am)",
        "Replace weekly reporting with an AI dashboard summary — human reviews exceptions only",
        "Route recurring questions to the Business Brain before escalating to a human",
        "Automate meeting notes → action items → task creation pipeline",
    ], S)
    flow.append(section_head("Token-Max Economics", S))
    flow += bullets([
        "Calculate AI Leverage Ratio: tasks completed per week / hours of human input",
        "Set a quarterly target for leverage ratio improvement (e.g., 2x → 5x → 10x)",
        "Track cost-per-task: (AI subscription cost + human review time) / tasks completed",
        "Reinvest time saved into higher-value work: new clients, new products, strategic projects",
    ], S)
    flow.append(section_head("Continuous Expansion", S))
    flow += bullets([
        "Run the Learn → Wire → Automate loop again on the next 10 processes",
        "Build an internal AI Skills Library: reusable prompts and agents accessible to all staff",
        "Include AI fluency in every future job description and interview process",
        "Hire for judgment, not execution — AI handles execution, humans handle direction",
        "Quarterly audit: retire agents that are no longer cost-effective; upgrade those that are",
    ], S)
    flow.append(Spacer(1, 3 * mm))
    flow.append(test_harness([
        "AI Leverage Ratio is being tracked and improving quarter over quarter",
        "Intelligence layer dashboard is live and reviewed daily by leadership",
        "AI Skills Library has at least 20 reusable prompts / agent templates",
    ], S))
    flow.append(Spacer(1, 3 * mm))
    flow.append(evidence(
        "claude-code-deepseek-backend — token-max in practice",
        "We open-sourced our Claude-Code-on-DeepSeek backend so engineering hours convert into more "
        "tokens per dollar. Same client agents, fraction of the inference cost. "
        "github.com/chatgptnotes/claude-code-deepseek-backend.",
        S))
    flow.append(PageBreak())
    return flow


def governance(S):
    flow = [Paragraph("Governance &amp; Change Management", S["h1"]),
            Paragraph("The framework only holds together when ownership and rituals are explicit.", S["italic"]),
            Spacer(1, 4 * mm),
            section_head("Roles", S)]
    flow += bullets([
        "Appoint an AI Ops Lead — owns the Business Brain, agent library, and quality standards",
        "Every department retains a Human-in-Loop reviewer for customer-facing outputs",
        "Leadership reviews AI Leverage Ratio metrics monthly",
    ], S)
    flow.append(section_head("Recurring Rituals", S))
    flow += bullets([
        "Weekly 15-min AI Retro: what broke, what improved, what to automate next",
        "Monthly prompt audit: review and refine all active agent prompts",
        "Quarterly 90-day review: measure before/after on time-per-task, error rate, satisfaction",
    ], S)
    flow.append(section_head("Data Privacy &amp; Safety Rules", S))
    flow += bullets([
        "Define which data types AI can access (public, internal, confidential, restricted)",
        "Never feed personal client financial or PHI data into external AI APIs without DPA in place",
        "All customer-facing AI outputs reviewed by a human until trust level is 9/10+",
        "Document which AI tools are approved; require IT/ops sign-off before adding new ones",
    ], S)
    flow.append(Spacer(1, 4 * mm))
    flow.append(evidence(
        "Clinical-grade governance, by default",
        "HopeTech leadership includes a practising surgeon (Dr. BK Murali). Our healthcare projects — "
        "<b>hopehospital.com</b>, <b>vivahgmc.com</b>, <b>Digihealthtwin</b>, <b>HealthPlus</b>, "
        "<b>nabh.online</b> — operate under the same governance pattern this section describes. "
        "PHI &amp; PII gates aren&rsquo;t a checkbox for us; they&rsquo;re how we ship.",
        S))
    flow.append(Spacer(1, 6 * mm))
    cta = Table(
        [[Paragraph('<font color="white" size="13"><b>Ready to begin? Start with Step 0: book a 90-minute Discovery Session.</b></font>', S["body"])]],
        colWidths=[CONTENT_W],
    )
    cta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BLUE),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    flow.append(cta)
    flow.append(PageBreak())
    return flow


# ---- PART B: How HopeTech Delivers This ------------------------------------

def part_b_intro(S):
    panel = Table(
        [[Paragraph('<font color="white" size="11"><b>PART B</b></font>', S["body"])],
         [Paragraph('<font color="white" size="22"><b>How HopeTech Delivers This</b></font>', S["body"])],
         [Spacer(1, 2 * mm)],
         [Paragraph('<font color="#CBD5E1" size="11"><i>Engagement packages, production stack, and a portfolio you can verify today.</i></font>', S["body"])]],
        colWidths=[CONTENT_W],
    )
    panel.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 22),
        ("RIGHTPADDING", (0, 0), (-1, -1), 22),
        ("TOPPADDING", (0, 0), (-1, -1), 22),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 22),
    ]))
    return [Spacer(1, 4 * mm), panel, Spacer(1, 6 * mm)]


def packages(S):
    flow = part_b_intro(S)
    flow.append(Paragraph("Engagement Packages", S["h1"]))
    flow.append(Paragraph(
        "DrmHope&rsquo;s public promise is &lsquo;Enterprise software. Shipped in 6 weeks.&rsquo; The packages below "
        "are how we keep that promise — fixed scope, fixed timeline, no surprises. Pricing is per "
        "engagement; indicative ranges are agreed in the Discovery Session.", S["italic"]))
    flow.append(Spacer(1, 4 * mm))

    items = [
        ("Discovery Sprint  ·  Week 0", SLATE,
         "90-minute kickoff + 5 working days. Tool inventory, top-10 workflow map, AI literacy scoring, "
         "AI Champion shortlist. Deliverable: signed Capability &amp; Readiness Report. Pricing: <i>on request</i>."),
        ("Learn + Wire Sprint  ·  Weeks 1–5", BLUE,
         "Hands-on coaching for AI Champions, Capability Map, Company Context File, first 3 live data "
         "connections (Supabase / HubSpot / Slack pattern proven on bni121), SOP markdown migration. "
         "Deliverable: a working Business Brain. Pricing: <i>fixed-scope quote</i>."),
        ("Automate Sprint  ·  Weeks 6–10", VIOLET,
         "One agent per department shipped to production with scoring checklists and closed-loop "
         "review. HopeTech engineers pair with internal Champions. Deliverable: 4–6 live agents "
         "(reference: zeroriskagent, aiinmail, moving-estimator, jotform-dashboard) + AI Skills "
         "Library v1. Pricing: <i>per-agent retainer</i>."),
        ("Scale Retainer  ·  Week 11+", EMERALD,
         "Monthly retainer covering intelligence-layer dashboards, AI Leverage Ratio tracking, "
         "quarterly agent audits, and continuous expansion onto the next 10 processes. Token-max "
         "economics powered by our claude-code-deepseek-backend. Pricing: <i>monthly retainer</i>."),
    ]
    for title, color, body in items:
        flow.append(deliverable(title, body, color, S))
        flow.append(Spacer(1, 4 * mm))

    flow.append(PageBreak())
    return flow


def what_hopetech_brings(S):
    flow = [Paragraph("What HopeTech Brings to Each Phase", S["h1"]),
            Paragraph("Concrete deliverables, anchored to the production stack we run today.", S["italic"]),
            Spacer(1, 4 * mm)]

    phase_blocks = [
        ("LEARN · Weeks 1–2", BLUE, [
            "Live coaching on Claude.ai and Claude Code for nominated AI Champions",
            "Curated &lsquo;real-task&rsquo; prompt library — sector-specific sets seeded from our 247+ shipped products",
            "<b>ironbark</b> deployed in your tenant: every Champion session harvests reusable skills automatically",
        ]),
        ("WIRE · Weeks 3–5", INDIGO, [
            "Markdown migration of SOPs, pricing, org chart — HopeTech engineers handle the conversion",
            "Live integrations: Supabase / HubSpot / Zoho / Slack / Drive / SharePoint via API, Zapier, Make, or n8n (the bni121 wiring pattern)",
            "Company Context File drafted with leadership, version-controlled in your repo or Notion",
        ]),
        ("AUTOMATE · Weeks 6–10", VIOLET, [
            "Production-grade agents per department, deployed on continuous-deploy pipelines (Vercel / our hosting)",
            "Scoring checklists and human-in-loop review gates wired into each agent",
            "AI Skills Library v1 — prompts, sub-agents, and SOP runners, harvested by ironbark and reusable across the company",
        ]),
        ("SCALE · Week 11+", EMERALD, [
            "Daily intelligence brief auto-generated and routed (email, Slack, or dashboard)",
            "AI Leverage Ratio dashboard, refreshed weekly, reviewed by leadership monthly",
            "Token-max economics: optional migration to <b>claude-code-deepseek-backend</b> for inference cost reduction",
            "Quarterly agent audit — retire what isn&rsquo;t cost-effective, upgrade what is",
        ]),
    ]
    for title, color, items in phase_blocks:
        flow.append(Paragraph(f'<font color="{color.hexval()}"><b>{title}</b></font>', S["h2"]))
        flow += bullets(items, S)

    flow.append(Spacer(1, 4 * mm))
    flow.append(Paragraph("Production stack we standardise on", S["h2"]))
    flow += bullets([
        "<b>LLM platform:</b> Claude (Sonnet / Opus / Haiku) for reasoning, Claude Code for engineering",
        "<b>Cost optimisation:</b> claude-code-deepseek-backend (open source) when inference budget matters",
        "<b>Skill harvesting:</b> ironbark — our self-improving learning loop, open source",
        "<b>Frontend:</b> Next.js 15, React + TypeScript, Vite, Tailwind (Linkist, DrmHope, bni121 stack)",
        "<b>Backend:</b> Supabase (Postgres + Auth + Storage), Python workers, Node webhooks",
        "<b>Hosting:</b> Vercel for web, Hostinger for OpenClaw deployments, on-prem when regulated",
        "<b>Mobile:</b> React Native (VisionClawRN, HealthPlus-mobile-app)",
        "<b>Industrial:</b> PLC AI patterns (plcautopilot, EcoLogic-PLC-Assistant, factorypulse, autopaneldesign)",
        "<b>Healthcare:</b> clinical-grade patterns from hopehospital.com, vivahgmc.com, Digihealthtwin, nabh.online",
    ], S)
    flow.append(PageBreak())
    return flow


def portfolio_evidence(S):
    flow = [Paragraph("Portfolio Evidence", S["h1"]),
            Paragraph("A representative slice of what we&rsquo;ve already shipped — every line is a live URL or a public repo.", S["italic"]),
            Spacer(1, 4 * mm)]

    sectors = [
        ("Enterprise AI &amp; legacy modernisation", BLUE, [
            "<b>DrmHope</b> &nbsp;·&nbsp; drmhope.com &nbsp;·&nbsp; &lsquo;Enterprise software. Shipped in 6 weeks.&rsquo; 100+ enterprise AI projects",
            "<b>claude-code-deepseek-backend</b> &nbsp;·&nbsp; Run Claude Code on DeepSeek — token-max for engineering",
            "<b>ironbark</b> &nbsp;·&nbsp; Self-improving Claude Code skill harvester — our internal moat",
        ]),
        ("Healthcare &amp; clinical software", EMERALD, [
            "<b>hopehospital.com</b> &nbsp;·&nbsp; HopeTech&rsquo;s flagship medical site",
            "<b>vivahgmc.com</b> &nbsp;·&nbsp; Hospital web platform",
            "<b>Digihealthtwin</b> &nbsp;·&nbsp; Diabetes health-tracking app",
            "<b>HealthPlus-mobile-app</b> + <b>healthplus-privacy</b> &nbsp;·&nbsp; Mobile health stack",
            "<b>nabh.online</b> &nbsp;·&nbsp; NABH (Indian hospital accreditation) compliance tool",
        ]),
        ("CRM, sales &amp; ops", INDIGO, [
            "<b>BNI 121</b> &nbsp;·&nbsp; bni121.vercel.app &nbsp;·&nbsp; Multi-tenant chapter CRM (Supabase + Python workers)",
            "<b>Linkist NFC</b> &nbsp;·&nbsp; Linkist-01 &nbsp;·&nbsp; Next.js 15 + Stripe NFC business-card e-commerce",
            "<b>adamrit</b>, <b>crm-_in_labs</b> &nbsp;·&nbsp; CRM tooling for niche verticals",
            "<b>jotform-dashboard</b> &nbsp;·&nbsp; External JotForm Workflow approval tracker",
        ]),
        ("Industrial automation &amp; engineering AI", AMBER, [
            "<b>plcautopilot.com</b> + <b>plcautopilot-nextjs_with_AI</b> &nbsp;·&nbsp; PLC autopilot",
            "<b>EcoLogic-PLC-Assistant</b> &nbsp;·&nbsp; PLC AI assistant",
            "<b>autopaneldesign.com</b> &nbsp;·&nbsp; Electrical-panel design AI",
            "<b>factorypulse.site</b> &nbsp;·&nbsp; Factory monitoring (C#)",
        ]),
        ("Compliance, risk &amp; agents", VIOLET, [
            "<b>zeroriskagent.com</b> &nbsp;·&nbsp; Compliance / risk agent",
            "<b>aiinmail.com</b> &nbsp;·&nbsp; Python email-AI pipeline",
            "<b>moving-estimator</b> &nbsp;·&nbsp; Video scans a room → estimates truck/container size",
            "<b>VisionClawRN</b> &nbsp;·&nbsp; React Native vision/OCR app",
            "<b>openclaw-for-hostinger</b> &nbsp;·&nbsp; OpenClaw deployment recipe",
        ]),
    ]
    for title, color, items in sectors:
        flow.append(Paragraph(f'<font color="{color.hexval()}"><b>{title}</b></font>', S["h2"]))
        flow += bullets(items, S)

    flow.append(Spacer(1, 4 * mm))
    flow.append(Paragraph(
        f'<font color="{SLATE.hexval()}"><i>Source of truth: github.com/chatgptnotes — every URL on this page maps '
        f'to a public repo or a live deployment.</i></font>', S["body"]))
    flow.append(PageBreak())
    return flow


def apply_to_your_business(S):
    flow = [Paragraph("Apply this to your business", S["h1"]),
            Paragraph("What happens after you book the Discovery Session.", S["italic"]),
            Spacer(1, 4 * mm)]

    items = [
        ("Day 0  ·  Discovery call", BLUE,
         "90 minutes with HopeTech leadership. We walk your top 10 workflows, score AI literacy, and "
         "identify Champions. You leave with a one-page Capability &amp; Readiness Report."),
        ("Day 1–5  ·  Tool &amp; workflow audit", INDIGO,
         "We map every tool in your stack, flag what&rsquo;s redundant, and score AI-readiness. Output: a "
         "prioritised &lsquo;automate next&rsquo; list with time-cost estimates per workflow."),
        ("Week 1  ·  Sprint kickoff", VIOLET,
         "Fixed-scope statement of work. Champions begin daily Claude.ai / Claude Code practice. ironbark "
         "deployed to capture every reusable skill from day one."),
        ("Week 6  ·  First agents in production", EMERALD,
         "At least one agent per department shipped — wired with scoring checklists and human-in-loop "
         "gates. The DrmHope &lsquo;6-week ship&rsquo; promise applies."),
        ("Week 11+  ·  Scale retainer", AMBER,
         "Daily intelligence briefs live. AI Leverage Ratio reviewed monthly by your leadership. "
         "Continuous expansion onto the next 10 processes."),
    ]
    for title, color, body in items:
        flow.append(deliverable(title, body, color, S))
        flow.append(Spacer(1, 3 * mm))

    flow.append(Spacer(1, 6 * mm))
    flow.append(Paragraph("Get in touch", S["h2"]))
    cta = Table(
        [[
            Paragraph('<font color="white" size="13"><b>Book your 90-minute Discovery Session.</b></font><br/><br/>'
                      '<font color="#CBD5E1" size="10">Email <b>cmd@hopehospital.com</b> &nbsp;·&nbsp; Web <b>hopetech.me/contact</b> &nbsp;·&nbsp; Portfolio <b>github.com/chatgptnotes</b></font>',
                      S["body"])
        ]],
        colWidths=[CONTENT_W],
    )
    cta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
    ]))
    flow.append(cta)
    return flow


# ---- BUILD ----------------------------------------------------------------

def build(out_path):
    S = make_styles()
    doc = BaseDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=22 * mm,
        title="Be AI-First — HopeTech Client Implementation Framework",
        author="HopeTech",
    )
    frame = Frame(MARGIN, 22 * mm, CONTENT_W, PAGE_H - MARGIN - 22 * mm,
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
                  showBoundary=0)
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_chrome)])

    story = []
    story += cover(S)
    story += at_a_glance(S)
    story += step_0(S)
    story += step_1(S)
    story += step_2(S)
    story += step_3(S)
    story += step_4(S)
    story += governance(S)
    story += packages(S)
    story += what_hopetech_brings(S)
    story += portfolio_evidence(S)
    story += apply_to_your_business(S)

    doc.build(story)


def main():
    default_out = os.path.join(os.path.expanduser("~"), "Desktop", "HopeTech_AI_First_Framework.pdf")
    out_path = sys.argv[1] if len(sys.argv) > 1 else default_out
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    build(out_path)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
