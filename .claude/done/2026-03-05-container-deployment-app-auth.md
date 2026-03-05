# Container Deployment with App-Level Authentication & ACR Migration

**Completed:** 2026-03-05
**PR:** [#15](https://github.com/gvieiracit/flowdash/pull/15)
**Merge Commit:** [`7fd5d28`](https://github.com/gvieiracit/flowdash/commit/7fd5d282fe764f2c0070ba176e37820137fd9c16)

---

## What was delivered

FlowDash was migrated from Azure Static Web Apps (publicly accessible) to Azure Container Apps with:

1. **App-level email authentication** — a login page that requires a `@ciandt.com` or `@asos.com` email and a shared password before accessing the dashboard
2. **Neo4j credential protection** — database credentials are stored in a separate file (`config-credentials.json`) that nginx only serves after successful authentication
3. **Dedicated Azure Container Registry (ACR)** — images are pushed to `acrflowdash.azurecr.io` instead of GitHub Container Registry, enabling env var changes via Azure Portal without image pull failures
4. **PR preview environments** — each PR gets its own Container App with a preview URL posted as a comment
5. **Performance configuration** — fixed 2 replicas with health probes for consistent availability

---

## Why it matters

- **Security**: Neo4j credentials are no longer exposed in a publicly accessible `config.json`. They are protected server-side by nginx and only delivered to authenticated users.
- **Audit trail**: Each user logs in with their email, which is set as a `$neodash_user_email` Cypher session parameter — available for query-level tracking.
- **Operational flexibility**: Auth can be toggled on/off via a single environment variable (`authEnabled`) without redeploying code. The password can be changed the same way.
- **Azure Portal works**: ACR credentials persist, so env var changes, manual revision creation, and portal operations work without CI/CD.

---

## How to use

### For end users

1. Visit the FlowDash URL (e.g., `https://flowdash-asos.ciandt.com/`)
2. Enter your `@ciandt.com` or `@asos.com` email
3. Enter the shared password
4. Dashboard loads automatically

### For administrators — Environment variables

These are set in the Container App and can be changed via Azure Portal (create new revision):

| Variable | Purpose | Example |
|----------|---------|---------|
| `authEnabled` | Toggle login page on/off | `true` or `false` |
| `AUTH_PASSWORD` | Shared login password | (set via GitHub Secrets) |
| `standalone` | Run in viewer mode | `true` |
| `standaloneProtocol` | Neo4j connection protocol | `neo4j+s` |
| `standaloneHost` | Neo4j hostname | `xxx.databases.neo4j.io` |
| `standalonePort` | Neo4j port | `7687` |
| `standaloneDatabase` | Neo4j database name | `neo4j` |
| `standaloneUsername` | Neo4j username | (set via GitHub Secrets) |
| `standalonePassword` | Neo4j password | (set via GitHub Secrets) |
| `standaloneDashboardName` | Dashboard to load | `My Dashboard` |

### For developers — URL parameters

| Parameter | Effect |
|-----------|--------|
| `?devMode=true` | Bypass standalone mode, show the manual connection form |
| `?standalone=Yes` | Force standalone mode (auto-connect) |
| `?page=N` | Jump to a specific dashboard page |

---

## Behavior by configuration

| `authEnabled` | `standalone` | URL param | Result |
|---------------|-------------|-----------|--------|
| `true` | `true` | — | Login page → auto-connect to Neo4j |
| `false` | `true` | — | Skip login → auto-connect to Neo4j |
| any | any | `?devMode=true` | Skip login → manual connection form |
| `true` | `true` | valid session cookie | Auto-connect (session restored, no login) |

---

## Infrastructure

| Component | Value |
|-----------|-------|
| **Container Registry** | `acrflowdash.azurecr.io` (ACR Basic, UK South) |
| **Container App (prod)** | `ca-flowdash-prod` in `cae-flowdash` environment |
| **Container App (preview)** | `ca-flowdash-pr-{N}` (created/destroyed per PR) |
| **Resource Group** | `ASOS_AI` |
| **Replicas** | 2 min / 2 max (fixed) |
| **CPU / Memory** | 0.5 vCPU / 1 Gi |
| **Health probes** | Liveness (30s) + Readiness (10s) on `GET /` port 5005 |
| **Auth** | `AZURE_CREDENTIALS` service principal (no extra secrets) |

---

## Rollback

- **Auth issues**: Set `authEnabled=false` via Azure Portal → create new revision → login page is bypassed
- **Full rollback**: Revert `deploy.yml` to restore the previous Static Web Apps workflow. The Static Web App resource still exists as a backup.
- **ACR cleanup**: `az acr delete --name acrflowdash --resource-group ASOS_AI --yes`
