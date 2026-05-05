---
name: code-reviewer
description: |
  Review code changes (staged/unstaged git diff) cho cả Backend (.NET) và Frontend
  (React/TypeScript) trước khi commit. Phân tích Performance, Security (OWASP Top 10),
  Code Quality, và đề xuất Best Practices cải thiện.
  Dùng khi user nói "review code", "check code", "review changes", "kiểm tra code",
  "xem lại code trước khi commit", "audit code", "code review", "review PR",
  "review trước khi push", kể cả khi nói ngắn "review đi", "check giúp".
  KHÔNG dùng cho: tối ưu hóa sâu một service cụ thể (dùng backend-optimize),
  viết code mới, hoặc debug lỗi runtime.
---

# Goal

Review tất cả code changes trước khi commit, phát hiện vấn đề về Performance,
Security, Code Quality và đề xuất Best Practices — giúp code đạt production
quality trước khi vào source control.

# Instructions

## Step 1 — Thu thập Changes

1. Dùng `get_changed_files` để lấy diff của các file đã thay đổi (staged + unstaged).
2. Nếu không có changes nào → thông báo user "Không có code changes nào để review."
3. Phân loại files theo loại:
   - **Backend**: `*.cs`, `*.csproj`, `appsettings*.json`
   - **Frontend**: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.css`, `*.scss`
   - **Config/Other**: `*.json`, `*.yml`, `*.yaml`, `*.md`
4. Đọc TOÀN BỘ file gốc (không chỉ diff) để hiểu context đầy đủ.

## Step 2 — Performance Review

Kiểm tra từng change theo checklist:

### Backend (.NET / EF Core)
| Check | Mô tả |
|-------|--------|
| N+1 Queries | `Include()`/`ThenInclude()` bị thiếu khi truy cập navigation properties |
| Missing AsNoTracking | Queries chỉ đọc mà không có `.AsNoTracking()` |
| Full Entity Load | Load toàn bộ entity khi chỉ cần vài fields → đề xuất `.Select()` projection |
| In-Memory Filtering | `.ToList()` trước `.Where()` → filter trên DB thay vì memory |
| Missing Pagination | Queries trả về danh sách lớn không có `Skip/Take` |
| Blocking Async | `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` thay vì `await` |
| Loop DB Calls | Gọi DB trong vòng lặp → đề xuất batch query |
| Missing CancellationToken | Async methods không propagate `CancellationToken` |
| Missing Caching | Data ít thay đổi không dùng `IDistributedCacheService` |

### Frontend (React/TypeScript)
| Check | Mô tả |
|-------|--------|
| Unnecessary Re-renders | Component thiếu `React.memo`, `useMemo`, `useCallback` khi cần |
| Missing Cleanup | `useEffect` có subscription/timer nhưng thiếu cleanup function |
| Large Bundle | Import toàn bộ library thay vì tree-shake (`import _ from 'lodash'`) |
| Redundant State | State có thể derive từ props hoặc state khác |
| Missing Dependency Array | `useEffect`/`useMemo`/`useCallback` thiếu hoặc sai dependency |
| API Call Without Cancel | Fetch/axios không có cancellation token → memory leak khi unmount |

## Step 3 — Security Audit

Kiểm tra theo OWASP Top 10:

### Backend
| Risk | Điều cần kiểm tra |
|------|-------------------|
| Injection (SQL/XSS) | `FromSqlRaw`/`ExecuteSqlRaw` dùng string concat thay vì parameterized |
| Broken Access Control | Endpoint thiếu `[Authorize]`, thiếu check organization scope trên data |
| Sensitive Data Exposure | PHI/PII trong log messages, response trả thừa fields nhạy cảm |
| Security Misconfiguration | CORS wildcard, Swagger enabled ở Production, error stack trace lộ ra client |
| SSRF | `HttpClient` gọi URL từ user input mà không validate |
| Mass Assignment | Model binding cho phép user set properties không nên (Id, CreatedBy) |
| Missing Input Validation | Request model thiếu `[Required]`, `[MaxLength]`, `[Range]` validation |

### Frontend
| Risk | Điều cần kiểm tra |
|------|-------------------|
| XSS | Dùng `dangerouslySetInnerHTML` hoặc inject HTML từ user input |
| Token Exposure | Token/secrets lưu `localStorage` thay vì `httpOnly cookie` |
| Sensitive Data in State | PII/PHI lưu trong Redux state mà không cần thiết |
| Open Redirect | Redirect URL từ query params mà không validate |

## Step 4 — Code Quality Analysis

### General (cả Backend & Frontend)
| Check | Mô tả |
|-------|--------|
| SOLID Violations | God class/function làm quá nhiều việc, thiếu interface abstraction |
| Error Handling | Empty `catch {}`, swallow exceptions, thiếu error logging |
| Magic Strings/Numbers | Hardcode values thay vì dùng constants |
| Dead Code | Code comment out, unreachable code, unused imports/variables |
| Naming | Tên biến/function không rõ ý nghĩa, không theo convention |
| Duplicated Logic | Copy-paste code có thể extract thành shared function |
| Missing Null Safety | Nullable reference không check null trước khi dùng |

### Backend-Specific
| Check | Mô tả |
|-------|--------|
| DI Lifetime Mismatch | Inject Scoped service vào Singleton |
| Missing Interface | Service mới không có interface trong `Core/Interfaces/` |
| Unit of Work | Writes không đi qua `IUnitOfWork.CommitAsync()` |
| Missing Logging | Service methods không có `ILogger<T>` log cho error cases |

### Frontend-Specific  
| Check | Mô tả |
|-------|--------|
| Type Safety | Dùng `any` type thay vì typed interface |
| Missing Error UI | API call không handle error state cho user |
| Accessibility | Form elements thiếu label, images thiếu alt |
| Hardcoded Strings | UI text hardcode thay vì dùng constants/i18n |

## Step 5 — Best Practices & Recommendations

Dựa trên findings, đề xuất cải thiện:

1. **Quick Wins** — sửa ngay, effort thấp, impact cao (missing `AsNoTracking`, thiếu `[Authorize]`)
2. **Should Fix** — sửa trước khi merge, effort trung bình (refactor logic, thêm validation)
3. **Nice to Have** — cải thiện sau, không block commit (naming, code organization)

## Step 6 — Sinh Report

Trình bày kết quả theo format sau:

```
## 🔍 Code Review Report

### 📊 Summary
- Files reviewed: X
- Issues found: Y (🔴 Critical: A | 🟠 Warning: B | 🟡 Info: C)

### 🔴 Critical Issues (PHẢI sửa trước khi commit)
#### [Tên file]
- **[Security/Performance/Quality]**: Mô tả vấn đề
  - 📍 Location: dòng X
  - 💡 Fix: Code suggestion cụ thể

### 🟠 Warnings (NÊN sửa)
#### [Tên file]
- **[Category]**: Mô tả
  - 💡 Fix: Suggestion

### 🟡 Suggestions (cải thiện thêm)
- ...

### ✅ Good Practices Found
- Ghi nhận những điểm code tốt để encourage

### 📋 Checklist trước khi commit
- [ ] Đã fix tất cả Critical issues
- [ ] Đã review tất cả Warnings
- [ ] Code đã build thành công
- [ ] Không có sensitive data trong changes
```

# Examples

## Ví dụ 1: Happy path — Backend changes có vài vấn đề

**Context:** Dev thêm endpoint mới cho Patient Search

**Input (diff):**
```csharp
// PatientsController.cs — thêm action mới
[HttpGet("search")]
public async Task<IActionResult> SearchPatients(string keyword)
{
    var patients = await _patientService.SearchAsync(keyword);
    return Ok(patients);
}

// PatientService.cs
public async Task<List<Patient>> SearchAsync(string keyword)
{
    var patients = _unitOfWork.GetRepository<Patient>()
        .GetAll()
        .Where(p => p.FirstName.Contains(keyword))
        .ToList();
    return patients;
}
```

**Output:**
```
## 🔍 Code Review Report

### 📊 Summary
- Files reviewed: 2
- Issues found: 5 (🔴 Critical: 2 | 🟠 Warning: 2 | 🟡 Info: 1)

### 🔴 Critical Issues
#### PatientsController.cs
- **[Security] Missing Authorization**: Endpoint `SearchPatients` thiếu `[Authorize]`
  attribute — bất kỳ ai cũng có thể truy cập search patients.
  - 💡 Fix: Thêm `[Authorize(Policy = "RequireActiveUser")]`

- **[Security] Missing Input Validation**: Parameter `keyword` không validate
  — có thể null/empty, gây exception hoặc trả toàn bộ records.
  - 💡 Fix: Thêm `[Required]` hoặc check `string.IsNullOrWhiteSpace(keyword)`

### 🟠 Warnings
#### PatientService.cs
- **[Performance] Missing AsNoTracking**: Query chỉ đọc nhưng không có
  `.AsNoTracking()` — EF track changes không cần thiết, tốn bộ nhớ.
  - 💡 Fix: Thêm `.AsNoTracking()` sau `.GetAll()`

- **[Performance] Full Entity Load**: Trả về toàn bộ `Patient` entity cho
  search results — nên dùng `.Select()` projection chỉ lấy fields cần thiết.
  - 💡 Fix: Tạo `PatientSearchResponse` DTO và map qua AutoMapper

### 🟡 Suggestions
- **[Quality]**: `SearchAsync` nên nhận `CancellationToken` để hỗ trợ cancel
  khi user navigate away.

### ✅ Good Practices Found
- Sử dụng async/await đúng cách
- Tách logic vào Service layer thay vì để trong Controller
```

---

## Ví dụ 2: Frontend changes — React component có vấn đề

**Context:** Dev tạo component hiển thị danh sách medications

**Input (diff):**
```tsx
// MedicationList.tsx
const MedicationList = ({ patientId }: { patientId: string }) => {
  const [meds, setMeds] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await MedicationService.getByPatient(patientId);
      setMeds(result);
    };
    fetchData();
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: meds.map(m => 
      `<div>${m.name} - ${m.dosage}</div>`
    ).join('') }} />
  );
};
```

**Output:**
```
## 🔍 Code Review Report

### 📊 Summary
- Files reviewed: 1
- Issues found: 4 (🔴 Critical: 1 | 🟠 Warning: 2 | 🟡 Info: 1)

### 🔴 Critical Issues
#### MedicationList.tsx
- **[Security] XSS via dangerouslySetInnerHTML**: Render medication data
  (có thể chứa user input) trực tiếp qua `dangerouslySetInnerHTML` — 
  attacker có thể inject script qua tên thuốc.
  - 💡 Fix: Dùng JSX mapping thay vì innerHTML:
    ```tsx
    {meds.map(m => <div key={m.id}>{m.name} - {m.dosage}</div>)}
    ```

### 🟠 Warnings
- **[Quality] `any` type**: `useState<any[]>([])` mất type safety — nếu
  API response thay đổi, sẽ không có compile error.
  - 💡 Fix: Tạo `Medication` interface và dùng `useState<Medication[]>([])`

- **[Performance] Missing useEffect dependency**: `patientId` không có trong
  dependency array — component sẽ không refetch khi đổi patient.
  - 💡 Fix: `useEffect(() => { ... }, [patientId])`

### 🟡 Suggestions
- **[Performance]**: Thêm cleanup function trong `useEffect` để cancel API
  call khi component unmount, tránh memory leak.
```

---

## Ví dụ 3: Không có changes

**Input:** User nói "review code" nhưng không có git changes.

**Output:**
```
Không có code changes nào để review. Hãy thực hiện thay đổi code rồi 
gọi lại "review code" nhé.
```

# Constraints

- 🚫 KHÔNG tự sửa code — chỉ review và đề xuất. User quyết định có sửa hay không.
- 🚫 KHÔNG bỏ qua Security issues — mọi vấn đề security đều phải report, dù nhỏ.
- 🚫 KHÔNG review files không liên quan đến changes (node_modules, bin/, obj/, build/).
- ✅ LUÔN đọc full file context, không chỉ diff — hiểu code xung quanh mới review chính xác.
- ✅ LUÔN phân loại severity rõ ràng (Critical / Warning / Suggestion) — giúp dev ưu tiên.
- ✅ LUÔN đưa ra code fix cụ thể cho Critical issues — đừng chỉ nói "nên sửa".
- ✅ LUÔN ghi nhận Good Practices — review không chỉ là chê, mà còn động viên.
- ⚠️ PHI/PII (dữ liệu bệnh nhân) phải được đặc biệt chú ý — dự án healthcare, 
  lộ PHI = vi phạm HIPAA nghiêm trọng.
- ⚠️ Giữ report ngắn gọn, tập trung — không liệt kê nitpick khi có Critical issues.

<!-- Generated by Skill Creator Ultra v1.0 -->
