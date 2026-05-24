---
name: plain-english-explainer-box
description: Add a "How to read this document" plain-language box to any technical document so non-technical stakeholders understand purpose and structure at a glance.
origin: harvested
version: 1.0.0
---

# Plain-English Explainer Box for Technical Documents

## Problem

Technical documents (SOPs, architecture docs, compliance checklists, stage-gate frameworks) are written for practitioners. When they are shared with non-technical stakeholders (executives, clients, auditors, board members), the reader either skips the document or misunderstands it.

## Pattern

Add a visually distinct "How to read this document" box near the top of page 1. It should:
- State the document's purpose in one plain sentence
- Walk through each section in 1-2 plain sentences
- Name the intended audience explicitly
- Use no jargon

## HTML Template

```html
<div class="explainer-box">
  <div class="explainer-title">How to read this document</div>
  <div class="explainer-body">
    <p><strong>What this is:</strong> [One plain sentence — what the document does, not what it is called.]</p>
    <p><strong>Who it is for:</strong> [Named roles — e.g. "the project sponsor, client representative, and any auditor reviewing our delivery process."]</p>
    <p><strong>Section by section:</strong></p>
    <ul>
      <li><strong>Section A</strong> - [plain sentence]</li>
      <li><strong>Section B</strong> - [plain sentence]</li>
    </ul>
    <p><strong>What to do with it:</strong> [e.g. "Sign the gate at the bottom of page 2 when your product exits a stage."]</p>
  </div>
</div>
```

## CSS (Bettroi / Navy-Gold palette)

```css
.explainer-box {
  background: #F8F9FB;
  border-left: 3px solid #C9A93F;
  padding: 10px 14px;
  border-radius: 0 4px 4px 0;
  margin-bottom: 14px;
}
.explainer-title {
  font-size: 9px;
  font-weight: 800;
  color: #1C2B4A;
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 6px;
}
.explainer-body p, .explainer-body li {
  font-size: 9px;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 3px;
}
```

## Example Domains

| Document type | Plain-English purpose statement |
|---------------|--------------------------------|
| SOP | "This checklist tells us exactly what to build, document, and sign off at each stage of a new product so any auditor can verify we followed a consistent process." |
| Architecture doc | "This shows how the system's components connect and why each choice was made, so future developers and reviewers understand the design." |
| Security review | "This records what risks we checked for before launch and what we did about each one." |
| Compliance matrix | "This maps each regulation requirement to the evidence we have, so a regulator can confirm we are compliant without reading all our internal files." |
| Proposal / commercial | "This outlines what we will build, what it costs, and how we will deliver it, so the client can make an informed decision." |

## Placement

- Always page 1, after the header and before section A
- If document has an intro paragraph, the explainer box replaces or precedes it
- Keep it to 10-14 lines maximum so it fits within the page without displacing key content

## Trigger

Use whenever a technical document will be reviewed by someone who did not author it, especially in audit, certification, board, or client-facing contexts.
