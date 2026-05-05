---
description: "Create a SQL migration script — DDL, indexes, seed data, following DHP migration conventions"
agent: "Database"
argument-hint: "What to create (e.g. 'add Appointment table', 'add index on Person.Email', 'seed roles')"
---

## Target

- Migration description: ${input:description:What to create e.g. 'add Appointment table', 'add index on Person.Email'}

## Conventions

1. Migration scripts go in `OUTPATIENT_API/MigrationScripts/`
2. File naming: `YYYY_MM_DD_description.sql` (e.g. `2026_04_02_add_appointment_table.sql`)
3. All scripts must be **idempotent** — use `IF NOT EXISTS` checks
4. Follow existing patterns in [MigrationScripts/](../../OUTPATIENT_API/MigrationScripts/)

## Generation Steps

1. If creating a table — include: columns, types, PK (`NEWID()` default), FK constraints, audit columns (`CreatedBy`, `CreatedDate`, `UpdatedBy`, `UpdatedDate`), indexes
2. If adding indexes — check existing schema first using MCP SQL tools
3. If seeding data — use `MERGE` or `IF NOT EXISTS` patterns for idempotency
4. Match the EF Core entity model if one exists in `Infrastructure/Data/Entities/`
5. Use `decimal(10,2)` for financial fields, `DeleteBehavior.ClientSetNull` for FKs (no cascade)

Generate the SQL file and also update the corresponding EF Core entity configuration if needed.
