# GitHub Workflows Consolidation - Technical Specification

## Overview

This spec details the exact file changes to consolidate 6 GitHub workflows into 2.

**Reference Plan:** `.claude/plan/2026-01-25-github-workflows-consolidation.md`

---

## Files to Change

| Action | File | Why |
|--------|------|-----|
| CREATE | `.github/workflows/ci.yml` | New CI workflow for lint + build |
| RENAME | `azure-static-web-apps-gentle-sea-048057803.yml` → `deploy.yml` | Cleaner name |
| MODIFY | `.github/workflows/deploy.yml` | Fix triggers, keep Neo4j injection |
| DELETE | `.github/workflows/master-deployment.yml` | Broken (no runners) |
| DELETE | `.github/workflows/develop-deployment.yml` | Broken (no runners) |
| DELETE | `.github/workflows/master-test.yml` | Broken (no runners) |
| DELETE | `.github/workflows/develop-test.yml` | Broken (no runners) |
| DELETE | `.github/workflows/azure-deploy.yml` | Failing (wrong token) |

---

## File 1: CREATE `.github/workflows/ci.yml`

**Purpose:** Run lint and build on all branches to catch errors early.

**Location:** `.github/workflows/ci.yml`

**Full Content:**

```yaml
name: CI

on:
  push:
    branches:
      - '**'
    paths-ignore:
      - '.claude/**'
      - '*.md'
      - 'docs/**'
  pull_request:
    branches:
      - master
    paths-ignore:
      - '.claude/**'
      - '*.md'
      - 'docs/**'

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Lint
        run: yarn run lint

      - name: Build
        run: yarn run build-minimal
```

---

## File 2: RENAME + MODIFY `deploy.yml`

**Purpose:** Deploy to Azure Static Web Apps with Neo4j config injection.

**Action:**
1. Rename `azure-static-web-apps-gentle-sea-048057803.yml` → `deploy.yml`
2. Modify triggers

**Location:** `.github/workflows/deploy.yml`

**Full Content:**

```yaml
name: Deploy

on:
  push:
    branches:
      - master
    paths-ignore:
      - '.claude/**'
      - '*.md'
      - 'docs/**'
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - master
    paths-ignore:
      - '.claude/**'
      - '*.md'
      - 'docs/**'

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: true
          lfs: false

      - name: Inject Neo4j config
        run: |
          sed -i 's/<NEO4J_PROTOCOL>/${{ secrets.NEO4J_PROTOCOL }}/g' public/config.json
          sed -i 's/<NEO4J_HOST>/${{ secrets.NEO4J_HOST }}/g' public/config.json
          sed -i 's/<NEO4J_PORT>/${{ secrets.NEO4J_PORT }}/g' public/config.json
          sed -i 's/<NEO4J_DATABASE>/${{ secrets.NEO4J_DATABASE }}/g' public/config.json
          sed -i 's/<NEO4J_USERNAME>/${{ secrets.NEO4J_USERNAME }}/g' public/config.json
          sed -i 's/<NEO4J_PASSWORD>/${{ secrets.NEO4J_PASSWORD }}/g' public/config.json
          sed -i 's/<NEO4J_CUSTOMHEADER>/${{ secrets.NEO4J_CUSTOMHEADER }}/g' public/config.json

      - name: Build and Deploy to Azure
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_GENTLE_SEA_048057803 }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: ""
          output_location: "dist"

  close_pull_request:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_GENTLE_SEA_048057803 }}
          action: "close"
```

**Changes from Original:**

| Line | Original | New | Reason |
|------|----------|-----|--------|
| 1 | `name: Azure Static Web Apps CI/CD` | `name: Deploy` | Cleaner name |
| 5-6 | `branches: - master` | `branches: - master` | Same (push to master only) |
| 7-10 | (none) | `paths-ignore: ...` | Skip docs-only changes |
| 12-16 | (none on PR) | `paths-ignore: ...` | Skip docs-only changes |
| 19 | `uses: actions/checkout@v3` | `uses: actions/checkout@v4` | Update action version |
| 22-28 | `Set production credentials` | `Inject Neo4j config` | Cleaner step name |

---

## Files 3-7: DELETE

### DELETE `.github/workflows/master-deployment.yml`

**Reason:** Uses `neodash-runners` (not available), deploys to Neo4j Labs infrastructure (S3, Docker Hub, NPM) which doesn't apply to this fork.

### DELETE `.github/workflows/develop-deployment.yml`

**Reason:** Uses `neodash-runners` (not available), deploys to Neo4j Labs S3 bucket.

### DELETE `.github/workflows/master-test.yml`

**Reason:** Uses `neodash-runners` (not available), duplicate testing (new `ci.yml` replaces this).

### DELETE `.github/workflows/develop-test.yml`

**Reason:** Uses `neodash-runners` (not available), duplicate testing (new `ci.yml` replaces this).

### DELETE `.github/workflows/azure-deploy.yml`

**Reason:** Failing workflow - uses `AZURE_STATIC_WEB_APPS_API_TOKEN` which doesn't exist or is wrong. The `deploy.yml` (renamed from gentle-sea) uses the correct token.

---

## Implementation Steps

### Step 1: Create feature branch

```bash
git checkout -b chore/consolidate-workflows
```

### Step 2: Create `ci.yml`

Create new file `.github/workflows/ci.yml` with content from File 1 above.

### Step 3: Rename and modify deploy workflow

```bash
git mv .github/workflows/azure-static-web-apps-gentle-sea-048057803.yml .github/workflows/deploy.yml
```

Then modify `.github/workflows/deploy.yml` with content from File 2 above.

### Step 4: Delete broken workflows

```bash
rm .github/workflows/master-deployment.yml
rm .github/workflows/develop-deployment.yml
rm .github/workflows/master-test.yml
rm .github/workflows/develop-test.yml
rm .github/workflows/azure-deploy.yml
```

### Step 5: Commit and push

```bash
git add -A
git commit -m "chore: consolidate GitHub workflows

- Create ci.yml for lint + build on all branches
- Rename azure-static-web-apps-gentle-sea to deploy.yml
- Fix deploy triggers (master push + PRs only)
- Delete 5 broken/redundant workflows
- Keep Neo4j config injection for PR previews and production

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push -u origin chore/consolidate-workflows
```

### Step 6: Create PR and verify

1. Create PR to master
2. Verify `ci.yml` runs (lint + build)
3. Verify `deploy.yml` creates preview environment
4. Check preview URL has Neo4j config injected

### Step 7: Merge and verify production

1. Merge PR to master
2. Verify `deploy.yml` deploys to production
3. Check production has Neo4j config injected

---

## Verification Checklist

### After PR Created

- [ ] `CI` workflow runs and passes (lint + build)
- [ ] `Deploy` workflow runs and creates preview
- [ ] Preview URL is accessible
- [ ] Preview has Neo4j connection working (config injected)

### After Merge to Master

- [ ] `CI` workflow runs and passes
- [ ] `Deploy` workflow runs and deploys to production
- [ ] Production URL is accessible
- [ ] Production has Neo4j connection working (config injected)

### Docs-Only Commit Test

- [ ] Push a commit that only changes `.md` files
- [ ] Verify both workflows are skipped

---

## Secrets Required

These secrets must exist in GitHub repository settings:

| Secret | Required By |
|--------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_GENTLE_SEA_048057803` | `deploy.yml` |
| `NEO4J_PROTOCOL` | `deploy.yml` |
| `NEO4J_HOST` | `deploy.yml` |
| `NEO4J_PORT` | `deploy.yml` |
| `NEO4J_DATABASE` | `deploy.yml` |
| `NEO4J_USERNAME` | `deploy.yml` |
| `NEO4J_PASSWORD` | `deploy.yml` |
| `NEO4J_CUSTOMHEADER` | `deploy.yml` |

**Status:** ✅ All secrets already exist (verified via `gh secret list`).

---

## Rollback

If something breaks after implementation:

```bash
git revert <commit-hash>
git push
```

All original workflows are preserved in git history.
