---
description: "Generate frontend integration layer from an existing backend controller — types, service, endpoints, permissions"
agent: "Frontend"
argument-hint: "Controller or feature name (e.g. 'OperatingHour', 'Appointment', 'PatientVitals')"
---

Read the skill file at [.github/skills/react-integration/SKILL.md](../skills/react-integration/SKILL.md) and follow its procedure exactly.

## Target

- Controller/Feature: ${input:controller:Backend controller name e.g. OperatingHour, Appointment}

## What to Generate

1. **Read** the backend controller, request/response models, and service interface from `OUTPATIENT_API/`
2. **Generate TypeScript interfaces** in `src/types/` — derived directly from C# DTOs (no guessing)
3. **Generate RTK Query API slice** in `src/slices/` — with `axiosBaseQuery`, proper tags, exported hooks
4. **Register endpoints** in `src/services/endpoints.json` with `SCREAMING_SNAKE_CASE` keys
5. **Add permission entries** to `src/config.json` matching backend `Policies` UUIDs
6. **Generate page skeleton** (optional) — ready-to-use React component consuming the API hooks

All types, routes, and permissions must be derived from the C# source — nothing guessed.
