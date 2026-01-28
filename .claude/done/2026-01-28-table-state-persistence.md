# Table State Persistence

**Completed:** 2026-01-28
**PR:** [#12](https://github.com/gvieiracit/flowdash/pull/12)
**Commit:** [3719d5b1](https://github.com/gvieiracit/flowdash/commit/3719d5b1)

## What Was Delivered

The Table widget (DataGrid) now remembers user customizations across interactions and page reloads:

- **Column widths** - When users resize columns, the widths are preserved
- **Inline filters** - Filters applied via the column menu persist across page reloads
- **Sort order** - Column sorting persists across page reloads

## Why It Matters

Users reported frustration with the table constantly "forgetting" their preferences:

1. **Improved workflow** - No more repeatedly resizing columns to fit content
2. **Reduced friction** - Filters stay applied when navigating or refreshing
3. **Better UX** - The table now behaves as users expect

## How to Use

No action required - the feature works automatically:

1. **Column widths**: Drag column borders to resize → widths are saved
2. **Filters**: Click column menu (⋮) → Filter → apply filter → persists on reload
3. **Sorting**: Click column menu (⋮) → Sort → persists on reload

## Behavior

| Action | Before | After |
|--------|--------|-------|
| Resize column, then select a filter | Width resets | Width preserved |
| Resize column, then select a row | Width resets | Width preserved |
| Apply inline filter, then reload page | Filter lost | Filter preserved |
| Sort column, then reload page | Sort lost | Sort preserved |
| Navigate to another page and back | State lost | State preserved |

State is stored per-table (identified by page number and card ID) in session storage.
