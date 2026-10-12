<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent guide

Shared conventions live under **`.cursor/rules/`**. They are product-neutral: structure, DRY, comments, tests, and verification.

- Structure and when to extract code: **`project-structure.mdc`**
- Types, exports, components: **`code-conventions.mdc`**
- Comments: **`comments-and-structure.mdc`**
- Tests: **`testing.mdc`**
- Chat language: **`.cursor/rules/assistant-chat-language.local.mdc`** — copy from **`assistant-chat-language.local.mdc.example`** if missing.
