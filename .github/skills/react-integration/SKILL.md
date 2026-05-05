---
name: react-integration
description: |
  Reads existing OUTPATIENT_API backend controllers, models, and interfaces to 
  auto-generate the matching frontend integration layer for OUTPATIENT_WEB.
  Produces: TypeScript interfaces, Service class, endpoint constants, permission 
  config entries, and a ready-to-use React hook/page skeleton — all derived 
  directly from the C# source code so nothing is guessed.
  Use when user says "integrate API", "tạo service cho API", "connect frontend 
  to backend", "generate frontend for controller", "tạo integration cho [feature]",
  "integrate [controller]", "frontend cho API [feature]", "sync API to frontend",
  even short like "integrate đi", "kết nối API".
argument-hint: "Controller or feature name (e.g. 'OperatingHour', 'Appointment', 'PatientVitals')"
---

# Goal

Read an existing ASP.NET Core controller + its models/interface in the 
OUTPATIENT_API project, then auto-generate a complete frontend integration 
layer in OUTPATIENT_WEB — TypeScript types, service class, endpoint constants, 
and permission entries — so the React page can consume the API immediately.

**No guessing.** Every type, route, and permission is derived from the C# source.

# Instructions

## Step 1 — Identify the Backend Feature

Ask user (skip if already provided):
1. **Controller name** or **feature name** — e.g. `OperatingHour`, `Appointment`, `Consent`
2. **Which operations** to integrate? All endpoints? Or a subset?

Then **read these backend files** (all 3 are required):

```
OUTPATIENT_API/Asenda.DHP.API/Controllers/{Feature}Controller.cs
OUTPATIENT_API/Asenda.DHP.Core/Interfaces/I{Feature}Service.cs
OUTPATIENT_API/Asenda.DHP.Core/Models/{Feature}/  ← all files in this folder
```

If user points to a specific controller → read it, extract the interface + model 
namespace, then locate the remaining files automatically.

**Extract from the controller:**
- Route prefix: `[Route("[controller]")]` → base path is `/{ControllerName}`
- Each `[Http{Verb}("sub-route")]` → full path
- Each `[Authorize(Policy = nameof(Policies.{PolicyName}))]` → permission key
- Each action's request/response types from method signatures + `[FromBody]`

## Step 2 — Map C# Types to TypeScript

Read every model class referenced by the controller actions. Apply these mapping rules:

| C# Type | TypeScript Type | Notes |
|---------|----------------|-------|
| `Guid` | `string` | Always string in JSON |
| `string` | `string` | |
| `int`, `long`, `short`, `byte` | `number` | |
| `decimal`, `double`, `float` | `number` | |
| `bool` | `boolean` | |
| `DateTime` | `string` | ISO 8601 in JSON |
| `TimeSpan` | `string \| null` | `"HH:mm:ss"` format |
| `T?` (nullable) | `T \| null` | |
| `List<T>`, `IEnumerable<T>` | `T[]` | |
| `enum Foo` | `number` or string union | Prefer number if backend sends int |
| `[JsonIgnore]` properties | **SKIP** | Not sent over wire |
| `GenericResult` | `{ succeeded: boolean; entityId?: string; errors: { description: string }[] }` | Standard wrapper |

**Create interfaces in the service file** (co-located), or in `src/types/{feature}.types.ts` if shared.

**Rules:**
- One TypeScript `interface` per C# DTO class
- Use `export interface`, not `type` alias (consistency with codebase)
- Only include properties that cross the wire (skip `[JsonIgnore]`)
- Request interfaces: match the `[FromBody]` parameter type
- Response interfaces: match the action's return type / `Ok(result)` shape
- If a response wraps items in `GenericResult<T>`, extract `T` as the real response type

### Generated TypeScript Pattern

```typescript
// Response types — mirror C# Response DTOs
export interface {Entity}Response {
    id: string;
    // ... every non-JsonIgnore property, mapped
}

// Request types — mirror C# Request DTOs (minus [JsonIgnore])
export interface {Entity}Request {
    // ... every wire property
}

// Input/nested types — if the request contains sub-objects
export interface {Entity}Input {
    // ...
}
```

## Step 3 — Generate Endpoint Constants

Read the controller's routes and generate entries for `src/services/endpoints.json`.

**Naming convention:** `{VERB}_{FEATURE}_{OPERATION}`

Map each controller action:

| Controller Attribute | Endpoint Constant | Value |
|---------------------|-------------------|-------|
| `[HttpGet("org/{orgId}")]` | `GET_{FEATURE}_BY_ORG` | `"/{Controller}/org"` |
| `[HttpGet("{id}")]` | `GET_{FEATURE}` | `"/{Controller}"` |
| `[HttpGet]` (list) | `GET_{FEATURE}_LIST` | `"/{Controller}"` |
| `[HttpPost]` | `POST_{FEATURE}` or `SAVE_{FEATURE}` | `"/{Controller}"` |
| `[HttpPost("save")]` | `SAVE_{FEATURE}` | `"/{Controller}/save"` |
| `[HttpPost("apply-to-all")]` | `APPLY_{FEATURE}_TO_ALL` | `"/{Controller}/apply-to-all"` |
| `[HttpPut("{id}")]` | `PUT_{FEATURE}` | `"/{Controller}"` |
| `[HttpDelete("{id}")]` | `DELETE_{FEATURE}` | `"/{Controller}"` |

**Rules:**
- Path parameters (`{id}`, `{orgId}`) are appended at call-time, NOT in the constant
- The constant stores the base path only
- Append to the END of `endpoints.json` (before the closing `}`)

## Step 4 — Generate Service Class

Create `src/services/{Feature}Service.ts` extending `CommonApi`:

```typescript
import CommonApi from './CommonApi';
import endpoints from './endpoints.json';

// ---- Types (from Step 2) ----
export interface {Entity}Response { /* ... */ }
export interface {Entity}Request { /* ... */ }

// ---- Service ----
export default class {Feature}Service extends CommonApi {
    // One method per controller action
}
```

**Method generation rules per HTTP verb:**

For `[HttpGet("sub/{param}")]`:
```typescript
Get{Name} = async ({param}: string): Promise<{ResponseType} | null> => {
    return await this.get(`${endpoints.{CONSTANT}}/${param}`)
        .then(response => response.data)
        .catch(() => null);
};
```

For `[HttpGet]` with query params:
```typescript
Get{Name} = async (params?: {FilterType}): Promise<{ResponseType}[]> => {
    return await this.get(endpoints.{CONSTANT}, params)
        .then(response => response.data ?? [])
        .catch(() => []);
};
```

For `[HttpPost]` / `[HttpPut]`:
```typescript
{ActionName} = async (request: {RequestType}) => {
    return await this.post(endpoints.{CONSTANT}, request)
        .then(response => response.data)
        .catch(() => null);
};
```

For `[HttpPut("{id}")]`:
```typescript
Update{Entity} = async (id: string, request: {RequestType}) => {
    return await this.put(`${endpoints.{CONSTANT}}/${id}`, request)
        .then(response => response.data)
        .catch(() => null);
};
```

For `[HttpDelete("{id}")]`:
```typescript
Delete{Entity} = async (id: string) => {
    return await this.delete(`${endpoints.{CONSTANT}}/${id}`)
        .then(response => response.data)
        .catch(() => null);
};
```

**Rules:**
- Class extends `CommonApi` — never use raw axios
- Error handling: `.catch(() => null)` — caller decides UI behavior
- GET responses that return lists: default to `[]` on error
- GET responses that return single objects: return `null` on error
- POST/PUT/DELETE: return `null` on error (caller checks truthiness)
- Method names should be readable: `GetByOrgId`, `Save`, `Create`, `Delete`, `Search`

## Step 5 — Generate Permission Config Entries

Read the `[Authorize(Policy = nameof(Policies.{Name}))]` from each controller action.
Then read the GUID values from `Asenda.DHP.Core/Constants/Policies.cs`.

For each unique policy found, add to `src/config.json` under `"PERMISSIONS"`:

```json
"{PERMISSION_KEY}": "{guid-from-policies-cs}"
```

**Naming convention:**
- `Policies.ViewOperatingHour` → `"VIEW_OPERATING_HOUR"`
- `Policies.EditOperatingHour` → `"EDIT_OPERATING_HOUR"`
- `Policies.CreateAppointment` → `"CREATE_APPOINTMENT"`

Transform: PascalCase → SCREAMING_SNAKE_CASE.

**Rules:**
- Check if the permission already exists in `config.json` before adding
- Only add permissions referenced by the controller being integrated
- Insert before the closing `}` of the `"PERMISSIONS"` block

## Step 6 — Generate Usage Skeleton (optional)

If user wants a page/component, generate a minimal usage skeleton showing how 
to consume the service in a React component:

```typescript
import { useEffect, useState } from 'react';
import { useService } from 'contexts/ServicesContext';
import { useAlerts } from 'hooks/useAlert';
import { useCheckUserPermission } from 'hooks/useCheckUserPermission';
import {Feature}Service, { {Entity}Response } from 'services/{Feature}Service';

const {Feature}Page: React.FC = () => {
    const service = useService({Feature}Service);
    const { showSuccess, showError } = useAlerts();
    const canEdit = useCheckUserPermission('{EDIT_PERMISSION_KEY}');
    const [data, setData] = useState<{Entity}Response[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        service.Get{Name}(/* params */)
            .then(result => setData(result ?? []))
            .catch(() => showError('Failed to load'))
            .finally(() => setLoading(false));
    }, []);

    // ... render data
};
```

**This step is OPTIONAL** — only generate if user asks for a full page, or say 
"Run `react-creator` or `react-creator-new` skill to scaffold the full page."

## Step 7 — Verify

✅ **Checklist before finishing:**
- [ ] Every controller action has a matching service method
- [ ] Every `[FromBody]` parameter type has a matching TypeScript interface
- [ ] Every response DTO has a matching TypeScript interface
- [ ] `[JsonIgnore]` properties are excluded from TypeScript
- [ ] Endpoint constants added to `endpoints.json` with correct paths
- [ ] Permissions added to `config.json` with correct GUIDs from `Policies.cs`
- [ ] Duplicate permissions NOT re-added
- [ ] Service class extends `CommonApi` — no raw axios
- [ ] Types use `string` for `Guid`, `DateTime`, `TimeSpan`
- [ ] Nullable C# types → `| null` in TypeScript
- [ ] No `any` types — every method is fully typed
- [ ] Method signatures match the HTTP verb semantics (GET→get, POST→post, etc.)

# Examples

## Example 1: OperatingHour Controller → Full Integration

**Input:** "integrate OperatingHour API to frontend"

**Step 1 — Read backend:**
```
Controllers/OperatingHourController.cs  →  4 actions found
Interfaces/IOperatingHourService.cs     →  4 methods
Models/OperatingHours/                  →  5 DTOs
```

**Step 2 — Generated TypeScript types:**
```typescript
export interface OperatingHourResponse {
    id: string;
    orgId: string;
    dayOfWeek: number;        // byte → number
    isClosed: boolean;
    regularHoursStart: string | null;  // TimeSpan? → string | null
    regularHoursEnd: string | null;
    afterHoursStart: string | null;
    afterHoursEnd: string | null;
    surcharge: number;        // decimal → number
    createdBy: string | null; // Guid? → string | null
    createdDate: string;      // DateTime → string
    updatedBy: string | null;
    updatedDate: string | null;
}

export interface OrgOperatingHoursResponse {
    orgId: string;
    items: OperatingHourResponse[];  // List<T> → T[]
}

export interface OperatingHourInput {
    dayOfWeek: number;
    isClosed: boolean;
    regularHoursStart: string | null;
    regularHoursEnd: string | null;
    afterHoursStart: string | null;
    afterHoursEnd: string | null;
    surcharge: number;
}

export interface SaveOperatingHoursRequest {
    orgId: string;
    items: OperatingHourInput[];
    // IssuerUserId SKIPPED — [JsonIgnore]
}

export interface ApplyToDefaultRequest {
    sourceOrgId: string;
    destinationOrgId: string;
    // IssuerUserId SKIPPED — [JsonIgnore]
}
```

**Step 3 — Generated endpoints.json entries:**
```json
"GET_OPERATING_HOURS_BY_ORG": "/OperatingHour/org",
"SAVE_OPERATING_HOURS": "/OperatingHour/save",
"APPLY_OPERATING_HOURS_TO_ALL": "/OperatingHour/apply-to-all",
"APPLY_OPERATING_HOURS_DEFAULT": "/OperatingHour/apply-to-default"
```

**Step 4 — Generated service:**
```typescript
export default class OperatingHourService extends CommonApi {
    GetByOrgId = async (orgId: string): Promise<OrgOperatingHoursResponse | null> => {
        return await this.get(`${endpoints.GET_OPERATING_HOURS_BY_ORG}/${orgId}`)
            .then(response => response.data)
            .catch(() => null);
    };

    Save = async (request: SaveOperatingHoursRequest) => {
        return await this.post(endpoints.SAVE_OPERATING_HOURS, request)
            .then(response => response.data)
            .catch(() => null);
    };

    ApplyToAll = async (request: ApplyToAllRequest) => {
        return await this.post(endpoints.APPLY_OPERATING_HOURS_TO_ALL, request)
            .then(response => response.data)
            .catch(() => null);
    };

    ApplyToDefault = async (request: ApplyToDefaultRequest) => {
        return await this.post(endpoints.APPLY_OPERATING_HOURS_DEFAULT, request)
            .then(response => response.data)
            .catch(() => null);
    };
}
```

**Step 5 — Generated config.json permissions:**
```json
"VIEW_OPERATING_HOUR": "b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
"EDIT_OPERATING_HOUR": "d3c4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f"
```

## Example 2: Simple CRUD Controller

**Input:** "integrate Consent API"

**Reads:** `ConsentController.cs` → finds:
```csharp
[HttpGet("{patientId}")]     [Policy: ViewConsent]
[HttpPost]                   [Policy: CreateConsent]
[HttpPut("{id}")]            [Policy: EditConsent]  
[HttpDelete("{id}")]         [Policy: DeleteConsent]
```

**Generates:**
```
src/services/ConsentService.ts     ← 4 methods, all types
src/services/endpoints.json        ← 4 new entries
src/config.json                    ← up to 4 permission entries (skips existing)
```

## Example 3: Partial Integration

**Input:** "chỉ integrate GET endpoints của Person API thôi"

**Only reads** `[HttpGet]` actions from `PersonController.cs` → generates:
- Response types only (no request types needed for GET)
- GET endpoint constants only
- View permissions only
- Service methods with `this.get()` only

# Constraints

- 🚫 NEVER guess routes — always read from `[Http*]` attributes in the controller
- 🚫 NEVER guess types — always read from C# model files
- 🚫 NEVER guess permission GUIDs — always read from `Policies.cs`
- 🚫 NEVER use raw axios in generated service — always extend `CommonApi`
- 🚫 NEVER include `[JsonIgnore]` properties in TypeScript interfaces
- 🚫 NEVER add duplicate entries to `endpoints.json` or `config.json`
- ✅ ALWAYS read the actual backend source files before generating anything
- ✅ ALWAYS verify that referenced model files exist before mapping
- ✅ ALWAYS use `string` for C# `Guid`/`DateTime` types in TypeScript
- ✅ ALWAYS add `| null` for nullable C# types
- ✅ ALWAYS extend `CommonApi` for new service classes
- ✅ ALWAYS check existing `endpoints.json` and `config.json` before adding entries

<!-- Generated by Copilot Skill Creator -->
