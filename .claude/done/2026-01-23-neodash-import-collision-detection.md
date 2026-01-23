# Dashboard Import Collision Detection

**Completed**: 2026-01-23
**PR**: [#4](https://github.com/gvieiracit/flowdash/pull/4)
**Commit**: [`4d657ebe`](https://github.com/gvieiracit/flowdash/commit/4d657ebe)

---

## What was delivered

When importing a dashboard JSON file, FlowDash now validates the file and checks if a dashboard with the same identifier already exists. If a collision is detected, users are presented with resolution options instead of silently overwriting the existing dashboard.

## Why it matters

- **Prevents accidental data loss**: Users can no longer accidentally overwrite existing dashboards when importing a file with a duplicate UUID
- **Enables safe collaboration**: Teams can share dashboard files without fear of overwriting each other's work
- **Validates before importing**: Invalid or malformed JSON files are rejected immediately without creating broken drafts
- **User control**: Clear options let users decide how to handle conflicts

## How to use

1. Click the **+** button in the Dashboards sidebar
2. Select **Import** and choose your `.json` file
3. **If no collision**: Dashboard imports immediately (unchanged experience)
4. **If collision detected**: A dialog appears with three options:
   - **Replace**: Overwrite the existing dashboard with the imported version
   - **Cancel**: Abort the import, keeping the original dashboard unchanged
   - **Import as New**: Create a copy with a new identifier (both dashboards coexist)

## Behavior

| Scenario | Result |
|----------|--------|
| Import dashboard with unique UUID | Imports immediately |
| Import dashboard with existing UUID | Shows collision dialog |
| Select "Replace" | Existing dashboard overwritten on save |
| Select "Cancel" | No changes made |
| Select "Import as New" | New dashboard created with different UUID |
| Import invalid/malformed JSON | Error notification shown, no draft created |
| Import JSON missing required structure | Error notification shown, no draft created |
