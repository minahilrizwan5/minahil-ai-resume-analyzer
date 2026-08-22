import { Router, type IRouter } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import {
  AnalyzeResumeBody,
  AnalyzeResumeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const systemPrompt = `You are an expert recruiter and resume coach. Compare the candidate resume to the job description and return only valid JSON with exactly this shape:
{
  "match_score": number from 0 to 100,
  "strengths": string[],
  "missing_skills": string[],
  "improvement_suggestions": string[],
  "interview_questions": string[] of exactly 5 items
}
Be specific, concise, evidence-based, and constructive. Do not include markdown fences or any extra text.`;

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const cleaned = (fenced?.[1] ?? content).trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("The AI returned invalid JSON");
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("The AI returned malformed JSON");
  }
}

async function requestAnalysis(resume: string, jobDescription: string): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://replit.com",
      // HTTP headers must be byte-safe; keep this value ASCII-only.
      "X-Title": "Minahil AI Resume Analyzer",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}` },
      ],
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    let detail = responseText;
    try {
      const errorPayload = JSON.parse(responseText) as { error?: { message?: string } | string };
      detail = typeof errorPayload.error === "string"
        ? errorPayload.error
        : errorPayload.error?.message ?? detail;
    } catch {
      // Keep the original response text when the upstream body is not JSON.
    }
    throw new Error(`OpenRouter request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  let payload: { choices?: Array<{ message?: { content?: string | null } }> };
  try {
    payload = JSON.parse(responseText) as typeof payload;
  } catch {
    throw new Error("OpenRouter returned an unreadable response");
  }
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("The AI returned an empty response");
  return AnalyzeResumeResponse.parse(extractJson(content));
}

function sendAnalysisError(req: any, res: any, error: unknown): void {
  req.log.error({ err: error }, "Resume analysis failed");
  const message = error instanceof Error ? error.message : "Unknown analysis error";
  res.status(500).json({ error: `Analysis failed: ${message}` });
}

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a resume and job description with enough detail to analyze." });
    return;
  }
  try {
    res.json(await requestAnalysis(parsed.data.resume, parsed.data.jobDescription));
  } catch (error) {
    sendAnalysisError(req, res, error);
  }
});

router.post("/analyze/upload", (req, res): void => {
  upload.single("resume")(req, res, async (uploadError) => {
    if (uploadError) {
      req.log.warn({ err: uploadError }, "Resume upload rejected");
      res.status(400).json({ error: uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE"
        ? "That file is too large. Please upload a resume under 5 MB."
        : "We couldn't read that upload. Please choose a PDF or DOCX file." });
      return;
    }

    const jobDescription = typeof req.body.jobDescription === "string" ? req.body.jobDescription.trim() : "";
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Please upload a PDF or DOCX resume." });
      return;
    }
    if (jobDescription.length < 40) {
      res.status(400).json({ error: "Please add a job description with at least 40 characters." });
      return;
    }

    const extension = (file.originalname.split(".").pop() ?? "").toLowerCase();
    if (!["pdf", "docx"].includes(extension)) {
      res.status(400).json({ error: "Unsupported file type. Please upload a PDF or DOCX resume." });
      return;
    }

    try {
      const extracted = extension === "pdf"
        ? await pdfParse(file.buffer).then((result: { text: string }) => result.text)
        : (await mammoth.extractRawText({ buffer: file.buffer })).value;
      const resume = extracted.replace(/\s+/g, " ").trim();
      if (resume.length < 40) {
        res.status(400).json({ error: "That file appears to be empty. Please upload a resume with readable text." });
        return;
      }
      req.log.info(
        { fileType: extension, resumeCharacters: resume.length, jobDescriptionCharacters: jobDescription.length },
        "Resume extracted; requesting analysis",
      );
      res.json(await requestAnalysis(resume, jobDescription));
    } catch (error) {
      sendAnalysisError(req, res, error);
    }
  });
});

export default router;