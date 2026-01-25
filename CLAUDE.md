# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL RULES (MUST FOLLOW)

1. **Pull Requests MUST be created in `gvieiracit/flowdash`** - This is a fork. NEVER create PRs in the upstream `neo4j-labs/neodash` repository. Always use `--repo gvieiracit/flowdash` when running `gh pr create`.

## Project Overview

FlowDash is a CI&T fork of NeoDash, a web-based dashboard builder for Neo4j graph databases. It allows users to create interactive dashboards with various visualization types including tables, graphs, bar/line/pie charts, maps, and more. Dashboards are configured via Cypher queries and can be saved to the database.

## Implementation Workflow (MUST FOLLOW)

All implementations must follow this workflow:

### 1. Plan Phase
- THe plan can be already in the `.claude/plan/`  describing the feature/change. If exists and asked, use it. Otherwise, start by creating a `.md` file in `.claude/plan/` describing the feature/change at a high level
- File naming: `YYYY-MM-DD-feature-name.md`

### 2. Specification Phase
- After the plan is reviewed, create a detailed specification in `.claude/spec/`
- The spec MUST include:
  - **Files to change**: List each file that will be modified or created
  - **What**: Describe the specific changes for each file
  - **Where**: Exact location in the file (function, component, line range)
  - **Why**: Rationale for each change
- Wait for user approval before implementing

### 3. Implementation Phase
- Create a new branch for the implementation (never work directly on master)
- Implement according to the approved specification
- Run local tests (`yarn lint`, `yarn test-headless`)

### 4. Pull Request Phase
- After local tests pass, create a Pull Request
- **MUST use `gh pr create --repo gvieiracit/flowdash`** - This is a fork, NEVER create PRs in upstream neo4j-labs/neodash
- **NEVER merge directly to master** - always create a PR first
- Wait for explicit user approval to merge

### 5. Merge & Archive Phase
- Only merge when the user explicitly requests it
- After merge, create a **product-oriented feature documentation** file in `.claude/done/`
- The done file serves as feature documentation and MUST include:
  - **Header**: Feature title, completion date, PR link, and commit ID with links
  - **What was delivered**: User-facing description of the feature
  - **Why it matters**: Benefits to users (UX improvements, capabilities enabled)
  - **How to use**: Step-by-step instructions for end users
  - **Behavior**: Table or list showing how the feature behaves in different scenarios
- Do NOT include technical implementation details (files changed, code snippets, etc.) — the PR/commit links provide that
- Delete the original plan and spec files (they are superseded by the done documentation)

### Folder Structure
```
.claude/
├── plan/    # High-level implementation plans (pending)
├── spec/    # Detailed technical specifications (pending)
└── done/    # Product-oriented feature documentation (completed)
```

## Common Commands

```bash
# Development
yarn install          # Install dependencies
yarn dev              # Start dev server at http://localhost:3000

# Code quality (runs automatically on pre-commit via Husky)
yarn format           # Format code with Prettier
yarn lint             # Run ESLint

# Testing
yarn test             # Open Cypress interactive mode
yarn test-headless    # Run Cypress tests headless (requires Neo4j + app running)

# Production
yarn build            # Build for production (outputs to dist/)
```

### Running a Single Cypress Test

```bash
yarn cypress run --spec "cypress/e2e/your-test-file.cy.ts"
```

### Testing Setup

Tests require a Neo4j instance with sample data. The CI uses a Docker container initialized via `scripts/docker-neo4j-initializer/`. For local testing, ensure Neo4j is running and accessible, then start the dev server before running tests.

## Architecture

### State Management (Redux)

Three main reducers in `src/store.ts`:
- **dashboard** - Dashboard pages, cards, and their configurations
- **application** - Global app state (connections, modals, notifications)
- **sessionStorage** - Session-specific ephemeral state

Each feature follows the pattern:
- `{Feature}Reducer.ts` - State reducers
- `{Feature}Actions.ts` - Action creators
- `{Feature}Selectors.ts` - State selectors (using Reselect)
- `{Feature}Thunks.ts` - Async operations

State is persisted to localStorage via redux-persist.

### Extension System

Extensions are defined in `src/extensions/ExtensionConfig.tsx`. Each extension can contribute:
- Custom Redux reducers
- Card settings UI components
- Settings menu buttons
- Report prepopulation functions
- Custom loading icons

Current extensions: `advanced-charts`, `styling`, `forms`, `rbac`, `text2cypher`, `cypher-upload`, `actions`, `query-translator`

### Report/Visualization System

Report types are configured in `src/config/ReportConfig.tsx`. Each report type defines:
- React component for rendering
- Available settings and their types
- Field selection behavior
- Max record limits

Chart implementations live in `src/chart/{type}/` directories.

### Key Directory Structure

```
src/
├── application/     # App-level state and logging
├── card/            # Card components (settings + view)
├── chart/           # Visualization implementations (bar, graph, map, table, etc.)
├── component/       # Reusable UI (editor, fields, theme)
├── config/          # App configuration (ReportConfig, CardConfig, StyleConfig)
├── dashboard/       # Dashboard layout (sidebar, header)
├── extensions/      # Plugin system
├── modal/           # Modal dialogs
├── page/            # Page management
└── utils/           # Utility functions
```

### Dev Server Proxy

The webpack dev server proxies `/flow-llm-proxy` requests to `https://flow.ciandt.com` for LLM integration.

## Code Style

- Prettier: 120 char line width, single quotes, semicolons
- ESLint: TypeScript strict mode, no var, prefer arrow functions
- Pre-commit hooks enforce formatting and linting on staged files

## Tech Stack

- React 17 + TypeScript + Redux (with redux-persist, redux-thunk)
- UI: Material-UI 5, Tailwind CSS, Neo4j Design Language (NDL)
- Visualizations: Nivo charts, React Force Graph (2D/3D), Leaflet maps
- Database: Neo4j driver with SSO support
- Build: Webpack 5 + Babel
- Testing: Cypress with code coverage
