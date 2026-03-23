import "dotenv/config";
import { InferenceClient } from "@huggingface/inference";

const hfToken = process.env.HF_TOKEN;

if (!hfToken) {
  throw new Error("Missing HF_TOKEN in .env");
}

const client = new InferenceClient(hfToken);

const MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const PROVIDER = "auto";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type Route = "booker" | "info" | "unclear";

async function callModel(messages: Message[]): Promise<string> {
  const response = await client.chatCompletion({
    provider: PROVIDER,
    model: MODEL,
    messages,
    max_tokens: 200,
    temperature: 0.1,
  });

  return response.choices?.[0]?.message?.content?.trim() ?? "";
}

/**
 * Step 1: route the request
 */
async function routeRequest(userInput: string): Promise<Route> {
  const decision = await callModel([
    {
      role: "system",
      content: `
You are a request router.

Classify the user's request into exactly one category:
- "booker" -> flights, hotels, reservations, bookings
- "info" -> general questions, facts, explanations
- "unclear" -> vague or ambiguous requests

Return ONLY one word:
booker
info
unclear
      `.trim(),
    },
    {
      role: "user",
      content: userInput,
    },
  ]);

  const cleaned = decision.toLowerCase().trim();

  if (cleaned === "booker") return "booker";
  if (cleaned === "info") return "info";
  return "unclear";
}

/**
 * Booker handler
 */
async function bookingHandler(userInput: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "You are a booking assistant. Help with flight and hotel booking requests in a clear, practical way.",
    },
    {
      role: "user",
      content: userInput,
    },
  ]);
}

/**
 * Info handler
 */
async function infoHandler(userInput: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "You are an information assistant. Answer clearly and concisely.",
    },
    {
      role: "user",
      content: userInput,
    },
  ]);
}

/**
 * Unclear handler
 */
async function unclearHandler(userInput: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "You are a clarification assistant. The user's request is unclear. Ask a short clarifying question.",
    },
    {
      role: "user",
      content: userInput,
    },
  ]);
}

/**
 * Main routing flow
 */
async function runRouter(userInput: string) {
  console.log("\n--- STEP 1: ROUTE DECISION ---");
  const route = await routeRequest(userInput);
  console.log(route);

  console.log("\n--- STEP 2: HANDLER OUTPUT ---");

  let result = "";

  if (route === "booker") {
    result = await bookingHandler(userInput);
  } else if (route === "info") {
    result = await infoHandler(userInput);
  } else {
    result = await unclearHandler(userInput);
  }

  console.log(result);
}

const input =
  process.argv.slice(2).join(" ") ||
  "Book me a hotel in Paris for next weekend.";

runRouter(input).catch((err) => {
  console.error("Router failed:", err);
});
