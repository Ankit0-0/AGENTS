# Reflection Agent (TS + Hugging Face)

A minimal implementation of the **Reflection pattern** in TypeScript.

---

## What it does

Implements a **generate → critique → refine loop**:

- **Producer** → generates initial output  
- **Critic** → reviews and finds issues  
- **Refinement** → improves output using feedback  

Repeats until:
- output is good enough  
- or max iterations reached  


## demo run 

```py
draft = generate(task)

for i in range(maxIterations):
    critique = review(task, draft)

    if critique says perfect:
        break

    draft = improve(task, draft, critique)

return draft

```
## how to run 

```
npm run reflection
```