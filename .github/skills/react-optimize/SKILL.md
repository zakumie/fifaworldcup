---
name: react-optimize
description: |
  Frontend skill for React/TypeScript. Use when: optimizing component render 
  performance, fixing memory leaks, analyzing re-render loops, reviewing Redux 
  state design, auditing XSS risks, improving bundle size, reviewing custom hooks,
  fixing useEffect dependency issues, analyzing API service patterns, reviewing
  accessibility (a11y), checking TypeScript type safety, spotting stale closures.
  Dùng khi user nói "optimize component", "tại sao render chậm", "fix re-render",
  "review React code", "improve frontend performance", "bundle size lớn",
  "memory leak frontend", "tối ưu React", kể cả khi nói tắt "optimize đi".
  KHÔNG dùng cho: backend/API issues (dùng api-optimize), tạo component mới
  (dùng react-creator), review toàn bộ changes trước commit (dùng code-reviewer).
argument-hint: "Paste code, a file path, or describe the area (e.g. 'PatientList component', 'MedicationService', 'Redux auth reducer', 'useEffect in VitalsForm')"
---

# React Optimize — Performance, Security & Code Quality

## When to Use
- Slow or laggy UI components, excessive re-renders
- Memory leaks from subscriptions, timers, or API calls
- Redux state growing too large or causing unnecessary re-renders
- Bundle size too large, slow initial load
- XSS vulnerabilities or token handling issues
- TypeScript `any` abuse, missing type safety
- useEffect dependency bugs, stale closures
- Accessibility (a11y) issues in forms and interactive elements

## Stack Context
- **Framework**: React 18 (Functional Components, Hooks)
- **Language**: TypeScript
- **State**: Redux (`rootReducer`, feature reducers, `useDispatch`/`useSelector`)
- **HTTP**: Axios via `CommonApi` base class, service classes extend `CommonApi`
- **UI Libraries**: CoreUI Pro (`@coreui/react-pro`), MUI Date Pickers
- **Routing**: React Router with `<ProtectedRoute>` wrapper
- **Auth**: JWT in sessionStorage (`user:data`), auto-refresh 30s before expiry
- **i18n**: i18next with `react-i18next`
- **Icons**: CoreUI Icons
- **Custom Hooks**: `useMultiState()` for managing multiple state values
- **Endpoints**: Centralized in `endpoints.json`

---

## Procedure

### Step 1 — Gather Context
1. Identify the target: component, hook, service, reducer, or utility.
2. Read the full source file — not just the suspected area.
3. Trace the data flow: props → state → render → side effects.
4. Check parent components for unnecessary prop changes causing re-renders.
5. Review related service class in `src/services/` for API patterns.

### Step 2 — Performance Analysis

Key checks:

| Check | What to Look For |
|-------|-----------------|
| **Unnecessary Re-renders** | Component re-renders when props/state haven't changed → wrap in `React.memo()`, use `useMemo`/`useCallback` for computed values and callbacks passed as props |
| **useEffect Dependencies** | Missing deps cause stale data; extra deps cause infinite loops. Verify every dependency is intentional |
| **Stale Closures** | Event handlers or callbacks capturing old state/props. Fix with `useCallback` + correct deps or `useRef` |
| **Large Lists** | Rendering 100+ items without virtualization → suggest `react-window` or `react-virtualized` |
| **Expensive Computations** | Heavy filtering/sorting in render body → wrap in `useMemo` with correct deps |
| **API Call Patterns** | Missing cancellation on unmount → memory leak. Use `AbortController` or `getWithCancellationToken()` |
| **Redux Selectors** | `useSelector(state => state.bigObject)` causes re-render on any property change → select only needed fields |
| **Lazy Loading** | Route components not using `React.lazy()` → increases initial bundle |
| **Image/Asset Size** | Uncompressed images, missing `loading="lazy"` on below-fold images |
| **Debounce/Throttle** | Search inputs or resize handlers firing on every keystroke/pixel → add debounce |

### Step 3 — Security Audit

| Risk | What to Check |
|------|--------------|
| **XSS** | `dangerouslySetInnerHTML` with user/API data, string interpolation into DOM |
| **Token Handling** | Tokens in `localStorage` (vulnerable to XSS) instead of `httpOnly cookies`. Verify project uses `sessionStorage` with `user:data` key |
| **Sensitive Data in State** | PHI/PII stored in Redux or component state longer than needed — clear on unmount |
| **Open Redirect** | Redirect URLs from query params (`?next=/url`) without validation |
| **Dependency Vulnerabilities** | Outdated packages in `package.json` with known CVEs |
| **CORS/Fetch** | API calls to user-controlled URLs (SSRF via frontend proxy) |
| **Console Logging** | `console.log` with patient data or tokens in production code |

### Step 4 — Code Quality & Best Practices

| Check | What to Look For |
|-------|-----------------|
| **TypeScript `any`** | Every `any` is a type-safety hole. Replace with proper interface/type |
| **Missing Error UI** | API calls without error handling → user sees blank screen on failure |
| **Component Size** | Component > 200 lines → extract sub-components or custom hooks |
| **Dead Code** | Unused imports, commented-out code, unreachable branches |
| **Naming** | Components: PascalCase. Functions: camelCase. Constants: UPPER_SNAKE_CASE |
| **Prop Drilling** | Props passed through 3+ levels → use Context or Redux |
| **Duplicate Logic** | Same fetch/transform logic in multiple components → extract to custom hook |
| **Missing Cleanup** | `useEffect` with setInterval/addEventListener but no return cleanup |
| **Hardcoded Strings** | UI text hardcoded instead of using `t('key')` from i18next |
| **Missing Key Props** | `.map()` rendering lists without unique `key` prop |
| **Accessibility** | Form inputs without `<label>`, clickable `<div>` without role/keyboard support, missing `alt` on images |
| **Service Pattern** | API calls not going through service classes → should extend `CommonApi` |

### Step 5 — Report Findings

Present results in this format:

```
## Analysis: [Component/Target Name]

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

For each issue, provide:
- **What**: Clear description of the problem
- **Why**: Impact (performance hit, security risk, maintainability)
- **Fix**: Concrete code suggestion — not just "should optimize"

---

## Examples

### Example 1: Component with re-render + memory leak

**Target:** `PatientVitalsList.tsx`

**Issues Found:**
```
## Analysis: PatientVitalsList

### Critical Issues
- **Memory Leak**: `useEffect` subscribes to SignalR hub but never 
  unsubscribes on unmount. When navigating away, the handler keeps firing 
  and calls `setState` on an unmounted component.
  
  Fix:
  ```tsx
  useEffect(() => {
    const connection = hubConnection.on('VitalUpdated', handleUpdate);
    return () => { connection.off('VitalUpdated', handleUpdate); };
  }, []);
  ```

### Performance Issues
- **Unnecessary Re-renders**: Parent passes `onSelect={() => handleSelect(id)}`
  — creates new function every render, causing child to re-render.
  
  Fix: `const onSelect = useCallback(() => handleSelect(id), [id]);`

- **Full Redux State**: `useSelector(state => state.vitals)` re-renders on 
  ANY vitals state change. Select only what's needed:
  `useSelector(state => state.vitals.list)`
```

### Example 2: Service class with issues

**Target:** `MedicationService.ts`

**Issues Found:**
```
## Analysis: MedicationService

### Security Issues
- **Console Logging PHI**: `console.log('Medications:', response.data)` 
  logs patient medication data. Remove or guard with environment check.

### Code Quality
- **Missing TypeScript Types**: Return type is `Promise<any>` — should be 
  `Promise<MedicationResponse[]>`. Define interface in `types/`.
```

<!-- Generated by Skill Creator Ultra v1.0 -->
