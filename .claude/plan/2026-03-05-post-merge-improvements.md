# Post-Merge Improvements: Container Deployment & Auth

**Date:** 2026-03-05
**Context:** Issues found during final review of PR #15 (feat/container-deployment-app-auth). None are blocking — all are low-severity improvements for follow-up PRs.

---

## 1. Blacklist transient auth fields from redux-persist

**Severity:** Low
**File:** `src/store.ts`

`pendingConfig` (which may contain Neo4j credentials after merge) is persisted to localStorage via redux-persist. Fields like `authLoginError`, `authLoginLoading`, `pendingConfig`, `pendingParams`, and `pendingStandalone` are transient and should not survive page reloads.

**Fix:** Add a `blacklist` to the persist config for these fields, or blacklist the entire `application` reducer since `loadApplicationConfigThunk` re-initializes everything on startup.

---

## 2. Wire up logout button in standalone mode

**Severity:** Low
**Files:** `src/dashboard/header/DashboardHeaderLogoutButton.tsx`, `src/application/ApplicationThunks.ts`

`logoutAuthThunk` exists and works (clears cookie, localStorage, Redux state, reloads page), but no UI element calls it in standalone mode. Users must clear cookies manually or close the browser to end their session.

**Fix:** Add a logout button (or repurpose the existing one) that calls `logoutAuthThunk` when `authEnabled=true` in standalone mode.

---

## 3. Add `Secure` flag to auth cookie on HTTPS

**Severity:** Low
**File:** `src/application/ApplicationThunks.ts` (line ~766)

The `flowdash_token` cookie is set without the `Secure` flag. Azure Container Apps enforce HTTPS, so this is not a practical risk, but adding it is a best-practice hardening.

**Fix:** `document.cookie = \`flowdash_token=${token};path=/;SameSite=Strict${window.location.protocol === 'https:' ? ';Secure' : ''}\``

---

## 4. Eliminate duplicate credential fetch on session restore

**Severity:** Low
**File:** `src/application/ApplicationThunks.ts`

When `authEnabled=true` and a valid session exists, `config-credentials.json` is fetched twice: once in the early "always try" block (line ~456) and again in `restoreAuthSession` (line ~539). Both succeed and merge the same data.

**Fix:** Skip the early fetch when `authEnabled=true` (let the auth flow handle it), or remove the redundant fetch from `restoreAuthSession` since credentials are already merged.

---

## 5. Add re-login step to production deploy job

**Severity:** Info
**File:** `.github/workflows/deploy.yml`

The `deploy-preview` job has a second "Login to Azure" step between the Docker build and the deploy (defensive against token expiry during long builds). The `deploy-production` job does not have this. Inconsistent but not harmful.

**Fix:** Either add the same re-login to production (between build and `Get ACR credentials`), or remove the duplicate from preview.

---

## 6. Set up ACR purge task for untagged manifests

**Severity:** Info
**Context:** `.github/workflows/deploy.yml` cleanup job

The cleanup step uses `az acr repository untag` which removes the tag but leaves the underlying manifest and layers in the registry. Over time, untagged images accumulate and consume storage (Basic SKU has 10 GB limit).

**Fix:** Set up an ACR purge task to periodically clean untagged manifests:
```bash
az acr run --cmd "acr purge --filter 'flowdash:.*' --untagged --ago 7d" --registry acrflowdash /dev/null
```
Or switch the cleanup step from `untag` to `az acr repository delete --image "flowdash:$tag"`.

---

## 7. Health probes briefly absent during deploy

**Severity:** Info
**File:** `.github/workflows/deploy.yml`

Health probes are configured in a separate step AFTER `container-apps-deploy-action@v2` creates the new revision. During the brief window between revision creation and probe configuration, the container runs without probes.

**Fix:** Combine probe configuration into the deploy step using a YAML template that includes both the container spec and probes, or accept this as an acceptable deploy-time trade-off.
