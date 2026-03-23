# Routing Agent (TS + Hugging Face)

A minimal routing example in TypeScript.

## Flow

input -> router -> handler

## Routes

- `booker` → booking-related requests
- `info` → general information requests
- `unclear` → vague requests

## Run

```bash
npm run routing "Your input here"
ex: 
npm run routing "What is the capital of Italy?"
npm run routing "Book me a hotel in Paris for next weekend."
npm run routing "I need help with something"
