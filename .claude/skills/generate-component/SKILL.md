---
name: generate-component
description: Design-to-Code orchestration by running a team of single-responsibility AI agents
argument-hint: <brief - text, possibly a Figma link / screenshot notes>
disable-model-invocation: true
---

# Design-to-Code Pipeline — Orchestrator

> A runnable orchestration script. Follow it top to bottom. It drives the six
> pipeline skills **strictly in sequence** — each one finishes completely before
> the next begins, with **no parallelism at this level**. Steps 4 and 5 form a
> **bounded repair loop** (generate → validate), repeated up to 2 times until the
> code passes its checks, after which step 6 assembles the report — turning a
> single UI component brief into a validated `output.json`.
>
> This script owns **only the order and the repair-loop decision**. It never
> edits artifacts, never writes code, and never talks to a skill's internal
> subagents directly. The only artifacts it reads itself are the two
> `validation.*.json` files — and only to decide whether to loop. Each skill
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
   not invoke any other skill or do unrelated work. A step may be launched more
   than once — steps 4 and 5 repeat inside the repair loop — but every individual
   Task call still invokes exactly one skill and then stops. The loop is driven
   **here, by the orchestrator**, never by a subagent calling back into another
   skill.
3. **Thread the component folder.** Step 1 (`sk-extract`) creates a component
   folder under `/docs` (e.g. `docs/PaymentCardComponent/`) and its subagent
   returns the list of files it created. Read `{FOLDER}` **from that returned
   list** — it is the directory that holds the freshly written `extraction.json`
   (the parent of the returned `docs/<slug>/extraction.json` path). Do **not**
   guess it from filesystem timestamps or "most recently modified": an abandoned
   earlier run left in `/docs` would poison that heuristic. Before continuing,
   confirm `docs/{FOLDER}/extraction.json` exists; if step 1 reported no such
   path, treat step 1 as failed (rule 4). Use `{FOLDER}` verbatim in every
   remaining step's argument.
4. **Stop on failure.** If any step fails or does not produce its expected
   artifact, halt the pipeline and report which step failed. Do not fabricate a
   downstream pass. An honest failing report beats a fabricated success.
5. **Do not bypass the spec.** Never pass the raw brief, images, or Figma links
   to steps 4+. After step 3, `spec.json` is the frozen contract; downstream
   steps read it, not the prose.
6. **Repair loop owns the accept/loop decision.** Steps 4–5 run at most **3**
   times (initial generation + up to **2** repairs). After each step 5 the
   orchestrator reads the two `validation.*.json` files and either accepts (go to
   step 6) or, if repair budget remains, rebuilds a `fix_list` and re-runs step 4
   with it. The spec stays frozen throughout — only the code is regenerated. See
   the **Repair loop** block in Steps below.

## Steps

### Step 1 — `sk-extract`  (brief → `extraction.json`)
- **Task tool call:** invoke the `sk-extract` skill.
- **Argument:** the full `BRIEF` text, verbatim.
- **Produces:** `docs/{FOLDER}/extraction.json` (plus the component folder).
- **After it completes:** resolve `{FOLDER}` from the returned file list per rule 3
  (the parent folder of the reported `extraction.json`), and use it below.

### Step 2 — `sk-audit`  (`extraction.json` → `gaps.*.json`)
- **Task tool call:** invoke the `sk-audit` skill.
- **Argument:** `@/docs/{FOLDER}/extraction.json`
- **Produces:** `docs/{FOLDER}/gaps.states.json`, `docs/{FOLDER}/gaps.a11y.json`.

### Step 3 — `sk-create-spec`  (extraction + gaps → frozen `spec.json`)
- **Task tool call:** invoke the `sk-create-spec` skill.
- **Argument:** `@/docs/{FOLDER}`
- **Produces:** `docs/{FOLDER}/spec.json` — the frozen contract for all that follows.
- **Spec gate:** if `sk-create-spec` reports that a required state is missing from
  `spec.json`, the spec gate has failed — halt the pipeline per rule 4 and do not
  proceed to generation.

### Repair loop — Steps 4–5  (run up to 3×: initial generation + 2 repairs)

Maintain an iteration counter `iter`, starting at `0`, and a repair budget of
**2**. On each pass, run **Step 4** then **Step 5**, then apply the **Loop
decision**. Keep `fix_list` empty on the first pass (`iter = 0`).

#### Step 4 — `sk-create-implementation`  (`spec.json` → component code)
- **Task tool call:** invoke the `sk-create-implementation` skill.
- **Argument (iter 0):** `@/docs/{FOLDER}/spec.json`
- **Argument (iter > 0, repair):** `@/docs/{FOLDER}/spec.json` followed by the
  carried `fix_list`, appended verbatim as:
  `Fix ONLY these defects, keep everything else unchanged: {fix_list}`
- **Produces:** the generated component files plus `docs/{FOLDER}/generated.meta.json`.

#### Step 5 — `sk-validate-implementation`  (code + spec → `validation.*.json`)
- **Task tool call:** invoke the `sk-validate-implementation` skill.
- **Argument:** `@/docs/{FOLDER}`
- **Produces:** `docs/{FOLDER}/validation.tokens.json`, `docs/{FOLDER}/validation.qa.json`.

#### Loop decision  (orchestrator, after step 5 completes)
First **confirm both files exist on disk** at their full paths —
`docs/{FOLDER}/validation.tokens.json` and `docs/{FOLDER}/validation.qa.json`. A validator
subagent reporting success is **not** proof the file was written; check the disk. If either file
is missing, do not evaluate the decision — treat step 5 as failed per rule 4 (surface which
artifact is absent) rather than reading a bare `validation.qa.json`.

Then read the two files **by their full `docs/{FOLDER}/` paths** and evaluate:
- `tokensOk`  = `docs/{FOLDER}/validation.tokens.json` → `token_compliance` is `true`.
- `coverageOk` = in `docs/{FOLDER}/validation.qa.json` → `states_coverage`, numerator ==
  denominator (every spec state covered — e.g. `27/27`).

Then take exactly one branch:
- **Accept** — if `tokensOk && coverageOk`: exit the loop and go to **Step 6**.
- **Repair** — else if `iter < 2`: build `fix_list` from the same two full-path files —
  `docs/{FOLDER}/validation.qa.json.fix_list ∪ docs/{FOLDER}/validation.tokens.json.hallucinations_caught ∪ docs/{FOLDER}/validation.tokens.json.raw_literals_found`,
  increment `iter`, and go back to **Step 4** carrying that `fix_list`.
- **Honest failure** — else (`iter == 2`, checks still failing): stop looping and
  go to **Step 6** carrying the real failing numbers. Never loop past the budget
  and never fudge the values to force a pass (rule 4).

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

## Global stop conditions
- **Abort** (non-zero exit) if any agent fails JSON validation after retries, or the spec gate
  fails (step 3), or a required ground-truth file is missing.
- **Honest failure, not abort:** if the repair budget is exhausted while validation still fails,
  finish the pipeline and report the real failing numbers. The CLI exits non-zero on
  `token_compliance == false` so CI can gate on it; the report is never falsified to pass.

## Completion

When step 6 finishes, the run is complete. Report the path to the final report:

```
✅ Pipeline complete. Final report: docs/{FOLDER}/output.json
```
