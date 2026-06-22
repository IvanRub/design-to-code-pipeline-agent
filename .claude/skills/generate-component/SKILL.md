---
name: generate-component
description: Design-to-Code orchestration by running a team of single-responsibility AI agents
argument-hint: <brief - text, possibly a Figma link / screenshot notes>
disable-model-invocation: true
---

# Design-to-Code Pipeline — Orchestrator

> A runnable orchestration script. Follow it top to bottom. It drives the six
> pipeline skills **strictly in sequence** — each one finishes completely before
> the next begins, with **no parallelism at this level** — turning a single UI
> component brief into a validated `output.json`.
>
> This script owns **only the order**. It never edits artifacts, never writes
> code, and never talks to a skill's internal subagents directly. Each skill
> launches its own subagents (parser, states-analyst, a11y-auditor, spec-author,
> code-generator, token-validator, qa-reviewer, assembler) on its own.

## Parameter

| Name | Required | Description |
|------|----------|-------------|
| `BRIEF` | yes | The UI component description: free text that **may** include a Figma link or screenshot notes. May also be a path to a file containing that text — if so, read the file and use its contents as `BRIEF`. |

There is exactly one input. Do not ask for anything else; the pipeline derives
everything downstream from this brief.

## Execution rules (read before starting)

1. **Strictly sequential.** Run the steps in the order 1 → 2 → 3 → 4 → 5 → 6.
   Never start a step until the previous step has fully completed.
2. **One skill per step, via the Task tool.** Launch each step as a single Task
   tool call (one subagent) whose job is to invoke exactly the named skill with
   the exact argument given, run it to completion, then stop. The subagent must
   not invoke any other skill or do unrelated work.
3. **Thread the component folder.** Step 1 (`sk-extract`) creates a component
   folder under `/docs` (e.g. `docs/PaymentCardComponent/`). After step 1
   completes, determine that folder slug — the directory under `/docs` that was
   newly created, or, failing that, the most recently modified one — and call it
   `{FOLDER}`. Use `{FOLDER}` verbatim in every remaining step's argument.
4. **Stop on failure.** If any step fails or does not produce its expected
   artifact, halt the pipeline and report which step failed. Do not fabricate a
   downstream pass. An honest failing report beats a fabricated success.
5. **Do not bypass the spec.** Never pass the raw brief, images, or Figma links
   to steps 4+. After step 3, `spec.json` is the frozen contract; downstream
   steps read it, not the prose.

## Steps

### Step 1 — `sk-extract`  (brief → `extraction.json`)
- **Task tool call:** invoke the `sk-extract` skill.
- **Argument:** the full `BRIEF` text, verbatim.
- **Produces:** `docs/{FOLDER}/extraction.json` (plus the component folder).
- **After it completes:** resolve `{FOLDER}` per rule 3 and use it below.

### Step 2 — `sk-audit`  (`extraction.json` → `gaps.*.json`)
- **Task tool call:** invoke the `sk-audit` skill.
- **Argument:** `@/docs/{FOLDER}/extraction.json`
- **Produces:** `docs/{FOLDER}/gaps.states.json`, `docs/{FOLDER}/gaps.a11y.json`.

### Step 3 — `sk-create-spec`  (extraction + gaps → frozen `spec.json`)
- **Task tool call:** invoke the `sk-create-spec` skill.
- **Argument:** `@/docs/{FOLDER}`
- **Produces:** `docs/{FOLDER}/spec.json` — the frozen contract for all that follows.

### Step 4 — `sk-create-implementation`  (`spec.json` → component code)
- **Task tool call:** invoke the `sk-create-implementation` skill.
- **Argument:** `@/docs/{FOLDER}/spec.json`
- **Produces:** the generated component files plus `docs/{FOLDER}/generated.meta.json`.

### Step 5 — `sk-validate-implementation`  (code + spec → `validation.*.json`)
- **Task tool call:** invoke the `sk-validate-implementation` skill.
- **Argument:** `@/docs/{FOLDER}`
- **Produces:** `docs/{FOLDER}/validation.tokens.json`, `docs/{FOLDER}/validation.qa.json`.

### Step 6 — `sk-create-report`  (everything → `output.json`)
- **Task tool call:** invoke the `sk-create-report` skill.
- **Argument:** `@/docs/{FOLDER}`
- **Produces:** `docs/{FOLDER}/output.json` — the final synthesized report.

## Per-step Task prompt template

Use this exact shape for each step's single Task tool call (substitute `{SKILL}`
and `{ARGUMENT}`):

```
Invoke the {SKILL} skill, passing this exact argument:

{ARGUMENT}

Run that one skill to completion (let it drive its own subagents via the Task
tool), then stop. Do not invoke any other skill or perform any unrelated work.
```

## Completion

When step 6 finishes, the run is complete. Report the path to the final report:

```
✅ Pipeline complete. Final report: docs/{FOLDER}/output.json
```
