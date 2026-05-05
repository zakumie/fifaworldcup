# Performance Analysis Reference

## Entity Framework Core

### Read-Only Queries — Always Use AsNoTracking + Projection
```csharp
// BAD: loads all columns, change-tracked in memory
var patients = await _context.Patients
    .Where(p => p.OrgId == orgId)
    .ToListAsync();

// GOOD: projected DTO + no tracking + cancellation support
var patients = await _context.Patients
    .AsNoTracking()
    .Where(p => p.OrgId == orgId)
    .Select(p => new PatientDto
    {
        Id = p.Id,
        FullName = p.FullName,
        DateOfBirth = p.DateOfBirth
    })
    .ToListAsync(cancellationToken);
```

### N+1 Query Detection
**Red flag**: a `foreach`/`for` loop that calls the database per iteration.

```csharp
// BAD: N+1 — one query per patient
foreach (var patient in patients)
{
    var allergies = await _context.Allergies.Where(a => a.PatientId == patient.Id).ToListAsync();
}

// GOOD: single query with Include
var patients = await _context.Patients
    .AsNoTracking()
    .Include(p => p.Allergies)
    .Where(p => p.OrgId == orgId)
    .ToListAsync(cancellationToken);

// GOOD for large sets: lookup dictionary
var patientIds = patients.Select(p => p.Id).ToList();
var allergiesByPatient = await _context.Allergies
    .AsNoTracking()
    .Where(a => patientIds.Contains(a.PatientId))
    .GroupBy(a => a.PatientId)
    .ToDictionaryAsync(g => g.Key, g => g.ToList(), cancellationToken);
```

### Read Replica Usage
Use `ReplicaDbContext` for all read-only service methods to reduce load on the primary DB.

```csharp
// In service constructor — inject replica for reads
public PatientListService(MainDbContext mainContext, ReplicaDbContext replicaContext, ...)
{
    _readContext = replicaContext;
    _writeContext = mainContext;
}
```

### Pagination — Server-Side Only
```csharp
// BAD: loads everything into memory, then pages
var all = await _context.Patients.ToListAsync();
var paged = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();

// GOOD: translates to SQL OFFSET/FETCH
var paged = await _context.Patients
    .AsNoTracking()
    .OrderBy(p => p.LastName)
    .Skip((request.Page - 1) * request.PageSize)
    .Take(request.PageSize)
    .Select(p => new PatientListDto { ... })
    .ToListAsync(cancellationToken);
```

### Batch / Bulk Operations
```csharp
// BAD: individual inserts in a loop
foreach (var item in items)
    _context.Add(item);

// GOOD: add range in one operation, single SaveChanges
_context.AddRange(items);
await _unitOfWork.CommitAsync(cancellationToken);

// For large updates: consider ExecuteUpdateAsync (EF Core 7+)
await _context.Orders
    .Where(o => o.Status == OrderStatus.Pending && o.CreatedAt < cutoff)
    .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, OrderStatus.Expired), cancellationToken);
```

### Multi-Org / Batch Pattern — No DB in Loops
When applying the same operation to multiple entities (e.g., apply schedule to all orgs):
```csharp
// BAD: DB round-trips inside loop (N×3 calls for N orgs)
foreach (var orgId in orgIds)
{
    var existing = repo.Filter(x => x.OrgId == orgId).ToList(); // DB call
    await repo.DeleteRangeAsync(toDelete, ct);  // DB call
    await repo.CreateRangeAsync(toCreate, ct);  // DB call
}

// GOOD: single query + in-memory loop + batched DB calls
var allExisting = repo.Filter(x => orgIds.Contains(x.OrgId)).ToList(); // 1 DB call

var allToCreate = new List<Entity>();
var allToDelete = new List<Entity>();
foreach (var orgId in orgIds)
{
    var existing = allExisting.Where(x => x.OrgId == orgId).ToList(); // in-memory
    // compute changes → add to allToCreate, allToDelete
}

// 2-3 DB calls total, wrapped in transaction for atomicity
await using var tx = await dbContext.Database.BeginTransactionAsync(ct);
await repo.DeleteRangeAsync(allToDelete, ct);
await repo.CreateRangeAsync(allToCreate, ct);
await tx.CommitAsync(ct);
```

**Key principle**: Separate computation (pure logic, in-memory) from execution (DB calls). 
Loop over data to *prepare* change sets, then *execute* DB ops in bulk after the loop.

### Atomicity — Transaction for Multi-Step Writes
The repository's `CreateRangeAsync` / `UpdateRangeAsync` / `DeleteRangeAsync` each auto-commit 
via `SaveChangesAsync` (when `isSharedContext=false`, which is the default). This means if 
delete succeeds but create fails, data is lost permanently.

Always wrap multi-step writes in a DB transaction **via the execution strategy** 
(required because `SqlServerRetryingExecutionStrategy` is configured):
```csharp
var strategy = _unitOfWork.DbContext.Database.CreateExecutionStrategy();
await strategy.ExecuteAsync(async () =>
{
    await using var transaction = await _unitOfWork.DbContext.Database.BeginTransactionAsync(ct);
    try
    {
        await repo.DeleteRangeAsync(toDelete, ct);
        await repo.UpdateRangeAsync(toUpdate, ct);
        await repo.CreateRangeAsync(toCreate, ct);
        await transaction.CommitAsync(ct);
    }
    catch
    {
        await transaction.RollbackAsync(ct);
        throw;
    }
});
```

> ⚠️ **Never call `BeginTransactionAsync` directly** — it throws:
> `The configured execution strategy 'SqlServerRetryingExecutionStrategy' does not support user-initiated transactions.`
> Always wrap in `CreateExecutionStrategy().ExecuteAsync()` first.

---

## Caching with Redis (`IDistributedCacheService`)

### Cache Expensive / Stable Lookups
```csharp
public async Task<PatientSummaryDto?> GetPatientSummaryAsync(int patientId, CancellationToken ct)
{
    var cacheKey = $"patient:{patientId}:summary";

    var cached = await _cacheService.GetAsync<PatientSummaryDto>(cacheKey, ct);
    if (cached is not null) return cached;

    var result = await _repository.GetSummaryAsync(patientId, ct);
    if (result is not null)
        await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), ct);

    return result;
}
```

**Cache invalidation** — bust on write:
```csharp
await _cacheService.RemoveAsync($"patient:{patientId}:summary", ct);
```

**Do NOT cache**:
- User-specific, permission-sensitive queries (risk of cross-user data leakage)
- Rapidly changing data (vitals in real-time monitors)

---

## Async/Await Patterns

### Rules
- Every I/O path must be `async Task<T>`.
- Never block the thread pool:

```csharp
// BAD
var result = _service.GetAsync(id).Result;
_service.GetAsync(id).Wait();
Task.Run(() => _service.GetAsync(id)).Result;

// GOOD
var result = await _service.GetAsync(id, cancellationToken);
```

### CancellationToken Propagation
Pass the token from the controller action all the way to the DB call:
```csharp
// Controller
[HttpGet("{id}")]
public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    => Ok(await _service.GetAsync(id, cancellationToken));

// Service
public async Task<PatientDto?> GetAsync(int id, CancellationToken cancellationToken = default)
    => await _repository.GetByIdAsync(id, cancellationToken);

// Repository
public async Task<Patient?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    => await _context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
```

---

## HttpClient Performance

```csharp
// BAD: creates new socket per call, socket exhaustion risk
var client = new HttpClient();

// GOOD: use IHttpClientFactory (registered typed clients in Program.cs)
public class DrFirstService(IHttpClientFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient("DrFirst");
}
```

- Polly retry policy (`HttpRetryPolicy`) is already configured — verify typed clients use it.
- Set appropriate timeouts; don't rely on default infinite timeout.

---

## Memory & Allocation

- Avoid `ToList()` when only iterating once — use `IAsyncEnumerable<T>` or `await foreach`.
- Use `StringBuilder` for string concatenation in loops.
- `IMemoryCache` for process-local, sub-millisecond caching of reference data (ICD codes, dropdown lists).
- Dispose `IDisposable` resources (streams, `HttpResponseMessage`) in `using` statements.
