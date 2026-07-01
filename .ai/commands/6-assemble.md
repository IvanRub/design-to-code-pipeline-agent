---
name: assembler report
description: Synthesize every upstream artifact into the single report
argument-hint: <path to the folder with requirements, format: @/docs/{COMPONENT_FOLDER}>"
---

# Assemble the final report

Synthesize every upstream artifact into the single schema-conformant `output.json`. Pure mapping:
the assembler does not re-judge, re-derive, or re-validate anything.

## Inputs
- $ARGUMENTS

## Algorithm
1. Call the Task Tool to generate a final report:

- `subagent_type`: `assembler`
- `prompt`: "Input data (path to the folder with requirements): $ARGUMENTS.
Return a list of created or modified files for subsequent review."

Wait for the agent to complete and save the list of files from its response.
2. Validate output against the assembler's declared output contract (its **Output** section).
3. **Authoritative override:** regardless of what the assembler synthesized, set
   - `validation.token_compliance` ← `validation.tokens.json.token_compliance`
   - `validation.hallucinations_caught` ← `validation.tokens.json.hallucinations_caught`
   - `validation.states_coverage` ← `validation.qa.json.states_coverage`
4. Write `/docs/{COMPONENT_FOLDER}/output.json`.

## Artifact transfer out
- `output.json` — the final deliverable. The CLI prints a summary and sets the process exit code
  from `validation.token_compliance` (non-zero on failure, for CI gating).

## Quality checkpoints
- JSON valid against the assembler's declared output shape; every key present with the correct type.
- `gap_analysis` correctly merges both gap reports; `issues_found` = `qa.issues_found ∪
  tokens.misuse_warnings`.
- Overridden validation fields match the upstream validators exactly (no drift).

## Stop conditions
- **Retry** (≤2): invalid/mismatched JSON → re-prompt with the error.
- **Abort** if still invalid after retries.
- Note: a *failing* validation report is a valid, expected output here — it is reported honestly,
  not treated as an error.
