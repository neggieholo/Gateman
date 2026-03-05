import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Helper to generate content from a prompt
const generateFromPrompt = async (prompt: string): Promise<string> => {
  if (!apiKey) return "API key missing, cannot generate content.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return text || "No output returned by model.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate content.";
  }
};

export const getEnergySavingTips = async (usageData: string): Promise<string> => {
  const prompt = `Provide 3 short, actionable energy saving tips based on this usage pattern: ${usageData}. Keep it friendly and concise.`;
  return await generateFromPrompt(prompt);
};

export const summarizeForumThread = async (posts: string): Promise<string> => {
  const prompt = `Summarize the following community discussion thread into 2-3 key takeaways: ${posts}`;
  return await generateFromPrompt(prompt);
};

export const generateEventIdeas = async (season: string): Promise<string[]> => {
  const prompt = `List 3 creative community event ideas for the ${season} season. Return only the event titles separated by commas.`;

  const text = await generateFromPrompt(prompt);
  return text
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);
};
