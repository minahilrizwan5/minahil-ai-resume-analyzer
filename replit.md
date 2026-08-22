# Minahil — AI Resume Analyzer

AI-powered Resume & Job Match Tool that compares a pasted resume with a pasted job description and returns practical next steps.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `OPENROUTER_API_KEY` — server-side OpenRouter credential

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/resume-analyzer/src/App.tsx` — single-page resume analysis experience
- `artifacts/resume-analyzer/src/index.css` — visual theme and responsive styles
- `artifacts/api-server/src/routes/analyze.ts` — validated OpenRouter analysis and PDF/DOCX extraction endpoints
- `lib/api-spec/openapi.yaml` — source of truth for the analysis contract

## Architecture decisions

- Resume text is sent only from the server to OpenRouter; the browser never receives the API key.
- The analysis response is constrained to a small JSON contract and validated before it reaches the UI.
- No database or accounts are used because the requested experience is intentionally transient and lightweight.

## Product

- Users upload a PDF/DOCX resume or load sample content, add a job description, and run an AI comparison.
- Results include a 0–100 match score, strengths, missing skills, improvement suggestions, and five interview questions.

## User preferences

- Keep the project small, reliable, understandable, and free of unnecessary features.

## Gotchas

- Keep `OPENROUTER_API_KEY` in Replit Secrets; never expose it in client code or logs.
- The generated Zod package currently uses Zod 3, so OpenAPI numeric score validation uses `number` with 0–100 bounds instead of `integer`.
- Uploaded resumes are held in memory for extraction only and are limited to 5 MB; they are not persisted.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
