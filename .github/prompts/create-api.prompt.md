---
description: "Scaffold a complete ASP.NET Core API endpoint — model, interface, service, controller, mapper, DI registration"
agent: "Backend"
argument-hint: "Entity name and operations (e.g. 'Appointment with CRUD', 'Notification — create and list only')"
---

Read the skill file at [.github/skills/api-creator/SKILL.md](../skills/api-creator/SKILL.md) and follow its procedure exactly.

## Context

- Entity/Feature: ${input:entity:Entity name e.g. Appointment, ClinicalNote}
- Operations: ${input:operations:CRUD all, or pick from Create / Read / Update / Delete / List / Search}
- Reference controller (optional): ${input:reference:Existing controller to use as pattern e.g. OperatingHour}

## Requirements

1. Follow all conventions from [.github/copilot-instructions.md](../copilot-instructions.md)
2. Read `.github/memories/backend-memory.md` and `.github/memories/project-rules.md` for project context
3. If a reference controller is provided, read it first and match its patterns exactly
4. Generate all files: Request/Response DTOs, Interface, Service, Controller, AutoMapper mapping, DI registration
5. Use permission-based authorization (`Policies.ViewXxx` / `Policies.EditXxx`)
6. All endpoints must accept `CancellationToken`
7. Use `ReplicaDbContext` for read operations, `MainDbContext` for writes
