# Table Pagination Persistence

**Completed**: 2026-01-23
**PR**: [#2](https://github.com/gvieiracit/flowdash/pull/2)
**Commit**: [`e51e8724`](https://github.com/gvieiracit/flowdash/commit/e51e8724)

---

## What was delivered

Users can now configure and persist their preferred "Rows per page" setting for Table widgets. Previously, when users changed the pagination from the default (5 rows) to another value (e.g., 50 rows), the selection would reset every time the query was re-run or the widget was maximized/minimized.

## Why it matters

- **Improved user experience**: Users working with large datasets no longer need to repeatedly change the rows-per-page setting during their workflow
- **Configurable defaults**: Dashboard creators can set appropriate default pagination per table (e.g., 25 rows for summary tables, 100 for detailed data)
- **Session persistence**: User preferences are remembered throughout their session without requiring a page refresh

## How to use

1. **Set a default** (optional): Open Table widget → Advanced Settings → "Default Rows Per Page" → enter desired number
2. **Change on-the-fly**: Use the pagination dropdown in the table footer — your selection persists across queries and widget interactions
3. **Priority**: User's dropdown selection takes precedence over the configured default

## Behavior

| Action | Result |
|--------|--------|
| Change rows via dropdown | Persists for the session |
| Re-run query | Keeps current selection |
| Maximize/minimize widget | Keeps current selection |
| Refresh page | Resets to Advanced Settings default (or 5) |
