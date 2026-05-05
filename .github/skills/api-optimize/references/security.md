# Security Audit Reference (OWASP Top 10)

> This project handles Protected Health Information (PHI). HIPAA compliance is mandatory.
> All access to PHI must be logged via `IAuditLogService`.

---

## 1. Broken Access Control

Every endpoint that touches patient/org data must:
1. Require authentication via `[Authorize]`.
2. Verify the caller has rights to the requested **resource** (not just "is logged in").

```csharp
// BAD: authenticates but no resource-level check
[Authorize]
[HttpGet("{patientId}")]
public async Task<IActionResult> GetPatient(int patientId, CancellationToken ct)
    => Ok(await _service.GetPatientAsync(patientId, ct));

// GOOD: verify caller's org matches patient's org
[Authorize]
[HttpGet("{patientId}")]
public async Task<IActionResult> GetPatient(int patientId, CancellationToken ct)
{
    if (!await _authService.CanAccessPatientAsync(CurrentUserId, patientId, ct))
        return Forbid();
    return Ok(await _service.GetPatientAsync(patientId, ct));
}
```

**Checklist**:
- [ ] All controllers inherit `BaseApiController` (which enforces base `[Authorize]`).
- [ ] No `[AllowAnonymous]` on PHI endpoints.
- [ ] Organization-scoped queries always filter by `OrgId` tied to the current user's claims.
- [ ] Role-based access uses `[Authorize(Roles = RoleConstants.XYZ)]` from `Asenda.DHP.Core.Constants`.

---

## 2. Injection (SQL, XSS, Command)

### SQL Injection
```csharp
// CRITICAL — DANGEROUS: user input in raw SQL
_context.Database.ExecuteSqlRaw($"SELECT * FROM Patients WHERE Name = '{name}'");

// SAFE: parameterized interpolated SQL
_context.Database.ExecuteSqlInterpolated($"SELECT * FROM Patients WHERE Name = {name}");

// BEST: use EF Core LINQ — parameterized automatically
_context.Patients.Where(p => p.LastName == name);
```

Flag all `FromSqlRaw` / `ExecuteSqlRaw` calls containing string interpolation or concatenation.

### Stored XSS (Clinical Notes)
Free-text fields saved to the DB and rendered back in the UI (notes, dot phrases, macros) must be sanitized before storage or HTML-encoded on output.

```csharp
// Flag: any field that accepts HTML content from the client
// Ensure sanitization library (e.g., HtmlSanitizer) strips dangerous tags
var safeContent = _sanitizer.Sanitize(request.NoteContent);
```

---

## 3. Cryptographic Failures

| Area | Requirement |
|------|------------|
| Passwords | ASP.NET Identity `IPasswordHasher<T>` (PBKDF2/bcrypt) — never MD5/SHA1 |
| JWT Secret | ≥256-bit random key from `appsettings` / Azure Key Vault, never hardcoded |
| PHI at rest | Sensitive fields (SSN, DOB) must be encrypted per HIPAA standards |
| Transport | `UseHttpsRedirection()` + HSTS enforced in `Program.cs` |
| Tokens | Refresh tokens must be stored as secure hashes, not plaintext |

```csharp
// BAD: hardcoded secret
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("my-secret-key-123"));

// GOOD: from configuration / Key Vault
var secret = builder.Configuration["jwtTokenConfig:secret"]
    ?? throw new InvalidOperationException("JWT secret not configured");
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
```

---

## 4. Security Misconfiguration

### CORS
```csharp
// DANGEROUS: allows any origin with credentials
policy.AllowAnyOrigin().AllowCredentials(); // throws at runtime, but flag the intent

// REQUIRED: explicit allowed origins from config
policy.WithOrigins(domainOrigins.Select(d => d.Origin).ToArray())
      .AllowCredentials()
      .AllowAnyHeader()
      .AllowAnyMethod();
```

### Swagger in Production
```csharp
// Swagger must be gated — not exposed in Production without auth
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment(EnvironmentNames.Sandbox))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

### Error Detail Leakage
```csharp
// BAD: exposes stack trace to client
app.UseDeveloperExceptionPage();

// GOOD in production: generic error handler
app.UseExceptionHandler("/error");
// Return ProblemDetails without internal details
```

---

## 5. Identification & Authentication Failures

### JWT Configuration
```csharp
// Verify in IJwtAuthService / AuthorizationConfig.cs:
TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,           // must be true
    ValidateAudience = true,         // must be true
    ValidateLifetime = true,         // must be true — rejects expired tokens
    ValidateIssuerSigningKey = true, // must be true
    ClockSkew = TimeSpan.Zero        // no grace period — enforce exact expiry
};
```

**Checklist**:
- [ ] Access token lifetime ≤ 60 minutes.
- [ ] Refresh tokens are single-use and rotated on each use.
- [ ] Failed login attempts are rate-limited (lockout policy in `IdentityOptions`).
- [ ] Account lockout enabled: `options.Lockout.MaxFailedAccessAttempts`.
- [ ] MFA enforced for admin/provider roles.

---

## 6. Sensitive Data Exposure (PHI / HIPAA)

```csharp
// FORBIDDEN: logging PHI
_logger.LogInformation("Accessing patient SSN: {Ssn}", patient.Ssn);
_logger.LogDebug("Patient record: {@Patient}", patient); // object dump may include PHI

// SAFE: log only non-PHI identifiers
_logger.LogInformation("Patient record accessed. PatientId: {PatientId}, UserId: {UserId}",
    patientId, currentUserId);
```

**PHI fields to never log**: SSN, DOB, full name in combination, diagnosis codes, medication details, addresses.

### Audit Log (HIPAA Required)
Every read/write of PHI must produce an audit entry:
```csharp
await _auditLogService.LogAsync(new AuditEntry
{
    UserId = currentUserId,
    Action = AuditActions.ReadPatient,
    ResourceId = patientId.ToString(),
    ResourceType = "Patient",
    Timestamp = DateTime.UtcNow,
    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
});
```

---

## 7. Software & Data Integrity Failures

- Validate all inbound data at API boundaries using model validation attributes.
- Return `ValidationProblem()` on `!ModelState.IsValid`.
- Do not trust client-supplied IDs/roles in the request body — derive them from JWT claims.

```csharp
// BAD: client tells us which org they belong to
public async Task<IActionResult> Create([FromBody] CreatePatientRequest request)
// where request.OrgId comes from the body

// GOOD: derive OrgId from the authenticated user's claims
var orgId = User.GetOrgId(); // extension on ClaimsPrincipal
```

---

## 8. SSRF (Server-Side Request Forgery)

Flag any `HttpClient` call where the target URL is constructed from user input.

```csharp
// DANGEROUS: user controls the URL
var response = await _httpClient.GetAsync(request.WebhookUrl);

// SAFE: validate against an allowlist before calling
private static readonly HashSet<string> AllowedHosts = ["api.partner.com", "fhir.example.org"];

if (!Uri.TryCreate(request.WebhookUrl, UriKind.Absolute, out var uri)
    || !AllowedHosts.Contains(uri.Host))
    return BadRequest("URL not allowed.");

var response = await _httpClient.GetAsync(uri);
```

---

## 9. Vulnerable & Outdated Components

Run periodically:
```bash
dotnet list package --vulnerable
dotnet list package --outdated
```

Flag packages with known CVEs in `Asenda.DHP.API.csproj`, `Asenda.DHP.Infrastructure.csproj`, `Asenda.DHP.Core.csproj`.

---

## 10. Security Logging & Monitoring Failures

Structured logging events that **must** exist:
- Authentication success / failure (with IP, user agent).
- Authorization failures (403/401 with endpoint and userId).
- PHI access (read/write) via `IAuditLogService`.
- Configuration changes by admins.
- Unusual patterns: bulk exports, after-hours access.

Never route security events through `ILogger` alone — use `IAuditLogService` for tamper-evident storage.
