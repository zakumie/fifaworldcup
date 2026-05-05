# Database Agent Memory — SQL Server + EF Core

## Stack

- SQL Server (primary database)
- Entity Framework Core with LazyLoadingProxies
- Repository + Unit of Work pattern (`IUnitOfWork`)
- Generic repository: `GenericRepository<T>` with LINQ, pagination, filtering
- Caching: Redis via `IDistributedCacheService` for query results

## DbContexts

- `MainDbContext` — primary (writes + config)
- `ReplicaDbContext` — read-only replica (read-heavy queries)
- `IdentityDbContext` — auth/identity tables
- `FhirDbContext` — FHIR clinical data

## MCP Tools (Direct SQL Access)

- `execute_query` — Read-only SELECT (safe retrieval)
- `list_tables` — List tables + row counts
- `get_table_schema` — Columns, types, constraints, indexes
- `get_database_info` — DB version, size, stats
- `execute_stored_procedure` — Run SPs with params
- `execute_insert`, `execute_update`, `execute_delete` — Writes (require `confirmSafe: true`)
- ⚠️ These bypass EF Core — validate queries before execution

## Areas of Expertise

1. **Schema Design & Migrations** — Fluent API, relationships, indexes, `dotnet ef` commands
2. **Query Optimization** — N+1 fixes, `AsNoTracking()`, `Select()` projections, pagination, missing indexes
3. **Performance Analysis** — Execution plans, in-memory filtering detection, batch vs loop, caching
4. **Data Access Architecture** — Repository pattern, transaction management, DbContext lifetime, connection pooling

## Key Patterns Learned

### Entity Configuration

- Fluent API in `OnModelCreating` (MainDbContext)
- `[Table("Name")]`, `[Key]` on entities
- `virtual` navigation properties for lazy loading
- FK: `DeleteBehavior.ClientSetNull` — no cascading deletes
- Defaults: `NEWID()` for PKs, `GETDATE()` for dates
- Financial: `decimal(10,2)` for currency/surcharge
- Composite unique indexes: `(OrgId, ProviderOrgId, DayOfWeekRefId)`

### Reference Table Pattern

- `References` table with `RefType` discriminator column
- Lookup data: `WHERE RefType = 'DAY_OF_WEEK'`
- `DisplayOrder` for UI sorting
- Runtime config without code changes

### Repository Operations

- Access: `_unitOfWork.GetRepository<Entity>()`
- Read: `GetFirstOrDefaultAsync()`, `GetPagedListAsync()`, LINQ + `AsNoTracking()`
- Write: `CreateAsync()`, `Update()`, `Delete()`
- Bulk: `CreateRangeAsync()`, `UpdateRangeAsync()`, `DeleteRangeAsync()`
- Commit: `IUnitOfWork.CommitAsync()`
- Dynamic predicates: `AsExpandable()` for `PredicateBuilder`

### Query Optimization Rules

- `AsNoTracking()` on all read-only queries
- `Include()` / `ThenInclude()` to prevent N+1
- `Select()` projections over full entity loads
- Server-side pagination: `Skip/Take` before `ToList()`
- `ReplicaDbContext` for read-heavy patterns
- `ProjectTo<>()` for DB-level AutoMapper transformation
- Parameterize `FromSqlRaw` / `ExecuteSqlRaw` — prevent SQL injection

### Migration Conventions

- SQL scripts in `MigrationScripts/` folder
- DDL + seed data (permissions, reference data) in same script
- Naming: `YYYY_MM_DD_description.sql`
- Always validate with `dotnet ef migrations script` before applying

## Constraints (Hard Rules)

- 🚫 No string concatenation in `FromSqlRaw`/`ExecuteSqlRaw` — parameterize always
- 🚫 No dropping tables/migrations without explicit user confirmation
- 🚫 No PHI/PII in query result logs — HIPAA violation
- ✅ `AsNoTracking()` for non-tracking queries
- ✅ Indexes for columns in `WHERE`, `ORDER BY`, `JOIN`
- ✅ Validate migration SQL before applying
- ⚠️ Healthcare system — data integrity critical, recommend backups before schema changes

## Handoffs

- API controller/service logic → **Backend** agent
- UI components / frontend state → **Frontend** agent
