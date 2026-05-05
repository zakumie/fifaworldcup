# Frontend Agent Memory — OUTPATIENT_WEB

> Verified source of truth for the Frontend agent. All patterns confirmed against the codebase.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 17.0.2 + TypeScript 4.6 (strict mode — no `any`) |
| State | Redux Toolkit 2.8 + **RTK Query** (new features) / legacy Redux reducers |
| UI (layout) | MUI 5 (`@mui/material`, `@mui/x-date-pickers`, `@mui/x-data-grid`, `@mui/icons-material`) |
| UI (forms) | CoreUI Pro 4 (`CForm`, `CFormInput`, `CFormSelect`, `CSpinner`) |
| Forms | `useMultiState` hook (manual controlled state) — RHF/Yup are in package.json but **unused** |
| HTTP | RTK Query `createApi` + `axiosBaseQuery` (preferred) / Axios `CommonApi` (legacy) |
| Auth | JWT in `sessionStorage` key `___actowrefto`, property `.at` for access token |
| Routing | React Router DOM 6 + `<ProtectedRoute>` (dynamic, menu-driven, lazy-loaded) |
| i18n | `react-i18next`, keys in `src/internationalization/translations.json` |
| Styling | SCSS Modules (`.module.scss`) — import as `styles` |
| Date/Time | date-fns, MUI DatePicker/TimePicker |
| Real-time | Microsoft SignalR 8, Twilio Video/Voice, Vonage |
| Charts | Recharts, FullCalendar |
| PDF | @react-pdf/renderer, react-pdf, pdf-lib |
| Rich Text | react-quill |
| DnD | react-beautiful-dnd, react-dnd |
| AI | Deepgram SDK (speech-to-text), Azure Cognitive Services |
| Package manager | npm (package-lock.json) |

---

## Folder Structure

```
src/
├── slices/               # RTK Query API slices (preferred for new features)
├── services/             # CommonApi base + rtqQueryBaseQuery.ts + endpoints.json
├── contexts/             # 14 React contexts (ServicesContext, GlobalContext, PermissionContext, etc.)
├── reducers/             # combineReducers (legacy + RTK Query + RTK slices)
├── pages/{section}/      # Thin wrappers (lazy-loaded via virtualPath) importing views
├── views/{section}/{feature}/ # View logic + CSS Modules (main UI code lives here)
├── components/           # Reusable UI (~40 folders, includes form/ with 14 wrappers)
├── modules/              # 15 feature modules (ai, encounters, patients, signalr, etc.)
├── hooks/                # 26 custom hooks (useMultiState, useAlerts, useCheckUserPermission, etc.)
├── helpers/              # ErrorsHelper, LoginHelper, GlobalHelper, MenuHelper, CacheHelper
├── utils/                # Pure functions (timePicker/parseTimeSpan, formatTimeSpan)
├── actions/              # Redux action types + creators
├── types/                # TypeScript interfaces
├── constants/            # Enums, dateConstants, globalConstants, cacheConfig
├── routes/               # ProtectedRoute component
├── selectors/            # Redux selectors (rootSelectors, userSelectors)
├── middlewares/          # Custom middleware (debouncedAutoSave)
├── common/               # Shared types (PageFilter, PageResponse)
├── assets/               # Static assets (fonts, images)
├── scss/                 # Global SCSS
├── workers/              # Web workers
├── internationalization/ # translations.json
├── config.json           # API_TIMEOUT, IDLE_TIMEOUT, GRID defaults, PERMISSIONS GUIDs
├── store.tsx             # Redux store (includes RTK Query middleware)
└── App.tsx               # Routes & providers
```

---

## Skills & When to Use

| Trigger | Skill |
|---------|-------|
| Create page/component/form | `.github/skills/react-creator/SKILL.md` |
| Optimize renders, bundle, memory leaks | `.github/skills/react-optimize/SKILL.md` |
| Review code before commit | `.github/skills/code-reviewer/SKILL.md` |
| Integrate backend API to frontend | `.github/skills/react-integration/SKILL.md` |

---

## Key Patterns

### RTK Query (preferred for all new features)

- Slice file: `src/slices/<feature>Api.ts` using `createApi` + `axiosBaseQuery()`
- `axiosBaseQuery` wraps `CommonApi.createClient({ includeContentType: true })` — auto-injects JWT
- Fully typed queries + mutations with request/response interfaces
- Tag-based cache invalidation (`providesTags` / `invalidatesTags`)
- Register: reducer in `reducers/index.tsx` via `[api.reducerPath]: api.reducer` + middleware in `store.tsx` via `.concat(api.middleware)`
- Consume via auto-generated hooks: `useGetXxxQuery()`, `useXxxMutation()`

**Existing RTK Query slices** (`src/slices/`):

| File | Type | Feature |
|------|------|---------|
| `operatingHourApi.ts` | `createApi` | Facility operating hours (4 queries + 3 mutations) |
| `encounterTypeSettingApi.ts` | `createApi` | Encounter type CRUD |
| `onCallApi.ts` | `createApi` | On-call incidents/scheduling |
| `onCallSignOutApi.ts` | `createApi` | Patient sign-out operations |
| `aariStreamSlice.ts` | `createSlice` | AARI audio streaming state |
| `pendingJobSlice.ts` | `createSlice` | Background job tracking |
| `helpers.ts` | utility | Pagination helper functions |

Note: `twilioPhoneCallApi` lives in `src/modules/twilio-phone-call/`.

### Page & View Pattern

- **Page** (`src/pages/{section}/{Feature}.tsx`): Thin wrapper, matches DB `virtualPath`, lazy-loaded via `React.lazy()`
- **View** (`src/views/{section}/{feature}/{Feature}Page.tsx`): Contains actual UI logic + state
- **Style** (`src/views/{section}/{feature}/{Feature}Page.module.scss`): CSS Modules
- Some large pages (e.g., PatientList) contain logic directly — exception to thin-wrapper pattern

### Form & Validation

- **`useMultiState`** hook is the primary form state manager — NOT React Hook Form
- Error tracking via `Set<string>` keys
- Save button guard: `saving || loading || !selected || hasErrors || !isFormValid`
- Client-side range validation (e.g., start ≤ end)
- Utility functions in `src/utils/` (e.g., `parseTimeSpan()`, `formatTimeSpan()`)

### Reusable Form Components (`src/components/form/`)

| Component | Purpose |
|-----------|---------|
| `FormControl` | Standard text input wrapper |
| `SelectControl` | Dropdown wrapper (most used) |
| `CustomAutocomplete` | MUI Autocomplete wrapper |
| `DatePickerInput` | MUI date picker |
| `MultiSelectControl` | Multi-select dropdown |
| `PhoneNumberControl` | Phone input with validation |
| `TextAreaControl` | Textarea wrapper |
| `YesNoRadioControl` | Binary radio buttons |
| `RegionSelect` | Region selector |
| `CopyToClipboardInput` | Input + copy button |
| `SmsConsentCheckbox` | SMS opt-in checkbox |
| `SelectStyledDropdown` | Custom styled select |

### Key Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useMultiState` | Form state management (replaces useState for multi-field forms) |
| `useAlerts` (useAlert.ts) | `showSuccess()`, `showError()`, `showInfo()`, `showWarning()` |
| `useCheckUserPermission` | Check permission by GUID key from `config.json.PERMISSIONS` |
| `useCheckUserRole` | Check user role |
| `useCustomContexts` | Access all global contexts in one call |
| `useAPIPagination` / `usePagination` | Table pagination (API-driven / client-side) |
| `useCache` | Client-side cache management |
| `useDebounce` | Debounced value |
| `useToggle` | Boolean toggle |
| `useSessionStorage` | Session storage hook |
| `useDeepgram` | AI speech-to-text |
| `useReferences` | Reference data lookup |
| `usePatientData` | Patient data retrieval |
| `useEditable` | Editable state management |
| `useOnCallSignalR` | SignalR real-time for on-call |

### Contexts (`src/contexts/` — 14 providers)

Key contexts: `GlobalContext` (app-wide state), `PermissionContext` (user permissions), `ServicesContext` (DI container → `useService(XyzService)`), `SignalRConnectionContext` (real-time hub), `CacheContext`, `DialogContext`, `MenuContext`, `VideoContext`, `ChatContext`, `AariChatContext`, `RoomContext`, `JobContext`, `WorkerContext`, `ConnectionContext`.

### API Integration

- Endpoint URLs: `src/services/endpoints.json` — use `SCREAMING_SNAKE_CASE` keys
- HTTP client: `CommonApi.createClient()` auto-injects JWT from `sessionStorage`
- Token key: `___actowrefto` (defined in `constants/globalConstants.ts` as `tokenSessionItemKey`)
- Token structure: `JSON.parse(token).at` → access token for `Authorization: Bearer` header
- Legacy services: `src/services/{Feature}Service.ts` consumed via `useService(XyzService)` from `ServicesContext`
- New features: RTK Query `axiosBaseQuery()` from `services/rtqQueryBaseQuery.ts`

### i18n Pattern

- `t('featureName.keyName')` — always namespace-prefixed
- Keys grouped by feature in `translations.json`
- Example: `operatingHours.title`, `operatingHours.savedSuccessfully`

### Config (`src/config.json`)

| Key | Value | Purpose |
|-----|-------|---------|
| `API_TIMEOUT` | `300000` | 5-minute API timeout (ms) |
| `IDLE_TIMEOUT_MINUTES` | `60` | Session idle timeout |
| `GRID_DEFAULT_ITEMS_PER_PAGE` | `150` | Default table pagination |
| `APPLICATION_NAME` | `"Digital Health Platform"` | UI branding |
| `PERMISSIONS` | Object (80+ GUIDs) | Permission key → GUID mapping |

---

## Constraints (Hard Rules)

- 🚫 No `dangerouslySetInnerHTML` with user/API data (XSS)
- 🚫 No tokens in `localStorage` — `sessionStorage` only
- 🚫 No `any` type when interface can be defined — use `unknown` + type guards
- 🚫 No traditional Redux for new features — use RTK Query
- 🚫 No `console.log` with PHI/PII — HIPAA system
- ✅ Cleanup in `useEffect` for subscriptions/timers
- ✅ `t('key')` for all UI text — no hardcoded strings
- ✅ Type all API responses — no `Promise<any>`
- ✅ SCSS Modules for styling — no inline styles for layout
- ✅ Define request/response interfaces for RTK Query
- ✅ Tag-based cache invalidation in mutations
- ✅ Always set form `defaultValues` to avoid uncontrolled-to-controlled warnings

---

## Handoffs

- Backend API / .NET code → **Backend** agent
- Database schema / queries → **Database** agent
