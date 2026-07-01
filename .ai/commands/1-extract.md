---
name: extract
description: Requirements Extraction - Requirements Parser and Analysis
argument-hint: <brief - text, possibly a Figma link / screenshot notes>
---

# Extract requirements

Turn the raw human brief into structured, grounded facts. First step of the pipeline.

## Inputs
- $ARGUMENTS

## Algorithm

Call the Task Tool to describe brief requirements:

- `subagent_type`: `parser`
- `prompt`: "Input data (description of brief needs): $ARGUMENTS.
Return a list of created or modified files for subsequent review, and state explicitly the
component folder path (`docs/<slug>/`) and the full path to the `extraction.json` you wrote."

Wait for the agent to complete, then **surface the component folder path and the `extraction.json`
path back to the caller** — the orchestrator threads `{FOLDER}` from that path, not from filesystem
timestamps. If no `extraction.json` path was produced, report step 1 as failed.

## Quality checkpoints
- JSON parses and matches the parser's declared output shape.
- `component.type` ∈ `{form, card, table, modal, page}`.
- No invented states/tokens: `specified_states` and `tokens_referenced` are grounded in the brief;
  values without a matching token land in `unmapped_values` (never guessed).

## Stop conditions
- **Retry** (≤2): JSON invalid or schema mismatch → re-prompt `parser` with the error.
- **Abort:** still invalid after retries, or `brief.md` is empty/missing.
