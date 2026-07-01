---
name: validation
description: Check the generated code against ground truth and against the specification
argument-hint: <path to the folder with requirements, format: @/docs/{COMPONENT_FOLDER}>"
---

# Validate & repair loop

Check the generated code against ground truth and against the spec, then **report** whether it
passes (`tokensOk` / `coverageOk`) plus the `fix_list`. Combines one **deterministic** check with
two **sequential** LLM validators. The accept-vs-loop decision is **owned by the `generate-component`
orchestrator**, not by this step — it only produces the inputs that decision is made from.

## Checks (one deterministic)
- **Deterministic token check** — a non-LLM check the orchestrator runs over the generated
  CSS/TS against `../../design-system/tokens.json` and `../../design-system/components.json`. Authoritative
  for `token_compliance`.

## Inputs
- $ARGUMENTS

## Algorithm
1. Run the **deterministic token check** over `generated.meta.json` vs `tokens.json` /
   `components.json` → hallucinations, raw literals, unknown imports.
2. Call the Task Tool to check the generated code uses only existing tokens and components:

- `subagent_type`: `token-validator`
- `prompt`: "Input data (path to the folder with requirements): $ARGUMENTS.
Write your output to `$ARGUMENTS/validation.tokens.json` (the fully-qualified path inside the
component folder, not a bare filename). Return a list of created or modified files for review."

Wait for the agent to complete, then **verify `$ARGUMENTS/validation.tokens.json` actually exists
on disk** — do not trust the agent's claim of success. If it is missing, re-run this agent once;
if still missing, fail step 5 (do not proceed).
3. Call the Task Tool to check the generated code fully complies with the specification:

- `subagent_type`: `qa-reviewer`
- `prompt`: "Input data (path to the folder with requirements): $ARGUMENTS.
Write your output to `$ARGUMENTS/validation.qa.json` (the fully-qualified path inside the
component folder, not a bare filename). Return a list of created or modified files for review."

Wait for the agent to complete, then **verify `$ARGUMENTS/validation.qa.json` actually exists on
disk** — do not trust the agent's claim of success. If it is missing, re-run this agent once; if
still missing, fail step 5 (do not proceed).
4. **Override:** replace the token-validator's `token_compliance`, `hallucinations_caught`, and
   `raw_literals_found` with the deterministic result — the LLM never has the final word on these.
5. **Confirm both artifacts are on disk** at `/docs/{COMPONENT_FOLDER}/validation.tokens.json` and
   `/docs/{COMPONENT_FOLDER}/validation.qa.json` (the validators write them; this step does not
   fabricate them). Only once both files exist may the decision inputs below be computed.
6. **Report the decision inputs — the orchestrator owns the loop.** This skill does
   **not** loop back or advance on its own; it computes and reports, and the
   `generate-component` orchestrator decides accept vs. repair. Emit:
   - `tokensOk` = deterministic `token_compliance`.
   - `coverageOk` = `qa.states_coverage` numerator == denominator.
   - `fix_list = qa.fix_list ∪ det.hallucinations_caught ∪ det.raw_literals_found`
     (the defects a repair pass must fix; empty when both checks pass).
7. Generating a Final Report
After both agents have completed, generate a final report:
1. Fix status
2. Number of fixed errors
3. List of created or modified files
4. Recommendations for further actions

## CRITICAL RULES

**PROHIBITED:**

- ❌ Running agents in parallel
- ❌ Skipping any of the steps
- ❌ Edit code directly (use agents only)
- ❌ Modify project rule files

**PERMITTED:**

- ✅ Run agents sequentially via the Task tool
- ✅ Generate a final report
- ✅ Provide recommendations to the user

## Artifact transfer out
- `validation.tokens.json`, `validation.qa.json` → consumed by [6-assemble](6-assemble.md).
- `tokensOk` / `coverageOk` / `fix_list` → reported to the `generate-component`
  orchestrator, which owns the accept-vs-repair decision and, on repair, re-runs
  [4-generate](4-generate.md) with the `fix_list`.

## Quality checkpoints
- Both validator JSONs valid against their schemas.
- `token_compliance` reflects the **deterministic** verdict, not the agent's claim.
- `states_coverage` denominator == number of states in `spec.json`.

## Stop conditions
- **Retry** (≤2) per agent on invalid/mismatched JSON; **abort** if still invalid.
- **Repair budget (enforced by the orchestrator):** the orchestrator re-runs step 4
  at most **2** times; this skill never loops on its own.
- **Honest failure:** when the budget is exhausted and checks still fail, the orchestrator
  does **not** loop again and does **not** fudge numbers — it proceeds to assembly carrying the
  real failing values. The CLI exits non-zero on `token_compliance == false`.
