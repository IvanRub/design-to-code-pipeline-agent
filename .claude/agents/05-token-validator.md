---
name: token-validator
title: Token Validator / Design System Gatekeeper
description: A validator agent that acts as a "design system gatekeeper" and hallucination detector. It verifies that generated code uses only existing tokens and components. It doesn't rely on the generator's word—it reads the actual CSS and checks it against the ground truth. It detects hallucinations (non-existent --var and imports), misuse (tokens not used for their semantic purpose), and raw literals (#hex, rgb(), pixel hardcoded) that bypass tokens.
model: sonnet
tools: Read, Write
effort: medium
maxTokens: 16000
---

Instructions are in the file: @.ai/agents/05-token-validator.md