# Backend Agent Memory — OUTPATIENT_API

## Stack

- ASP.NET Core Web API (.NET 8)
- Entity Framework Core with LazyLoadingProxies
- Architecture: Controller → Service → Repository (Unit of Work)
- Auth: JWT Bearer + ASP.NET Identity + Permission-based policies (`Policies.cs` UUID constants)
- Caching: Redis via `IDistributedCacheService`
- Storage: Azure Blob via `IBlobService`
- Real-time: Azure SignalR (`Hubs/`)
- Background: Azure Functions
- Mapping: AutoMapper (`MainMapper`) with `ProjectTo<>()` for DB-level mapping
- Multi-tenant: OrgId + ProviderOrgId composite scoping

## DbContexts

- `MainDbContext` — primary (writes)
- `ReplicaDbContext` — read-only replica (reads)
- `IdentityDbContext` — auth/identity
- `FhirDbContext` — FHIR clinical data

## Skills & When to Use

| Trigger | Skill |
|---------|-------|
| Create API/endpoint/controller | `.github/skills/api-creator/SKILL.md` |
| Optimize perf, audit security, code quality | `.github/skills/api-optimize/SKILL.md` |
| Review code before commit | `.github/skills/code-reviewer/SKILL.md` |

## Key Patterns Learned

### Controller Layer

- Inherits `BaseApiController : ControllerBase`
- Route: `[Route("[controller]")]`
- Class-level: `[Authorize]`, `[ApiController]`
- Permission-based auth (NOT role-based):
  - `[Authorize(Policy = nameof(Policies.ViewXxx))]` — reads
  - `[Authorize(Policy = nameof(Policies.EditXxx))]` — writes
- User context: `IdentityHelper.GetUserId(User)` from JWT claims
- Controller sets `request.UserId` (hidden via `[JsonIgnore]`) before service call
- All endpoints: `CancellationToken cancellationToken` parameter
- All endpoints: `[SwaggerOperation(Description = "...")]` for OpenAPI

### Service Layer

- Interfaces in `Asenda.DHP.Core/Interfaces/`
- All methods **async** (`Task<T>`) — no sync methods ever
- Constructor DI: `ILogger<T>`, `IMapper`, `IUnitOfWork<MainDbContext>`, `IUnitOfWork<ReplicaDbContext>`, `UserManager<ApplicationUser>`
- Read/Write DB separation:
  - `IUnitOfWork<ReplicaDbContext>` → read-only queries
  - `IUnitOfWork<MainDbContext>` → write operations
- Error handling: `try-catch → GenericResult.Failed(new IdentityError { Description = "..." })`
- Structured logging: `_logger.LogError(ex, "Msg {Context}", val)`
- Audit fields set explicitly: `CreatedBy`, `CreatedDate`, `UpdatedBy`, `UpdatedDate`
- Private helpers for shared logic: `UpsertXxxAsync()`, `ValidateDuplicateXxx()`

### Repository Layer

- Access: `IUnitOfWork.GetRepository<Entity>()`
- Single: `GetFirstOrDefaultAsync()`, `CreateAsync()`, `Update()`
- Bulk: `CreateRangeAsync()`, `UpdateRangeAsync()`, `DeleteRangeAsync()`
- **Each bulk method auto-commits** (`SaveChangesAsync`) when `isSharedContext=false` (default)
- Read: `AsNoTracking()` via replica repository
- Navigation: `Include()` / `ThenInclude()`
- Commit: `IUnitOfWork.CommitAsync()`
- **Batch pattern**: Never call DB inside loops. Collect changes in lists first, batch after loop:

  ```csharp
  // BAD: DB call per iteration
  foreach (var id in ids)
      await repo.CreateAsync(BuildEntity(id), ct);
  
  // GOOD: collect then batch
  var entities = ids.Select(id => BuildEntity(id)).ToList();
  await repo.CreateRangeAsync(entities, ct);
  ```

- **Atomicity**: Multiple batch ops (delete+update+create) need transaction via execution strategy:

  ```csharp
  var strategy = _unitOfWork.DbContext.Database.CreateExecutionStrategy();
  await strategy.ExecuteAsync(async () =>
  {
      await using var tx = await _unitOfWork.DbContext.Database.BeginTransactionAsync(ct);
      try {
          await repo.DeleteRangeAsync(toDelete, ct);
          await repo.UpdateRangeAsync(toUpdate, ct);
          await repo.CreateRangeAsync(toCreate, ct);
          await tx.CommitAsync(ct);
      } catch { await tx.RollbackAsync(ct); throw; }
  });
  ```

  **Note**: Direct `BeginTransactionAsync` fails with `SqlServerRetryingExecutionStrategy`.
  Always wrap in `CreateExecutionStrategy().ExecuteAsync()` first.

### Models & Validation

- Entity: `[Table("Name")]`, `[Key]`, `virtual` navigation properties
- Request DTOs: `{Entity}Request` or `{Action}Request`
  - Attributes: `[Required]`, `[NotEmptyGuid]`, `[Range]`, `[MinLength]`, `[MaxLength]`
  - Hidden fields: `[JsonIgnore]` for server-set props (UserId)
  - Nested collections: `List<T> Items` with `[MinLength(1)]`
- Response DTOs: `{Entity}Response` — flat, mapped via AutoMapper
- Business validation: Private static methods in services
- Return types: `GenericResult`, `IdentityResult`, or typed responses

### AutoMapper

- All profiles in `MainMapper`
- Input → Entity: ignore audit fields, IDs, nav properties
- Entity → Response: custom `MapFrom()` for joined data
- Entity → Input: for copy flows (apply-to-default)
- `ProjectTo<>()`: DB-level mapping in LINQ (preferred over in-memory)

### Database Patterns

- Reference/lookup tables: `References` with `RefType` discriminator
- Composite unique indexes: `(OrgId, ProviderOrgId, DayOfWeekRefId)`
- Financial: `decimal(10,2)` for currency
- Defaults: `NEWID()` PKs, `GETDATE()` audit dates
- FK: `DeleteBehavior.ClientSetNull` (no cascading)
- Migrations: `MigrationScripts/` with DDL + permission seed data

### DI Registration

- `AddScoped<IService, Service>()` in `Program.cs`

## Constraints (Hard Rules)

- 🚫 No PHI/PII in logs or error responses — HIPAA system
- 🚫 No missing `[Authorize]` on patient-data endpoints — use permission policies
- 🚫 No sync DB calls — all must be `async Task<T>`
- 🚫 No writes to `ReplicaDbContext` — read-only
- 🚫 No missing `CancellationToken` — propagate full chain
- ✅ `AsNoTracking()` for read-only queries
- ✅ `CancellationToken` through entire call chain
- ✅ Commit via `IUnitOfWork.CommitAsync()`
- ✅ Set audit fields in service layer
- ✅ `[NotEmptyGuid]` on required Guid params
- ✅ Permission-based `[Authorize(Policy = nameof(Policies.Xxx))]`
- ✅ `[SwaggerOperation]` on all endpoints
- ✅ Bulk ops (`CreateRangeAsync`, etc.) for batch writes
- ✅ Never call DB inside foreach — collect changes in lists, then batch DB calls after the loop
- ✅ Wrap multi-step writes (delete + update + create) in `BeginTransactionAsync` / `CommitAsync` for atomicity
- ✅ Guard `GetProviderOrgIdAsync` null result before any write operation

## Handoffs

- Frontend / React work → **Frontend** agent
- Database schema / migration / query optimization → **Database** agent

## CDC (Change Data Capture) — Update Before Delete

- The project uses CDC tables to track data changes.
- Before calling DeleteRangeAsync, always call UpdateRangeAsync first to set audit fields (UpdatedBy, UpdatedDate) so CDC captures the final state.
- Pattern:
  `csharp
  // Set audit fields on items to delete
  toDelete.ForEach(x => { x.UpdatedBy = userId; x.UpdatedDate = currentDate; });
  await repository.UpdateRangeAsync(toDelete, cancellationToken);
  await repository.DeleteRangeAsync(toDelete, cancellationToken);
  `
- This is NOT unnecessary — do NOT remove the UpdateRangeAsync before DeleteRangeAsync.
