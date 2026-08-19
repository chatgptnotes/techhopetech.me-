// Server-verified Supabase authentication for internal CRM and marketing pages.
(function () {
  'use strict';

  document.documentElement.style.visibility = 'hidden';
  localStorage.removeItem('bni_crm_auth');
  localStorage.removeItem('ht_admin_session');

  function sessionToken() {
    for (var index = 0; index < localStorage.length; index += 1) {
      var key = localStorage.key(index) || '';
      if (!/^sb-.+-auth-token$/.test(key)) continue;
      try {
        var value = JSON.parse(localStorage.getItem(key) || '{}');
        if (value && value.access_token) return value.access_token;
      } catch (error) {}
    }
    return '';
  }

  function redirectToLogin() {
    var here = (location.pathname.split('/').pop() || '') + location.search;
    location.replace('/bni/login.html?next=' + encodeURIComponent(here));
  }

  var token = sessionToken();
  if (!token) return redirectToLogin();

  fetch('/api/hopetech/auth/session', {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store',
  })
    .then(function (response) {
      if (!response.ok) throw new Error('Unauthorized');
      document.documentElement.style.visibility = 'visible';
      document.dispatchEvent(new Event('bni-auth-ready'));
    })
    .catch(redirectToLogin);
})();
