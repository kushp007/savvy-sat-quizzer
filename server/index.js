/**
 * SAT Quizzer — API server (OpenAI stays server-side only).
 * Run: `node server/index.js` from project root (see README).
 */
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  generateFeedbackHandler,
  generateQuestionsHandler,
  healthHandler,
} from "./apiHandlers.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", healthHandler);
app.post("/api/generate-questions", generateQuestionsHandler);
app.post("/api/generate-feedback", generateFeedbackHandler);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`[sat-quiz-api] listening on http://localhost:${port}`);
});
