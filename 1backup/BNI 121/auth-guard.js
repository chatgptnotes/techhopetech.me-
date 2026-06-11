// Auth guard — gates internal CRM pages behind the admin login (login.html).
// Included on every internal page; runs immediately on load. Public pages
// (index/about/my-card/scheduler) deliberately do NOT include this file.
(function () {
  'use strict';
  var AUTH_KEY = 'bni_crm_auth';

  // Already signed in — allow the page to render.
  if (localStorage.getItem(AUTH_KEY) === '1') return;

  // Not signed in — hide content immediately and bounce to the login page,
  // remembering where the user was headed so we can return after sign-in.
  try { document.documentElement.style.visibility = 'hidden'; } catch (e) {}
  var here = (location.pathname.split('/').pop() || '') + location.search;
  location.replace('login.html?next=' + encodeURIComponent(here));
})();
