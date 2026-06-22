#!/usr/bin/env ts-node
/**
 * Design-to-Code pipeline orchestrator.
 *
 * Drives the six pipeline skills STRICTLY in sequence — one finishes completely
 * before the next begins, no parallelism — turning a single UI-component brief
 * into a validated `output.json`.
 *
 *   1. sk-extract                 brief  ............................ extraction.json
 *   2. sk-audit                   @/docs/{FOLDER}/extraction.json  .. gaps.*.json
 *   3. sk-create-spec             @/docs/{FOLDER}  ................. spec.json (frozen)
 *   4. sk-create-implementation   @/docs/{FOLDER}/spec.json  ....... generated.meta.json + /src
 *   5. sk-validate-implementation @/docs/{FOLDER}  ................. validation.*.json
 *   6. sk-create-report           @/docs/{FOLDER}  ................. output.json
 *
 * Each skill internally launches its own subagents via the Task tool (parser,
 * states-analyst, a11y-auditor, spec-author, code-generator, token-validator,
 * qa-reviewer, assembler). This orchestrator only owns the ORDER — it never
 * edits artifacts or talks to those subagents directly. Skills are invoked by
 * driving Claude Code through the Agent SDK with the Skill tool enabled.
 *
 * Usage:
 *   ts-node scripts/orchestrate.ts "<UI component description>"
 *   ts-node scripts/orchestrate.ts ./path/to/brief.md
 *
 * The single argument is the brief: inline text (which may include a Figma link
 * or screenshot notes) or a path to a file containing it.
 */
import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const DOCS_DIR = path.join(ROOT, "docs");

/** Tools each skill needs: Skill to enter it, Task to spawn its subagents, plus file/IO access. */
const ALLOWED_TOOLS = [
  "Skill",
  "Task",
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
  "Bash",
];

/** One pipeline step: the skill to run and how to build its argument from the threaded folder. */
interface Step {
  skill: string;
  /** Builds the skill argument. `folder` is the component folder slug under /docs (empty for step 1). */
  arg: (brief: string, folder: string) => string;
}

/**
 * The pipeline, in strict order. Only these six steps run — nothing else.
 * Arguments follow each skill's documented `argument-hint`.
 */
const STEPS: Step[] = [
  // 1. Extract structured facts from the raw brief.
  { skill: "sk-extract", arg: (brief) => brief },
  // 2. Gap analysis (states + a11y) over the extraction.
  { skill: "sk-audit", arg: (_b, folder) => `@/docs/${folder}/extraction.json` },
  // 3. Author the frozen spec from extraction + gaps.
  { skill: "sk-create-spec", arg: (_b, folder) => `@/docs/${folder}` },
  // 4. Generate React/TS code strictly from the spec.
  { skill: "sk-create-implementation", arg: (_b, folder) => `@/docs/${folder}/spec.json` },
  // 5. Validate generated code against ground truth + spec.
  { skill: "sk-validate-implementation", arg: (_b, folder) => `@/docs/${folder}` },
  // 6. Assemble every artifact into the final output.json.
  { skill: "sk-create-report", arg: (_b, folder) => `@/docs/${folder}` },
];

/** Resolve the brief: a readable file path is loaded, otherwise the argument is used verbatim. */
function resolveBrief(input: string): string {
  try {
    const candidate = path.resolve(ROOT, input);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return fs.readFileSync(candidate, "utf8").trim();
    }
  } catch {
    /* fall through to inline text */
  }
  return input.trim();
}

/** List component folder slugs under /docs (directories only). */
function listDocsFolders(): { name: string; mtimeMs: number }[] {
  if (!fs.existsSync(DOCS_DIR)) return [];
  return fs
    .readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({
      name: d.name,
      mtimeMs: fs.statSync(path.join(DOCS_DIR, d.name)).mtimeMs,
    }));
}

/**
 * Discover the component folder that step 1 (sk-extract) created/updated.
 * Prefers a folder that newly appeared (vs. the pre-run snapshot); otherwise
 * falls back to the most recently modified folder under /docs.
 */
function discoverComponentFolder(before: Set<string>): string {
  const after = listDocsFolders();
  const fresh = after.filter((f) => !before.has(f.name));
  const pool = fresh.length > 0 ? fresh : after;
  if (pool.length === 0) {
    throw new Error(
      "sk-extract did not produce a component folder under /docs — cannot continue."
    );
  }
  pool.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return pool[0].name;
}

/**
 * Run a single skill to completion by driving Claude Code through the Agent SDK.
 * Blocks until the skill's full message stream ends, then returns its final text.
 */
async function runSkill(skill: string, argument: string): Promise<string> {
  const prompt =
    `Invoke the ${skill} skill, passing this exact argument:\n\n${argument}\n\n` +
    `Run that one skill to completion (let it drive its own subagents via the Task tool), ` +
    `then stop. Do not invoke any other skill or perform any unrelated work.`;

  let finalText = "";

  for await (const message of query({
    prompt,
    options: {
      cwd: ROOT,
      permissionMode: "bypassPermissions",
      allowedTools: ALLOWED_TOOLS,
      model: process.env.PIPELINE_MODEL ?? "claude-opus-4-8",
    },
  })) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") process.stdout.write(block.text);
      }
    } else if (message.type === "result") {
      if (message.subtype !== "success") {
        throw new Error(`Skill ${skill} failed: ${message.subtype}`);
      }
      finalText = message.result ?? finalText;
    }
  }

  return finalText.trim();
}

async function main(): Promise<void> {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    console.error(
      'Usage: ts-node scripts/orchestrate.ts "<UI component description>" | <path/to/brief.md>'
    );
    process.exit(2);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set — aborting.");
    process.exit(2);
  }

  const brief = resolveBrief(input);
  const snapshotBefore = new Set(listDocsFolders().map((f) => f.name));

  let folder = "";

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];
    const argument = step.arg(brief, folder);

    console.log(`\n=== Step ${i + 1}/${STEPS.length}: ${step.skill} ===`);
    console.log(`    arg: ${argument.length > 120 ? argument.slice(0, 117) + "..." : argument}\n`);

    await runSkill(step.skill, argument);

    // After step 1, learn which /docs folder the pipeline is operating on and
    // thread it into every remaining step.
    if (i === 0) {
      folder = discoverComponentFolder(snapshotBefore);
      console.log(`\n>>> Component folder: docs/${folder}`);
    }
  }

  console.log(`\n✅ Pipeline complete. Final report: docs/${folder}/output.json`);
}

main().catch((err) => {
  console.error("\n❌ Pipeline aborted:", err instanceof Error ? err.message : err);
  process.exit(1);
});
