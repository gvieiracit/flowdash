# Form Submit Validation Modes

**Completed:** 25 January 2026
**PR:** [#6](https://github.com/gvieiracit/flowdash/pull/6)
**Commit:** [1dedf946](https://github.com/gvieiracit/flowdash/commit/1dedf9464e0337b9c13e96458289baa106e26058)

---

## What Was Delivered

The Form widget now supports configurable submit button validation modes, allowing users to submit forms with partial data instead of requiring all fields to be filled.

---

## Why It Matters

- **Enables bulk update workflows** - Users can update only specific properties on multiple records without filling every field
- **Flexible form design** - Form creators can choose validation behavior that matches their use case
- **Better UX for optional fields** - Users aren't blocked by fields they don't need to fill

---

## How to Use

### 1. Set Submit Button Mode

1. Add or edit a Form widget
2. Open **Advanced Settings**
3. Find **Submit Button Mode** dropdown
4. Select one of three options:

| Mode | When Submit is Enabled |
|------|------------------------|
| **All fields required** | All form fields must have values (default, original behavior) |
| **At least one field required** | At least one form field has a value |
| **Only required fields** | Only fields marked as "Required" must have values |

### 2. Mark Fields as Required (for "Only required fields" mode)

1. Click the pencil icon to edit a form field
2. Check the **Required field** checkbox
3. Click Save

Fields marked as required will block form submission if empty when using "Only required fields" mode.

---

## Behavior

| Mode | 0 fields filled | 1 field filled | All fields filled |
|------|-----------------|----------------|-------------------|
| All fields required | Disabled | Disabled | Enabled |
| At least one field required | Disabled | Enabled | Enabled |
| Only required fields | Depends on required fields | Depends on required fields | Enabled |

### "Only required fields" Mode Details

| Required Fields | Filled | Submit Button |
|-----------------|--------|---------------|
| None marked | Any | Enabled |
| 2 marked | 0 of 2 | Disabled |
| 2 marked | 1 of 2 | Disabled |
| 2 marked | 2 of 2 | Enabled |

---

## Example: Bulk Update Form

For a form that updates multiple properties on selected nodes, where users typically only want to change one or two properties:

1. Set **Submit Button Mode** to "At least one field required"
2. User fills only the "Migration Status" field
3. Submit button becomes enabled
4. Query uses `FOREACH` with `coalesce()` to only update non-empty values

```cypher
FOREACH (_ IN CASE WHEN coalesce($neodash_status, '') <> '' THEN [1] ELSE [] END |
    SET n.status = $neodash_status)
```
