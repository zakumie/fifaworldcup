---
name: api-creator
description: |
  Scaffold a complete ASP.NET Core API endpoint for the DHP project — from model 
  to controller in one shot. Generates Request/Response DTOs, Interface, Service, 
  Controller, AutoMapper mapping, and DI registration following project conventions.
  Use when user says "tạo API mới", "create endpoint", "thêm controller", 
  "scaffold API", "tạo CRUD cho entity", "new API for [feature]".
argument-hint: "Entity name and operations needed (e.g. 'Appointment with CRUD', 'Notification — create and list only')"
---

# Goal

Scaffold a production-ready API endpoint (6 files) in under 2 minutes, following 
every DHP convention so the code looks like a senior dev on the team wrote it.

# Instructions

## Step 1 — Gather Requirements

Ask user (skip if already provided):
1. **Entity name** (e.g. `Appointment`, `ClinicalNote`)
2. **Operations needed**: CRUD all, or pick from Create / Read / Update / Delete / List / Search
3. **Key properties** of the entity (name, type, required?) — or point to an existing DB table
4. **Authorization**: which Policy should protect each operation? (or "same as [existing controller]")
5. **Special logic**: any business rules, duplicate checks, or external service calls?

If user says "like PatientVitals" → read that controller + service as the reference pattern.

## Step 2 — Generate Request/Response Models

Create files in `Asenda.DHP.Core/Models/<Feature>/`:

```csharp
// {Entity}Request.cs
public class {Entity}Request
{
    [Required]
    public <type> <Property> { get; set; }
    // ... from user's property list
    
    [JsonIgnore]
    public Guid IssuerUserId { get; set; }
}

// {Entity}Response.cs  
public class {Entity}Response
{
    public Guid Id { get; set; }
    // ... mirror entity properties relevant for output
    public DateTime CreatedDate { get; set; }
    public string CreatedBy { get; set; }
}
```

**Rules:**
- Request model: only fields the caller provides. Add `[Required]`, `[StringLength]`, `[NotEmptyGuid]` as needed.
- Response model: all fields the caller should see. Include audit fields (`CreatedDate`, `CreatedBy`).
- If entity has sub-collections → create `{Entity}Input` for nested items.
- `IssuerUserId` is set by controller from JWT, never from request body.
- Add `{Entity}SearchFilter` if List/Search operation is needed.

## Step 3 — Generate Interface

Create in `Asenda.DHP.Core/Interfaces/`:

```csharp
// I{Entity}Service.cs
public interface I{Entity}Service
{
    GenericResult Create{Entity}({Entity}Request request);
    GenericResult Update{Entity}(Guid id, {Entity}Request request);
    GenericResult Delete{Entity}(Guid id, Guid issuerUserId);
    {Entity}Response? Get{Entity}ById(Guid id);
    IEnumerable<{Entity}Response> Get{Entity}List({Entity}SearchFilter filter);
}
```

Only include methods for the operations user requested.

## Step 4 — Generate Service

Create in `Asenda.DHP.Infrastructure/Services/`:

```csharp
// {Entity}Service.cs
public class {Entity}Service : I{Entity}Service
{
    private readonly ILogger<{Entity}Service> _logger;
    private readonly IMapper _mapper;
    private readonly IGenericRepository<{Entity}> _{camelEntity}Repository;

    public {Entity}Service(
        ILogger<{Entity}Service> logger,
        IMapper mapper,
        IUnitOfWork<MainDbContext> unitOfWork)
    {
        _logger = logger;
        _mapper = mapper;
        _{camelEntity}Repository = unitOfWork.GetRepository<{Entity}>();
    }
}
```

**For each operation, follow this pattern:**

**Create:**
```csharp
public GenericResult Create{Entity}({Entity}Request request)
{
    try
    {
        // 1. Validate business rules (duplicate check, FK existence, etc.)
        // 2. Map request → entity
        var entity = _mapper.Map<{Entity}Request, {Entity}>(request);
        // 3. Save
        _{camelEntity}Repository.Create(entity);
        return GenericResult.Success;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating {Entity}");
        return GenericResult.Failed();
    }
}
```

**Read:**
```csharp
public {Entity}Response? Get{Entity}ById(Guid id)
{
    var entity = _{camelEntity}Repository.Find(x => x.Id == id);
    return entity == null ? null : _mapper.Map<{Entity}, {Entity}Response>(entity);
}
```

**Update:**
```csharp
public GenericResult Update{Entity}(Guid id, {Entity}Request request)
{
    try
    {
        var entity = _{camelEntity}Repository.Find(x => x.Id == id);
        if (entity == null)
            return GenericResult.Failed(new IdentityError
            {
                Code = MessageCodes.EntityNotFound,
                Description = $"{Entity} with id {id} not found"
            });

        _mapper.Map(request, entity);
        _{camelEntity}Repository.Update(entity);
        return GenericResult.Success;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating {Entity} {Id}", id);
        return GenericResult.Failed();
    }
}
```

**Delete:**
```csharp
public GenericResult Delete{Entity}(Guid id, Guid issuerUserId)
{
    try
    {
        var entity = _{camelEntity}Repository.Find(x => x.Id == id);
        if (entity == null)
            return GenericResult.Failed(new IdentityError
            {
                Code = MessageCodes.EntityNotFound,
                Description = $"{Entity} with id {id} not found"
            });

        _{camelEntity}Repository.Delete(entity);
        return GenericResult.Success;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error deleting {Entity} {Id}", id);
        return GenericResult.Failed();
    }
}
```

## Step 5 — Generate Controller

Create in `Asenda.DHP.API/Controllers/`:

```csharp
[Route("[controller]")]
[Authorize]
[ApiController]
public class {Entity}Controller : BaseApiController
{
    private readonly I{Entity}Service _{camelEntity}Service;

    public {Entity}Controller(I{Entity}Service {camelEntity}Service)
    {
        _{camelEntity}Service = {camelEntity}Service;
    }

    [HttpPost]
    [Authorize(Policy = nameof(Policies.Create{Entity}))]
    [SwaggerOperation(Description = "Creates a new {entity}")]
    public ActionResult Create{Entity}([FromBody] {Entity}Request request)
    {
        if (!ModelState.IsValid)
            return BadRequest();

        request.IssuerUserId = IdentityHelper.GetUserId(User);
        var result = _{camelEntity}Service.Create{Entity}(request);
        return result.Succeeded ? Ok(result) : UnprocessableEntity(result);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = nameof(Policies.Read{Entity}))]
    [SwaggerOperation(Description = "Gets {entity} by id")]
    public ActionResult Get{Entity}ById(Guid id)
    {
        var result = _{camelEntity}Service.Get{Entity}ById(id);
        return result == null ? NotFound($"{Entity} [{id}] not found") : Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = nameof(Policies.Update{Entity}))]
    [SwaggerOperation(Description = "Updates an existing {entity}")]
    public ActionResult Update{Entity}(Guid id, [FromBody] {Entity}Request request)
    {
        if (!ModelState.IsValid)
            return BadRequest();

        request.IssuerUserId = IdentityHelper.GetUserId(User);
        var result = _{camelEntity}Service.Update{Entity}(id, request);
        return result == null ? NotFound() :
               result.Succeeded ? Ok(result) : UnprocessableEntity(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = nameof(Policies.Delete{Entity}))]
    [SwaggerOperation(Description = "Deletes {entity}")]
    public ActionResult Delete{Entity}(Guid id)
    {
        var issuerUserId = IdentityHelper.GetUserId(User);
        var result = _{camelEntity}Service.Delete{Entity}(id, issuerUserId);
        return result.Succeeded ? Ok(result) : UnprocessableEntity(result);
    }
}
```

## Step 6 — Register DI & AutoMapper

**DI — Add to `Program.cs`:**
```csharp
builder.Services.AddScoped<I{Entity}Service, {Entity}Service>();
```

**AutoMapper — Add to `MainMapper.cs` in `Asenda.DHP.Infrastructure/Data/`:**
```csharp
CreateMap<{Entity}Request, {Entity}>();
CreateMap<{Entity}, {Entity}Response>();
```

## Step 7 — Verify

✅ **Checklist before finishing:**
- [ ] Models have `[Required]` and validation attributes where needed
- [ ] Interface matches the operations user requested
- [ ] Service uses try-catch + `_logger.LogError` for all write operations
- [ ] Controller inherits `BaseApiController`, has `[Authorize]` + policy per action
- [ ] `IssuerUserId` is set from `IdentityHelper.GetUserId(User)` in controller, not from request
- [ ] DI registration added as `AddScoped`
- [ ] AutoMapper mappings added for Request→Entity and Entity→Response
- [ ] Swagger `[SwaggerOperation]` on each action
- [ ] No hardcoded strings — use `MessageCodes` constants for error codes

# Examples

## Example 1: Full CRUD — Appointment

**Input:** "Tạo API cho Appointment với CRUD đầy đủ. Properties: PatientId (Guid, required), ProviderId (Guid, required), AppointmentDate (DateTime, required), Duration (int, minutes), Notes (string, optional), Status (enum AppointmentStatus)"

**Files generated:**

```
Asenda.DHP.Core/Models/Appointment/AppointmentRequest.cs
Asenda.DHP.Core/Models/Appointment/AppointmentResponse.cs
Asenda.DHP.Core/Interfaces/IAppointmentService.cs
Asenda.DHP.Infrastructure/Services/AppointmentService.cs
Asenda.DHP.API/Controllers/AppointmentController.cs
+ DI in Program.cs + Mapping in MainMapper.cs
```

**AppointmentRequest.cs:**
```csharp
public class AppointmentRequest
{
    [Required]
    [NotEmptyGuid]
    public Guid PatientId { get; set; }

    [Required]
    [NotEmptyGuid]
    public Guid ProviderId { get; set; }

    [Required]
    public DateTime AppointmentDate { get; set; }

    public int Duration { get; set; } = 30;

    [StringLength(500)]
    public string? Notes { get; set; }

    [Required]
    public AppointmentStatus Status { get; set; }

    [JsonIgnore]
    public Guid IssuerUserId { get; set; }
}
```

---

## Example 2: Read-only endpoint — PatientAllergy Summary

**Input:** "Tạo API chỉ đọc cho PatientAllergySummary — Get by patient ID và List all for patient"

**Thought Process:**
- Only Read operations → no Create/Update/Delete in interface or controller
- No Request model needed (query by patientId route param)
- Only Response model + read methods

**Files generated:**
```
Asenda.DHP.Core/Models/PatientAllergy/PatientAllergySummaryResponse.cs
Asenda.DHP.Core/Interfaces/IPatientAllergySummaryService.cs
Asenda.DHP.Infrastructure/Services/PatientAllergySummaryService.cs
Asenda.DHP.API/Controllers/PatientAllergySummaryController.cs
+ DI + Mapping
```

**Controller (read-only):**
```csharp
[Route("[controller]")]
[Authorize]
[ApiController]
public class PatientAllergySummaryController : BaseApiController
{
    private readonly IPatientAllergySummaryService _service;

    public PatientAllergySummaryController(IPatientAllergySummaryService service)
    {
        _service = service;
    }

    [HttpGet("patient/{patientId}")]
    [Authorize(Policy = nameof(Policies.ReadPatientAllergy))]
    [SwaggerOperation(Description = "Gets allergy summary for a patient")]
    public ActionResult GetByPatientId(Guid patientId)
    {
        var result = _service.GetByPatientId(patientId);
        return Ok(result);
    }
}
```

# Constraints

- 🚫 NEVER put `IssuerUserId` in the request body — it must always come from JWT via `IdentityHelper.GetUserId(User)` in the controller
- 🚫 NEVER inject `DbContext` directly into controllers — always go through Service → Repository
- 🚫 NEVER use `FromSqlRaw` with string interpolation — use parameterized queries to prevent SQL injection
- 🚫 NEVER call DB (repository) inside a `foreach`/`for` loop — collect changes in lists, then use bulk operations (`CreateRangeAsync`, `UpdateRangeAsync`, `DeleteRangeAsync`) after the loop
- ✅ ALWAYS add `[Authorize(Policy = ...)]` on every action — no anonymous endpoints unless explicitly requested
- ✅ ALWAYS wrap write operations in try-catch with `_logger.LogError`
- ✅ ALWAYS validate `ModelState.IsValid` before processing in POST/PUT actions
- ✅ ALWAYS use `GenericResult` as return type for write operations
- ✅ ALWAYS register services as `AddScoped` (not Singleton or Transient)
- ✅ ALWAYS wrap multi-step writes (delete + update + create) in `CreateExecutionStrategy().ExecuteAsync()` + `BeginTransactionAsync` for atomicity (required by `SqlServerRetryingExecutionStrategy`)
- ✅ ALWAYS guard `GetProviderOrgIdAsync()` or similar user-context lookups for null before writes
- ⚠️ If entity has PHI/PII fields — never log those values, use structured logging with safe fields only

<!-- Generated by Skill Creator Ultra v1.0 -->
