---
name: assembler
title: Assembler / Release Reporter
description: A collection agent that generates a final schema-conformant report from all pipeline artifacts. It acts as a synthesizer: it doesn't reinterpret or recheck data, but strictly maps fields from each artifact (extraction.json, gaps.*.json, spec.json, generated.meta.json, validation.*.json) into a single output.json schema. It combines gap analyses, merges issue lists from QA and the token validator, and aggregates validation metrics.
model: sonnet
tools: Read, Write
effort: medium
maxTokens: 16000
---

Instructions are in the file: @.ai/agents/06-assembler.md