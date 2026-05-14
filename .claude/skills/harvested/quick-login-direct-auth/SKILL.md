---
name: quick-login-direct-auth
description: Quick-login buttons that directly authenticate via Supabase auth API on click — not just pre-filling form fields. Fixes the pattern where clicking a dev/demo quick-access button fills state but requires a second manual submit.
metadata:
  type: skill
---

# Quick-Login Direct Auth Buttons

Developer/demo quick-access buttons that immediately sign in the user on click, rather than just pre-filling the email/password form fields (which requires a separate manual submit).

## When to Use

Any app with dev shortcuts, demo accounts, or team quick-access logins — staging environments, demo portals, internal tools, onboarding flows.

| Example Domain | Use Case |
|---|---|
| Internal SaaS tools | Quick switch between test accounts |
| Demo portals | One-click demo login for sales calls |
| Staging environments | Dev/QA shortcuts |
| Multi-user apps | Switch between org members |

---

## The Bug Pattern (Don't Do This)

```tsx
// WRONG — fills form state but doesn't submit
onClick={() => {
  setEmail(acc.email);
  setPassword(acc.password);
  // user still has to click "Sign In" manually
}}
```

This silently breaks when:
- The form's `onSubmit` handler reads state that hasn't re-rendered yet
- There is no visible submit button (icon-only form)
- The user doesn't realize a second click is needed

---

## Correct Pattern — Direct Supabase Auth Call

```tsx
const QUICK_ACCOUNTS = [
  { label: 'Admin', email: 'admin@yourapp.com', password: 'Admin@2026' },
  { label: 'Demo User', email: 'demo@yourapp.com', password: 'Demo@2026' },
];

// In JSX:
{QUICK_ACCOUNTS.map((acc) => (
  <button
    key={acc.email}
    onClick={async () => {
      setLoading(true);
      setError('');
      try {
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: acc.email,
          password: acc.password,
        });
        if (authError) throw authError;
        if (data.user && data.session) {
          // Small delay to allow session to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          window.location.href = '/dashboard';
        }
      } catch (err: any) {
        setError(err.message || 'Login failed');
        setLoading(false);
      }
    }}
  >
    {acc.label}
  </button>
))}
```

---

## Key Points

- Call `supabase.auth.signInWithPassword()` directly in `onClick` — do not set form state
- Use `window.location.href` (hard redirect) rather than `router.push()` to ensure the session cookie is fully recognized on the next page load
- Add a 500ms delay before redirect to allow the session to propagate through Supabase's client-side cookie write
- Show error inline using the same `error` state as the main form — same UX, no special handling needed
- Keep `QUICK_ACCOUNTS` constant outside the component — it never changes, no need to put it in state or a ref

---

## Environment Safety

Only render quick-access buttons in appropriate environments:

```tsx
{process.env.NODE_ENV === 'development' && QUICK_ACCOUNTS.map(...)}

// Or with an explicit env flag:
{process.env.NEXT_PUBLIC_SHOW_QUICK_LOGIN === 'true' && QUICK_ACCOUNTS.map(...)}
```
