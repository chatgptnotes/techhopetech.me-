# hreflang Strategy (deferred until regional rollout)

## Status
**Deferred.** No implementation today. The site currently serves a single English locale at `https://headz.international/`.

## When this becomes active
Trigger this plan once any of the following is true:
- A second language version of any public page is launched (e.g. Arabic).
- A region-specific URL space is launched (e.g. `/ae/`, `/sa/`, `/in/`).
- Localized marketing campaigns require region-targeted Google results.

## Approach when triggered
1. **URL strategy.** Use subdirectories per locale, not subdomains:
   - `https://headz.international/` → `en` (default, x-default)
   - `https://headz.international/ar/` → `ar`
   - `https://headz.international/ae/` → `en-AE`
   - `https://headz.international/sa/` → `ar-SA`

2. **Tag every locale-equivalent page** in the `<head>` of every locale variant:
   ```html
   <link rel="alternate" hreflang="en" href="https://headz.international/app" />
   <link rel="alternate" hreflang="ar" href="https://headz.international/ar/app" />
   <link rel="alternate" hreflang="x-default" href="https://headz.international/app" />
   ```
   Every variant must reference every other variant **including itself** — Google ignores asymmetric clusters.

3. **Sitemap.** Update `public/sitemap.xml` to use `xhtml:xmlns="http://www.w3.org/1999/xhtml"` and emit `<xhtml:link rel="alternate" hreflang="...">` per URL. This is more reliable than `<link>` tags alone for crawl coverage.

4. **Canonicals.** Each locale page must self-canonicalize. Do NOT canonicalize a localized page back to the English version — that prevents indexing of the locale.

5. **Hook integration.** Extend `utils/useDocumentMeta.ts` to accept an `alternates: { hreflang: string; href: string }[]` field and emit the `<link rel="alternate" hreflang>` tags alongside canonical.

6. **RTL support.** When Arabic ships, ensure `<html lang="ar" dir="rtl">` is set per route. The current `useDocumentMeta` hook only writes meta — extend it to also set `document.documentElement.lang` and `dir`.

## Acceptance gate (re-open D-28)
- [ ] At least one non-English public route exists.
- [ ] All locale variants are tagged with reciprocal `hreflang`.
- [ ] `x-default` is set to the canonical English page.
- [ ] Sitemap includes `xhtml:link` alternates per URL.
- [ ] Search Console reports zero asymmetric hreflang errors after first crawl.

## Out of scope for now
- Geographic IP redirects.
- Currency or pricing localization (the product is free).
- Region-specific OAuth scopes — Google handles locale on its end.
