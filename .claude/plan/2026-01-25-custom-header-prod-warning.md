# Plan: Custom Header Injection and PROD Environment Warning

## Overview

1. Inject `customHeader` from GitHub secret `NEO4J_CUSTOMHEADER`
2. In devMode: always show connection URL (not custom header)
3. In devMode + connected to PROD: show red "PROD" warning label

## User Experience

| Mode | Header Display |
|------|----------------|
| **Client (standalone)** | Shows `customHeader` value (e.g., company name) |
| **Team (devMode) + STAGE** | Shows connection URL |
| **Team (devMode) + PROD** | Shows connection URL + red "PROD" label |

## Implementation

### 1. Config & CI/CD Changes

**`public/config.json`**: Add placeholder
```json
"customHeader": "<NEO4J_CUSTOMHEADER>"
```

**`.github/workflows/azure-static-web-apps-gentle-sea-048057803.yml`**: Add injection
```bash
sed -i 's/<NEO4J_CUSTOMHEADER>/${{ secrets.NEO4J_CUSTOMHEADER }}/g' public/config.json
```

### 2. Store devMode in Application State

**Files**:
- `src/application/ApplicationActions.ts` - Add `SET_DEV_MODE` action
- `src/application/ApplicationReducer.ts` - Handle action, store `devMode`
- `src/application/ApplicationSelectors.ts` - Add `applicationGetDevMode` selector
- `src/application/ApplicationThunks.ts` - Dispatch `setDevMode(devMode)` after calculating it

### 3. Modify Header Component

**`src/dashboard/header/DashboardHeader.tsx`**:
- Get `devMode` and `standaloneSettings` from state
- Logic:
  - If `devMode`: show connection URL (ignore customHeader)
  - If `devMode` AND connection matches standalone config (PROD): show red "PROD" badge
- Comparison: check if `connection.url === standaloneSettings.standaloneHost`

## Files to Change

| File | Change |
|------|--------|
| `public/config.json` | Add `<NEO4J_CUSTOMHEADER>` placeholder |
| `.github/workflows/...yml` | Add sed command for customHeader |
| `src/application/ApplicationActions.ts` | Add `setDevMode` action |
| `src/application/ApplicationReducer.ts` | Store `devMode` in state |
| `src/application/ApplicationSelectors.ts` | Add `applicationGetDevMode` selector |
| `src/application/ApplicationThunks.ts` | Dispatch `setDevMode` |
| `src/dashboard/header/DashboardHeader.tsx` | Show PROD warning in devMode |
