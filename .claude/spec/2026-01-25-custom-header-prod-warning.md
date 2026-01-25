# Specification: Custom Header Injection and PROD Environment Warning

## Files to Change

### 1. `public/config.json`

**What**: Add placeholder for customHeader injection.

**Where**: Update `customHeader` value.

**Change**: `"customHeader": ""` → `"customHeader": "<NEO4J_CUSTOMHEADER>"`

**Why**: Allow CI/CD to inject the value from GitHub secret.

---

### 2. `.github/workflows/azure-static-web-apps-gentle-sea-048057803.yml`

**What**: Add sed command to inject customHeader.

**Where**: Inside "Set production credentials" step.

**Add**:
```bash
sed -i 's/<NEO4J_CUSTOMHEADER>/${{ secrets.NEO4J_CUSTOMHEADER }}/g' public/config.json
```

**Why**: Inject the custom header value during build.

---

### 3. `src/application/ApplicationActions.ts`

**What**: Add action to set devMode state.

**Where**: After line 237 (after `setCustomHeader`).

**Add**:
```typescript
export const SET_DEV_MODE = 'APPLICATION/SET_DEV_MODE';
export const setDevMode = (devMode: boolean) => ({
  type: SET_DEV_MODE,
  payload: { devMode },
});
```

**Why**: Need to store devMode in Redux state for header access.

---

### 4. `src/application/ApplicationReducer.ts`

**What**: Add devMode to initial state and handle action.

**Where**:
- Initial state (add `devMode: false`)
- Add case for `SET_DEV_MODE`

**Add to initial state** (~line 40):
```typescript
devMode: false,
```

**Add case** (after SET_CUSTOM_HEADER case ~line 325):
```typescript
case SET_DEV_MODE: {
  const { devMode } = payload;
  state = update(state, { devMode: devMode });
  return state;
}
```

**Why**: Store devMode flag for component access.

---

### 5. `src/application/ApplicationSelectors.ts`

**What**: Add selector to get devMode.

**Where**: After `applicationGetCustomHeader` (~line 135).

**Add**:
```typescript
export const applicationGetDevMode = (state: any) => {
  return state.application.devMode;
};
```

**Why**: Allow components to read devMode from state.

---

### 6. `src/application/ApplicationThunks.ts`

**What**: Dispatch setDevMode after calculating it.

**Where**: After line 441 (after `const standalone = ...`).

**Add**:
```typescript
dispatch(setDevMode(devMode));
```

**Also**: Import `setDevMode` at the top.

**Why**: Persist devMode in state for component access.

---

### 7. `src/dashboard/header/DashboardHeader.tsx`

**What**: Show connection URL and PROD warning in devMode.

**Where**: Lines 54-57 (header nav content).

**Current**:
```typescript
{customHeader && customHeader.length > 0
  ? `${customHeader}`
  : `${connection.protocol}://${connection.url}:${connection.port}`}
```

**New**:
```typescript
{devMode ? (
  <>
    {`${connection.protocol}://${connection.url}:${connection.port}`}
    {connection.url === standaloneSettings.standaloneHost && (
      <span style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        marginLeft: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        PROD
      </span>
    )}
  </>
) : (
  customHeader && customHeader.length > 0
    ? customHeader
    : `${connection.protocol}://${connection.url}:${connection.port}`
)}
```

**Also**:
- Import `applicationGetDevMode` from selectors
- Add `devMode` to mapStateToProps
- Add `devMode` to component props

**Why**: Team members need to see which environment they're connected to, with clear PROD warning.

---

## Testing Plan

1. **Client access** (no devMode):
   - Header shows customHeader value (e.g., "CI&T FLOW")

2. **Team access** (devMode + STAGE connection):
   - Header shows connection URL
   - No PROD label

3. **Team access** (devMode + PROD connection):
   - Header shows connection URL
   - Red "PROD" badge visible
