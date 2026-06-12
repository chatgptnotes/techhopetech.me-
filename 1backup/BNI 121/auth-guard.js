// Auth guard — gates internal CRM pages behind the admin login (login.html).
// Loaded synchronously in <head> on every internal page so the redirect fires
// before anything paints. Public pages (index/about/my-card/scheduler)
// deliberately do NOT include this file.
// A session is a ms-epoch expiry timestamp stored by login.html (12 hours).
(function () {
  'use strict';
  var AUTH_KEY = 'bni_crm_auth';

  // Signed in with an unexpired session — allow the page to render.
  var exp = Number(localStorage.getItem(AUTH_KEY));
  if (exp && Date.now() < exp) {
    // Some pages (dev-tree/dev-calendar/dev-retro) init on this event. Fire at
    // DOMContentLoaded so listeners registered by body scripts are attached.
    var fire = function () { document.dispatchEvent(new Event('bni-auth-ready')); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fire);
    } else {
      fire();
    }
    return;
  }

  // Missing, legacy ('1') or expired session — clear it (including the
  // admin.html SSO flag), hide content and bounce to the login page,
  // remembering where the user was headed so we can return after sign-in.
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('ht_admin_session');
  } catch (e) {}
  try { document.documentElement.style.visibility = 'hidden'; } catch (e) {}
  var here = (location.pathname.split('/').pop() || '') + location.search;
  location.replace('login.html?next=' + encodeURIComponent(here));
})();
