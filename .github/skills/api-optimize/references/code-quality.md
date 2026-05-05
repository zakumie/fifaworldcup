# Code Quality Reference

## Architecture Rules

### Layer Responsibilities
| Layer | Responsibility | Must NOT |
|-------|---------------|----------|
| Controller | Receive HTTP, delegate to service, return `IActionResult` | Contain business logic or direct DB access |
| Service | Orchestrate repositories, enforce business rules | Directly call `DbContext` |
| Repository | Data access only | Contain business logic |
| Infrastructure | EF Core, external integrations | Leak domain logic |

```csharp
// BAD: business logic in controller
[HttpPost]
public async Task<IActionResult> CreateAppointment([FromBody] AppointmentRequest request)
{
    var existing = await _context.Appointments.AnyAsync(a => a.PatientId == request.PatientId);
    if (existing) return Conflict("Patient already has an appointment.");
    // ...
}

// GOOD: delegate to service
[HttpPost]
public async Task<IActionResult> CreateAppointment([FromBody] AppointmentRequest request, CancellationToken ct)
    => Ok(await _appointmentService.CreateAsync(request, ct));
```

---

## Unit of Work — CommitAsync

All write operations must go through `IUnitOfWork.CommitAsync()`. Never call `_context.SaveChangesAsync()` directly from a service.

```csharp
// BAD: bypasses Unit of Work
await _context.SaveChangesAsync(cancellationToken);

// GOOD: commit through UoW
_context.Patients.Add(patient);
await _unitOfWork.CommitAsync(cancellationToken);
```

---

## Service Lifetime Issues

**Most dangerous pattern**: injecting a Scoped service (e.g., `DbContext`) into a Singleton.

```csharp
// DANGEROUS: DbContext is Scoped; MyBackgroundService is Singleton — DbContext will be stale/corrupted
services.AddSingleton<IMyBackgroundService, MyBackgroundService>();
// where MyBackgroundService receives IMyRepository (Scoped) in constructor

// SAFE: use IServiceScopeFactory in Singletons that need Scoped dependencies
public class MyBackgroundService(IServiceScopeFactory scopeFactory) : IHostedService
{
    public async Task DoWorkAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IMyRepository>();
        await repo.DoAsync(ct);
    }
}
```

**Lifetime quick reference**:
| Service | Lifetime |
|---------|----------|
| `DbContext` (MainDbContext, ReplicaDbContext) | Scoped |
| Repositories | Scoped |
| Domain Services | Scoped |
| `IHttpClientFactory` | Singleton |
| `ILogger<T>` | Singleton |
| `IMemoryCache` | Singleton |

---

## Exception Handling

```csharp
// BAD: swallowed exception — hides bugs
try { await _service.ProcessAsync(id); }
catch (Exception) { }

// BAD: catching base Exception for all cases — too broad
catch (Exception ex)
{
    _logger.LogError(ex, "Something failed");
    return StatusCode(500);
}

// GOOD: specific exceptions mapped to correct HTTP responses
try
{
    var result = await _service.GetAsync(id, cancellationToken);
    return Ok(result);
}
catch (NotFoundException ex)
{
    _logger.LogWarning(ex, "Resource not found. Id: {Id}", id);
    return NotFound(new ProblemDetails { Detail = ex.Message });
}
catch (UnauthorizedAccessException ex)
{
    _logger.LogWarning(ex, "Unauthorized access attempt. UserId: {UserId}", CurrentUserId);
    return Forbid();
}
```

Use a global exception-handling middleware for unhandled exceptions rather than try/catch in every controller.

---

## CancellationToken — Full Propagation Chain

```csharp
// Controller → accepts from ASP.NET Core pipeline
[HttpGet("{id}")]
public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    => Ok(await _patientService.GetAsync(id, cancellationToken));

// Service → passes through
public async Task<PatientDto?> GetAsync(int id, CancellationToken cancellationToken = default)
    => await _repository.GetByIdAsync(id, cancellationToken);

// Repository → passes to EF Core
public async Task<Patient?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    => await _context.Patients
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
```

---

## Logging Standards

```csharp
// BAD: positional/string-interpolated messages lose structured data
_logger.LogInformation($"Created patient with id {patientId}");

// GOOD: named placeholders enable structured queries in Application Insights / Seq
_logger.LogInformation("Patient created. PatientId: {PatientId}, OrgId: {OrgId}", patientId, orgId);

// Log levels guide:
// Debug    — verbose dev-time details (disable in Production)
// Info     — normal operations (record created, job started)
// Warning  — unexpected but recoverable (not found, retry attempted)
// Error    — failures requiring attention (exception caught at boundary)
// Critical — system-wide failures (DB down, config missing)
```

**Never log**:
- PHI: SSN, DOB, diagnosis, medications, full patient name + ID together.
- Credentials, tokens, connection strings.
- Full request/response bodies from external health APIs.

---

## Nullable Reference Types

```csharp
// In *.csproj — should be enabled
<Nullable>enable</Nullable>

// Annotate return types correctly
public async Task<PatientDto?> GetAsync(int id, CancellationToken ct) // nullable — may return null

// Use null-forgiving (!) sparingly — only when you've already verified non-null
var name = patient!.FullName; // justify with a comment explaining the guarantee
```

---

## Magic Strings / Numbers

All constants should live in `Asenda.DHP.Core.Constants`:

```csharp
// BAD
if (user.Role == "SuperAdmin") ...
var cacheKey = $"patient_{id}_summary";

// GOOD
if (user.Role == RoleConstants.SuperAdmin) ...
var cacheKey = string.Format(CacheKeyConstants.PatientSummary, id);
```

---

## Response Patterns (BaseApiController)

Use the inherited helpers consistently:

```csharp
return Ok(result);              // 200 — successful read/update
return Created(uri, dto);       // 201 — successful create with Location header
return NoContent();             // 204 — successful delete or void update
return NotFound();              // 404 — resource does not exist
return Forbid();                // 403 — authenticated but not authorized
return Unauthorized();          // 401 — not authenticated
return ValidationProblem();     // 400 — model validation failure (uses ModelState)
return Conflict(detail);        // 409 — business rule conflict
```

---

## Input Validation

Apply data annotations on all API request DTOs:

```csharp
public class CreatePatientRequest
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public DateOnly DateOfBirth { get; set; }

    [MaxLength(11)]
    [RegularExpression(@"^\d{3}-\d{2}-\d{4}$", ErrorMessage = "Invalid SSN format")]
    public string? Ssn { get; set; }
}
```

In `BaseApiController`, model state should be checked automatically via `[ApiController]` attribute. Return `ValidationProblem()` on failure — do not return `BadRequest(ModelState)` directly.
