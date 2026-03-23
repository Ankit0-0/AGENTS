import "dotenv/config";
import { InferenceClient } from "@huggingface/inference";

const hfToken = process.env.HF_TOKEN;

if (!hfToken) {
  throw new Error("Missing HF_TOKEN in .env");
}

const client = new InferenceClient(hfToken);

const MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const PROVIDER = "auto";
const MAX_ITERATIONS = 3;

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function callModel(messages: Message[], maxTokens = 700): Promise<string> {
  const response = await client.chatCompletion({
    provider: PROVIDER,
    model: MODEL,
    messages,
    max_tokens: maxTokens,
    temperature: 0.1,
  });

  return response.choices?.[0]?.message?.content?.trim() ?? "";
}

const taskPrompt = `
Your task is to create a Python function named \`calculate_factorial\`.

This function should do the following:
1. Accept a single integer \`n\` as input.
2. Calculate its factorial (n!).
3. Include a clear docstring explaining what the function does.
4. Handle edge cases: The factorial of 0 is 1.
5. Handle invalid input: Raise a ValueError if the input is a negative number.
`.trim();

/**
 * Step 1: Generate initial code
 */
async function generateInitialCode(task: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content:
        "You are a Python developer. Write clean, correct Python code that satisfies the user's requirements. Return only the code.",
    },
    {
      role: "user",
      content: task,
    },
  ]);
}

/**
 * Step 2: Critique code like a senior engineer
 */
async function critiqueCode(task: string, code: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content: `
You are a senior software engineer and an expert in Python.

Your job is to review the provided code against the original task requirements.
Look for:
- bugs
- missing edge cases
- bad style
- incomplete requirements
- incorrect behavior

If the code is perfect and meets all requirements, respond with exactly:
CODE_IS_PERFECT

Otherwise, respond with a concise bulleted list of critiques.
      `.trim(),
    },
    {
      role: "user",
      content: `
Original Task:
${task}

Code to Review:
${code}
      `.trim(),
    },
  ]);
}

/**
 * Step 3: Refine code using critique
 */
async function refineCode(task: string, previousCode: string, critique: string): Promise<string> {
  return callModel([
    {
      role: "system",
      content: `
You are a Python developer revising code based on review feedback.
Update the code to address every critique.
Return only the improved code.
      `.trim(),
    },
    {
      role: "user",
      content: `
Original Task:
${task}

Previous Code:
${previousCode}

Critique:
${critique}

Please refine the code to fully satisfy the task.
      `.trim(),
    },
  ]);
}

async function runReflectionLoop(task: string) {
  let currentCode = "";

  console.log("\n--- TASK ---");
  console.log(task);

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`\n==================== ITERATION ${i + 1} ====================`);

    if (i === 0) {
      console.log("\n>>> STAGE 1: GENERATING INITIAL CODE...");
      currentCode = await generateInitialCode(task);
    } else {
      // currentCode already updated in previous refine step
      console.log("\n>>> STAGE 1: USING REFINED CODE...");
    }

    console.log(`\n--- CODE (v${i + 1}) ---`);
    console.log(currentCode);

    console.log("\n>>> STAGE 2: CRITIQUING CODE...");
    const critique = await critiqueCode(task, currentCode);

    console.log("\n--- CRITIQUE ---");
    console.log(critique);

    if (critique.includes("CODE_IS_PERFECT")) {
      console.log("\nNo further critiques found. Stopping.");
      break;
    }

    if (i < MAX_ITERATIONS - 1) {
      console.log("\n>>> STAGE 3: REFINING CODE...");
      currentCode = await refineCode(task, currentCode, critique);
    }
  }

  console.log("\n==================== FINAL RESULT ====================");
  console.log(currentCode);
}

runReflectionLoop(taskPrompt).catch((err) => {
  console.error("Reflection loop failed:", err);
});