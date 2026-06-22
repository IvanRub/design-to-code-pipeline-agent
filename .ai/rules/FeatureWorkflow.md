# Feature Workflow — how a component is built

The pipeline mirrors a real team. Each role runs in a **clean context** and only reads the
files the previous roles wrote. Steps 0–8:

| Step | Role(s) | Output artifact | Gate (stop if fails) |
|------|---------|-----------------|----------------------|
| 0 | Orchestrator: intake | `brief.md`, run dir | brief non-empty |
| 1 | **Parser / Requirements Analyst** | `extraction.json` | valid JSON, component type set |
| 2 | **States Analyst** ‖ **A11y Auditor** (parallel) | `gaps.states.json`, `gaps.a11y.json` | both valid JSON |
| 3 | **Spec Author / Tech Lead** | `spec.json` | every gap is resolved or explicitly waived |
| 4 | **Code Generator / Developer** | `generated/*`, `generated.meta.json` | files compile-shaped, meta valid |
| 5 | **Token Validator** ‖ **QA Reviewer** (parallel) | `validation.tokens.json`, `validation.qa.json` | 0 hallucinated tokens; coverage == spec |
| 6 | Orchestrator: assemble | `output.json` | matches Expected Output schema |
| 7 | Orchestrator: gate | — | if validation failed → loop to step 4 with feedback (max 2) |
| 8 | Orchestrator: report | console + `output.json` | — |

## Definition of Done
- `spec.json` lists every state including the ones the human omitted (empty/loading/error/disabled).
- `validation.tokens.json.hallucinations == []`.
- `validation.qa.json.states_coverage` numerator == denominator (all spec states covered + tested).
- Final `output.json` conforms to the Expected Output schema.

## Retry policy
- Invalid JSON from an agent → re-run that single agent with the parse error appended (max 2 retries).
- Hallucinated token or missing state at step 5 → re-run **step 4 only** with a structured
  "fix list", keeping the spec fixed. Never silently accept; never edit spec to match bad code.
