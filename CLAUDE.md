# CLAUDE.md

## Karpathy Coding Guidelines

> Source: https://github.com/forrestchang/andrej-karpathy-skills
> Derived from Andrej Karpathy's observations on LLM coding pitfalls.

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that was not requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Do not improve adjacent code, comments, or formatting.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- Only remove imports/variables/functions that YOUR changes made unused.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- Transform tasks into verifiable goals before starting.
- For multi-step tasks, state a brief plan with a verify step for each.
- Define success criteria concretely — weak criteria require constant clarification.

### 5. LLM Wiki — Personal Knowledge Base Pattern

> Source: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
> Derived from Andrej Karpathy's LLM Wiki pattern. Instead of repeated RAG retrieval, the LLM maintains an evolving wiki that compounds knowledge over time.

**Three-layer architecture**
- **Raw sources** — immutable. The LLM reads them but never modifies. Ground truth.
- **The wiki** — LLM-owned markdown files (summaries, entity pages, interconnected concepts). The LLM creates pages, updates them as new sources arrive, maintains cross-references, keeps everything consistent.
- **The schema** — a config file documenting wiki structure, conventions, and workflows. This is what turns a generic chatbot into a disciplined knowledge maintainer.

**Three core operations**
- **Ingestion** — process new sources one at a time or in batches. Extract key info, update relevant pages, maintain cross-references.
- **Querying** — treat the wiki as the primary source. Search relevant pages and synthesize answers. File valuable analyses back into the wiki as new pages.
- **Maintenance** — periodic health checks for contradictions, orphaned pages, missing cross-references, and knowledge gaps.

**Navigation files (always present)**
- `index.md` — catalogs wiki contents by category for efficient page discovery
- `log.md` — chronological record of ingests, queries, and maintenance activities

**Why this works**
Knowledge-base maintenance — updating references, noting contradictions, ensuring consistency — is the work humans abandon. LLMs excel at this bookkeeping. Humans focus on curation, analysis, and strategic questioning.

**How to apply on this machine**
When starting any non-trivial project or research thread, set up a wiki directory with `index.md` + `log.md` and a short `schema.md` describing the page conventions. Ingest sources into wiki pages, query the wiki before going back to raw sources, and run maintenance passes periodically. Treat `~/.claude/projects/-Users-murali/memory/` as a meta-wiki for cross-project facts; project-specific wikis live inside the project directory.

