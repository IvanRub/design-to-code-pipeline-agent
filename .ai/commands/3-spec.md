---
name: create-spec
description: Creating a specification - contract every downstream step is judged against
argument-hint: <path to the folder with requirements, format: @/docs/{COMPONENT_FOLDER}>"
---

# Author the spec

Merge the extraction and both gap reports into the single authoritative `spec.json`. This is the
contract every downstream step is judged against. **After this step the spec is frozen** — the
repair loop may regenerate code but must never edit the spec.

## Inputs
- $ARGUMENTS

## Algorithm
1. Call the Task Tool (switch_mode) to check for missing states & responsive gaps:

- `subagent_type`: `spec-author`
- `prompt`: "Input data (path to the folder with requirements): $ARGUMENTS.
Return a list of created or modified files for subsequent review."

Wait for the agent to complete and save the list of files from its response.
2. Validate output against the spec-author's declared output contract (its **Output** section).
3. **SPEC GATE** — compute `required = extraction.specified_states ∪ gaps.states.missing_states`.
   Every state in `required` must appear in `spec.states[].name`.
4. If the gate passes, write `/docs/{COMPONENT_FOLDER}/spec.json` and freeze it.

## Quality checkpoints
- JSON valid against the spec-author's declared output shape.
- `states` ⊇ (specified ∪ missing) — enforced by the spec gate.
- Every entry in `tokens` exists in `tokens.json`; every entry in `composes` exists in
  `components.json`. Values with no token are recorded in `open_questions`, not invented.
- Every gap from both reports is either folded into the spec or explicitly waived.

## Stop conditions
- **Retry** (≤2): invalid/mismatched JSON → re-prompt `spec-author` with the error.
- **Abort (spec gate failure):** if any required state is missing from the spec, stop the whole
  pipeline with `Spec gate failed: states not covered by spec: …`. Do **not** proceed to generation.
