# Plan: Standalone Viewer Mode with Dashboard Navigation

## Problem

When clients access the app in standalone mode:
1. **Error "Unable to load dashboard"** - because `standaloneDashboardName: "My Dashboard"` doesn't exist
2. **No sidebar** - clients can't navigate between dashboards
3. **Creates empty "New dashboard"** - instead of loading existing dashboards

## Current Behavior

| Setting | Current | Effect |
|---------|---------|--------|
| `standaloneAllowLoad` | `false` | Sidebar is hidden |
| `standaloneDashboardName` | `"My Dashboard"` | Tries to load non-existent dashboard |
| When dashboard not found | Shows error | App stuck with empty dashboard |

## Desired Behavior

| User | Behavior |
|------|----------|
| **Client (standalone)** | Sees sidebar with dashboard list, can navigate between dashboards, cannot edit/create/delete |
| **Team (devMode)** | Full editing capabilities |

### Client Experience in Standalone Mode:
- Show sidebar with dashboard list (for navigation)
- Hide: + button, 3-dots menu, edit icons ✅ (already works when `readonly=true`)
- Load first available dashboard from database (fallback if configured name not found)
- View-only mode ✅ (already works in standalone)

## Solution

### Part 1: Config Change (Quick)
Update `config.json` to enable sidebar:
```json
{
  "standaloneAllowLoad": true
}
```

### Part 2: Code Change (Load First Dashboard as Fallback)
Modify `loadDashboardFromNeo4jByNameThunk` in `src/dashboard/DashboardThunks.ts` to:
1. Try to load the configured dashboard by name
2. If not found, load the first available dashboard from the database
3. Only show error if NO dashboards exist at all

## Files to Change

| File | Change |
|------|--------|
| `public/config.json` | Set `standaloneAllowLoad: true` |
| `src/dashboard/DashboardThunks.ts` | Add fallback logic to load first dashboard |

## Verification

1. **Client access** (no `?devMode`):
   - Should see sidebar with dashboard list
   - Should NOT see + button, 3-dots menu
   - Should load first available dashboard automatically
   - Can click on other dashboards to navigate

2. **Team access** (`?devMode=true`):
   - Full editing capabilities (unchanged)
