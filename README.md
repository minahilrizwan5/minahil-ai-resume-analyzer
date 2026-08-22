# Minahil — AI Resume Analyzer

Minahil is a lightweight AI-powered resume and job matching tool. Upload a PDF or DOCX resume, paste a specific job description, and get a practical comparison that helps you prepare your application and interview story.

## The problem

Resumes and job descriptions often use different language, making it difficult to see what already aligns and what needs attention. Minahil turns that comparison into a concise, useful readout instead of leaving applicants to manually inspect both documents.

## Features

- Upload PDF or DOCX resumes up to 5 MB
- Extract resume text server-side without persisting uploaded files
- Paste a job description directly into the app
- Generate an AI match score from 0–100
- Identify resume strengths and missing skills
- Receive targeted improvement suggestions
- Generate five role-specific interview questions
- Load sample resume and job-description content
- Show loading, validation, upload, API, and parsing errors clearly
- Keep the OpenRouter API key exclusively on the server

## Tech stack

- React and Vite
- TypeScript
- Express 5
- pnpm workspaces
- Tailwind CSS and Lucide icons
- Zod validation with generated API contracts
- `pdf-parse` for PDF extraction
- `mammoth` for DOCX extraction
- OpenRouter Chat Completions API

## How the AI integration works

1. The browser sends the selected resume file and job description to the API server.
2. The API server extracts text from the PDF or DOCX file in memory.
3. The server sends the extracted resume and job description to OpenRouter.
4. OpenRouter returns a structured analysis.
5. The server safely extracts JSON, including responses wrapped in markdown, validates the response with Zod, and returns only the validated result to the browser.

The browser never receives the OpenRouter credential. Uploaded resumes are used for the current analysis only and are not saved to a database or file store.

## Analysis response

The validated response contains:

```json
{
  "match_score": 0,
  "strengths": [],
  "missing_skills": [],
  "improvement_suggestions": [],
  "interview_questions": []
}
```

## Running locally

### Prerequisites

- Node.js 20+
- pnpm
- An OpenRouter API key

### Install

```bash
pnpm install
```

### Configure the API key

Set `OPENROUTER_API_KEY` in the server environment or in Replit Secrets. Do not commit the key to the repository or place it in frontend code.

For a local shell session:

```bash
export OPENROUTER_API_KEY="your-key"
```

### Start the application

Start the API server:

```bash
pnpm --filter @workspace/api-server run dev
```

Start the frontend in a second terminal:

```bash
pnpm --filter @workspace/resume-analyzer run dev
```

The exact preview ports are controlled by the project workflows and environment.

## Quality checks

Run the workspace checks with:

```bash
pnpm run typecheck
pnpm run build
```

## Project structure

```text
artifacts/
  api-server/       Express API, file extraction, and OpenRouter integration
  resume-analyzer/  React/Vite user interface
lib/
  api-spec/         OpenAPI source contract
  api-client-react/ Generated React API client
  api-zod/          Generated Zod schemas
```

## Privacy and security

- `OPENROUTER_API_KEY` is read only by the API server.
- No API key is hardcoded in the source code.
- Uploaded resume files are held in memory for extraction and are not persisted.
- No accounts, database records, or saved resumes are required.

## License

This project is provided for personal and educational use. Add a license appropriate to your intended distribution before publishing derivative work.