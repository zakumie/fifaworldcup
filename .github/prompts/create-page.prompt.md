---
description: "Scaffold a new React/TypeScript page — component, RTK Query slice, types, styles, and route registration"
agent: "Frontend"
argument-hint: "Feature name and type (e.g. 'Appointment list page', 'Patient allergy form')"
---

Read the skill file at [.github/skills/react-creator/SKILL.md](../skills/react-creator/SKILL.md) and follow its procedure exactly.

## Context

- Feature: ${input:feature:Feature name e.g. Appointment, PatientAllergy}
- Page type: ${input:pageType:list / form / detail / dashboard}
- Backend controller (optional): ${input:controller:Existing API controller this page consumes}

## Requirements

1. Follow all conventions from [.github/copilot-instructions.md](../copilot-instructions.md)
2. Read `.github/memories/frontend-memory.md` and `.github/memories/project-rules.md` for project context
3. Use RTK Query (`createApi` + `axiosBaseQuery`) for data fetching in `src/slices/`
4. Use MUI for layout/display, CoreUI Pro for form controls
5. CSS Modules (`.module.scss`) for styling
6. All user-facing text through `useTranslation()` — add keys to `translations.json`
7. Use `useAlerts()` for success/error notifications
8. Use `useCheckUserPermission()` for permission checks
9. Register endpoints in `endpoints.json` with `SCREAMING_SNAKE_CASE` keys
