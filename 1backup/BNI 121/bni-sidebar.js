// BNI 121 — Shared sidebar + unified theme + Lucide icon system.
// Usage: just include <script src="bni-sidebar.js"></script> on any BNI page.
//   - Injects light-themed sidebar with auto-active link
//   - Removes legacy dark <aside> and orphan "Log Out" buttons
//   - Loads Lucide icons from CDN (window.lucide) and exposes window.bniRenderIcons()
//   - Applies shared theme CSS (top bar, cards, tables, stat cards, buttons)

(function () {
  // ─── PWA: link manifest, theme color, and register service worker ──────────
  if (!document.querySelector('link[rel="manifest"]')) {
    const m = document.createElement('link');
    m.rel = 'manifest'; m.href = '/bni/manifest.json';
    document.head.appendChild(m);
    const tc = document.createElement('meta');
    tc.name = 'theme-color'; tc.content = '#1e3a8a';
    document.head.appendChild(tc);
    const ac = document.createElement('meta');
    ac.name = 'apple-mobile-web-app-capable'; ac.content = 'yes';
    document.head.appendChild(ac);
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/bni/sw.js', { scope: '/bni/' }).catch(() => {});
    });
  }

  // ─── Load Lucide icons from CDN ────────────────────────────────────────────
  if (!window.__lucideLoading) {
    window.__lucideLoading = true;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.js';
    s.onload = () => { if (window.lucide) window.lucide.createIcons(); };
    document.head.appendChild(s);
  }
  window.bniRenderIcons = function () {
    if (window.lucide) { window.lucide.createIcons(); return; }
    const check = () => { if (window.lucide) window.lucide.createIcons(); else setTimeout(check, 40); };
    check();
  };

  // ─── Navigation config (grouped) ───────────────────────────────────────────
  const NAV_GROUPS = [
    { title: 'Daily',      items: [
      { href: '/bni/dashboard.html',      icon: 'sunrise',        label: 'Today',           desc: 'Daily to-do list and follow-up queue — your morning starting point' },
      { href: '/bni/followup.html',       icon: 'repeat',         label: 'Follow-ups',      desc: 'All scheduled appointments — see who needs a nudge and log meeting results' },
    ]},
    { title: 'Pipeline',   items: [
      { href: '/bni/pipeline.html',       icon: 'trello',         label: 'Pipeline',        desc: 'Visual kanban board — drag contacts across stages from Identified to Converted' },
      { href: '/bni/tracker.html',        icon: 'clipboard-list', label: 'Contact Tracker', desc: 'Full contact list — add, search, filter by status or city, manage leads' },
      { href: '/bni/proposals.html',      icon: 'file-check',     label: 'Proposals',       desc: 'Pending proposal approvals — assignees upload, Dr. Murali reviews and approves' },
    ]},
    { title: 'Meetings',   items: [
      { href: '/bni/zoom-completed.html', icon: 'video',          label: 'Zoom Meetings',   desc: 'Log of completed 121 Zoom calls — record outcomes and set follow-ups' },
      { href: '/bni/members-met.html',    icon: 'user-check',     label: 'Members Met',     desc: 'Compact roster of everyone you have completed a Zoom 121 with — name, category, chapter, city, mobile, date' },
      { href: '/bni/teams.html',          icon: 'layers',         label: 'Teams (A/B/C/D)', desc: 'Team-wise rosters from the Apr 2026 handwritten lists — auto-fetches profile data' },
      { href: '/bni/referrals.html',      icon: 'git-branch',     label: 'Referral Network', desc: 'Who introduced whom — top referrers, referral chains, and cold-contact list' },
      { href: '/bni/members.html',        icon: 'users',          label: 'All Members',     desc: 'BNI chapter member directory — browse and search all chapter members' },
    ]},
    { title: 'Engineering',items: [
      { href: '/bni/dev-boards.html',     icon: 'kanban-square',  label: 'Boards',          desc: 'Kanban board of dev work items — drag to change state, click to edit' },
      { href: '/bni/dev-backlog.html',    icon: 'list-todo',      label: 'Backlog',         desc: 'Prioritized list view of all work items with filters + CSV import' },
      { href: '/bni/dev-sprints.html',    icon: 'gauge',          label: 'Sprints',         desc: 'Sprint planning, capacity per developer, burndown chart' },
      { href: '/bni/dev-reports.html',    icon: 'bar-chart-3',    label: 'Reports',         desc: 'Per-developer load, velocity, type and priority breakdowns' },
      { href: '/bni/dev-tree.html',       icon: 'git-branch',     label: 'Hierarchy',       desc: 'Tree view of every work item by parent — Epic > Feature > Story > Task > Sub-task. Click an item to open it.' },
      { href: '/bni/dev-calendar.html',   icon: 'calendar-days',  label: 'Calendar',        desc: 'Sprint bands and per-developer leave dots on a month grid — see resource availability at a glance' },
      { href: '/bni/dev-retro.html',      icon: 'rotate-ccw',     label: 'Retrospective',   desc: 'Four L\'s retro per sprint: Liked, Learned, Lacked, Longed for. Captures team feedback at sprint end.' },
      { href: '/bni/dev-glossary.html',   icon: 'book-open',      label: 'Glossary',        desc: 'Plain-English definitions for the Scrum / Agile vocabulary — Epic, Story, Task, PBI, sprint, velocity, ceremonies, metrics' },
      { href: '/bni/dev-toolkit.html',    icon: 'wrench',         label: 'Dev Toolkit',     desc: 'Confidential — Day-1 reading for new inductees: Claude Code token-saving toolkit (Graphify, scraper MCP, NotebookLM, Awesome Design, ccr) plus the three-brain provider switch' },
    ]},
    { title: 'Tools',      items: [
      { href: '/bni/my-card.html',        icon: 'id-card',        label: 'My BNI Card',     desc: 'Your sharable BNI 121 introduction card — copy text, share on WhatsApp, download as PDF' },
      { href: '/bni/templates.html',      icon: 'mail',           label: 'Templates',       desc: 'Ready-to-send WhatsApp & email messages — personalise once, copy for any contact' },
      { href: '/bni/settings.html',       icon: 'settings',       label: 'Settings',        desc: 'Configure WhatsApp API, AI, and other integrations for this CRM' },
    ]},
  ];
  const LINKS = NAV_GROUPS.flatMap(g => g.items);

  // ─── Shared theme CSS ──────────────────────────────────────────────────────
  const THEME_CSS = `
    :root {
      --bni-bg:#f8fafc; --bni-surface:#ffffff; --bni-border:#e2e8f0;
      --bni-text:#0f172a; --bni-muted:#64748b; --bni-subtle:#94a3b8;
      --bni-primary:#2563eb; --bni-primary-2:#1d4ed8; --bni-primary-soft:#eff6ff;
      --bni-shadow-xs:0 1px 2px rgba(15,23,42,0.04);
      --bni-shadow-sm:0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
      --bni-shadow-md:0 4px 12px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04);
      --bni-radius-sm:8px; --bni-radius:12px; --bni-radius-lg:16px;
    }
    body.bni-sidebar-applied {
      font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif !important;
      background:var(--bni-bg) !important;
      color:var(--bni-text);
      margin-left:240px;
      padding-top:56px;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
      transition:margin-left 0.22s ease;
    }
    body.bni-sidebar-applied.bni-sidebar-collapsed { margin-left:0 !important; }
    body.bni-sidebar-applied .md\\:ml-60,body.bni-sidebar-applied .ml-60,
    body.bni-sidebar-applied .md\\:ml-56,body.bni-sidebar-applied .ml-56 { margin-left:0 !important; }

    /* Icons (Lucide) baseline */
    body.bni-sidebar-applied [data-lucide] { width:16px; height:16px; stroke-width:2; vertical-align:-2px; }
    body.bni-sidebar-applied .icon-sm [data-lucide] { width:14px; height:14px; }
    body.bni-sidebar-applied .icon-lg [data-lucide] { width:20px; height:20px; }
    body.bni-sidebar-applied .icon-xl [data-lucide] { width:28px; height:28px; }

    /* Top bar */
    body.bni-sidebar-applied nav.bg-white.border-b,
    body.bni-sidebar-applied nav.sticky {
      background:rgba(255,255,255,0.85) !important;
      border-bottom:1px solid var(--bni-border) !important;
      box-shadow:none !important;
      padding:16px 28px !important;
      backdrop-filter:saturate(1.3) blur(12px);
      -webkit-backdrop-filter:saturate(1.3) blur(12px);
    }

    body.bni-sidebar-applied .max-w-6xl,
    body.bni-sidebar-applied .max-w-7xl { max-width:1280px; }

    /* Cards */
    body.bni-sidebar-applied .bg-white.rounded-xl,
    body.bni-sidebar-applied .bg-white.rounded-2xl,
    body.bni-sidebar-applied .glass {
      background:var(--bni-surface) !important;
      border:1px solid var(--bni-border) !important;
      box-shadow:var(--bni-shadow-sm) !important;
      border-radius:var(--bni-radius-lg) !important;
    }
    body.bni-sidebar-applied .member-card:hover {
      box-shadow:var(--bni-shadow-md) !important;
      transform:translateY(-1px);
      border-color:#cbd5e1 !important;
    }

    /* Stat cards */
    body.bni-sidebar-applied #stats-row > div,
    body.bni-sidebar-applied #statsBar > div {
      background:var(--bni-surface);
      border:1px solid var(--bni-border);
      border-radius:var(--bni-radius);
      padding:16px 18px;
      box-shadow:var(--bni-shadow-xs);
      transition:all 0.15s ease;
    }
    body.bni-sidebar-applied #stats-row > div:hover { box-shadow:var(--bni-shadow-sm); transform:translateY(-1px); }
    body.bni-sidebar-applied #stats-row > div p:first-child,
    body.bni-sidebar-applied #stats-row > div p.text-2xl { font-weight:800; letter-spacing:-0.02em; }
    body.bni-sidebar-applied #stats-row > div p:last-child {
      color:var(--bni-muted);
      font-size:11px;
      letter-spacing:0.06em;
      text-transform:uppercase;
      font-weight:700;
      margin-top:2px;
    }

    /* Tables */
    body.bni-sidebar-applied table thead,
    body.bni-sidebar-applied table thead tr { background:#f8fafc !important; }
    body.bni-sidebar-applied table thead th {
      font-size:11px;
      font-weight:700;
      text-transform:uppercase;
      letter-spacing:0.06em;
      color:var(--bni-muted) !important;
      padding:12px 16px !important;
    }
    body.bni-sidebar-applied table tbody tr { transition:background 0.12s ease; }
    body.bni-sidebar-applied table tbody tr:hover { background:#f8fafc !important; }
    body.bni-sidebar-applied table tbody td { padding:14px 16px !important; }

    /* Inputs */
    body.bni-sidebar-applied input,
    body.bni-sidebar-applied select,
    body.bni-sidebar-applied textarea {
      border-radius:var(--bni-radius-sm) !important;
      border:1px solid var(--bni-border) !important;
    }
    body.bni-sidebar-applied input:focus,
    body.bni-sidebar-applied select:focus,
    body.bni-sidebar-applied textarea:focus {
      border-color:var(--bni-primary) !important;
      box-shadow:0 0 0 3px rgba(37,99,235,0.12) !important;
      outline:none;
    }

    /* Buttons */
    body.bni-sidebar-applied button.bg-blue-600,
    body.bni-sidebar-applied a.bg-blue-600 {
      background:var(--bni-primary) !important;
      box-shadow:0 1px 2px rgba(37,99,235,0.25);
      font-weight:600;
      letter-spacing:-0.01em;
    }
    body.bni-sidebar-applied button.bg-blue-600:hover,
    body.bni-sidebar-applied a.bg-blue-600:hover {
      background:var(--bni-primary-2) !important;
      box-shadow:0 4px 12px rgba(37,99,235,0.25);
    }

    /* Badges */
    body.bni-sidebar-applied .badge {
      display:inline-flex !important;
      align-items:center;
      gap:4px;
      padding:3px 9px !important;
      border-radius:999px !important;
      font-size:11px !important;
      font-weight:700 !important;
      letter-spacing:0.04em !important;
      text-transform:uppercase !important;
    }

    /* Quick filter buttons */
    body.bni-sidebar-applied .qf-btn {
      display:inline-flex;
      align-items:center;
      gap:5px;
      font-weight:600;
      letter-spacing:-0.01em;
    }

    /* Typography */
    body.bni-sidebar-applied h1 { letter-spacing:-0.02em; }
    body.bni-sidebar-applied h2 { letter-spacing:-0.015em; }

    @media (max-width: 900px) {
      body.bni-sidebar-applied { margin-left:0 !important; }
    }

    /* Touch-friendly minimums on mobile */
    @media (max-width: 640px) {
      body.bni-sidebar-applied button,
      body.bni-sidebar-applied .qf-btn,
      body.bni-sidebar-applied .action-btn,
      body.bni-sidebar-applied a.action-btn {
        min-height:38px;
      }
    }
  `;

  const SIDEBAR_CSS = `
    /* Top bar (always visible — hamburger toggles sidebar on every viewport) */
    #bni-mobile-bar {
      display:flex;
      position:fixed; top:0; left:0; right:0; height:56px;
      background:rgba(255,255,255,0.92);
      backdrop-filter:saturate(1.3) blur(10px);
      -webkit-backdrop-filter:saturate(1.3) blur(10px);
      border-bottom:1px solid var(--bni-border);
      z-index:65;
      align-items:center; justify-content:space-between;
      padding:0 14px;
      transition:left 0.22s ease;
    }
    body.bni-sidebar-applied:not(.bni-sidebar-collapsed) #bni-mobile-bar { left:240px; }
    body.bni-sidebar-applied.bni-sidebar-collapsed #bni-mobile-bar { left:0; }
    #bni-mobile-bar .mb-title { font-size:14px; font-weight:600; color:#0f172a; letter-spacing:-0.01em; display:flex; align-items:center; gap:10px; min-width:0; }
    #bni-mobile-bar .mb-title > span:last-child { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #bni-mobile-bar .mb-logo {
      width:30px; height:30px; border-radius:9px;
      background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);
      color:#fff; font-weight:800; font-size:12px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 8px rgba(37,99,235,0.3);
      flex-shrink:0;
    }
    /* On desktop with the sidebar visible, the BK logo is redundant — hide it. */
    body.bni-sidebar-applied:not(.bni-sidebar-collapsed) #bni-mobile-bar .mb-logo { display:none; }
    @media (max-width: 900px) {
      body.bni-sidebar-applied:not(.bni-sidebar-collapsed) #bni-mobile-bar .mb-logo { display:flex; }
    }
    #bni-hamburger {
      width:44px; height:44px; border-radius:10px;
      background:#0f172a; border:none;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:#fff;
      box-shadow:0 2px 6px rgba(15,23,42,0.18);
      flex-shrink:0;
    }
    #bni-hamburger:active { transform:scale(0.96); }
    #bni-hamburger [data-lucide], #bni-hamburger svg { width:22px; height:22px; }
    #bni-sidebar-backdrop {
      display:none; position:fixed; inset:0;
      background:rgba(15,23,42,0.45);
      backdrop-filter:blur(2px); z-index:55;
      animation:bni-fade 0.18s ease;
    }
    @keyframes bni-fade { from{opacity:0;} to{opacity:1;} }
    @keyframes bni-slide { from{transform:translateX(-100%);} to{transform:translateX(0);} }

    #bni-sidebar-root {
      position:fixed; top:0; left:0; bottom:0; width:240px;
      background:#1e3a8a;
      border-right:1px solid #1e40af;
      display:flex; flex-direction:column;
      font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
      z-index:60;
      box-shadow:0 4px 24px rgba(15,23,42,0.18);
      transform:translateX(0);
      transition:transform 0.22s ease;
    }
    body.bni-sidebar-collapsed #bni-sidebar-root { transform:translateX(-100%); }
    #bni-sidebar-root .bs-header {
      padding:18px 20px 16px;
      border-bottom:1px solid rgba(255,255,255,0.12);
      display:flex; align-items:center; gap:12px;
    }
    #bni-sidebar-root .bs-close {
      display:none;
      margin-left:auto;
      width:32px; height:32px; border-radius:8px;
      background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18);
      cursor:pointer; color:#cbd5e1;
      align-items:center; justify-content:center;
    }
    #bni-sidebar-root .bs-close:hover { background:rgba(255,255,255,0.16); color:#fff; }
    #bni-sidebar-root .bs-group-title {
      font-size:10.5px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;
      color:#93c5fd;
      padding:14px 14px 6px;
      opacity:0.85;
    }
    #bni-sidebar-root .bs-group:first-child .bs-group-title { padding-top:6px; }
    #bni-sidebar-root .bs-logo {
      width:40px; height:40px; flex-shrink:0;
      border-radius:11px;
      background:#ffffff;
      display:flex; align-items:center; justify-content:center;
      color:#1e3a8a; font-weight:800; font-size:15px;
      letter-spacing:0.01em;
      box-shadow:0 4px 12px rgba(0,0,0,0.18);
    }
    #bni-sidebar-root .bs-title { font-weight:700; color:#ffffff; font-size:14px; line-height:1.15; letter-spacing:-0.01em; }
    #bni-sidebar-root .bs-subtitle { font-size:11px; color:#bfdbfe; margin-top:3px; letter-spacing:0.02em; font-weight:500; }
    #bni-sidebar-root nav { flex:1; padding:14px 10px; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }
    #bni-sidebar-root .bs-link {
      display:flex; align-items:center; gap:11px;
      padding:9px 12px; border-radius:9px;
      color:#dbeafe; font-size:13.5px; font-weight:500;
      text-decoration:none;
      transition:background 0.12s ease, color 0.12s ease;
      letter-spacing:-0.005em;
    }
    #bni-sidebar-root .bs-link:hover { background:rgba(255,255,255,0.10); color:#ffffff; }
    #bni-sidebar-root .bs-link.active {
      background:#ffffff;
      color:#1e3a8a; font-weight:700;
      box-shadow:0 2px 6px rgba(0,0,0,0.10);
    }
    #bni-sidebar-root .bs-link.active [data-lucide] { color:#1e3a8a; }
    #bni-sidebar-root .bs-link [data-lucide] { width:17px; height:17px; stroke-width:2; flex-shrink:0; color:#93c5fd; }
    #bni-sidebar-root .bs-link:hover [data-lucide] { color:#ffffff; }
    #bni-sidebar-root .bs-footer {
      padding:14px 20px;
      border-top:1px solid rgba(255,255,255,0.12);
      font-size:11px; color:#bfdbfe;
      display:flex; align-items:center; justify-content:space-between;
      font-weight:500;
    }
    #bni-sidebar-root .bs-footer-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.28); }
    @media (max-width: 900px) {
      /* On narrow viewports the sidebar is hidden by default and acts as a drawer. */
      body.bni-sidebar-applied:not(.bni-sidebar-open) #bni-sidebar-root { transform:translateX(-100%); }
      body.bni-sidebar-applied.bni-sidebar-open #bni-sidebar-root { transform:translateX(0); box-shadow:0 0 30px rgba(15,23,42,0.18); width:280px; }
      body.bni-sidebar-applied.bni-sidebar-open #bni-sidebar-backdrop { display:block; }
      body.bni-sidebar-applied.bni-sidebar-collapsed #bni-sidebar-root { transform:translateX(-100%); }
      body.bni-sidebar-applied #bni-mobile-bar { left:0 !important; }
      #bni-sidebar-root .bs-close { display:flex; }
    }
  `;

  function renderHTML() {
    const current = (location.pathname || '').toLowerCase();
    const renderItem = (l) => {
      const active = current.endsWith(l.href.toLowerCase()) ? 'active' : '';
      return `<a class="bs-link ${active}" href="${l.href}" title="${l.desc}"><i data-lucide="${l.icon}"></i>${l.label}</a>`;
    };
    const groups = NAV_GROUPS.map(g => `
      <div class="bs-group">
        <div class="bs-group-title">${g.title}</div>
        ${g.items.map(renderItem).join('')}
      </div>`).join('');
    const activeLabel = (LINKS.find(l => current.endsWith(l.href.toLowerCase())) || {}).label || 'BNI 121';
    return `
      <div id="bni-mobile-bar">
        <div class="mb-title"><span class="mb-logo">BK</span><span>${activeLabel}</span></div>
        <button id="bni-hamburger" aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div id="bni-sidebar-backdrop"></div>
      <aside id="bni-sidebar-root">
        <div class="bs-header">
          <div class="bs-logo">BK</div>
          <div style="flex:1; min-width:0;">
            <div class="bs-title">Dr. BK Murali</div>
            <div class="bs-subtitle">BNI 121 · AI Tools</div>
          </div>
          <button class="bs-close" aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <nav>${groups}</nav>
        <div class="bs-footer">
          <span>v2 · Supabase</span>
          <span class="bs-footer-dot" title="Connected"></span>
        </div>
      </aside>
    `;
  }

  function bindDrawer() {
    const root = document.getElementById('bni-sidebar-root');
    const backdrop = document.getElementById('bni-sidebar-backdrop');
    const burger = document.getElementById('bni-hamburger');
    const close = root && root.querySelector('.bs-close');
    if (!root) return;

    const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
    const body = document.body;

    // Hamburger:
    //   • Mobile  — toggles `bni-sidebar-open` (drawer slides in over content).
    //   • Desktop — toggles `bni-sidebar-collapsed` (sidebar slides off, content reclaims width).
    const toggle = () => {
      if (isMobile()) body.classList.toggle('bni-sidebar-open');
      else body.classList.toggle('bni-sidebar-collapsed');
    };
    const closeAll = () => {
      body.classList.remove('bni-sidebar-open');
      // Don't auto-uncollapse on desktop — user explicitly chose that state.
    };

    burger && burger.addEventListener('click', toggle);
    backdrop && backdrop.addEventListener('click', closeAll);
    close && close.addEventListener('click', () => {
      if (isMobile()) body.classList.remove('bni-sidebar-open');
      else body.classList.add('bni-sidebar-collapsed');
    });

    // Close mobile drawer after navigating; on desktop, leave state alone.
    root.querySelectorAll('.bs-link').forEach(a => a.addEventListener('click', () => {
      if (isMobile()) body.classList.remove('bni-sidebar-open');
    }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

    // If user resizes from mobile→desktop while drawer is open, drop the open state.
    window.addEventListener('resize', () => {
      if (!isMobile()) body.classList.remove('bni-sidebar-open');
    });
  }

  function removeLegacySidebars() {
    document.querySelectorAll('aside').forEach(a => {
      if (a.id === 'bni-sidebar-root') return;
      const cls = (a.className || '').toString();
      if (/bg-slate-9\d\d|bg-gray-9\d\d|w-60|w-56/.test(cls)) a.remove();
    });
  }

  function removeLegacyLogoutButtons() {
    document.querySelectorAll('button, a').forEach(el => {
      const onclick = (el.getAttribute('onclick') || '').toLowerCase();
      const text = (el.textContent || '').trim().toLowerCase();
      const href = (el.getAttribute('href') || '').toLowerCase();
      const isLogout =
        onclick.includes('dologout') ||
        (onclick.includes('logout') && !onclick.includes('autologout')) ||
        href.includes('/auth/login') ||
        text === 'log out' ||
        text === 'logout' ||
        text === 'sign out';
      if (isLogout) {
        const parent = el.parentElement;
        el.remove();
        if (parent && parent.children.length === 0 && !parent.textContent.trim()) parent.remove();
      }
    });
  }

  function apply() {
    // Public-facing scheduler page should NOT get the admin sidebar injected.
    // (bni-sidebar.js is loaded on every BNI page but scheduler is customer-facing.)
    if (location.pathname.endsWith('/bni/scheduler.html') || location.pathname === '/bni/scheduler') {
      // Public booking page — no admin sidebar, no ml-56 offset
      if (!document.querySelector('link[rel="icon"]')) {
        const fav = document.createElement('link');
        fav.rel = 'icon';
        fav.type = 'image/svg+xml';
        fav.href = '/bni/favicon.svg';
        document.head.appendChild(fav);
      }
      const s = document.createElement('style');
      s.textContent = `
        body { font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif !important; background:#f8fafc !important; }
        body .md\\:ml-60, body .md\\:ml-56, body .ml-60, body .ml-56 { margin-left:0 !important; }
        body nav.bg-white.border-b, body nav.sticky { background:rgba(255,255,255,0.92) !important; border-bottom:1px solid #e2e8f0 !important; box-shadow:none !important; backdrop-filter:saturate(1.2) blur(8px); }
      `;
      document.head.appendChild(s);
      removeLegacySidebars();
      return;
    }
    // Inject favicon on every BNI page (if not already set)
    if (!document.querySelector('link[rel="icon"]')) {
      const fav = document.createElement('link');
      fav.rel = 'icon';
      fav.type = 'image/svg+xml';
      fav.href = '/bni/favicon.svg';
      document.head.appendChild(fav);
    }
    const style = document.createElement('style');
    style.textContent = SIDEBAR_CSS + '\n' + THEME_CSS;
    document.head.appendChild(style);
    removeLegacySidebars();
    const mount = document.getElementById('bni-sidebar-mount');
    const html = renderHTML();
    // renderHTML returns multiple sibling elements (mobile bar + backdrop + aside);
    // outerHTML assignment is unreliable for multi-root strings, so insert as siblings
    // then drop the mount placeholder.
    if (mount) {
      mount.insertAdjacentHTML('beforebegin', html);
      mount.remove();
    } else {
      document.body.insertAdjacentHTML('afterbegin', html);
    }
    document.body.classList.add('bni-sidebar-applied');
    removeLegacyLogoutButtons();
    bindDrawer();
    window.bniRenderIcons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
