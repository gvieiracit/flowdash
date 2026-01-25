# DevMode URL Parameter & Standalone Viewer Mode

**Completed:** 2026-01-25
**PRs:** [#7](https://github.com/gvieiracit/flowdash/pull/7), [#8](https://github.com/gvieiracit/flowdash/pull/8)
**Commits:** [cb3488bf](https://github.com/gvieiracit/flowdash/commit/cb3488bf5be9d65a9d1f5a4f741633c4b4112967), [f8a858ac](https://github.com/gvieiracit/flowdash/commit/f8a858ac)

---

## What was delivered

A dual-access system that provides different experiences for clients and development team members:

- **Clients** get automatic connection to production database with a clean, branded interface
- **Team members** can bypass standalone mode using `?devMode=true` to access any database with clear environment indicators

---

## Why it matters

- **Better client UX**: Clients see dashboards immediately without login screens or technical details
- **Team safety**: Red "PROD" badge prevents accidental changes to production data
- **Flexibility**: Team can switch between PROD and STAGE environments easily
- **Security**: Credentials are injected via CI/CD secrets, never stored in repository

---

## How to use

### For Clients
Simply access the application URL:
```
https://gentle-sea-048057803.3.azurestaticapps.net
```
- Automatically connects to production database
- Shows custom branded header
- Sidebar allows navigation between dashboards (view-only)
- Logo click is disabled (no access to connection dialog)

### For Team Members
Add `?devMode=true` to the URL:
```
https://gentle-sea-048057803.3.azurestaticapps.net?devMode=true
```
- Shows welcome screen with connection options
- Can connect to any database (PROD or STAGE)
- Header shows connection URL instead of custom header
- **Red "PROD" badge** appears when connected to production

---

## Behavior

| Access Method | Header Shows | Sidebar | Can Edit | Auto-connects |
|---------------|--------------|---------|----------|---------------|
| Normal URL (client) | Custom header | Yes (view-only) | No | Yes (PROD) |
| `?devMode=true` + STAGE | Connection URL | Yes (full) | Yes | No |
| `?devMode=true` + PROD | Connection URL + 🔴 PROD | Yes (full) | Yes | No |

---

## GitHub Secrets Required

| Secret | Description | Example |
|--------|-------------|---------|
| `NEO4J_PROTOCOL` | Connection protocol | `bolt+s` |
| `NEO4J_HOST` | Database hostname | `neo4jgraph.uksouth.cloudapp.azure.com` |
| `NEO4J_PORT` | Connection port | `443` |
| `NEO4J_DATABASE` | Database name | `neo4j` |
| `NEO4J_USERNAME` | Database user | `neo4j` |
| `NEO4J_PASSWORD` | Database password | *(secret)* |
| `NEO4J_CUSTOMHEADER` | Branded header text | `CI&T FLOW` |
