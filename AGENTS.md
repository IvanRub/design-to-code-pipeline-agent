# Design-to-Code Pipeline — Agent Guide

> Read this before working in the repo. It is the operating contract for both AI agents
> and humans. The pipeline turns a UI component **brief** into validated **React 18 + TypeScript**
> code through a team of single-responsibility agents that communicate only through files.

## Core philosophy
1. **Spec first, code derived.** No agent writes code from the human brief. Code is generated
   from a frozen `spec.json` and validated *against the spec*, not against the prose.
2. **Clean context per agent.** Each agent runs stateless and isolated — it sees only the files
   it is explicitly given, and knows nothing about the other agents. Never pass raw images or
   Figma links to coding agents; pass file paths.
3. **Design system is ground truth.** A token or component is valid **only** if it appears in
   `design-system/tokens.json` / `design-system/components.json`. Anything else is a hallucination.
4. **Autonomous self-healing.** Validation failures trigger a bounded repair loop; an honest
   failing report is preferable to a fabricated pass.

## Project overview
- **What it is:** a spec-first, multi-agent pipeline that converts a fintech UI component brief
  (text + optional screenshot/Figma notes) into production-ready React/TS/CSS with validation.
- **Output of a run:** a `docs/<Component>/` folder containing every intermediate artifact
  (`brief.md`, `extraction.json`, `gaps.*.json`, `spec.json`, `generated.meta.json`,
  `validation.*.json`) plus the final `output.json`. The component itself is materialized under
  `src/<Component>/`.
- **The AI tool:** Claude, driven through the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`).
- **Two ways to operate the same agents:**
  1. **Interactive** — invoke the `/generate-component` skill inside a Claude Code session; it
     drives the six pipeline skills in order via the Task tool.
  2. **Programmatic** — `scripts/orchestrate.ts` calls the Agent SDK's `query()` to run the same
     six skills headlessly. The `.ai/` files mirror each role as portable prompt specs.

## Tech & configuration
| Aspect | Value |
|--------|-------|
| Language | TypeScript (`strict`), CommonJS modules |
| Runtime | Node.js ≥ 20 |
| Generated framework | React 18 + TypeScript, CSS Modules (design-token CSS variables only) |
| Key deps | `@anthropic-ai/claude-agent-sdk` (drives Claude), `zod`, `dotenv` |
| Dev deps | `ts-node`, `typescript`, `@types/node` |
| Default model | `claude-opus-4-8` (override via `PIPELINE_MODEL`) |

### Scripts
- `/generate-component <brief.md | "inline brief">` — run the full pipeline via the Claude Code skill.

## Environment variables
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ANTHROPIC_API_KEY` | yes | — | Auth for the Agent SDK. `orchestrate.ts` aborts if unset. |
| `PIPELINE_MODEL` | no | `claude-opus-4-8` | Model id for every agent call. Use `claude-sonnet-4-6` for cheaper/faster runs. |

Copy `.env.example` → `.env` and fill in. `orchestrate.ts` loads it via `dotenv/config`.
`.env`, `node_modules/` are gitignored.

## Repository structure
```
scripts/
  orchestrate.ts         # the engine: Agent SDK driver, 6-step sequence, /docs folder threading
.claude/
  skills/                # the runnable stages: generate-component (orchestrator) + sk-extract,
                         #   sk-audit, sk-create-spec, sk-create-implementation,
                         #   sk-validate-implementation, sk-create-report (+ sk-sync-tokens)
  agents/                # the 8 subagent roles wired as Claude Code subagents
  settings.local.json
.ai/
  agents/                # the same roles as plain prompt specs (01-parser … 06-assembler, SoftwareArchitect)
  rules/                 # Architecture, CodeStyle, CodeHints, TestingHints, FeatureWorkflow
  commands/              # per-step orchestration prose (1-extract … 6-assemble) + pipeline.md
design-system/
  tokens.json            # SINGLE SOURCE OF TRUTH for tokens (name → cssVar → value)
  components.json        # reusable component catalog (@acme/ui) + conventions
docs/<Component>/        # per-run artifacts: brief, extraction, gaps.*, spec, validation.*, output.json
src/<Component>/         # the materialized component (.tsx, .module.css, .stories.tsx, .test.tsx, index.ts)
examples/                # sample briefs (payment-form.md)
```

## Architecture — the 6-step pipeline
The order is owned by `scripts/orchestrate.ts` (programmatic) or the `generate-component` skill
(interactive). Both drive **one skill per step, strictly in sequence** — each finishes before the
next begins. Every step writes a JSON artifact into `docs/<Component>/`; downstream steps receive
upstream artifacts as read-only `@/docs/<Component>/...` context. The orchestrator owns *only the
order* — it never edits an artifact or talks to a skill's subagents directly.

| Step | Skill | Subagent(s) | Input | Output artifact |
|------|-------|-------------|-------|-----------------|
| 1 | `sk-extract` | **Parser** | brief | `extraction.json` (+ creates the component folder) |
| 2 | `sk-audit` | **States Analyst** ‖ **A11y Auditor** | extraction | `gaps.states.json`, `gaps.a11y.json` |
| 3 | `sk-create-spec` | **Spec Author** | extraction + gaps | `spec.json` *(frozen contract)* |
| 4 | `sk-create-implementation` | **Code Generator** | spec | `src/<Component>/*`, `generated.meta.json` |
| 5 | `sk-validate-implementation` | **Token Validator** ‖ **QA Reviewer** | code, spec | `validation.tokens.json`, `validation.qa.json` |
| 6 | `sk-create-report` | **Assembler** | everything | `output.json` |

### Control flow & guarantees
- **Folder threading:** step 1 creates `docs/<Component>/`; the orchestrator resolves that slug
  (newest/new directory under `/docs`) and passes it verbatim into every later step.
- **Spec gate (after step 3):** every required state (from extraction + states-gap) must appear
  in `spec.json`. The spec is **frozen** after this point and downstream steps read it, never the prose.
- **Repair loop (steps 4–5):** if token compliance fails or state coverage `< 100%`, only the
  **Code Generator** re-runs with a targeted fix-list. The spec is never touched. If still broken,
  the pipeline reports an honest failure rather than a fabricated pass.
- **Ground-truth token check:** the **Token Validator** reads the actual generated CSS/TS and flags
  any `var(--…)` or `@acme/ui` import not in the catalog, plus raw color literals (`#hex`, `rgb()`).
  Its verdict is **authoritative** and overrides whatever an LLM claims about `token_compliance`.
- **Stop on failure:** if any step fails or omits its expected artifact, the pipeline halts and
  reports which step failed — it does not fabricate a downstream pass.

## Conventions for generated code
- **Styling:** CSS Modules with design-token CSS variables only — `var(--color-text-primary)`.
  No raw hex/rgb/inline literal colors.
- **Composition:** compose catalog components from `@acme/ui` (Button, Input, FormField, Alert,
  Spinner, Skeleton, …). Importing a component not in `components.json` is a hallucination.
- **State model:** every visual state must be reachable from props (no hidden internal-only states).
- **File layout per component:** `<Name>/<Name>.tsx`, `<Name>.module.css`, `<Name>.stories.tsx`,
  `<Name>.test.tsx`, `index.ts`.

## Testing
See [.ai/rules/TestingHints.md](.ai/rules/TestingHints.md). The project ships agent prompts and
generated test scaffolding; there is no top-level test runner for the pipeline itself.
- **Generated components:** React Testing Library + **Vitest**, ≥1 test per declared state in
  `spec.json`, plus an `axe` accessibility smoke test.
- **Query by role/label** (`getByRole`, `getByLabelText`), not test ids.
- **No network in component tests** — pass data/callbacks via props.
- Every state also gets a Storybook story (`*.stories.tsx`) as the visual-regression fixture.

## Working rules for agents
- Honor the file-based contract: read only the inputs you are given, write only your declared artifact.
- Never bypass `spec.json`; never let the Code Generator read the raw brief or images.
- Never invent tokens, CSS variables, or component imports — validate against `design-system/`.
- Keep changes minimal and aligned with [.ai/rules/CodeStyle.md](.ai/rules/CodeStyle.md) and
  [.ai/rules/Architecture.md](.ai/rules/Architecture.md).
- When something is genuinely ambiguous and blocks progress, surface a specific either/or question
  rather than guessing.
