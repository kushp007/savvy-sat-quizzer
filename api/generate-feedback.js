import { generateFeedbackHandler } from "../server/apiHandlers.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  return generateFeedbackHandler(req, res);
}
