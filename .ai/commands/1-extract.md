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

Call the Task Tool (switch_mode) to describe brief requirements:

- `subagent_type`: `parser`
- `prompt`: "Input data (description of brief needs): $ARGUMENTS.
Return a list of created or modified files for subsequent review."

Wait for the agent to complete and save the list of files from its response.

## Quality checkpoints
- JSON parses and matches the parser's declared output shape.
- `component.type` ∈ `{form, card, table, modal, page}`.
- No invented states/tokens: `specified_states` and `tokens_referenced` are grounded in the brief;
  values without a matching token land in `unmapped_values` (never guessed).

## Stop conditions
- **Retry** (≤2): JSON invalid or schema mismatch → re-prompt `parser` with the error.
- **Abort:** still invalid after retries, or `brief.md` is empty/missing.
