---
name: sk-sync-tokens
description: Sync design tokens from a Figma/JSON export into design-system ground truth, then reconcile existing specs
argument-hint: <path to a Figma or design-tokens JSON export, e.g. @design-system/incoming/figma.tokens.json> [--dry-run]
disable-model-invocation: true
---

# Sync design tokens

Pull design tokens from a **Figma export** or a **design-tokens JSON** file into the project's
ground truth and reconcile the existing design-system specs in the same pass:
- `design-system/tokens.json` — the token source of truth.
- `design-system/components.json` — the reusable component catalog.

This is the **only sanctioned way to mutate the design-system folder**. Per the operating contract
(AGENTS.md §Core philosophy #3), a token or component is valid only if it appears here; the
deterministic token check ([scripts/token-check.ts](../../scripts/token-check.ts)) treats anything
else as a hallucination.

## Scope guard — design-system/ only
Every write this skill makes stays **inside `design-system/`**. It MUST NOT edit `docs/`, `src/`, `.ai/`, or any other location. Specs and generated code elsewhere are reconciled later by
re-running their own pipeline steps (see Step 6) — not by this skill.

## Inputs
- $ARGUMENTS — path to the source export, plus optional flags:
  - `--dry-run` — compute and print the diff, write nothing.

## Algorithm

### Step 1 — Load & detect source format
Read the source file. Reject early if it is missing or not valid JSON. Detect the schema:
- **Figma Variables** (REST `GET /v1/files/:key/variables/local`, or Tokens Studio / "Figma Tokens"
  plugin export) — nested collections/groups; leaves carry `valuesByMode`, or `$value` + `$type`.
- **W3C Design Tokens** — nested groups; leaves are `{ "$value", "$type" }`.
- **Flat JSON** — already `name → value` (or already in this repo's `name → { cssVar, value }` shape).

If no recognizable token schema is found, **abort** and report the unrecognized shape — do not guess.

### Step 2 — Normalize to canonical token records
For each leaf token, derive a record matching the existing taxonomy:
- **name** — dotted, lowercase path mapped into one of the canonical top-level buckets:
  `color` · `space` · `radius` · `font` · `shadow` · `breakpoint`.
  Map source group names onto the bucket (e.g. Figma `Colors / Background / Default` →
  `color.background.default`; `Spacing / 4` → `space.4`).
- **cssVar** — `--` + the dotted name with every `.` replaced by `-`
  (e.g. `color.text.primary` → `--color-text-primary`). This derivation is fixed; never hand-author it.
- **value** — the **resolved primitive** value only: hex / `rgba()` for color, `px` for dimensions,
  string for font family, etc. **Resolve all aliases** (`{color.brand.500}`, `$value: "{...}"`) down
  to their primitive. `tokens.json` never stores alias syntax.
- A source group that cannot be mapped to a canonical bucket is collected and **reported**, never
  dumped ungrouped into the file.

If the source export also carries **component** metadata (Tokens Studio component sets, a
`components` block, etc.), normalize each into a catalog record matching `components.json`:
`{ name, import, props[] }`, using the existing `@acme/ui` import convention unless the source states
otherwise.

### Step 3 — Diff against the current design-system files
Compute, per token name (and per component name), against `tokens.json` / `components.json`:
- **added** — present in source, absent locally.
- **removed** — present locally, absent in source.
- **changed** — same name, different `value` / `cssVar` (tokens), or different props / import (components).
- **renamed** *(heuristic, requires confirmation)* — a `removed` name and an `added` name share an
  identical resolved value. Propose it as a rename; do **not** auto-apply when values differ.

Print a summary table (added / removed / changed / renamed counts + the rename map) for both files.
If `--dry-run` was passed, **stop** here.

### Step 4 — Write `design-system/tokens.json`
Apply **added** and **changed** records and the confirmed **rename** map. Preserve `$meta`
(bump `$meta.version` if the source carries a version). Keep the existing category grouping,
ordering, and column alignment/formatting.

### Step 5 — Write `design-system/components.json`
Apply the reconciled component records: add new components, update changed props/imports, and apply
component renames. Preserve `$meta` and the `conventions` block verbatim unless the source explicitly
changes a convention. A component **removed** from the source is **not** silently deleted — keep it
and note it in the report (deletion would orphan any spec that composes it). If the export carries no
component metadata, leave `components.json` unchanged and say so.

### Step 6 — Report
Emit a sync report:
1. Token diff counts (added / removed / changed / renamed) and the applied rename map.
2. Component diff counts and any components flagged as removed-upstream-but-kept.
3. Files written (only ever `design-system/tokens.json` and/or `design-system/components.json`).
4. **Downstream follow-ups** — list every renamed/removed token so the operator knows which specs
   may now be stale. Recommend re-running `sk-create-spec` for affected components (to refresh the
   frozen `docs/*/spec.json`) and then `sk-validate-implementation`, so the deterministic token check
   confirms generated code still resolves against the new ground truth. This skill does **not** make
   those edits itself.

## CRITICAL RULES

**PERMITTED:**
- ✅ Write `design-system/tokens.json` and `design-system/components.json` (this skill owns them).
- ✅ Ask the user to confirm ambiguous renames before applying them.

**PROHIBITED:**
- ❌ Writing anywhere outside `design-system/` (no `docs/`, `src/`, `.ai/`).
- ❌ Storing alias / unresolved values — only resolved primitives land in `tokens.json`.
- ❌ Hand-authoring `cssVar` — it is always derived from the name.
- ❌ Auto-applying a rename when the two values differ.
- ❌ Silently deleting a component that disappeared upstream — keep it and flag it.

## Quality checkpoints
- Every record in `tokens.json` has `name`, `cssVar`, `value`; `cssVar` equals the derived form.
- No alias or unresolved values remain anywhere in `tokens.json`.
- Every component record in `components.json` has `name`, `import`, `props`; `$meta` and `conventions`
  are intact.
- All written JSON parses and keeps the existing structure; nothing outside `design-system/` changed.

## Stop conditions
- **Abort:** source path missing, not valid JSON, or no recognizable token schema.
- **Abort the write:** one or more source groups cannot be mapped to a canonical bucket — report the
  unmapped groups so the taxonomy mapping can be fixed first.
- **Pause for confirmation:** any heuristic rename where the removed and added values are not identical.

