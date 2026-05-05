# Project Rules — DHP OutPatient Platform

## Project Overview

- **Domain**: Healthcare outpatient management (HIPAA-regulated)
- **Backend**: `OUTPATIENT_API/` — ASP.NET Core Web API (.NET 8)
- **Frontend**: `OUTPATIENT_WEB/` — React/TypeScript SPA
- **Database**: SQL Server with EF Core, read/write replica separation
- **Workspace**: `dhp-out-patient.code-workspace` (multi-root: OUTPATIENT_WEB + OUTPATIENT_API)

## Agent Roster

| Agent | Domain | Key Skill Files |
|-------|--------|-----------------|
| **Frontend** | React/TS, MUI, RTK Query, SCSS | react-creator, react-creator-new, react-optimize, react-integration, code-reviewer |
| **Backend** | .NET 8, EF Core, JWT, Redis | api-creator, api-optimize, code-reviewer |
| **Database** | SQL Server, EF Core, MCP SQL tools | api-optimize (Step 2) |
| **FullStack** | Cross-layer audit (all 3 layers) | All skills + MCP SQL + Chrome DevTools + Figma |
| **Explore** | Read-only codebase Q&A | N/A (search only) |

## Skill Dispatch Map

| User Says | Skill to Read |
|-----------|---------------|
| "tạo API", "create endpoint", "scaffold API" | `.github/skills/api-creator/SKILL.md` |
| "optimize backend", "slow query", "N+1", "audit security API" | `.github/skills/api-optimize/SKILL.md` |
| "tạo page", "create component", "scaffold React" | `.github/skills/react-creator/SKILL.md` |
| "tạo page OutPatient", "scaffold OutPatient" | `.github/skills/react-creator-new/SKILL.md` |
| "optimize component", "fix re-render", "memory leak" | `.github/skills/react-optimize/SKILL.md` |
| "integrate API", "connect frontend to backend" | `.github/skills/react-integration/SKILL.md` |
| "review code", "check code", "audit code" | `.github/skills/code-reviewer/SKILL.md` |
| "audit system", "full audit", "security audit" | Switch to **FullStack** agent |

## Cross-Cutting Rules (ALL Agents Must Follow)

### HIPAA / Security (Non-Negotiable)

- 🚫 Never log PHI/PII — not in `console.log`, not in `ILogger`, not in error responses
- 🚫 Never expose patient data without `[Authorize]` (backend) or `<ProtectedRoute>` (frontend)
- 🚫 Never use `dangerouslySetInnerHTML` with untrusted data (XSS)
- 🚫 Never use string concatenation in SQL (`FromSqlRaw`) — always parameterize
- 🚫 Never store tokens in `localStorage` — use `sessionStorage`
- ✅ Permission-based authorization (UUID policies in `Policies.cs`)
- ✅ Multi-tenant scoping: OrgId + ProviderOrgId filtering on all queries

### Code Quality

- ✅ TypeScript: No `any` — define proper interfaces
- ✅ .NET: All service methods must be `async Task<T>`
- ✅ .NET: Propagate `CancellationToken` through full call chain
- ✅ .NET: `AsNoTracking()` for read-only queries
- ✅ .NET: `[SwaggerOperation]` on all endpoints
- ✅ .NET: Never call DB inside foreach — collect changes in lists, batch after loop
- ✅ .NET: Wrap multi-step writes in `BeginTransactionAsync`/`CommitAsync` for atomicity
- ✅ .NET: Guard null on user-context lookups (`GetProviderOrgIdAsync`) before writes
- ✅ React: `t('key')` for all text — no hardcoded strings
- ✅ React: SCSS Modules (`.module.scss`) for styling
- ✅ React: RTK Query for new features — no legacy Redux for new state

### Architecture

- Backend: Controller → Service → Repository (Unit of Work)
- Frontend: Page (lazy) → View (logic) → Components (reusable)
- State: RTK Query slices in `src/slices/` (server state) + Redux reducers (client state)
- API: RTK Query `createApi` + `axiosBaseQuery` (new) / CommonApi service classes (legacy)
- DB: `MainDbContext` (writes), `ReplicaDbContext` (reads) — never write to replica

### Naming Conventions

- Backend: `{Entity}Request`, `{Entity}Response`, `I{Feature}Service`, `{Feature}Controller`
- Frontend: PascalCase components, `{feature}Api.ts` for RTK slices, `.module.scss` for styles
- DB: `PK_TableName`, `FK_Table_Reference`, `IX_Table_Columns`
- i18n: `featureName.keyName` namespace pattern
- Migrations: `YYYY_MM_DD_description.sql`

### Verified Patterns (from Operating Hours feature)

- RTK Query with tag-based cache invalidation works well for CRUD admin pages
- Manual form state (`useState` + `useMemo`) preferred over form libraries
- `Set<string>` for field-level error tracking
- `parseTimeSpan()` / `formatTimeSpan()` utilities for TimeSpan ↔ Date conversion
- Reference table (`References.RefType`) for enum-like lookup data
- Bulk upsert pattern: load existing → diff → delete/update/create ranges
- Apply-to-all governance: single endpoint applies config to batch of orgs (max 50)
- Audit trail: `CreatedBy/Date`, `UpdatedBy/Date` set explicitly in service layer
