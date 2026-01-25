# Specification: Standalone Viewer Mode with Dashboard Navigation

## Files to Change

### 1. `public/config.json`

**What**: Enable sidebar visibility in standalone mode.

**Where**: Update `standaloneAllowLoad` setting.

**Change**: `"standaloneAllowLoad": false` → `"standaloneAllowLoad": true`

**Why**: Shows sidebar for dashboard navigation while edit buttons remain hidden (already controlled by `readonly` flag in standalone mode).

---

### 2. `src/dashboard/DashboardThunks.ts`

**What**: Add fallback logic to load first available dashboard when configured name not found.

**Where**:
- Add new function `loadFirstAvailableDashboardThunk` (after line 386)
- Modify `loadDashboardFromNeo4jByNameThunk` (lines 388-486)

**Changes**:

1. **New helper function** `loadFirstAvailableDashboardThunk`:
   - Query: `MATCH (d:_Neodash_Dashboard) RETURN d.content as dashboard ORDER by d.date DESC LIMIT 1`
   - Returns the most recent dashboard
   - Calls `onEmpty` callback if no dashboards exist

2. **Modified** `loadDashboardFromNeo4jByNameThunk`:
   - Added `isStandalone` check using `applicationIsStandalone(loggingState)`
   - On "not found" status (lines 404-411): if standalone, call `loadFallbackDashboard()` instead of showing error
   - On empty records (lines 414-438): if standalone, call `loadFallbackDashboard()` instead of showing error
   - Shows info notification: "Dashboard '{name}' not found. Loading the most recent dashboard instead."

**Why**: Clients should always see a dashboard, not an error. The sidebar allows navigation anyway.

---

## Testing Plan

1. **Client access** (no `?devMode`):
   - Should see sidebar with dashboard list
   - Should NOT see + button, 3-dots menu
   - Should load first available dashboard automatically
   - Can click on other dashboards to navigate

2. **Team access** (`?devMode=true`):
   - Full editing capabilities (unchanged)

3. **Empty database**:
   - Shows "No dashboards available" notification
