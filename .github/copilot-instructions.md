# DHP OutPatient — Copilot Instructions

> Digital Health Platform (DHP) — a healthcare outpatient management system.
> This file defines project context, tech stack, coding conventions, and skill routing so Copilot produces code that fits the codebase on the first try.

---

## 1. Tech Stack

### Backend (`OUTPATIENT_API/`)

| Layer | Technology |
|---|---|
| Framework | ASP.NET Core 8.0 (net8.0), C# with nullable reference types |
| ORM | Entity Framework Core 8.0 (SQL Server) + EFCore.BulkExtensions |
| Database | SQL Server with `MainDbContext` (primary) and `ReplicaDbContext` (read-only) |
| Mapping | AutoMapper 13 |
| Validation | FluentValidation 11 |
| Auth | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`) + ASP.NET Core Identity |
| Caching | StackExchange.Redis 2.7 + `IDistributedCache` |
| Real-time | Azure SignalR |
| Resilience | Polly (retry, circuit breaker) via `Microsoft.Extensions.Http.Resilience` |
| Docs | Swashbuckle (Swagger / OpenAPI) |
| PDF/Excel | PdfSharpCore, ClosedXML, CsvHelper |
| Search | Lucene.NET 4.8 |
| Messaging | SendGrid (email), Twilio (SMS/voice) |
| Storage | Azure Blob Storage |
| AI | Azure AI Text Analytics |

### Frontend (`OUTPATIENT_WEB/`)

| Layer | Technology |
|---|---|
| Framework | React 17 + TypeScript 4.6 (strict mode) |
| State | Redux Toolkit 2.8 + RTK Query for data fetching |
| UI (layout/display) | MUI 5 (Button, Typography, Select, Alert, Grid, Dialog, DataGrid) |
| UI (forms) | CoreUI Pro 4 (CForm, CFormInput, CFormSelect, CSpinner) |
| Forms | React Hook Form 7 + Yup validation |
| Routing | React Router DOM 6 (dynamic menu-driven, lazy-loaded) |
| HTTP | Axios 0.26 + axios-cache-interceptor (via `CommonApi` base class) |
| Styling | CSS Modules (`.module.scss`) + SCSS + Styled-components |
| i18n | i18next + react-i18next |
| Date/Time | date-fns, MUI DatePicker/TimePicker |
| Charts | Recharts, FullCalendar |
| Video/Chat | Twilio Video, Microsoft SignalR, Vonage |
| PDF | @react-pdf/renderer, react-pdf |
| Rich Text | react-quill |
| DnD | react-beautiful-dnd |

---

## 2. Project Architecture

```
OUTPATIENT_API/                          # .NET 8 Backend
├── Asenda.DHP.API/                      # Web API layer (controllers, startup, models)
│   ├── Controllers/                     # REST controllers (~30)
│   ├── Models/Configs/                  # Configuration DTOs (JWT, SendGrid, etc.)
│   ├── CustomAttributes/               # Filters (GlobalExceptionFilter, ValidateEnum, etc.)
│   └── Startup/                         # DI registration, auth config, pipeline
├── Asenda.DHP.Core/                     # Business contracts
│   ├── Interfaces/                      # Service interfaces (I{Entity}Service)
│   ├── Models/                          # Domain DTOs (PersonModel, GenericResult, etc.)
│   └── Validators/                      # FluentValidation validators
├── Asenda.DHP.Infrastructure/           # Implementation layer
│   ├── Data/
│   │   ├── DbContexts/                 # MainDbContext, IdentityDbContext, ReplicaDbContext
│   │   └── Entities/                   # EF Core entity models (~60 entities)
│   ├── Repositories/                    # GenericRepository<T> + specialized repos
│   └── Services/                        # Business service implementations (~40)
├── Asenda.DHP.SharedKernel/             # Cross-cutting concerns (enums, exceptions, value objects)
└── MigrationScripts/                    # SQL migration scripts (manual, not EF migrations)

OUTPATIENT_WEB/                          # React Frontend
└── src/
    ├── pages/{section}/{Feature}.tsx     # Thin page wrappers (match DB virtualPath)
    ├── views/{section}/{feature}/        # View logic + CSS Modules
    ├── components/                       # Reusable UI components (~40 folders)
    │   └── form/                         # Form controls (FormControl, SelectControl, etc.)
    ├── services/                         # Axios-based API services (~50)
    │   ├── CommonApi.tsx                 # Base HTTP client factory
    │   ├── endpoints.json                # SCREAMING_SNAKE_CASE endpoint URLs
    │   └── rtqQueryBaseQuery.ts          # RTK Query base query using CommonApi
    ├── slices/                           # RTK Query API slices (new features)
    ├── reducers/                         # Legacy Redux reducers
    ├── hooks/                            # Custom hooks (~24)
    ├── contexts/                         # React Context providers (~14)
    ├── modules/                          # Feature modules (encounters, patients, ai, etc.)
    ├── types/                            # TypeScript type definitions
    ├── config.json                       # App config (timeouts, permissions GUIDs)
    ├── internationalization/             # i18n translations
    └── store.tsx                         # Redux store configuration
```

---

## 3. Backend (API) Rules

### Naming Conventions
- **Controllers**: `{Entity}Controller` — inherit from `BaseApiController`
- **Services**: interface `I{Entity}Service` in `Core/Interfaces/`, implementation `{Entity}Service` in `Infrastructure/Services/`
- **Repositories**: `GenericRepository<T>` pattern with `IGenericRepository<T>`
- **Entities**: plain class name in `Infrastructure/Data/Entities/` (e.g., `Person`, `Encounter`)
- **DTOs**: `{Entity}Model` for domain models in `Core/Models/`
- **Private fields**: `_camelCase` (underscore prefix)
- **Constants**: `ALL_CAPS` for `const string`

### Controller Patterns
- Always use `[ApiController]`, `[Route("api/[controller]")]` is NOT used — routes are explicit: `[Route("{action}")]`
- Authorization: `[Authorize(Policy = nameof(Policies.ViewPatientDetails))]`
- Return `Ok(data)`, `BadRequest()`, `NotFound()`, or `BaseApiController` helpers: `InternalServerError()`, `Forbidden()`, `NotImplemented()`
- Do NOT wrap responses in a generic envelope; return data or error directly
- Use `async Task<ActionResult>` for async endpoints

### Service Patterns
- Constructor injection for all dependencies: services, repos, `ILogger<T>`, `IMapper`
- Result types: `GenericResult` (with `Succeeded` property) for operation outcomes
- Async method names: suffix with `Async` (e.g., `GetPatientsAsync()`)
- Use `IMapper` (AutoMapper) for entity ↔ DTO mapping; define profiles

### Database & EF Core
- Use `MainDbContext` for writes, `ReplicaDbContext` for read-heavy queries
- SQL Server with `EnableRetryOnFailure()` for resilience
- Always use parameterized queries — NEVER concatenate user input into SQL
- Prefer `.AsNoTracking()` for read-only queries
- Migration scripts are manual SQL in `MigrationScripts/` (NOT EF migrations)

### Security (OWASP)
- JWT tokens validated with issuer, audience, signing key, and lifetime
- Token sources: `Authorization` header, `access_token` query param, `x-access-token` cookie
- Policy-based authorization with custom claims mapped to permissions
- Data encryption: AES-256 with `DataProtection` API for PHI/PII
- Always validate and sanitize all inputs via FluentValidation
- No sensitive data in logs — use structured logging with `ILogger<T>`

---

## 4. Frontend (React) Rules

### File & Folder Conventions
- **Page wrapper**: `src/pages/{section}/{Feature}.tsx` — thin component, matches DB `virtualPath`
- **View component**: `src/views/{section}/{feature}/{Feature}Page.tsx` — contains actual UI logic
- **Styles**: `src/views/{section}/{feature}/{Feature}Page.module.scss` — CSS Modules only
- **Types**: `src/types/{feature}.types.ts` for shared TypeScript interfaces
- **Services**: `src/services/{Feature}Service.ts` — Axios-based, uses `CommonApi` base client

### Component Patterns
- **Functional components only** — no class components for new code
- Use `React.FC<Props>` or explicit props type; always define a `Props` interface
- Destructure props in function signature
- Keep components under ~200 lines; extract sub-components when larger
- Use CSS Modules (`.module.scss`) for styling, import as `styles`

### State Management
- **New features**: RTK Query with `createApi` + `axiosBaseQuery()` in `src/slices/`
  - Register reducer in `reducers/index.tsx` + middleware in `store.tsx`
  - Use `providesTags` / `invalidatesTags` for cache invalidation
- **Existing features**: Legacy Redux reducers in `reducers/` — extend if modifying existing flow
- Do NOT mix RTK Query and legacy patterns within the same feature

### Forms
- Use **React Hook Form** (`useForm()`) with **Yup** schema validation (`yupResolver`)
- Use CoreUI Pro form controls: `CFormInput`, `CFormSelect`, `CForm`
- Custom wrappers in `src/components/form/`: `FormControl`, `SelectControl`, `DatePickerInput`, `CustomAutocomplete`
- Always set `defaultValues` to avoid uncontrolled-to-controlled warnings

### Hooks
- `useAlerts()` → `showSuccess()`, `showError()`, `showInfo()`, `showWarning()` for toast notifications
- `useCheckUserPermission('PERMISSION_KEY')` — permission string key from `config.json.PERMISSIONS`
- `useTranslation()` — all user-facing text must go through i18n (`t('key')`)
- `usePagination()` / `useAPIPagination()` for list/table pagination
- `useCache()` for client-side cache management

### Routing
- Routes are **dynamic & menu-driven**: backend `/account/menu` returns menu with `virtualPath`
- `FillRoutesFromMenuItem()` lazy-loads `src/pages/${virtualPath}.tsx`
- No manual route config needed — just create the page file at the right path
- Use `ProtectedRoute` for auth-guarded routes (already handled globally)

### API Integration
- Endpoint URLs in `src/services/endpoints.json` — use `SCREAMING_SNAKE_CASE` keys
- HTTP client: `CommonApi.createClient()` with auto-injected JWT from `sessionStorage`
- For new API slices: `axiosBaseQuery()` from `services/rtqQueryBaseQuery.ts`
- API timeout: 300s (configurable via `config.json.API_TIMEOUT`)

### TypeScript
- `strict: true` — never use `any` without justification
- Define explicit interfaces/types for API request/response payloads
- Use `unknown` over `any` for untyped data; narrow with type guards
- Import paths use `src/` as base (configured in `tsconfig.json` `baseUrl`)

---

## 5. Output Expectations

### When generating code, always:
- Follow existing naming conventions and folder structure exactly
- Use the same import style as neighboring files (relative vs absolute)
- Include proper TypeScript types — no implicit `any`
- Add `useTranslation()` for all user-facing strings in React components
- Use `useAlerts()` for success/error notifications instead of `console.log` or `alert()`
- Register new endpoints in `endpoints.json` with `SCREAMING_SNAKE_CASE` keys
- For backend: register new services in DI container (Startup folder)
- For backend: add AutoMapper profile mappings for new DTOs

### When generating code, never:
- Add extra comments, docstrings, or annotations unless explicitly requested
- Create wrapper types or abstractions for one-off operations
- Use `console.log` in production code (use `ILogger<T>` backend, remove in frontend)
- Hardcode URLs — always use `endpoints.json` or `appsettings.json`
- Skip error handling at API boundaries
- Use `var` in C# when the type is not obvious from the right-hand side
- Return raw exception details to the client

### Code review output:
- Categorize issues as **Critical** / **Warning** / **Info**
- Reference OWASP Top 10 for security issues
- Suggest concrete fixes, not vague advice
- Flag N+1 queries, missing `.AsNoTracking()`, unbounded queries

---

## 6. Skill Routing

### API Creator
When user requests "tạo API", "create endpoint", "scaffold API", "thêm controller", "tạo CRUD":
- Read `.github/skills/api-creator/SKILL.md`
- Follow step-by-step generation procedure

### React Creator
When user requests "tạo page", "create component", "thêm trang", "scaffold React", "tạo form":
- Read `.github/skills/react-creator/SKILL.md`
- Follow step-by-step generation procedure

### Code Reviewer
When user requests "review code", "check code", "audit", "kiểm tra code", "review PR":
- Read `.github/skills/code-reviewer/SKILL.md`
- Follow structured review procedure

### Master Review
When user requests "master review", "review branch", "so sánh với main", "diff với main", "review trước khi merge", "check branch changes", "review toàn bộ branch":
- Read `.github/skills/master-review/SKILL.md`
- Follow structured branch review procedure (local diff current branch vs main)

### API Optimize
When user requests "optimize backend", "tối ưu API", "slow query", "N+1", "review performance backend", "audit security API":
- Read `.github/skills/api-optimize/SKILL.md`
- Follow structured optimization procedure

### React Optimize
When user requests "optimize component", "tối ưu React", "fix re-render", "memory leak frontend", "review React performance", "bundle size":
- Read `.github/skills/react-optimize/SKILL.md`
- Follow structured optimization procedure

### React Integration
When user requests "integrate API", "tạo service cho API", "connect frontend to backend", "generate frontend for controller", "tạo integration", "integrate controller", "frontend cho API", "sync API to frontend", "kết nối API":
- Read `.github/skills/react-integration/SKILL.md`
- Read backend controller + models + interfaces, then generate frontend service, types, endpoints, and permissions

### FullStack Auditor
When user requests "audit system", "analyze performance", "security audit", "full audit", "check toàn bộ", "improve system", "system health", "cross-layer review":
- Switch to `FullStack` agent
- Agent analyzes Backend + Frontend + Database holistically
- Uses MCP SQL Server, Chrome DevTools, and Figma for verification
