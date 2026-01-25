# Plan: DevMode URL Parameter for Client vs Team Access

## Overview

Implement a `?devMode=true` URL parameter that allows the development team to bypass standalone mode and access the connection form, while clients get automatic connection to the production database.

## User Experience

| User | URL | Behavior |
|------|-----|----------|
| **Client** | `gentle-sea-048057803.3.azurestaticapps.net` | Auto-connects to PROD DB, sees PROD dashboards |
| **Team** | `gentle-sea-048057803.3.azurestaticapps.net?devMode=true` | Shows login form, can connect to PROD or STAGE DB |

## Implementation

### File 1: `src/application/ApplicationThunks.ts`

**Location**: Line ~439, in `loadApplicationConfigThunk()`

**Current code**:
```typescript
const standalone = config.standalone || urlParams.get('standalone') == 'Yes';
```

**New code**:
```typescript
const devMode = urlParams.get('devMode') === 'true';
const standalone = !devMode && (config.standalone || urlParams.get('standalone') == 'Yes');
```

**Why**: If `devMode=true` is in the URL, force `standalone` to `false`, which triggers `initializeApplicationAsEditorThunk()` instead of `initializeApplicationAsStandaloneThunk()`. This shows the welcome screen and connection modal.

### File 2: `public/config.json`

**Change**: Update with production standalone configuration.

**New config**:
```json
{
  "ssoEnabled": false,
  "ssoProviders": [],
  "ssoDiscoveryUrl": "https://example.com",
  "standalone": true,
  "standaloneProtocol": "bolt+s",
  "standaloneHost": "neo4jgraph.uksouth.cloudapp.azure.com",
  "standalonePort": "443",
  "standaloneDatabase": "neo4j",
  "standaloneUsername": "neo4j",
  "standalonePassword": "<PROD_PASSWORD>",
  "standaloneDashboardName": "My Dashboard",
  "standaloneDashboardDatabase": "neo4j",
  "standaloneDashboardURL": "",
  "standaloneAllowLoad": false,
  "standaloneLoadFromOtherDatabases": false,
  "standaloneMultiDatabase": false,
  "standaloneDatabaseList": "neo4j",
  "loggingMode": "0",
  "loggingDatabase": "logs",
  "customHeader": ""
}
```

**Note**: Using placeholder values. You will update with actual PROD credentials manually or via deployment pipeline before deploying to production.

## Verification

1. **Test client experience**:
   - Access `http://localhost:3000` (with standalone: true in config)
   - Should auto-connect to configured database
   - Should NOT show connection form

2. **Test team experience**:
   - Access `http://localhost:3000?devMode=true`
   - Should show the welcome screen with "New Dashboard" / "Existing Dashboard" options
   - Should show connection form when clicking those options
   - Should be able to connect to any database (PROD or STAGE)

3. **Run existing tests**:
   - `yarn lint`
   - `yarn test-headless`

## Files Changed

| File | Change |
|------|--------|
| `src/application/ApplicationThunks.ts` | Add devMode URL parameter check (~2 lines) |
| `public/config.json` | Enable standalone mode with PROD settings |
