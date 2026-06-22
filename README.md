# Design-to-Code Pipeline — spec-first multi-agent system

Turns a UI component **brief** (text + optional Figma link/screenshot notes) into validated
**React 18 + TypeScript** code, by running a team of single-responsibility AI agents — each in a
clean context, communicating only through files on disk.

> **Core principle: the specification is primary, code is derived.** No agent writes code from
> the human brief. Code is generated from a frozen `spec.json` and validated *against the spec*,
> not against the prose. A token or component is real only if it appears in the design system;
> anything else is treated as a hallucination and rejected by a deterministic, non-LLM check.

---

## What AI tool was used

**Claude (Anthropic)**

- Default model: **`claude-opus-4-8`**, overridable via the `PIPELINE_MODEL` env var
  (e.g. `claude-sonnet-4-6` for cheaper/faster runs).
- The same agent roles are *also* authored as portable **Claude Code skills**
  (`.claude/skills/`) and **subagents** (`.claude/agents/`), so the pipeline can be run end-to-end
  by the orchestrator *or* hand-driven inside an interactive Claude Code session.

### Where it was used (the boundary between deterministic and AI)

| Concern | Who does it |
|--------|-------------|
| Each pipeline **stage** (extract, audit, spec, generate, validate, assemble) | A Claude **skill** invoked via the `Skill` tool |
| The **work inside** each stage | Specialist **subagents** the skill spawns via the `Task` tool (parser, states-analyst, a11y-auditor, spec-author, code-generator, token-validator, qa-reviewer, assembler) |
| **Ground-truth token check** | Deterministic scan of the generated CSS/TS — overrides whatever the LLM claims |

The orchestrator owns only the *order*. It never edits an artifact or talks to a subagent directly —
it invokes one skill, lets that skill drive its own subagents to completion, then moves on.

---

## The team (one agent = one responsibility)

| Step | Skill | Role(s) | In | Out |
|------|-------|---------|----|-----|
| 1 | `sk-extract` | **Parser** | brief | `extraction.json` |
| 2 | `sk-audit` | **States Analyst** ‖ **A11y Auditor** *(parallel)* | extraction | `gaps.states.json`, `gaps.a11y.json` |
| 3 | `sk-create-spec` | **Spec Author** | extraction + gaps | `spec.json` *(frozen contract)* |
| 4 | `sk-create-implementation` | **Code Generator** | spec | `<Component>/*` + `generated.meta.json` |
| 5 | `sk-validate-implementation` | **Token Validator** ‖ **QA Reviewer** *(parallel)* | code, spec | `validation.tokens.json`, `validation.qa.json` |
| 6 | `sk-create-report` | **Assembler** | everything | `output.json` |

### Why multi-agent, not one magic prompt
- **Clean context per agent** → no anchoring. The QA reviewer can't see the generator's
  rationalizations, only its output — so real bugs surface instead of being argued away.
- **Spec-first** → a single frozen contract makes "did the code do the right thing?" a mechanical
  check, and lets the repair loop fix code without ever touching the requirements.
- **Two specialists in parallel** at gap-analysis and validation — independent perspectives,
  less wall-clock.

---

## Architecture

```
scripts/orchestrate.ts   # the engine: Agent SDK driver, 6-step state machine, /docs folder threading
.claude/
  skills/                # one skill per stage (sk-extract … sk-create-report) + sync-tokens, audit
  agents/                # the 8 subagent roles, wired as Claude Code subagents
  settings.local.json
.ai/
  agents/                # the same roles as plain prompt specs (01-parser … 06-assembler)
  rules/                 # Architecture, CodeStyle, CodeHints, TestingHints, FeatureWorkflow
  commands/              # per-step orchestration prose (1-extract … 6-assemble) + pipeline.md
design-system/
  tokens.json            # SINGLE SOURCE OF TRUTH for tokens (name → cssVar → value)
  components.json        # reusable @acme/ui component catalog + conventions
docs/<Component>/        # per-run artifacts: brief, extraction, gaps.*, spec, validation.*, output.json
src/<Component>/         # the materialized component (.tsx, .module.css, .stories.tsx, .test.tsx, index.ts)
examples/                # sample briefs (payment-form.md)
```

### Control flow & guarantees
- **6 explicit stages**: extract → gap-analysis → spec → generate → validate → assemble. Each writes
  a JSON artifact into `docs/<Component>/`; downstream stages read upstream artifacts as read-only context.
- **Spec gate (after step 3):** every required state (extraction + states-gap) must appear in
  `spec.json` or the run is invalid. The spec is **frozen** after this point.
- **Repair loop (steps 4–5):** if token compliance fails or state coverage `< 100%`, only the
  **Code Generator** re-runs with a targeted fix-list. The spec is never touched. If still broken,
  the pipeline reports an honest failure rather than a fabricated pass.
- **Deterministic token check:** scans generated CSS/TS for any `var(--…)` or `@acme/ui` import not
  in the catalog, plus raw color literals (`#hex`, `rgb()`). Its verdict is **authoritative** and
  overrides any LLM claim about `token_compliance`.
- **Structured output:** every stage emits a JSON artifact; the final `output.json` conforms to a
  fixed report schema (component, extraction, gap_analysis, generated_code, validation).

The single source of truth for working in this repo is [AGENTS.md](AGENTS.md).

---

## How to run it

Requirements: **Node.js ≥ 20** and an **Anthropic API key**.

```bash
# Run the full pipeline on a brief — inline text OR a path to a markdown file:

/generate-component "A loading-state dashboard card showing account balance"
/generate-component examples/payment-form.md
```

The brief may include a Figma link or screenshot notes as plain text. The orchestrator:
1. resolves the brief (file path → file contents, otherwise verbatim text),
2. runs the six skills strictly in sequence,
3. discovers the `docs/<Component>/` folder that step 1 created and threads it into every later step,
4. prints `✅ Pipeline complete. Final report: docs/<Component>/output.json`.

Every intermediate artifact plus the final `output.json` lands in `docs/<Component>/`; the generated
component is materialized under `src/<Component>/`. See the two committed example runs in
[`docs/`](docs/) for exactly what a completed run looks like.

---

## Example tests (input → output)

Two runs are committed in full under [`docs/`](docs/); a third is the bundled sample brief.

### Example 1 — `PaymentCard` (a card with 2 states → 8)

**Input** ([`docs/PaymentCardComponent/brief.md`](docs/PaymentCardComponent/brief.md)) — a merchant-dashboard
saved-payment-method card. Brief specifies only **`default`** and **`selected`** states, a masked
card number (`**** **** **** 1234`), three brands (Visa/Mastercard/Amex), select + delete. No tokens,
no error/loading/disabled states.

**Output** ([`docs/PaymentCardComponent/output.json`](docs/PaymentCardComponent/output.json)):
- **States covered: 8/8** — gap analysis added `hover`, `focus-visible`, `loading`, `empty`,
  `error`, `disabled` on top of the two specified.
- A11y auditor caught real WCAG issues from the *tokens alone* — e.g. `color.border.default`
  (#D8DEE9) on white ≈ 1.3:1, failing the 3:1 non-text-contrast rule — and the spec switched the
  default border to a compliant token.
- Masked number turned into an accessible label (`"Visa card ending in 4242, expires 09/26, …"`);
  cards wrapped in `role="radiogroup"` with roving tabindex.
- **`token_compliance: true`**, **`hallucinations_caught: []`**, **accessibility_score: "A (0 blocking, 2 minor)"**.
- Materialized to [`src/PaymentCard/`](src/PaymentCard/) (component + CSS module + stories + tests).

### Example 2 — `TransactionTable` (unmapped badge colors → grounded tokens)

**Input** ([`docs/TransactionTable-SortingPagination/brief.md`](docs/TransactionTable-SortingPagination/brief.md)) —
a 5-column financial table with per-column sorting, page-size selector (25/50/100), and status badges
(`pending`/`completed`/`failed`/`refunded`) whose **colors are explicitly *not* grounded in any token**.

**Output** ([`docs/TransactionTable-SortingPagination/output.json`](docs/TransactionTable-SortingPagination/output.json)):
- **States covered: 8/8** — added `loading`, `empty`, `error`, `paginated`.
- The "colored badge, no token" trap was handled correctly: instead of inventing raw hex, the spec
  **mapped statuses to existing semantic tokens** (`--color-feedback-warning` → pending,
  `--color-feedback-success` → completed, `--color-feedback-error` → failed) and flagged `refunded`
  as needing a new token — so **`token_compliance: true`** with no hallucinations.
- The independent **QA reviewer caught real bugs the generator missed** — the page-size `Select` was
  rendered with no `id`, `value`, or `onChange`, making it non-functional and breaking its label
  association — surfaced as **accessibility_score: "B (1 blocking, 3 minor)"**.

### Example 3 — bundled sample brief (checkout card form)

**Input** ([`examples/payment-form.md`](examples/payment-form.md)) — *"Payment details"* checkout card:
card-number input, expiry + CVC side-by-side, a primary **"Pay $49.00"** button; on submit the button
shows a spinner and the form locks; on charge failure show a red error under the card-number field;
24px padding, large heading, fields stack on mobile.

**Run it:** `/generate-component examples/payment-form.md` as a Claude Code skill.

**Expected output:** the explicit `default`/`submitting`/`error` states are extracted from the prose;
the gap pass adds the canonical form states (`disabled`, `loading`, field-level `invalid`); the spec
composes `@acme/ui` `Card`, `Input`, `FormField`, and `Button` (with `loading`) and maps "brand blue"
to `--color-action-primary-default` and "red error" to `--color-feedback-error` rather than raw hex;
the deterministic check confirms `token_compliance: true`; the report is written to
`docs/<Component>/output.json` with a story and test per state.

---

## What worked

- **Spec-first decomposition** reliably turned under-specified briefs into complete contracts — both
  committed runs went from 2–4 stated states to **8/8 covered**, with the added states justified by
  the gap analysis rather than guessed.
- **Clean-context review found real defects** an all-in-one prompt would have rationalized away.
- **The deterministic token guard held the line** on hallucinations: `hallucinations_caught: []` and
  `token_compliance: true` on both runs, including the deliberately ungrounded badge-color trap, which
  was resolved by mapping to existing tokens instead of inventing hex.
- **File-only communication between agents** made every step auditable — you can read each artifact in
  `docs/<Component>/` and see exactly what each agent decided.
