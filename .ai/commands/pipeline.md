# Command: pipeline (master orchestration)

End-to-end algorithm that turns a `brief.md` into a validated `output.json`. Each step is
detailed in its own command file. Agents never talk to each other — they exchange **files** in
the run directory `runs/<id>/`. This command owns the order; the agents do not know it.

## Shared conventions
- **Run dir:** every artifact is written under `runs/<id>/`. Inputs to an agent are passed as
  explicit read-only file paths; an agent reads only what it is given.
- **Ground truth (read-only, every step):** `../../design-system/tokens.json`,
  `../../design-system/components.json`.
- **JSON robustness:** every agent must return one JSON object matching its declared output
  contract. On invalid/non-matching JSON, re-prompt the same agent with the validation error.
  Max **2** retries, then **abort the pipeline**.
- **Determinism over claims:** mechanically verifiable facts (token existence, catalog imports,
  raw literals) are decided by code, not by an agent, and override any agent claim.

## Sequence
| Step | Command | Agent(s) | Writes |
|------|---------|----------|--------|
| 1 | [1-extract](1-extract.md) | parser | `extraction.json` |
| 2 | [2-gap-analysis](2-gap-analysis.md) | states-analyst ‖ a11y-auditor | `gaps.states.json`, `gaps.a11y.json` |
| 3 | [3-spec](3-spec.md) | spec-author | `spec.json` *(frozen)* |
| 4 | [4-generate](4-generate.md) | code-generator | `generated/*`, `generated.meta.json` |
| 5 | [5-validate](5-validate.md) | det. token check + token-validator ‖ qa-reviewer | `validation.tokens.json`, `validation.qa.json` |
| 6 | [6-assemble](6-assemble.md) | assembler | `output.json` |

## Control flow
```
1 extract
2 gaps.states ‖ gaps.a11y            (parallel barrier)
3 spec  ── SPEC GATE ───────────────  abort if a required state is missing
repeat (iter = 0 .. 2  — initial run + up to 2 repairs):
   4 generate  (iter>0 ⇒ pass fix_list, regenerate ONLY)
   5 det. token check + token-validator ‖ qa-reviewer
     if token_compliance AND states_coverage == 1/1 → break
     else fix_list = qa.fix_list ∪ det.hallucinations ∪ det.raw_literals
   if repair budget exhausted → keep going to step 6 with an HONEST failing report
6 assemble → output.json
```

## Global stop conditions
- **Abort** (non-zero exit) if any agent fails JSON validation after retries, or the spec gate
  fails (step 3), or a required ground-truth file is missing.
- **Honest failure, not abort:** if the repair budget is exhausted while validation still fails,
  finish the pipeline and report the real failing numbers. The CLI exits non-zero on
  `token_compliance == false` so CI can gate on it; the report is never falsified to pass.
