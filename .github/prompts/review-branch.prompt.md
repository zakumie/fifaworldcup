---
description: "Review all changes between current branch and main — full diff analysis before merge/PR"
argument-hint: "Optional: specific area to focus on (e.g. 'backend only', 'security'), or leave empty for full review"
---

Read the skill file at [.github/skills/master-review/SKILL.md](../skills/master-review/SKILL.md) and follow its procedure exactly.

## Scope

- Focus area (optional): ${input:focus:Focus area e.g. 'backend only', 'security', 'all'}

## Review Process

1. Run `git diff main...HEAD` to get all changes on the current branch vs main
2. Categorize all changed files into Backend and Frontend
3. For each file, perform deep analysis:
   - **Performance** — query efficiency, render performance, caching gaps
   - **Security (OWASP Top 10)** — auth issues, injection, data exposure, HIPAA compliance
   - **Code Quality** — conventions, dead code, type safety, naming
   - **Breaking Changes** — API contract changes, DB schema changes, config changes
4. Output structured report with **Critical** / **Warning** / **Info** categories
5. Provide a merge readiness verdict: READY / NEEDS FIXES / BLOCKED
