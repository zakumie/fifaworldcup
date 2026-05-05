---
description: "Optimize ASP.NET Core backend — performance, N+1 queries, caching, security audit (OWASP Top 10)"
agent: "Backend"
argument-hint: "Service or controller name to optimize (e.g. 'EncounterService', 'PatientController')"
---

Read the skill file at [.github/skills/api-optimize/SKILL.md](../skills/api-optimize/SKILL.md) and follow its procedure exactly.

## Target

- File or service: ${input:target:Service/Controller to optimize e.g. EncounterService, PatientController}

## Checklist

Analyze the target for:

1. **Performance** — N+1 queries, missing `.AsNoTracking()`, unbounded queries, in-memory filtering, loop-based DB calls
2. **Security (OWASP Top 10)** — SQL injection, XSS, broken auth, sensitive data exposure, HIPAA/PHI violations
3. **Caching** — Redis cache opportunities for stable/reference data
4. **Async patterns** — blocking calls, missing `CancellationToken` propagation
5. **EF Core** — lazy loading traps, unnecessary `Include()`, missing `ProjectTo<>()`
6. **Code quality** — dead code, overly complex methods, missing validation

Output a categorized report: **Critical** / **Warning** / **Info** with concrete fixes.
