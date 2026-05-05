---
description: "Optimize React component — fix re-renders, memory leaks, bundle size, and TypeScript issues"
agent: "Frontend"
argument-hint: "Component or page to optimize (e.g. 'PatientList.tsx', 'EncounterForm')"
---

Read the skill file at [.github/skills/react-optimize/SKILL.md](../skills/react-optimize/SKILL.md) and follow its procedure exactly.

## Target

- File or component: ${input:target:Component/page to optimize e.g. PatientList.tsx, EncounterForm.tsx}

## Checklist

Analyze the target for:

1. **Re-renders** — missing `useMemo`/`useCallback`, inline objects/functions in JSX, unstable keys
2. **Memory leaks** — unclean `useEffect` (SignalR, intervals, subscriptions), stale closures
3. **State management** — unnecessary state, derived state that should be `useMemo`, Redux anti-patterns
4. **TypeScript** — implicit `any`, loose equality (`==`), missing type guards
5. **Dead code** — unused imports, unreachable branches, commented-out code
6. **Security** — `dangerouslySetInnerHTML`, `console.log`/`console.error` with patient data (HIPAA)
7. **Bundle size** — heavy imports that could be lazy-loaded or tree-shaken

Apply fixes directly. Output a summary: **Critical** / **Warning** / **Info**.
