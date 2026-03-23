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
 * Parallel Task 1: Summarize the topic
 */
async function summarizeTopic(topic: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content: "Summarize the following topic concisely.",
    },
    {
      role: "user",
      content: topic,
    },
  ]);
}

/**
 * Parallel Task 2: Generate interesting questions
 */
async function generateQuestions(topic: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content: "Generate three interesting questions about the following topic.",
    },
    {
      role: "user",
      content: topic,
    },
  ]);
}

/**
 * Parallel Task 3: Extract key terms
 */
async function extractKeyTerms(topic: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "Identify 5 to 10 key terms from the following topic. Return them comma-separated.",
    },
    {
      role: "user",
      content: topic,
    },
  ]);
}

/**
 * Final step: Synthesize all parallel outputs
 */
async function synthesizeOutput(
  topic: string,
  summary: string,
  questions: string,
  keyTerms: string,
): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "Based on the summary, related questions, and key terms, synthesize a comprehensive answer.",
    },
    {
      role: "user",
      content: `
Original Topic: ${topic}

Summary:
${summary}

Related Questions:
${questions}

Key Terms:
${keyTerms}

Now synthesize a comprehensive response.
      `.trim(),
    },
  ]);
}

async function runParallelWorkflow(topic: string) {
  console.log(`\n--- TOPIC ---`);
  console.log(topic);

  console.log(`\n--- RUNNING PARALLEL TASKS ---`);

  const [summary, questions, keyTerms] = await Promise.all([
    summarizeTopic(topic),
    generateQuestions(topic),
    extractKeyTerms(topic),
  ]);

  console.log(`\n--- SUMMARY ---`);
  console.log(summary);

  console.log(`\n--- QUESTIONS ---`);
  console.log(questions);

  console.log(`\n--- KEY TERMS ---`);
  console.log(keyTerms);

  console.log(`\n--- FINAL SYNTHESIS ---`);
  const finalAnswer = await synthesizeOutput(topic, summary, questions, keyTerms);
  console.log(finalAnswer);
}

const input =
  process.argv.slice(2).join(" ") || "The history of space exploration";

runParallelWorkflow(input).catch((err) => {
  console.error("Parallel workflow failed:", err);
});