---
description: "Review staged/unstaged code changes — performance, security (OWASP), code quality, best practices"
argument-hint: "Optional: specific files to focus on, or leave empty to review all changes"
---

Read the skill file at [.github/skills/code-reviewer/SKILL.md](../skills/code-reviewer/SKILL.md) and follow its procedure exactly.

## Scope

- Focus area (optional): ${input:focus:Specific files or area to focus review on, or 'all changes'}

## Review Process

1. Get current git diff (staged + unstaged changes)
2. Categorize changed files into Backend (`.cs`) and Frontend (`.tsx`, `.ts`, `.scss`)
3. For each changed file, analyze:
   - **Performance** — N+1 queries, unnecessary re-renders, missing memoization, unbounded queries
   - **Security (OWASP Top 10)** — injection, broken auth, sensitive data exposure, XSS, HIPAA violations
   - **Code Quality** — naming conventions, dead code, type safety, error handling
   - **Best Practices** — project conventions per [.github/copilot-instructions.md](../copilot-instructions.md)
4. Output structured report with **Critical** / **Warning** / **Info** categories
5. Suggest concrete fixes for each issue
