# Fix: Health Probes & PR Merge Race Condition

- **Completed:** 2026-03-05
- **PR:** [#16](https://github.com/gvieiracit/flowdash/pull/16)
- **Commit:** [`62dd77e2`](https://github.com/gvieiracit/flowdash/commit/62dd77e2)

## What was delivered

Fixed two deployment issues discovered after PR #15:

1. **Health probes now work** — Production and preview container apps have liveness and readiness probes configured correctly, without losing environment variables.
2. **No more orphaned preview containers on PR merge** — A concurrency group prevents the deploy-preview and cleanup-preview jobs from racing.

## Why it matters

- **Reliability:** Health probes enable Azure to automatically restart unhealthy containers and route traffic only to ready instances.
- **Cost & hygiene:** Orphaned container apps (like `ca-flowdash-pr-15`) consumed resources and caused confusion. The concurrency fix ensures cleanup always wins on merge.

## How it works

### Health probes
The workflow fetches the **full container spec** from Azure (including env vars, resources, etc.), adds liveness/readiness probes via `jq`, converts to YAML with `yq`, and applies the update. This preserves all existing container configuration.

### Race condition prevention
A top-level concurrency group serializes workflow runs per PR number. When a PR is merged, GitHub fires both `synchronize` and `closed` events — the concurrency group cancels the stale deploy-preview run, letting cleanup run cleanly.

## Behavior

| Scenario | Before | After |
|----------|--------|-------|
| Production deploy | Health probes step failed (`ContainerAppImageRequired`) | All steps succeed, probes configured |
| Preview deploy | Probes wiped env vars | Full container spec preserved |
| PR merge | Race condition → orphaned container app | Concurrency group → cleanup wins |
| Rapid pushes to master | Both deploys run in parallel | Newer deploy cancels older (latest code wins) |
