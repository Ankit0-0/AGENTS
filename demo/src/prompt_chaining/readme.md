````markdown
# Prompt Chaining Agent (TS + Hugging Face)

Minimal 3-step prompt chain:
1. Analyze
2. Plan
3. Generate

---
## Setup
```bash
npm install @huggingface/inference dotenv
npm install -D typescript tsx @types/node
````

Create `.env`:

```env
HF_TOKEN=your_token_here
```

## Run

```bash
npm run prompt_chaining "Your input here"
ex:
npm run prompt_chaining "Give me a beginner roadmap to learn prompt engineering"
```