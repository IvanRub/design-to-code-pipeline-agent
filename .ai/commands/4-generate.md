---
name: create-implementation
description: Development of software code according to specification
argument-hint: <path to the file with the specification, format: @/docs/{COMPONENT_FOLDER}/spec.json>"
---

# Generate code

Implement the component in React 18 + TypeScript strictly from the frozen `spec.json`. This step
is the **head of the repair loop**: on a repair iteration it re-runs here with a fix-list and
regenerates only the defects, leaving the spec untouched.


## Inputs
- $ARGUMENTS
- **On repair iterations only:** the accumulated `fix_list` from [5-validate](5-validate.md),
  passed as an extra instruction: *"Fix ONLY these defects, keep the rest."*

## Algorithm
1. Call the Task Tool (switch_mode) to check for missing states & responsive gaps:

- `subagent_type`: `code-generator`
- `prompt`: "Input data (path to the folder with specification): $ARGUMENTS (+ `fix_list` if `iter > 0`).
Return a list of created or modified files for subsequent review."

Wait for the agent to complete and save the list of files from its response.
2. Validate output against the code-generator's declared output contract (its **Output** section).
3. Write `/docs/{COMPONENT_FOLDER}/generated.meta.json`, then materialize each `files[]` entry to
   `/src/<filename>` for humans.

## Quality checkpoints
- JSON valid against the code-generator's declared output shape.
- `states_covered` == the set of `spec.states[].name`.
- Per role contract: every `var(--…)` in CSS has a matching `tokens_used` entry; every
  `tokens_used` entry exists in `tokens.json`; every import exists in `components.json`.
- One story and one test per state, plus an axe smoke test (per TestingHints).

> The hard token/import verdict is enforced downstream by the deterministic check in step 5 —
> this checkpoint is the generator's self-discipline, not the gate.

## Stop conditions
- **Retry** (≤2): invalid/mismatched JSON → re-prompt with the error.
- **Abort** if still invalid after retries.
- **Loop control:** this step runs at most **3** times across the run (initial generation + up to
  2 repairs); the decision to loop is made by [5-validate](5-validate.md).
