---
name: validation
description: Check the generated code against ground truth and against the specification
argument-hint: <path to the folder with requirements, format: @/docs/{COMPONENT_FOLDER}>"
---

# Validate & repair loop

Check the generated code against ground truth and against the spec, then decide whether to accept
or loop back to [4-generate](4-generate.md). Combines one **deterministic** check with two
**parallel** LLM validators. This step owns the repair-loop decision.

## Checks (one deterministic)
- **Deterministic token check** — a non-LLM check the orchestrator runs over the generated
  CSS/TS against `../../design-system/tokens.json` and `../../design-system/components.json`. Authoritative
  for `token_compliance`.

## Inputs
- $ARGUMENTS

## Algorithm
1. Run the **deterministic token check** over `generated.meta.json` vs `tokens.json` /
   `components.json` → hallucinations, raw literals, unknown imports.
2. Call the Task Tool (switch_mode) to check for missing states & responsive gaps:

- `subagent_type`: `token-validator`
- `prompt`: "Input data (path to the folder with requirements): $ARGUMENTS.
Return a list of created or modified files for subsequent review."

Wait for the agent to complete and save the list of files from its response.
3. Call the Task Tool (switch_mode) to check for missing states & responsive gaps:

- `subagent_type`: `qa-reviewer`
- `prompt`: "Input data (path to the folder with requirements): $ARGUMENTS.
Return a list of created or modified files for subsequent review."

Wait for the agent to complete and save the list of files from its response.
4. **Override:** replace the token-validator's `token_compliance`, `hallucinations_caught`, and
   `raw_literals_found` with the deterministic result — the LLM never has the final word on these.
5. Write `/docs/{COMPONENT_FOLDER}/validation.tokens.json` and `/docs/{COMPONENT_FOLDER}/validation.qa.json`.
6. **Decision:**
   - `tokensOk` = deterministic `token_compliance`.
   - `coverageOk` = `qa.states_coverage` numerator == denominator.
   - If `tokensOk && coverageOk` → **accept**, exit loop, go to [6-assemble](6-assemble.md).
   - Else build `fix_list = qa.fix_list ∪ det.hallucinations_caught ∪ det.raw_literals_found` and
     loop back to [4-generate](4-generate.md).
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
- `fix_list` → fed back into [4-generate](4-generate.md) on the next iteration.

## Quality checkpoints
- Both validator JSONs valid against their schemas.
- `token_compliance` reflects the **deterministic** verdict, not the agent's claim.
- `states_coverage` denominator == number of states in `spec.json`.

## Stop conditions
- **Retry** (≤2) per agent on invalid/mismatched JSON; **abort** if still invalid.
- **Repair budget:** loop back to step 4 at most **2** times (the repair budget).
- **Honest failure:** when the budget is exhausted and checks still fail, do **not** loop again and
  do **not** fudge numbers — proceed to assembly carrying the real failing values. The CLI exits
  non-zero on `token_compliance == false`.
