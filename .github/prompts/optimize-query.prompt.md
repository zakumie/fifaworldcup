---
description: "Optimize database queries — analyze EF Core LINQ, find N+1, missing indexes, slow queries"
agent: "Database"
argument-hint: "Service or entity to analyze (e.g. 'EncounterService', 'Person table queries')"
---

## Target

- Service or entity: ${input:target:Service/entity to analyze e.g. EncounterService, Person queries}

## Analysis Steps

1. **Read** the target service/repository code and trace LINQ queries
2. **Identify issues**:
   - N+1 queries (loop-based DB calls, missing `Include()`/`ThenInclude()`)
   - In-memory filtering (`.ToList()` before `.Where()`)
   - Missing `.AsNoTracking()` on read-only queries
   - Unbounded queries (no `Take()`/pagination)
   - Full entity loads where `Select()` projection would suffice
   - Missing `ProjectTo<>()` for AutoMapper (DB-level mapping)
   - Queries that should use `ReplicaDbContext` instead of `MainDbContext`
3. **Check indexes** — use MCP SQL tools to inspect table schemas for columns used in `Where`, `OrderBy`, `Join`
4. **Recommend caching** — stable/reference data that could use Redis via `IDistributedCacheService`

## Output

Categorized report with **Critical** / **Warning** / **Info**, including before/after code for each fix.
