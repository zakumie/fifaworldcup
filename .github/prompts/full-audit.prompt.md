---
description: "Full-stack system audit — analyze Backend, Frontend, and Database holistically for performance, security, and quality"
agent: "FullStack"
argument-hint: "Feature or area to audit (e.g. 'patient module', 'auth flow', 'entire system')"
---

## Target

- Audit scope: ${input:scope:Feature/area to audit e.g. 'patient module', 'encounter flow', 'entire system'}

## Audit Dimensions

Analyze the target across the full stack:

### 1. Performance
- **Backend**: N+1 queries, missing indexes, unbounded queries, cache misses, slow endpoints
- **Frontend**: unnecessary re-renders, large bundle imports, API waterfall calls
- **Database**: missing indexes, table scan queries, execution plan issues

### 2. Security (OWASP Top 10)
- **Backend**: SQL injection, broken auth, sensitive data exposure, HIPAA/PHI violations
- **Frontend**: XSS risks, insecure token handling, `console.log` with patient data
- **Cross-layer**: auth bypass paths, permission gaps between frontend and backend

### 3. Code Quality
- **Architecture**: convention drift, layer violations, dead code
- **Type Safety**: implicit `any` (TS), missing validation (C#)
- **Consistency**: naming conventions, error handling patterns

### 4. UX/UI (if applicable)
- Accessibility gaps, responsive issues, loading state handling

## Output

Structured report with **Critical** / **Warning** / **Info** categories, concrete fixes, and an overall health score.
