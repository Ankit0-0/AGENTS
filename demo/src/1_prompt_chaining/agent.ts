import "dotenv/config";
import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
const hfToken = process.env.HF_TOKEN;

if (!hfToken) {
  throw new Error("Missing HF_TOKEN in .env");
}

const client = new InferenceClient(hfToken);

// Pick any chat-capable model/provider combo supported by HF Inference Providers.
// You may need to change this depending on what is currently available to your account.
const MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const PROVIDER = "auto";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function callModel(messages: Message[]): Promise<string> {
  const response = await client.chatCompletion({
    provider: PROVIDER,
    model: MODEL,
    messages,
    max_tokens: 400,
    temperature: 0.3,
  });

  return response.choices?.[0]?.message?.content?.trim() ?? "";
}

/**
 * Step 1: understand the request
 */
async function analyzeTask(userInput: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "You are a task analyzer. Extract the user's goal, constraints, and desired output format. Be concise.",
    },
    {
      role: "user",
      content: `User request: ${userInput}`,
    },
  ]);
}

/**
 * Step 2: make a plan from the analysis
 */
async function createPlan(analysis: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "You are a planning assistant. Based on the analysis, create a short step-by-step plan. Keep it practical.",
    },
    {
      role: "user",
      content: `Analysis:\n${analysis}`,
    },
  ]);
}

/**
 * Step 3: generate final answer using both previous steps
 */
async function generateFinal(
  userInput: string,
  analysis: string,
  plan: string,
): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "You are a helpful assistant. Use the analysis and the plan to produce the final answer. Be clear and useful.",
    },
    {
      role: "user",
      content:
        `Original user request: ${userInput} Task analysis: ${analysis} Plan: ${plan} Now produce the final response.`.trim(),
    },
  ]);
}

async function runPromptChain(userInput: string) {
  console.log("\n--- STEP 1: ANALYSIS ---");
  const analysis = await analyzeTask(userInput);
  console.log(analysis);

  console.log("\n--- STEP 2: PLAN ---");
  const plan = await createPlan(analysis);
  console.log(plan);

  console.log("\n--- STEP 3: FINAL OUTPUT ---");
  const finalAnswer = await generateFinal(userInput, analysis, plan);
  console.log(finalAnswer);
}

const input =
  process.argv.slice(2).join(" ") ||
  "Help me learn backend engineering in a structured way over the next 3 months.";

runPromptChain(input).catch((err) => {
  console.error("Agent failed:", err);
});