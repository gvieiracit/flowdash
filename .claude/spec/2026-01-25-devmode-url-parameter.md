# Specification: DevMode URL Parameter for Client vs Team Access

## Files to Change

### 1. `src/application/ApplicationThunks.ts`

**What**: Add a `devMode` URL parameter check that overrides standalone mode when set to `true`.

**Where**: Line 439, inside `loadApplicationConfigThunk()`, immediately before the `standalone` variable declaration.

**Current code** (line 439):
```typescript
const standalone = config.standalone || urlParams.get('standalone') == 'Yes';
```

**New code** (lines 439-440):
```typescript
const devMode = urlParams.get('devMode') === 'true';
const standalone = !devMode && (config.standalone || urlParams.get('standalone') == 'Yes');
```

**Why**:
- When `devMode=true` is in the URL, `standalone` becomes `false` regardless of config settings
- This causes line 568-572 to call `initializeApplicationAsEditorThunk()` instead of `initializeApplicationAsStandaloneThunk()`
- `initializeApplicationAsEditorThunk()` shows the welcome screen (line 605) which allows team members to access the connection form and connect to any database

---

### 2. `public/config.json`

**What**: Enable standalone mode with production database settings (using placeholder for password).

**Where**: Entire file content replacement.

**Current config**:
```json
{
  "ssoEnabled": false,
  "ssoProviders": [],
  "ssoDiscoveryUrl": "https://example.com",
  "standalone": false,
  ...
}
```

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

**Why**:
- `standalone: true` enables automatic connection for clients visiting without `?devMode=true`
- `standaloneProtocol: "bolt+s"` uses secure WebSocket connection for Azure deployment
- `standalonePort: "443"` is the standard HTTPS port for the Azure VM
- `standalonePassword: "<PROD_PASSWORD>"` is a placeholder - actual credentials should be injected during deployment via CI/CD pipeline or manual update
- `standaloneDashboardDatabase: "neo4j"` stores dashboards in the same database as data

---

## Testing Plan

1. **Lint check**: `yarn lint`
2. **Unit tests**: `yarn test-headless`
3. **Manual verification**:
   - Start dev server with `yarn dev`
   - Visit `http://localhost:3000` - should attempt auto-connect (will fail without real credentials, but should NOT show welcome screen)
   - Visit `http://localhost:3000?devMode=true` - should show welcome screen with connection options
