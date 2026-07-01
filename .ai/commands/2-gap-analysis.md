---
name: gap-analysis
description: Find what the brief omitted, on two independent axes, before any spec is written
argument-hint: <path to extraction.json>
---

# Gap analysis

Find what the brief omitted, on two independent axes, before any spec is written. The two
analysts run **in strict sequence** and never see each other's output — independence is the point.

## Inputs
- $ARGUMENTS

## Algorithm

### Step 1. Identifies missing UI component states and responsiveness gaps

Call the Task Tool to check for missing states & responsive gaps:

- `subagent_type`: `states-analyst`
- `prompt`: "Input data (the specified brief): $ARGUMENTS.
Return a list of created or modified files for subsequent review."

Wait for the agent to complete and save the list of files from its response.

### Step 2. Check UI components for compliance with WCAG 2.2 AA standards.

Call the Task Tool to check for WCAG 2.2 AA accessibility gaps:

- `subagent_type`: `a11y-auditor`
- `prompt`: "Input data (the specified brief): $ARGUMENTS.
Return a list of created or modified files for subsequent review."

Wait for the agent to complete and save the list of files from its response.

### Step 3: Generating a Final Report

After both agents have completed, generate a final report:

1. Fix status
2. Number of fixed errors
3. List of created or modified files
4. Recommendations for further actions

## CRITICAL RULES

**STRICT SEQUENCE:**

1. ✅ First, COMPLETELY terminate the `states-analyst` agent
2. ✅ Then COMPLETELY terminate the `a11y-auditor` agent
3. ✅ Only then generate a final report

**PROHIBITED:**

- ❌ Running agents in parallel
- ❌ Skipping any of the steps
- ❌ Edit code directly (use agents only)
- ❌ Modify project rule files

**PERMITTED:**

- ✅ Run agents sequentially via the Task tool
- ✅ Generate a final report
- ✅ Provide recommendations to the user

## Quality checkpoints
- Both JSON outputs valid against their schemas.
- `missing_states` is a true set difference vs `specified_states` (no overlap).
- Each responsive gap references a real `breakpoint.*` token; each a11y color gap cites the token
  pair and an estimated contrast ratio.

## Stop conditions
- **Retry** (≤2) per agent independently on invalid/mismatched JSON.
- **Abort** if either agent still fails after retries (the spec cannot be authored without both gap reports).
