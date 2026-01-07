const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.planProject = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Allow preflight
      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      const { idea, time, experience, mode } = req.body;

      if (!idea) {
        return res.status(400).json({ error: "Missing input" });
      }

      let prompt;

      if (mode === "study") {
        prompt = `
You are an AI Study Planner acting as an expert academic coach.

Learning goal: "${idea}"
Available time: "${time || "flexible"}"
Experience level: "${experience || "beginner"}"

Return ONLY valid JSON:
{
  "overview": "learning goal summary",
  "timeline": "total study duration",
  "dailyPlan": [
    {
      "day": "Day 1",
      "focus": "main topic",
      "tasks": ["task 1", "task 2"]
    }
  ],
  "studyTips": ["tip 1", "tip 2"],
  "risks": ["risk 1"]
}
`;
      } else {
        prompt = `
You are an AI Project Planner.

Project idea: "${idea}"
Available time: "${time || "flexible"}"
Experience level: "${experience || "beginner"}"

Return ONLY valid JSON:
{
  "overview": "project summary",
  "tasks": [
    { "title": "Task", "description": "Details" }
  ],
  "timeline": "estimated duration",
  "techStack": ["Firebase", "JavaScript"],
  "risks": ["risk"]
}
`;
      }

      const result = await model.generateContent(prompt);
      let text = result.response.text();

      text = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(text);

      res.json(data);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "AI generation failed" });
    }
  });
});
