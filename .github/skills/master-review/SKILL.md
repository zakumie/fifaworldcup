---
name: master-review
description: |
  Review toàn bộ code changes giữa branch hiện tại và branch main (local).
  So sánh diff của cả Backend (.NET) và Frontend (React/TypeScript), phân tích
  Performance, Security (OWASP Top 10), Code Quality, và đề xuất Best Practices.
  Dùng khi user nói "review branch", "master review", "so sánh với main",
  "review trước khi merge", "diff với main", "check branch changes",
  "review tất cả changes", "review toàn bộ", "kiểm tra trước khi tạo PR",
  kể cả khi nói ngắn "review branch đi", "check vs main".
  KHÔNG dùng cho: review staged/unstaged changes trước commit (dùng code-reviewer),
  tối ưu hóa sâu một service cụ thể (dùng api-optimize/react-optimize).
---

# Goal

Review toàn bộ code changes giữa branch hiện tại so với `main` branch (chỉ local,
không fetch remote), phát hiện vấn đề về Performance, Security, Code Quality
và đề xuất Best Practices — giúp code đạt production quality trước khi tạo PR/merge.

# Instructions

## Step 1 — Xác định Branch và Thu thập Changes

1. Chạy `git branch --show-current` để lấy tên branch hiện tại.
2. Nếu đang ở `main` → thông báo: "Bạn đang ở branch main. Hãy checkout sang feature branch rồi chạy lại."
3. Chạy `git merge-base main HEAD` để tìm điểm rẽ nhánh (common ancestor).
4. Chạy `git diff --name-status <merge-base> HEAD` để lấy danh sách files changed.
5. Nếu không có changes nào → thông báo: "Không có code changes nào giữa branch hiện tại và main."
6. Phân loại files theo project và loại:
   - **API Backend**: files trong `OUTPATIENT_API/` — `*.cs`, `*.csproj`, `appsettings*.json`
   - **WEB Frontend**: files trong `OUTPATIENT_WEB/` — `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.css`, `*.scss`
   - **SQL/Migration**: files trong `MigrationScripts/` — `*.sql`
   - **Config/Other**: `*.json`, `*.yml`, `*.yaml`, `*.md`
   - **Bỏ qua**: `bin/`, `obj/`, `node_modules/`, `build/`, `*.lock`, `package-lock.json`
7. Hiển thị overview summary cho user:
   ```
   Branch: feature/xxx → main
   Total files changed: N (Added: A | Modified: M | Deleted: D)
   API files: X | WEB files: Y | Other: Z
   ```

## Step 2 — Thu thập Diff và Context

1. Với mỗi file changed, chạy `git diff <merge-base> HEAD -- <file-path>` để lấy diff.
2. Đọc TOÀN BỘ file hiện tại (version HEAD) để hiểu context đầy đủ — không chỉ diff.
3. Nếu file bị xóa (status `D`), chỉ ghi nhận xóa, không cần đọc.
4. Nếu file mới (status `A`), đọc toàn bộ file mới.
5. Nhóm các files liên quan lại với nhau để review có context:
   - Controller + Service + Interface + Model → review cùng nhau
   - Component + API Slice + Types → review cùng nhau

## Step 3 — Performance Review

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

## Step 4 — Security Audit

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

## Step 5 — Code Quality Analysis

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

## Step 6 — Cross-Layer Consistency Check

Vì review toàn bộ branch (cả API + WEB), kiểm tra thêm tính nhất quán giữa các layer:

| Check | Mô tả |
|-------|--------|
| API Contract Match | DTO/Response model ở Backend khớp với TypeScript interface ở Frontend |
| Endpoint URL Match | URL trong Controller khớp với endpoint constant trong Frontend |
| Missing Frontend Integration | API endpoint mới nhưng chưa có service/RTK query slice ở Frontend |
| Missing Backend Endpoint | Frontend gọi endpoint chưa tồn tại ở Backend |
| Permission Consistency | `[Authorize(Policy)]` ở Backend khớp với permission check ở Frontend |
| Error Handling Chain | Backend trả error format → Frontend handle đúng format đó |

## Step 7 — Migration Script Review (nếu có)

Nếu có files trong `MigrationScripts/`:

| Check | Mô tả |
|-------|--------|
| Naming Convention | File name theo format `YYYY_MM_DD_NN_description.sql` |
| Idempotent | Script có thể chạy lại mà không lỗi (`IF NOT EXISTS`, `IF COL NOT EXISTS`) |
| Data Loss Risk | `DROP`, `DELETE`, `ALTER COLUMN` có thể gây mất data |
| Index Coverage | Columns thường query/filter có index |
| FK Constraints | Foreign keys đúng relationships |

## Step 8 — Best Practices & Recommendations

Dựa trên findings, đề xuất cải thiện:

1. **Quick Wins** — sửa ngay, effort thấp, impact cao (missing `AsNoTracking`, thiếu `[Authorize]`)
2. **Should Fix** — sửa trước khi merge, effort trung bình (refactor logic, thêm validation)
3. **Nice to Have** — cải thiện sau, không block merge (naming, code organization)

## Step 9 — Sinh Report

Trình bày kết quả theo format sau:

```
## 🔍 Master Review Report

### 🌿 Branch Info
- **Current branch**: `feature/xxx`
- **Compare against**: `main`
- **Commits ahead**: N
- **Files changed**: X (Added: A | Modified: M | Deleted: D)

### 📁 Changed Files Overview
#### OUTPATIENT_API (Backend)
- [A] `Controllers/NewController.cs`
- [M] `Services/ExistingService.cs`

#### OUTPATIENT_WEB (Frontend)
- [A] `src/views/feature/FeaturePage.tsx`
- [M] `src/slices/featureApi.ts`

### 📊 Review Summary
- Total issues: Y (🔴 Critical: A | 🟠 Warning: B | 🟡 Info: C)

---

### 🔴 Critical Issues (PHẢI sửa trước khi merge)
#### [Tên file]
- **[Security/Performance/Quality]**: Mô tả vấn đề
  - 📍 Location: dòng X
  - 💡 Fix: Code suggestion cụ thể

### 🟠 Warnings (NÊN sửa trước khi merge)
#### [Tên file]
- **[Category]**: Mô tả
  - 💡 Fix: Suggestion

### 🟡 Suggestions (cải thiện thêm)
- ...

### 🔗 Cross-Layer Issues (nếu có)
- **[API-WEB Mismatch]**: Mô tả vấn đề nhất quán giữa các layer
  - 📍 Backend: file + dòng | Frontend: file + dòng
  - 💡 Fix: Cách đồng bộ

### ✅ Good Practices Found
- Ghi nhận những điểm code tốt để encourage

### 📋 Merge Readiness Checklist
- [ ] Đã fix tất cả Critical issues
- [ ] Đã review tất cả Warnings
- [ ] API + WEB contract khớp nhau
- [ ] Migration scripts idempotent (nếu có)
- [ ] Code build thành công (API + WEB)
- [ ] Không có sensitive data trong changes
```

# Examples

## Ví dụ 1: Branch có changes cả API + WEB

**Context:** Dev tạo feature Patient Allergy Management trên branch `feature/allergy`

**Output:**
```
## 🔍 Master Review Report

### 🌿 Branch Info
- **Current branch**: `feature/allergy`
- **Compare against**: `main`
- **Commits ahead**: 7
- **Files changed**: 12 (Added: 8 | Modified: 3 | Deleted: 1)

### 📁 Changed Files Overview
#### OUTPATIENT_API (Backend) — 6 files
- [A] `Controllers/AllergiesController.cs`
- [A] `Core/Interfaces/IAllergyService.cs`
- [A] `Core/Models/Allergy/AllergyRequest.cs`
- [A] `Core/Models/Allergy/AllergyResponse.cs`
- [A] `Infrastructure/Services/AllergyService.cs`
- [M] `Startup/DependencyInjection.cs`

#### OUTPATIENT_WEB (Frontend) — 5 files
- [A] `src/views/allergy/AllergyPage.tsx`
- [A] `src/views/allergy/AllergyPage.module.scss`
- [A] `src/slices/allergyApi.ts`
- [M] `src/reducers/index.tsx`
- [M] `src/store.tsx`

#### MigrationScripts — 1 file
- [A] `2026_03_28_01_add_allergy_table.sql`

### 📊 Review Summary
- Total issues: 6 (🔴 Critical: 1 | 🟠 Warning: 3 | 🟡 Info: 2)

---

### 🔴 Critical Issues
#### AllergiesController.cs
- **[Security] Missing Authorization**: Endpoint `DeleteAllergy` thiếu
  `[Authorize]` — bất kỳ ai cũng có thể xóa allergy records.
  - 📍 Location: dòng 45
  - 💡 Fix: Thêm `[Authorize(Policy = "RequireActiveUser")]`

### 🟠 Warnings
#### AllergyService.cs
- **[Performance] Missing AsNoTracking**: `GetAllergiesByPatient()` là read-only
  query nhưng thiếu `.AsNoTracking()`.
  - 💡 Fix: Thêm `.AsNoTracking()` sau repository query

#### AllergyPage.tsx
- **[Quality] `any` type**: Dùng `useState<any[]>` cho allergy list — mất type safety.
  - 💡 Fix: Import `AllergyResponse` type từ `allergyApi.ts`

#### 2026_03_28_01_add_allergy_table.sql
- **[Quality] Not idempotent**: `CREATE TABLE` không có `IF NOT EXISTS` guard.
  - 💡 Fix: Wrap trong `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Allergy')`

### 🟡 Suggestions
- **[Quality]** `AllergyRequest.cs`: Thêm `[MaxLength]` cho `AllergyName` property
- **[Performance]** `allergyApi.ts`: Thêm `providesTags` cho cache invalidation

### 🔗 Cross-Layer Issues
- **[API-WEB Match] ✅**: Endpoint URLs và DTO fields khớp giữa Controller và RTK query
- **[Permission] ⚠️**: Backend có `[Authorize]` nhưng Frontend chưa check
  `useCheckUserPermission('MANAGE_ALLERGY')` cho nút Delete

### ✅ Good Practices Found
- Interface + Service pattern đúng convention
- RTK Query slice với proper base query
- CSS Modules cho styling (không global CSS)
- Migration script đặt tên đúng convention

### 📋 Merge Readiness Checklist
- [ ] Fix missing `[Authorize]` on DeleteAllergy
- [ ] Add `.AsNoTracking()` to read queries
- [x] API + WEB contract khớp nhau
- [ ] Migration script cần idempotent guard
- [ ] Thêm permission check ở Frontend cho Delete
```

## Ví dụ 2: Đang ở main branch

**Output:**
```
Bạn đang ở branch `main`. Hãy checkout sang feature branch rồi chạy lại:
  git checkout feature/your-branch
```

## Ví dụ 3: Không có changes

**Output:**
```
Không có code changes nào giữa branch `feature/test` và `main`.
Branch này chưa có commit nào khác main.
```

# Constraints

- 🚫 KHÔNG tự sửa code — chỉ review và đề xuất. User quyết định có sửa hay không.
- 🚫 KHÔNG fetch remote — chỉ làm việc với local git data.
- 🚫 KHÔNG bỏ qua Security issues — mọi vấn đề security đều phải report, dù nhỏ.
- 🚫 KHÔNG review files không liên quan (`node_modules`, `bin/`, `obj/`, `build/`, `*.lock`).
- ✅ LUÔN đọc full file context, không chỉ diff — hiểu code xung quanh mới review chính xác.
- ✅ LUÔN kiểm tra cross-layer consistency khi có changes cả API + WEB.
- ✅ LUÔN phân loại severity rõ ràng (Critical / Warning / Suggestion).
- ✅ LUÔN đưa ra code fix cụ thể cho Critical issues.
- ✅ LUÔN ghi nhận Good Practices — review không chỉ là chê, mà còn động viên.
- ⚠️ PHI/PII (dữ liệu bệnh nhân) phải được đặc biệt chú ý — dự án healthcare,
  lộ PHI = vi phạm HIPAA nghiêm trọng.
