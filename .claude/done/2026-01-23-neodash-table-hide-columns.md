# Table Default Hidden Columns

**Completed**: 2026-01-23
**PR**: [#3](https://github.com/gvieiracit/flowdash/pull/3)
**Commit**: [`13576201`](https://github.com/gvieiracit/flowdash/commit/13576201)

---

## What was delivered

Admins can now configure which table columns are hidden by default, while users retain the ability to show/hide columns during their session. Previously, all columns returned by a query were always visible unless the column name started with "__".

## Why it matters

- **Cleaner default views**: Admins can hide technical or less-relevant columns (like GUIDs, internal IDs) without removing them from the query
- **User flexibility**: Users can reveal hidden columns via the column menu when needed
- **Session persistence**: User's column visibility choices persist across queries and widget interactions
- **Backward compatible**: Existing dashboards work unchanged; the "__" prefix convention still works

## How to use

1. **Set columns to hide** (optional): Open Table widget → Advanced Settings → "Hide Columns" → enter JSON array with column names, e.g., `["Type", "GUID", "Internal ID"]`
2. **Change on-the-fly**: Click any column header menu → "Manage columns" or "Hide column" — your selection persists for the session
3. **Priority**: User session selection → Admin setting → "__" prefix → All visible

## Behavior

| Action | Result |
|--------|--------|
| Configure Hide Columns setting | Listed columns hidden by default |
| User shows hidden column via menu | Column visible, persists for session |
| User hides column via menu | Column hidden, persists for session |
| Re-run query | User's visibility choices preserved |
| Maximize/minimize widget | User's visibility choices preserved |
| Refresh page | Resets to Advanced Settings default |
| Non-existent column in setting | Silently ignored (no error) |
