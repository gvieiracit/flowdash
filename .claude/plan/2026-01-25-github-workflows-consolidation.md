# GitHub Workflows Consolidation Plan

## Executive Summary

FlowDash currently has 6 GitHub Actions workflows inherited from upstream NeoDash. After analysis, 5 are broken or redundant. This plan takes a **conservative approach (Option A)** - keeping the working workflow and removing only the broken ones.

---

## Decision: Option A (Conservative)

| Option | Description | Risk | Chosen |
|--------|-------------|------|--------|
| A | Minimal cleanup - keep working workflow, delete broken ones | Low | ✅ **YES** |
| B | Full consolidation - rewrite everything | Medium | ❌ No |
| C | Keep self-hosted runners | N/A | ❌ No (not available) |

**Rationale:** Option A is safer because we keep the proven working workflow (`azure-static-web-apps-gentle-sea-048057803.yml`) and only remove what's broken.

---

## Current State

### Workflow Status

| # | File | Status | Reason |
|---|------|--------|--------|
| 1 | `master-deployment.yml` | ❌ Broken | Uses `neodash-runners` (not available) |
| 2 | `develop-deployment.yml` | ❌ Broken | Uses `neodash-runners` (not available) |
| 3 | `master-test.yml` | ❌ Broken | Uses `neodash-runners` (not available) |
| 4 | `develop-test.yml` | ❌ Broken | Uses `neodash-runners` (not available) |
| 5 | `azure-deploy.yml` | ❌ Failing | Wrong token |
| 6 | `azure-static-web-apps-gentle-sea-048057803.yml` | ✅ **Working** | Correct token, Neo4j injection |

### Requirements Confirmed

| Requirement | Status |
|-------------|--------|
| Neo4j config injection on PR preview | ✅ Required |
| Neo4j config injection on production (master merge) | ✅ Required |
| Same secrets for PR and production | ✅ Confirmed |
| Cypress tests in CI | ❌ Not needed |
| Access to `neodash-runners` | ❌ Not available |

---

## Implementation Plan

### Step 1: Create CI Workflow

Create a new `ci.yml` for lint and build validation on all branches.

- Runs on `ubuntu-latest` (GitHub-hosted)
- Triggers on all branch pushes and PRs to master
- Runs lint + build only (no Cypress)
- Skips docs-only changes

### Step 2: Keep and Update Deploy Workflow

Keep `azure-static-web-apps-gentle-sea-048057803.yml` with minimal changes:

- Fix trigger: push only to `master` (not all branches)
- Keep PR triggers for preview environments
- Keep Neo4j config injection (required)
- Add `paths-ignore` for docs
- Optionally rename to `deploy.yml` for clarity

### Step 3: Delete Broken Workflows

Remove all non-functional workflows:

| File | Reason for Deletion |
|------|---------------------|
| `master-deployment.yml` | Uses unavailable runners, Neo4j Labs infra |
| `develop-deployment.yml` | Uses unavailable runners, Neo4j Labs infra |
| `master-test.yml` | Uses unavailable runners |
| `develop-test.yml` | Uses unavailable runners |
| `azure-deploy.yml` | Failing (wrong token) |

---

## Expected Behavior After Implementation

### CI Workflow (`ci.yml`)

| Event | Runs? | What it does |
|-------|-------|--------------|
| Push to any branch | ✅ | Lint + Build |
| PR to master | ✅ | Lint + Build |
| Docs-only changes | ❌ | Skipped |

### Deploy Workflow (`deploy.yml`)

| Event | Runs? | What it does |
|-------|-------|--------------|
| Push to feature branch | ❌ | Nothing |
| PR opened to master | ✅ | Build + Inject secrets + Deploy preview |
| PR updated | ✅ | Build + Inject secrets + Update preview |
| PR closed | ✅ | Clean up preview environment |
| PR merged to master | ✅ | Build + Inject secrets + Deploy production |
| Docs-only changes | ❌ | Skipped |

### Secret Injection

Both PR preview and production deployments inject the same secrets:

```
public/config.json placeholders → GitHub Secrets
<NEO4J_PROTOCOL>    → ${{ secrets.NEO4J_PROTOCOL }}
<NEO4J_HOST>        → ${{ secrets.NEO4J_HOST }}
<NEO4J_PORT>        → ${{ secrets.NEO4J_PORT }}
<NEO4J_DATABASE>    → ${{ secrets.NEO4J_DATABASE }}
<NEO4J_USERNAME>    → ${{ secrets.NEO4J_USERNAME }}
<NEO4J_PASSWORD>    → ${{ secrets.NEO4J_PASSWORD }}
<NEO4J_CUSTOMHEADER>→ ${{ secrets.NEO4J_CUSTOMHEADER }}
```

---

## Before and After

### Before (6 workflows)

```
.github/workflows/
├── azure-deploy.yml                               ❌ Failing
├── azure-static-web-apps-gentle-sea-048057803.yml ✅ Working
├── develop-deployment.yml                         ❌ Broken
├── develop-test.yml                               ❌ Broken
├── master-deployment.yml                          ❌ Broken
└── master-test.yml                                ❌ Broken
```

### After (2 workflows)

```
.github/workflows/
├── ci.yml      ✅ NEW - Lint + Build
└── deploy.yml  ✅ KEPT (renamed) - Azure deploy with Neo4j injection
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking production deploy | Very Low | High | Keeping working workflow, minimal changes |
| Breaking PR previews | Very Low | Medium | Keeping working workflow, minimal changes |
| Missing test coverage | Low | Low | Lint + build catches most issues |

---

## Rollback Plan

If issues occur after implementation:
1. `git revert` the consolidation commit
2. All original workflows are preserved in git history

---

## Next Step

Create detailed specification in `.claude/spec/` with exact file contents and changes.
