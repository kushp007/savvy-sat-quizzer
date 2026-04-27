/**
 * SAT Quizzer — API server (OpenAI stays server-side only).
 * Run: `node server/index.js` from project root (see README).
 */
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { z } from "zod";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const QuestionSchema = z.object({
  topic: z.string(),
  subtopic: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question: z.string().min(8),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().int().min(0).max(3),
  explanation: z.string().min(15),
});

const ResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
});

const FeedbackItemSchema = z.object({
  topic: z.string().min(1),
  subtopic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  selected: z.number().int().min(0).max(3),
  correct: z.number().int().min(0).max(3),
  isCorrect: z.boolean(),
});

const FeedbackRequestSchema = z.object({
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  percentage: z.number().min(0).max(100),
  answers: z.array(FeedbackItemSchema).min(1),
});

const FeedbackResponseSchema = z.object({
  summary: z.string().min(1),
  weakAreas: z.array(z.string()).default([]),
  strongAreas: z.array(z.string()).default([]),
  studyTips: z.array(z.string()).default([]),
});

function normalizeCorrectAnswer(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    const upper = trimmed.toUpperCase();
    const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
    if (upper in letterToIndex) return letterToIndex[upper];
  }
  return value;
}

function normalizeQuestion(rawQuestion) {
  if (!rawQuestion || typeof rawQuestion !== "object") return rawQuestion;

  const q = rawQuestion;
  return {
    topic: q.topic,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    question: q.question ?? q.questionText ?? q.prompt,
    options: q.options ?? q.choices,
    correctAnswer: normalizeCorrectAnswer(q.correctAnswer ?? q.answer),
    explanation: q.explanation,
  };
}

function getSafeErrorDetails(error) {
  if (!error || typeof error !== "object") {
    return {
      message: "Generation failed",
      status: undefined,
      code: undefined,
      type: undefined,
    };
  }

  return {
    message:
      typeof error?.message === "string" && error.message.length > 0
        ? error.message
        : "Generation failed",
    status:
      typeof error?.status === "number" || typeof error?.status === "string"
        ? error.status
        : undefined,
    code:
      typeof error?.code === "string" || typeof error?.code === "number"
        ? error.code
        : undefined,
    type: typeof error?.type === "string" ? error.type : undefined,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/generate-questions", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
          error: "OPENAI_API_KEY is not set. Add it to .env in the project root.",
          questions: [],
        });
  }

  const batchSize = Math.min(20, Math.max(5, Number(req.body?.batchSize) || 15));
  const recent = Array.isArray(req.body?.recentQuestionStems) ? req.body.recentQuestionStems : [];
  const recentBlock =
    recent.length > 0
      ? `Avoid repeating or paraphrasing these recent stems:\n${recent.map((s) => `- ${String(s).slice(0, 200)}`).join("\n")}\n`
      : "";

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const userPrompt = `Generate exactly ${batchSize} distinct SAT Math multiple-choice questions (calculator-appropriate style).

${recentBlock}

Requirements:
- Output JSON only, matching this shape: { "questions": [ ... ] }
- Use EXACT field names for each question object:
  - topic
  - subtopic
  - difficulty (easy|medium|hard)
  - question
  - options (array of exactly 4 strings)
  - correctAnswer (0-3 index into options)
  - explanation (1-3 sentences)
- Do not use alternate field names like questionText, prompt, choices, or answer.
- Use diverse topics across the batch: algebra, linear equations, quadratics, exponents, ratios, geometry, word problems.
- Mix difficulties: include easy, medium, and hard items in roughly balanced proportion.
- Questions must be mathematically correct; exactly one correct option.
- Do not duplicate stems or trivially reword the same problem.
- Keep stems concise (SAT-style).`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write valid JSON only. You are an expert SAT Math author. Never include markdown or prose outside JSON.",
        },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty model response");

    const parsed = JSON.parse(raw);
    const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    const normalizedQuestions = rawQuestions.map(normalizeQuestion);
    const validQuestions = [];

    normalizedQuestions.forEach((candidate) => {
      const result = QuestionSchema.safeParse(candidate);
      if (result.success) validQuestions.push(result.data);
    });

    if (validQuestions.length === 0) {
      console.error("[sat-quiz-api] OpenAI generation failed: no valid questions after normalization", {
        receivedCount: rawQuestions.length,
      });
      return res.status(500).json({
        error: "AI question batch failed. Using local question bank.",
        questions: [],
      });
    }

    if (validQuestions.length < rawQuestions.length) {
      console.warn("[sat-quiz-api] Dropped invalid AI questions", {
        receivedCount: rawQuestions.length,
        acceptedCount: validQuestions.length,
      });
    }

    const validated = ResponseSchema.parse({ questions: validQuestions });
    const ts = Date.now();

    const questions = validated.questions.map((q, i) => ({
      id: `ai-${ts}-${i}`,
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      question: q.question,
      options: [q.options[0], q.options[1], q.options[2], q.options[3]],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      source: "ai",
    }));

    return res.json({ questions });
  } catch (err) {
    const safeError = getSafeErrorDetails(err);
    console.error(
      `[sat-quiz-api] OpenAI generation failed: ${safeError.message}`,
      {
        status: safeError.status,
        code: safeError.code,
        type: safeError.type,
      }
    );
    return res.status(500).json({
      error: "AI question batch failed. Using local question bank.",
      questions: [],
    });
  }
});

app.post("/api/generate-feedback", async (req, res) => {
  const parsedReq = FeedbackRequestSchema.safeParse(req.body);
  if (!parsedReq.success) {
    return res.status(400).json({ error: "Invalid feedback request payload." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "OPENAI_API_KEY is not set." });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const openai = new OpenAI({ apiKey });
  const data = parsedReq.data;
  const condensedAnswers = data.answers.map((a) => ({
    topic: a.topic,
    subtopic: a.subtopic,
    difficulty: a.difficulty,
    selected: a.selected,
    correct: a.correct,
    isCorrect: a.isCorrect,
  }));

  const prompt = `Analyze this SAT Math quiz performance and return concise JSON only.
Return exactly this shape:
{
  "summary": "...",
  "weakAreas": ["...", "..."],
  "strongAreas": ["...", "..."],
  "studyTips": ["...", "...", "..."]
}

Requirements:
- Keep summary to 1-2 short sentences.
- weakAreas: up to 3 topic/subtopic areas where the learner missed most.
- strongAreas: up to 3 topic/subtopic areas where the learner performed best.
- studyTips: 2-3 actionable SAT-focused tips.
- Mention difficulty-level trend in the summary if useful.

Quiz stats:
${JSON.stringify(
    {
      score: data.score,
      totalQuestions: data.totalQuestions,
      percentage: data.percentage,
      answers: condensedAnswers,
    },
    null,
    2
  )}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a concise SAT Math coach. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty model response");

    const parsed = FeedbackResponseSchema.parse(JSON.parse(raw));
    return res.json(parsed);
  } catch (err) {
    const safeError = getSafeErrorDetails(err);
    console.error(`[sat-quiz-api] OpenAI feedback generation failed: ${safeError.message}`, {
      status: safeError.status,
      code: safeError.code,
      type: safeError.type,
    });
    return res.status(500).json({ error: "AI feedback unavailable." });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`[sat-quiz-api] listening on http://localhost:${port}`);
});
