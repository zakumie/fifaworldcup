---
name: api-optimize
description: "Backend skill for ASP.NET Core. Use when: optimizing code performance, analyzing slow queries, reviewing Entity Framework usage, auditing security (OWASP Top 10), spotting N+1 queries, improving caching with Redis, reviewing JWT/auth config, identifying memory leaks, refactoring services and repositories, analyzing async/await patterns, reviewing API response times, checking for SQL injection or XSS risks, auditing PHI/HIPAA data handling."
argument-hint: "Paste code, a file path, or describe the area (e.g. 'PatientListService', 'EF query in EncountersController', 'JWT config')"
---

# API Optimize — Performance, Security & Code Quality

## When to Use
- Slow API endpoints or long-running EF Core queries
- Code review for performance or security issues
- Audit a service/repository/controller for OWASP Top 10 risks
- Reviewing EF Core query patterns, caching strategy, async usage
- Validating JWT configuration, authorization policies, input validation
- Checking PHI data handling and HIPAA audit trail compliance

## Stack Context
- **Framework**: ASP.NET Core (.NET 8)
- **ORM**: Entity Framework Core (`MainDbContext`, `ReplicaDbContext`, `IdentityDbContext`)
- **Caching**: Redis (`IDistributedCacheService`)
- **Auth**: JWT Bearer + ASP.NET Identity + custom `IJwtAuthService`
- **Architecture**: Repository + Unit of Work (`IUnitOfWork`) + Service Layer
- **Storage**: Azure Blob (`IBlobService`)
- **Real-time**: Azure SignalR (`Hubs/`)
- **HTTP Resilience**: Polly retry policies (`HttpRetryPolicy`)
- **Background Jobs**: Azure Functions (`Asenda.DHP.OnCallFunctions`)
- **Constants**: `Asenda.DHP.Core.Constants`

---

## Procedure

### Step 1 — Gather Context
1. Identify the target: controller, service, repository, or configuration file.
2. Read the relevant source files and their interfaces under `Asenda.DHP.Core/Interfaces/`.
3. Check related EF DbContext configurations in `Asenda.DHP.Infrastructure/Data/DbContexts/`.
4. Review DI registrations in `Program.cs` for scope/lifetime issues.

### Step 2 — Performance Analysis
Follow [./references/performance.md](./references/performance.md).

Key checks:
- **N+1 queries**: Ensure `Include`/`ThenInclude` or projections replace lazy loading.
- **AsNoTracking**: Apply on all read-only queries.
- **Select projections**: Never load full entities when a DTO subset suffices.
- **Pagination**: Confirm `Skip/Take` is applied server-side, not in-memory.
- **Async/Await**: All I/O must be `async`; flag `.Result`, `.Wait()`, blocking calls.
- **Caching**: Check if stable results can be cached via `IDistributedCacheService`.
- **ReplicaDbContext**: Read-heavy queries should use the read replica.
- **Batch operations**: Replace per-item DB calls inside loops with bulk queries.
- **Indexes**: Flag LINQ `Where` clauses filtering on likely non-indexed columns.

### Step 3 — Security Audit
Follow [./references/security.md](./references/security.md).

OWASP Top 10 checks:
| Risk | Where to Check |
|------|---------------|
| Broken Access Control | `[Authorize]` attributes, policy enforcement, organization-scoped data isolation |
| Injection (SQL/XSS) | `FromSqlRaw`/`ExecuteSqlRaw` with string interpolation, unparameterized inputs |
| Cryptographic Failures | Password hashing (ASP.NET Identity), JWT secret strength, TLS enforcement |
| Security Misconfiguration | CORS policy in `Program.cs`, Swagger in Production, error detail leakage |
| Identification/Auth Failures | JWT expiry, refresh token handling, `IJwtAuthService` claims validation |
| Sensitive Data Exposure | PHI/PII in logs (`IHttpClientLogService`), response bodies, audit logs |
| SSRF | External `HttpClient` calls — validate target URLs against user input |
| Outdated Components | Flag deprecated NuGet packages in `*.csproj` files |

### Step 4 — Code Quality & Optimization
Follow [./references/code-quality.md](./references/code-quality.md).

- **Service lifetime**: Scoped vs Singleton mismatches cause threading/data bugs.
- **Exception handling**: Catch specific exceptions; never swallow with empty `catch {}`.
- **CancellationToken**: Must propagate from controller → service → repository.
- **Logging**: Use `ILogger<T>` structured logging; never log PHI/PII.
- **Null safety**: Check nullable reference type annotations are consistent.
- **SOLID violations**: God services, missing interfaces, DbContext injected directly into controllers.
- **Magic strings/numbers**: Should use `Asenda.DHP.Core.Constants`.
- **Unit of Work**: All writes must commit through `IUnitOfWork.CommitAsync()`.

### Step 5 — Report Findings
Present results in this format:

```
## Analysis: [Target Name]

### Critical Issues (fix immediately)
- ...

### Performance Issues
- ...

### Security Issues
- ...

### Code Quality
- ...

### Recommendations
- ...
```

---

## Reference Files
- [Performance Guide](./references/performance.md)
- [Security Guide](./references/security.md)
- [Code Quality Guide](./references/code-quality.md)
