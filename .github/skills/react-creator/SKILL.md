---
name: react-creator
description: |
  Scaffold a new React/TypeScript page or component for the DHP Web project — 
  generates page component, RTK Query API slice, types, and route registration.
  Uses MUI for layout/display, CoreUI Pro for forms, RTK Query for data fetching,
  and CSS Modules for styling. Follows all project conventions.
  Use when user says "tạo page mới", "create component", "thêm trang", 
  "new page for [feature]", "scaffold React", "tạo form cho [entity]",
  "build UI for [feature]".
argument-hint: "Feature name and type (e.g. 'Appointment list page', 'Patient allergy form component')"
---

# Goal

Scaffold a production-ready React page or component (4-8 files) following DHP 
Web conventions, so the code integrates seamlessly with the existing codebase.

# Project Structure (Reference)

```
OUTPATIENT_WEB/src/
├── slices/                          # RTK Query API slices (NEW standard)
│   ├── operatingHourApi.ts          # Example: types + createApi + exported hooks
│   ├── onCallApi.ts
│   ├── onCallSignOutApi.ts
│   └── helpers.ts                   # Shared pagination/query helpers
├── services/
│   ├── CommonApi.tsx                # Base HTTP client (used by axiosBaseQuery)
│   ├── rtqQueryBaseQuery.ts         # axiosBaseQuery adapter for RTK Query
│   └── endpoints.json               # All API endpoint URLs (SCREAMING_SNAKE_CASE)
├── pages/                           # Thin page wrappers (matched by virtualPath)
│   └── administration/
│       └── OperatingHours.tsx       # Thin wrapper → imports view component
├── views/                           # Actual page/view logic + styling
│   └── administration/
│       └── operatingHours/
│           ├── OperatingHoursPage.tsx
│           └── OperatingHoursPage.module.scss
├── components/                      # Reusable shared components
│   └── timepicker/
│       ├── TimeRangePicker.tsx
│       └── ClearableTimePicker.tsx
├── reducers/
│   └── index.tsx                    # rootReducer — register RTK Query reducers here
├── store.tsx                        # configureStore — register RTK Query middleware here
├── config.json                      # PERMISSIONS map (string key → GUID)
├── constants/
│   └── enums.ts                     # Shared enums
├── hooks/
│   ├── useAlert.ts                  # useAlerts() → showSuccess/showError/showInfo
│   └── useCheckUserPermission.ts    # Permission check by config.json key
└── internationalization/
    └── translations.json            # i18n strings
```

# Instructions

## Step 1 — Gather Requirements

Ask user (skip parts already provided):
1. **Feature name** (e.g. `OperatingHours`, `PatientAllergyForm`)
2. **Type**: Page (route-level) or Component (reusable in `components/` or `views/`)
3. **Data source**: Which API endpoints? (existing or new — if new, suggest using `api-creator` skill first)
4. **Form?** If yes → will use CoreUI Pro form components
5. **Permissions**: Which permission key guards this page? (check `src/config.json` under `PERMISSIONS`)

## Step 2 — Generate RTK Query API Slice

Create in `src/slices/{feature}Api.ts`:

```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from 'services/rtqQueryBaseQuery';
import configData from 'services/endpoints.json';

// ---- Types (co-located in the same slice file) ----
export interface {Entity}Response {
    id: string;
    // ... properties matching API response (use camelCase)
    createdBy: string | null;
    createdDate: string;
    updatedBy: string | null;
    updatedDate: string | null;
}

export interface {Entity}Input {
    // ... properties for create/update (omit audit fields)
}

export interface Save{Entity}Request {
    // ... request wrapper with items/payload
}

export interface GenericResult {
    succeeded: boolean;
    entityId?: string | null;
    errors: { code: string; description: string }[];
}

// ---- RTK Query API Slice ----
export const {feature}Api = createApi({
    reducerPath: '{feature}Api',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['{Entity}'],
    keepUnusedDataFor: 60,
    endpoints: (builder) => ({
        getAll: builder.query<{Entity}Response[], void>({
            query: () => ({
                url: configData.GET_{ENTITY}_LIST,
                method: 'GET',
            }),
            providesTags: ['{Entity}'],
        }),
        getById: builder.query<{Entity}Response, { id: string }>({
            query: ({ id }) => ({
                url: `${configData.GET_{ENTITY}}/${id}`,
                method: 'GET',
            }),
            providesTags: (_result, _error, { id }) => [
                { type: '{Entity}', id },
            ],
        }),
        save: builder.mutation<GenericResult, Save{Entity}Request>({
            query: (request) => ({
                url: configData.SAVE_{ENTITY},
                method: 'POST',
                data: request,
            }),
            invalidatesTags: ['{Entity}'],
        }),
        delete: builder.mutation<GenericResult, { id: string }>({
            query: ({ id }) => ({
                url: `${configData.DELETE_{ENTITY}}/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['{Entity}'],
        }),
    }),
});

// ---- Auto-generated hooks ----
export const {
    useGetAllQuery,
    useGetByIdQuery,
    useSaveMutation,
    useDeleteMutation,
} = {feature}Api;
```

**Then add endpoints to `src/services/endpoints.json`:**
```json
{
    "GET_{ENTITY}_LIST": "/{Controller}/list",
    "GET_{ENTITY}": "/{Controller}",
    "SAVE_{ENTITY}": "/{Controller}/save",
    "DELETE_{ENTITY}": "/{Controller}"
}
```

**Then register in Redux store — TWO places:**

**A. Add reducer to `src/reducers/index.tsx`:**
```typescript
import { {feature}Api } from 'slices/{feature}Api';

export const rootReducer = combineReducers({
    // ... existing reducers
    [{feature}Api.reducerPath]: {feature}Api.reducer,
});
```

**B. Add middleware to `src/store.tsx`:**
```typescript
import { {feature}Api } from 'slices/{feature}Api';

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
        }).concat(
            // ... existing middlewares
            {feature}Api.middleware
        ),
});
```

**Rules:**
- RTK Query is the **standard pattern** for new features — never use raw axios or legacy `CommonApi` service class directly
- `axiosBaseQuery()` internally uses `CommonApi` for auth headers/timeout — you get auth for free
- Types co-located in the same slice file (not separate `types/` files unless shared across multiple slices)
- Use `builder.query` for reads, `builder.mutation` for writes
- Use `providesTags` / `invalidatesTags` for automatic cache invalidation
- Export auto-generated hooks (e.g., `useGetAllQuery`, `useSaveMutation`)
- For paginated endpoints, use helpers from `src/slices/helpers.ts` (`validatePaginationParams`, `buildQueryParams`)

## Step 3 — Generate Page Component

**Pages use a two-file pattern:**
1. **Thin page wrapper** in `src/pages/<section>/<Feature>.tsx` — just imports the view
2. **Actual view component** in `src/views/<section>/<feature>/<Feature>Page.tsx` — all logic here
3. **CSS Module** in `src/views/<section>/<feature>/<Feature>Page.module.scss` — scoped styles

### A. Thin Page Wrapper — `src/pages/<section>/<Feature>.tsx`

```tsx
import {Feature}Page from '../../views/<section>/<feature>/{Feature}Page';

const {Feature} = () => {
    return <{Feature}Page />;
};

export default {Feature};
```

> **Route registration is automatic.** The backend `/account/menu` endpoint returns menu items 
> with `virtualPath` (e.g., `"administration/OperatingHours"`). The frontend `FillRoutesFromMenuItem()` 
> in `MenuHelper.tsx` dynamically lazy-loads `src/pages/${virtualPath}.tsx`. 
> Just place the file at the correct path matching the `virtualPath` from the database.

### B. View Component — `src/views/<section>/<feature>/<Feature>Page.tsx`

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CSpinner } from '@coreui/react-pro';
import { Button, Typography, Select, MenuItem, Alert } from '@mui/material';
import { useAlerts } from 'hooks/useAlert';
import { useCheckUserPermission } from 'hooks/useCheckUserPermission';
import {
    useGetAllQuery,
    useSaveMutation,
    {Entity}Response,
} from 'slices/{feature}Api';
import styles from './{Feature}Page.module.scss';

const {Feature}Page: React.FC = () => {
    const { t } = useTranslation();
    const { showSuccess, showError } = useAlerts();
    const canEdit = useCheckUserPermission('EDIT_{ENTITY}');

    // RTK Query hooks — loading/caching handled automatically
    const { data = [], isLoading, isFetching } = useGetAllQuery();
    const [save, { isLoading: saving }] = useSaveMutation();

    const loading = isLoading || isFetching;

    const handleSave = async () => {
        try {
            await save({ /* request data */ }).unwrap();
            showSuccess(t('{feature}.savedSuccessfully'));
        } catch {
            showError(t('{feature}.saveError'));
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <CSpinner color="primary" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>{t('{feature}.title')}</h1>
                <p>{t('{feature}.subtitle')}</p>
            </div>

            {/* Content here */}

            {canEdit && (
                <div className={styles.footer}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        disabled={saving || loading}
                    >
                        {t('{feature}.save')}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default {Feature}Page;
```

### C. CSS Module — `src/views/<section>/<feature>/<Feature>Page.module.scss`

```scss
.container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.header {
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1a2b4a;
    margin: 0 0 4px 0;
  }

  p {
    font-size: 14px;
    color: #6b7a99;
    margin: 0;
  }
}

.loadingContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

.footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0;
}
```

**If Component (reusable)** → Create in `src/components/<category>/` or `src/views/<feature>/`:

```tsx
import React from 'react';
import { Box } from '@mui/material';

interface {Component}Props {
    // typed props
}

const {Component}: React.FC<{Component}Props> = ({ ...props }) => {
    return (
        <Box>
            {/* Component content */}
        </Box>
    );
};

export default {Component};
```

**UI Library Decision:**
- **Layout, tables, cards, typography, buttons** → MUI (`Box`, `Paper`, `Typography`, `Table`, `Grid`, `Button`, `Select`, `MenuItem`, `Dialog`, `Alert`)
- **Forms (inputs, selects, date pickers, switches)** → CoreUI Pro (`CForm`, `CFormInput`, `CFormSelect`, `CDatePicker`, `CFormSwitch`)
- **Spinners/Loading** → CoreUI Pro `CSpinner`
- **Modals/Dialogs** → MUI `Dialog`
- **Icons** → MUI Icons
- **Time pickers** → MUI `TimePicker` (via `@mui/x-date-pickers`)

## Step 4 — Generate Form (if needed)

Use CoreUI Pro form components:

```tsx
import React, { useState } from 'react';
import { 
    CForm, CFormInput, CFormSelect, CFormTextarea, 
    CFormLabel, CCol, CRow, CButton, CFormFeedback 
} from '@coreui/react-pro';
import { useTranslation } from 'react-i18next';
import { useAlerts } from 'hooks/useAlert';
import { {Entity}Input } from 'slices/{feature}Api';

interface {Entity}FormProps {
    initialData?: {Entity}Input;
    onSubmit: (data: {Entity}Input) => Promise<void>;
    onCancel: () => void;
}

const {Entity}Form: React.FC<{Entity}FormProps> = ({ initialData, onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const { showSuccess, showError } = useAlerts();
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState<{Entity}Input>(
        initialData ?? { /* defaults */ }
    );

    const handleChange = (field: keyof {Entity}Input, value: {Entity}Input[keyof {Entity}Input]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        if (!form.checkValidity()) {
            setValidated(true);
            return;
        }
        try {
            await onSubmit(formData);
            showSuccess(t('common.savedSuccessfully'));
        } catch {
            showError(t('common.saveError'));
        }
    };

    return (
        <CForm validated={validated} onSubmit={handleSubmit}>
            <CRow className="mb-3">
                <CCol md={6}>
                    <CFormLabel>{t('{feature}.fieldName')}</CFormLabel>
                    <CFormInput
                        required
                        value={formData.fieldName}
                        onChange={(e) => handleChange('fieldName', e.target.value)}
                    />
                    <CFormFeedback invalid>{t('validation.required')}</CFormFeedback>
                </CCol>
            </CRow>
            <CButton type="submit" color="primary">{t('common.save')}</CButton>
            <CButton type="button" color="secondary" onClick={onCancel}>{t('common.cancel')}</CButton>
        </CForm>
    );
};

export default {Entity}Form;
```

## Step 5 — Add Translations

Add i18n keys to `src/internationalization/translations.json`:

```json
"{feature}": {
    "title": "{Feature Title}",
    "subtitle": "{Feature description text}",
    "save": "Save",
    "loadError": "Failed to load {feature}",
    "saveError": "Failed to save {feature}",
    "savedSuccessfully": "{Feature} saved successfully"
}
```

## Step 6 — Add Permissions to config.json (if new)

If the backend defines new permission policies, add the corresponding entries to 
`src/config.json` under `PERMISSIONS`:

```json
{
    "PERMISSIONS": {
        "VIEW_{ENTITY}": "<guid-from-backend-Policies.cs>",
        "EDIT_{ENTITY}": "<guid-from-backend-Policies.cs>"
    }
}
```

The `useCheckUserPermission` hook uses these string keys (not raw GUIDs):
```tsx
const canEdit = useCheckUserPermission('EDIT_{ENTITY}');
```

## Step 7 — Verify

✅ **Checklist before finishing:**
- [ ] RTK Query slice created in `src/slices/{feature}Api.ts` with types + endpoints + exported hooks
- [ ] Reducer registered in `src/reducers/index.tsx` via `[{feature}Api.reducerPath]: {feature}Api.reducer`
- [ ] Middleware registered in `src/store.tsx` via `.concat({feature}Api.middleware)`
- [ ] Endpoints added to `src/services/endpoints.json` (SCREAMING_SNAKE_CASE keys)
- [ ] Types defined and exported properly as `interface` (not `type`)
- [ ] Thin page wrapper at `src/pages/<section>/<Feature>.tsx` matching `virtualPath` from DB
- [ ] View component at `src/views/<section>/<feature>/<Feature>Page.tsx` with all logic
- [ ] CSS Module at `src/views/<section>/<feature>/<Feature>Page.module.scss`
- [ ] Component uses `useTranslation` for all user-visible text
- [ ] Permission check via `useCheckUserPermission('EDIT_{ENTITY}')` — string key, not GUID
- [ ] User feedback via `useAlerts()` with `showSuccess()` / `showError()`
- [ ] RTK Query hooks used for data fetching (`useGetAllQuery`, etc.) — no manual `useState` for loading
- [ ] Mutations use `.unwrap()` for error handling in try/catch
- [ ] Forms use CoreUI Pro components (`CForm`, `CFormInput`, etc.)
- [ ] Layout/display uses MUI (`Typography`, `Button`, `Select`, `Alert`, `Grid`)
- [ ] Loading spinner uses `CSpinner` from CoreUI Pro
- [ ] Styles use CSS Modules (`.module.scss`), not inline `sx` prop for complex styling
- [ ] Permission entries added to `src/config.json` PERMISSIONS if new
- [ ] Translation keys added to `src/internationalization/translations.json`
- [ ] No `any` types unless genuinely unavoidable
- [ ] No `console.log` in production code

# Examples

## Example 1: Settings page with data table — OperatingHours (REAL)

**Input:** "Tạo trang Operating Hours cho administration. Có select location, bảng day-of-week với time pickers, nút Save. Permission: VIEW_OPERATING_HOUR, EDIT_OPERATING_HOUR."

**Files generated:**
```
src/slices/operatingHourApi.ts                                — RTK Query slice + types + hooks
src/services/endpoints.json                                   — New endpoints added
src/pages/administration/OperatingHours.tsx                    — Thin page wrapper
src/views/administration/operatingHours/OperatingHoursPage.tsx — View component with all logic
src/views/administration/operatingHours/OperatingHoursPage.module.scss — Scoped styles
src/reducers/index.tsx                                        — Register reducer
src/store.tsx                                                 — Register middleware
src/config.json                                               — Permission entries
src/internationalization/translations.json                    — i18n keys
```

**operatingHourApi.ts:**
```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from 'services/rtqQueryBaseQuery';
import configData from 'services/endpoints.json';

export interface OperatingHourResponse {
    id: string;
    orgId: string;
    providerOrgId: string | null;
    dayOfWeekRefId: number;
    dayOfWeekName: string | null;
    isClosed: boolean;
    regularHoursStart: string | null;
    regularHoursEnd: string | null;
    afterHoursStart: string | null;
    afterHoursEnd: string | null;
    surcharge: number;
    createdBy: string | null;
    createdDate: string;
    updatedBy: string | null;
    updatedDate: string | null;
}

export interface OperatingHourInput {
    dayOfWeekRefId: number;
    isClosed: boolean;
    regularHoursStart: string | null;
    regularHoursEnd: string | null;
    afterHoursStart: string | null;
    afterHoursEnd: string | null;
    surcharge: number;
}

export interface DayOfWeekOption {
    id: number;
    name: string;
    displayOrder: number;
}

export interface SaveOperatingHoursRequest {
    orgId: string;
    items: OperatingHourInput[];
}

export interface ApplyToAllRequest {
    orgIds: string[];
    items: OperatingHourInput[];
}

export interface ApplyToDefaultRequest {
    sourceOrgId: string;
    destinationOrgId: string;
}

export interface GenericResult {
    succeeded: boolean;
    entityId?: string | null;
    errors: { code: string; description: string }[];
}

export interface OperatingHourFacilityResponse {
    id: string;
    name: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    isDefault: boolean;
}

export const operatingHourApi = createApi({
    reducerPath: 'operatingHourApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['OperatingHours', 'Facilities'],
    keepUnusedDataFor: 60,
    endpoints: (builder) => ({
        getFacilities: builder.query<OperatingHourFacilityResponse[], void>({
            query: () => ({
                url: configData.GET_OPERATING_HOUR_FACILITIES,
                method: 'GET',
            }),
            providesTags: ['Facilities'],
        }),
        getDayOfWeekOptions: builder.query<DayOfWeekOption[], void>({
            query: () => ({
                url: configData.GET_OPERATING_HOUR_DAY_OPTIONS,
                method: 'GET',
            }),
        }),
        getByOrgId: builder.query<OperatingHourResponse[], { orgId: string }>({
            query: ({ orgId }) => ({
                url: `${configData.GET_OPERATING_HOURS_BY_ORG}/${orgId}`,
                method: 'GET',
            }),
            providesTags: (_result, _error, { orgId }) => [
                { type: 'OperatingHours', id: orgId },
            ],
        }),
        saveOperatingHours: builder.mutation<GenericResult, SaveOperatingHoursRequest>({
            query: (request) => ({
                url: configData.SAVE_OPERATING_HOURS,
                method: 'POST',
                data: request,
            }),
            invalidatesTags: (_result, _error, { orgId }) => [
                { type: 'OperatingHours', id: orgId },
            ],
        }),
        applyToAll: builder.mutation<GenericResult, ApplyToAllRequest>({
            query: (request) => ({
                url: configData.APPLY_OPERATING_HOURS_TO_ALL,
                method: 'POST',
                data: request,
            }),
            invalidatesTags: ['OperatingHours'],
        }),
        applyToDefault: builder.mutation<GenericResult, ApplyToDefaultRequest>({
            query: (request) => ({
                url: configData.APPLY_OPERATING_HOURS_DEFAULT,
                method: 'POST',
                data: request,
            }),
            invalidatesTags: (_result, _error, { destinationOrgId }) => [
                { type: 'OperatingHours', id: destinationOrgId },
            ],
        }),
    }),
});

export const {
    useGetFacilitiesQuery,
    useGetDayOfWeekOptionsQuery,
    useGetByOrgIdQuery,
    useSaveOperatingHoursMutation,
    useApplyToAllMutation,
    useApplyToDefaultMutation,
} = operatingHourApi;
```

**OperatingHours.tsx (thin wrapper):**
```tsx
import OperatingHoursPage from '../../views/administration/operatingHours/OperatingHoursPage';

const OperatingHours = () => {
    return <OperatingHoursPage />;
};

export default OperatingHours;
```

**OperatingHoursPage.tsx (view — key patterns):**
```tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CSpinner } from '@coreui/react-pro';
import { Button, Typography, Select, MenuItem, Alert, TextField, InputAdornment, Checkbox, FormControlLabel } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useAlerts } from 'hooks/useAlert';
import { useCheckUserPermission } from 'hooks/useCheckUserPermission';
import {
    useGetFacilitiesQuery,
    useGetDayOfWeekOptionsQuery,
    useGetByOrgIdQuery,
    useSaveOperatingHoursMutation,
    OperatingHourInput,
} from 'slices/operatingHourApi';
import styles from './OperatingHoursPage.module.scss';

const OperatingHoursPage: React.FC = () => {
    const { t } = useTranslation();
    const { showSuccess, showError } = useAlerts();
    const canEdit = useCheckUserPermission('EDIT_OPERATING_HOUR');

    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [items, setItems] = useState<OperatingHourInput[]>([]);

    // RTK Query — data fetching + caching
    const { data: dayOptions = [], isLoading: dayOptionsLoading } = useGetDayOfWeekOptionsQuery();
    const { data: facilities = [], isLoading: facilitiesLoading } = useGetFacilitiesQuery();
    const { data: operatingHoursData, isLoading: hoursLoading, isFetching: hoursFetching } = useGetByOrgIdQuery(
        { orgId: selectedOrgId },
        { skip: !selectedOrgId }   // Skip query until org selected
    );

    const [saveOperatingHours, { isLoading: saving }] = useSaveOperatingHoursMutation();

    const loading = dayOptionsLoading || facilitiesLoading || hoursLoading || hoursFetching;

    const handleSave = async () => {
        try {
            await saveOperatingHours({ orgId: selectedOrgId, items }).unwrap();
            showSuccess(t('operatingHours.savedSuccessfully'));
        } catch {
            showError(t('operatingHours.saveError'));
        }
    };

    // ... handlers, useEffect for syncing state, table rendering, etc.

    return (
        <div className={styles.container}>
            {/* Header, location selector, table, save button */}
        </div>
    );
};

export default OperatingHoursPage;
```

**Key patterns demonstrated:**
- `useGetByOrgIdQuery({ orgId }, { skip: !orgId })` — conditional fetching
- `useSaveMutation()` → `await save(data).unwrap()` in try/catch
- `useCheckUserPermission('EDIT_OPERATING_HOUR')` — string key from config.json
- `useAlerts()` → `showSuccess()` / `showError()`
- CSS Module classes via `styles.container`, `styles.header`, etc.
- `CSpinner` for loading, MUI components for layout/interaction

---

## Example 2: Simple display component — no data fetching

**Input:** "Tạo component hiển thị patient demographics summary, nhận patientId qua props"

**Files generated:**
```
src/views/patient/PatientDemographicsSummary.tsx   — Component only
```

**PatientDemographicsSummary.tsx:**
```tsx
import React from 'react';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useGetByIdQuery, PatientResponse } from 'slices/patientApi';

interface PatientDemographicsSummaryProps {
    patientId: string;
}

const PatientDemographicsSummary: React.FC<PatientDemographicsSummaryProps> = ({ patientId }) => {
    const { t } = useTranslation();
    const { data: patient, isLoading } = useGetByIdQuery({ id: patientId });

    if (isLoading) return <Skeleton variant="rectangular" height={120} />;
    if (!patient) return <Typography color="error">{t('patient.notFound')}</Typography>;

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6">{patient.firstName} {patient.lastName}</Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                    <Typography variant="caption">{t('patient.dob')}</Typography>
                    <Typography>{patient.dateOfBirth}</Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="caption">{t('patient.gender')}</Typography>
                    <Typography>{patient.gender}</Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="caption">{t('patient.mrn')}</Typography>
                    <Typography>{patient.mrn}</Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PatientDemographicsSummary;
```

# Constraints

- 🚫 NEVER use raw `axios` — RTK Query with `axiosBaseQuery` is the standard; legacy code uses `CommonApi` class
- 🚫 NEVER hardcode API URLs — always use `src/services/endpoints.json` with `SCREAMING_SNAKE_CASE` keys
- 🚫 NEVER use `any` for component props — define explicit `interface` (not `type`)
- 🚫 NEVER put secrets or tokens in source code — auth is handled by `CommonApi.getAuthHeaders()` via `axiosBaseQuery`
- 🚫 NEVER use class components — always functional components with hooks
- 🚫 NEVER use manual Redux (action types + reducer + action creator) for new features — use RTK Query
- 🚫 NEVER create service classes extending `CommonApi` for new features — use RTK Query slices in `src/slices/`
- 🚫 NEVER use `alert(Severity.Error, ...)` — use `useAlerts()` with `showError()` / `showSuccess()`
- ✅ ALWAYS use RTK Query (`createApi`) for data fetching — registered in both `reducers/index.tsx` AND `store.tsx`
- ✅ ALWAYS use `useTranslation` for user-visible text (i18n ready)
- ✅ ALWAYS use `useAlerts()` → `showSuccess(msg)` / `showError(msg)` for user feedback
- ✅ ALWAYS check permissions with `useCheckUserPermission('EDIT_SOMETHING')` — string key from `config.json`
- ✅ ALWAYS use two-file page pattern: thin wrapper in `pages/` + view logic in `views/`
- ✅ ALWAYS use CSS Modules (`.module.scss`) for page-level styling
- ✅ ALWAYS use MUI for layout/display, CoreUI Pro for form inputs, CSpinner for loading
- ✅ ALWAYS lazy-load page components (handled automatically by `FillRoutesFromMenuItem` via `virtualPath`)
- ✅ ALWAYS use `.unwrap()` on RTK Query mutations for proper error handling in try/catch
- ✅ ALWAYS use `{ skip: !condition }` for conditional RTK Query fetching
- ⚠️ For paginated list endpoints, use `src/slices/helpers.ts` (`validatePaginationParams`, `buildQueryParams`)
- ⚠️ `GenericResult` with `succeeded` / `errors` is the standard API response wrapper for mutations

<!-- Updated based on OperatingHours feature implementation -->
