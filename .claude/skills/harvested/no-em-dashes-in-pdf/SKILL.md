---
name: no-em-dashes-in-pdf
description: Remove em dashes and en dashes from HTML before Chrome headless PDF generation — they render inconsistently and look unprofessional in printed commercial documents.
origin: harvested
version: 1.0.0
---

# No Em Dashes in PDF

## Problem

Em dashes (`—`, U+2014) and en dashes (`–`, U+2013) render inconsistently across Chrome headless PDF pipelines. In commercial documents (proposals, SOPs, reports, invoices) they can appear as boxes, question marks, or garbled characters depending on the font and Chrome version.

## Rule

Before generating any PDF via `--print-to-pdf`, strip all em/en dashes from the HTML source.

## Replacement Strategy

| Original | Replace with |
|----------|-------------|
| `— word` (em dash as separator) | `: word` or `,` or rewrite the sentence |
| `A — B` (em dash between nouns) | `A: B` or `A - B` (plain hyphen) |
| `A – B` (en dash in ranges) | `A-B` (plain hyphen) |
| `word — word` in titles/headings | `word: word` or `word and word` |

## Implementation

Find-replace before PDF generation:
```bash
# In-place replacement before Chrome headless
sed -i '' 's/—/-/g; s/–/-/g' file.html
```

Or handle in the HTML source during authoring - never use `—` or `–` in document templates.

## Example Domains

| Domain | Where it applies |
|--------|-----------------|
| Proposal / contract PDF | All headings, body text, footers |
| SOP / report PDF | Section titles, table cells |
| Invoice / commercial doc | Any narrative text |
| Legal forms | Clause text, definitions |

## Related

- Chrome headless PDF uses `--print-to-pdf` with `--no-margins`
- Same rule applies to Unicode fancy quotes (`"`, `"`) if font coverage is uncertain - use straight quotes instead
