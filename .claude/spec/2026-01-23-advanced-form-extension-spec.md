# FlowDash Advanced Form Extension - Technical Specification

## Document Information

**Related Plan:** `.claude/plan/2026-01-23-neodash-advanced-form-extension.md`
**Implementation Option:** Option B (3.2) - Create Custom Extension in FlowDash with Visual Builder UI
**Date:** 23 January 2026
**Status:** REVISED - Pending Approval
**Revision:** 2.0 (Visual Builder UI)

---

## Overview

This specification details the implementation of a new "Advanced Form" report type as a FlowDash extension with a **Visual Builder UI** for configuring fields and buttons (no JSON editing required).

### Key Design Decisions

1. **Visual Builder UI** - Users configure fields/buttons through a visual interface, not JSON
2. **$neodash_ prefix** - All field parameter names follow the convention `$neodash_fieldname`
3. **Settings stored as arrays** - `advancedFormFields` and `advancedFormButtons` in report settings
4. **Delegate to existing components** - Reuse `ParameterSelectCardSettings` for node-property, relationship-property, and custom-query types

---

## 1. Architecture Overview

### 1.1 Settings Flow

```
User clicks "Edit Field"
    → NeoAdvancedFormFieldModal opens
    → User configures field (type, name, label, etc.)
    → Save updates settings.advancedFormFields array
    → NeoAdvancedForm reads from settings.advancedFormFields
    → Form renders with configured fields
```

### 1.2 Data Structure

**Settings stored in report:**
```typescript
settings: {
  advancedFormFields: [
    { type: 'text', name: 'customer_name', label: 'Customer Name', ... },
    { type: 'checkbox', name: 'agree', label: 'I Agree', checkedValue: 'Yes', uncheckedValue: 'No' },
  ],
  advancedFormButtons: [
    { label: 'Submit', variant: 'primary', query: 'RETURN $neodash_customer_name', requiresFields: [] },
  ],
  showReset: true,
  resetLabel: 'Clear Form',
  resetPosition: 'left',
  successMessage: 'Form submitted successfully.',
  clearAfterSubmit: false,
}
```

---

## 2. Files to Create

### 2.1 Extension Directory Structure

```
src/extensions/advanced-forms/
├── AdvancedFormsReportConfig.tsx       # Report type configuration
├── AdvancedFormsExampleConfig.tsx      # Example configurations
├── index.ts                            # Extension barrel export
├── chart/
│   └── NeoAdvancedForm.tsx             # Main form component
├── components/
│   ├── fields/
│   │   ├── TextField.tsx
│   │   ├── TextAreaField.tsx
│   │   ├── SelectField.tsx
│   │   ├── CheckboxField.tsx
│   │   ├── ToggleField.tsx
│   │   ├── RadioGroupField.tsx
│   │   ├── DatePickerField.tsx
│   │   ├── LinkField.tsx
│   │   └── index.ts
│   ├── FieldRenderer.tsx
│   └── ButtonGroup.tsx
├── settings/                           # NEW: Visual Builder UI
│   ├── NeoAdvancedFormCardSettings.tsx # Main settings component
│   ├── NeoAdvancedFormFieldModal.tsx   # Field editing modal
│   ├── NeoAdvancedFormButtonModal.tsx  # Button editing modal
│   ├── AdvancedFieldTypeSettings.tsx   # Settings UI for custom field types
│   └── list/
│       ├── SortableList.tsx            # Drag-and-drop list
│       ├── SortableItem.tsx            # Sortable item wrapper
│       └── SortableOverlay.tsx         # Drag overlay
└── utils/
    ├── validation.ts
    └── types.ts
```

---

## 3. Critical Implementation Details

### 3.1 IMPORTANT: SortableList State Management

**Problem encountered:** Delete operations caused page crashes due to stale array references.

**Root cause:** Using `fields[index]` inside `renderItem` callback accesses the original array which becomes stale after deletion.

**CORRECT implementation:**

```typescript
// NeoAdvancedFormCardSettings.tsx

// WRONG - causes crash:
renderItem={(item, index) => (
  <Banner description={getFieldDisplayName(fields[index])} /> // ❌ Stale reference
  <IconButton onClick={() => {
    updateFields([...fields.slice(0, index), ...fields.slice(index + 1)]); // ❌
  }} />
)}

// CORRECT - use item directly:
renderItem={(item, index) => (
  <Banner description={getFieldDisplayName(item)} /> // ✅ Use item from callback
  <IconButton onClick={(e) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ Prevent event bubbling
    const newFields = fields.filter((_, i) => i !== index); // ✅ Filter approach
    updateFields(newFields);
  }} />
)}
```

**Key rules:**
1. Always use the `item` parameter from `renderItem`, never `fields[index]`
2. Always call `e.preventDefault()` and `e.stopPropagation()` on click handlers
3. Use `filter()` instead of `slice()` for deletions
4. Use `item.id` for keys, not `index + 1`

---

### 3.2 IMPORTANT: Field Name Convention

**All field parameters MUST use the `$neodash_` prefix.**

| User enters | Parameter name | Query usage |
|-------------|----------------|-------------|
| `customer_name` | `neodash_customer_name` | `$neodash_customer_name` |
| `agree_terms` | `neodash_agree_terms` | `$neodash_agree_terms` |

**Implementation in `validation.ts`:**

```typescript
export function getQueryParameters(fields, values) {
  const params = {};
  fields.forEach((field) => {
    const paramName = `neodash_${field.name}`; // ✅ Add prefix
    if (field.type === 'link') {
      params[`${paramName}_url`] = value.url || '';
      params[`${paramName}_name`] = value.name || '';
    } else {
      params[paramName] = values[field.name] ?? '';
    }
  });
  return params;
}
```

**Display in settings UI:**
```typescript
// AdvancedFieldTypeSettings.tsx
const parameterName = fieldConfig.name ? `neodash_${fieldConfig.name}` : '';

// Show helper text:
{parameterName && (
  <p style={{ fontSize: 12, color: 'grey' }}>
    Use <b>${parameterName}</b> in a query to use the parameter.
  </p>
)}
```

---

### 3.3 IMPORTANT: DatePicker Safety

**Problem encountered:** `TypeError: x is not a function` when using DatePicker.

**Solution:** Add safety checks for all handlers and date parsing:

```typescript
// DatePickerField.tsx
export const DatePickerField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  // Safe date parsing
  let dateValue: Dayjs | null = null;
  if (value && typeof value === 'string') {
    try {
      const parsed = dayjs(value, outputFormat);
      if (parsed.isValid()) {
        dateValue = parsed;
      }
    } catch {
      // Invalid date, keep null
    }
  }

  // Safe onChange
  const handleChange = (newDate: Dayjs | null) => {
    if (newDate && newDate.isValid()) {
      try {
        onChange(newDate.format(outputFormat));
      } catch {
        onChange('');
      }
    } else {
      onChange('');
    }
  };

  // Safe onBlur - CRITICAL
  const handleBlur = () => {
    if (onBlur && typeof onBlur === 'function') {
      onBlur();
    }
  };

  return (
    <DatePicker
      slotProps={{
        textField: {
          onBlur: handleBlur, // ✅ Use safe handler
        },
      }}
    />
  );
};
```

---

## 4. Settings Components Specification

### 4.1 `NeoAdvancedFormCardSettings.tsx`

**Purpose:** Main settings UI with sortable lists for fields and buttons.

**Props:**
```typescript
interface Props {
  query: string;
  database: string;
  settings: {
    advancedFormFields?: FieldConfig[];
    advancedFormButtons?: ButtonConfig[];
    showReset?: boolean;
    resetLabel?: string;
    resetPosition?: 'left' | 'right' | 'inline';
    successMessage?: string;
    clearAfterSubmit?: boolean;
  };
  extensions: any;
  onReportSettingUpdate: (key: string, value: any) => void;
  onQueryUpdate: (query: string) => void;
}
```

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Fields:                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⋮⋮ $neodash_customer_name (Text)             [✏️] [✕]  │ │
│ │ ⋮⋮ $neodash_agree_terms (Checkbox)           [✏️] [✕]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                          [+]                                 │
├─────────────────────────────────────────────────────────────┤
│ Buttons:                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⋮⋮ Submit (primary)                          [✏️] [✕]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                          [+]                                 │
├─────────────────────────────────────────────────────────────┤
│ Reset Button Settings:                                       │
│ ☑ Show Reset Button                                         │
│ Label: [Clear Form        ]                                  │
│ Position: [left ▼]                                          │
├─────────────────────────────────────────────────────────────┤
│ Form Behavior:                                               │
│ Success Message: [Form submitted successfully.             ] │
│ ☐ Clear form after successful submission                    │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 `NeoAdvancedFormFieldModal.tsx`

**Purpose:** Modal for editing field configuration.

**Field Type Dropdown Options:**
| Value | Label | Settings Component |
|-------|-------|-------------------|
| `text` | Text Input | AdvancedFieldTypeSettings |
| `textarea` | Text Area | AdvancedFieldTypeSettings |
| `select` | Dropdown (Static Options) | AdvancedFieldTypeSettings |
| `checkbox` | Checkbox | AdvancedFieldTypeSettings |
| `toggle` | Toggle Switch | AdvancedFieldTypeSettings |
| `radio` | Radio Group | AdvancedFieldTypeSettings |
| `datepicker` | Date Picker | AdvancedFieldTypeSettings |
| `link` | Link (URL + Name) | AdvancedFieldTypeSettings |
| `node-property` | Node Property (Dynamic) | ParameterSelectCardSettings |
| `relationship-property` | Relationship Property (Dynamic) | ParameterSelectCardSettings |
| `custom-query` | Custom Query (Dynamic) | ParameterSelectCardSettings |

**Delegation Logic:**
```typescript
{isParameterType ? (
  <ParameterSelectCardSettings
    query={localField.query}
    database={database}
    settings={localField.settings}
    extensions={extensions}
    onReportSettingUpdate={handleParameterSettingUpdate}
    onQueryUpdate={handleQueryUpdate}
  />
) : (
  <AdvancedFieldTypeSettings
    fieldType={currentType}
    fieldConfig={localField}
    onUpdate={handleCustomFieldUpdate}
  />
)}
```

---

### 4.3 `AdvancedFieldTypeSettings.tsx`

**Purpose:** Settings UI for custom field types (text, textarea, checkbox, etc.).

**Common Fields (all types):**
- Field Name (with `$neodash_` prefix display)
- Label
- Helper Text
- Required checkbox

**Type-specific Fields:**

| Type | Additional Fields |
|------|------------------|
| text | Placeholder, Max Length |
| textarea | Placeholder, Rows, Max Length |
| checkbox | Checked Value, Unchecked Value |
| toggle | On Value, Off Value |
| radio | Options (value/label pairs) |
| select | Placeholder, Options (value/label pairs) |
| datepicker | Display Format, Output Format, Placeholder |
| link | URL Placeholder, Name Placeholder |

---

### 4.4 `NeoAdvancedFormButtonModal.tsx`

**Purpose:** Modal for editing button configuration.

**Fields:**
- Button Label (text)
- Button Variant (dropdown: primary/secondary)
- Cypher Query (code editor)
- Required Fields (multi-select checkboxes showing field names)

---

## 5. Report Config Changes

### 5.1 `AdvancedFormsReportConfig.tsx`

```typescript
import NeoAdvancedFormCardSettings from './settings/NeoAdvancedFormCardSettings';

export const ADVANCED_FORMS = {
  'advanced-form': {
    label: 'Advanced Form',
    component: NeoAdvancedForm,
    settingsComponent: NeoAdvancedFormCardSettings, // ✅ Visual builder
    textOnly: true,
    settings: {
      advancedFormFields: {
        label: 'Form Fields',
        type: SELECTION_TYPES.LIST,
        default: DEFAULT_FIELDS,
      },
      advancedFormButtons: {
        label: 'Form Buttons',
        type: SELECTION_TYPES.LIST,
        default: DEFAULT_BUTTONS,
      },
      showReset: { ... },
      resetLabel: { ... },
      resetPosition: { ... },
      successMessage: { ... },
      clearAfterSubmit: { ... },
      // ... other settings
    },
  },
};
```

---

## 6. Implementation Order

| Phase | Files | Description |
|-------|-------|-------------|
| 1 | `utils/types.ts`, `utils/validation.ts` | Type definitions and validation (include $neodash_ prefix) |
| 2 | `components/fields/*.tsx` | All field components (with safety checks) |
| 3 | `components/FieldRenderer.tsx`, `components/ButtonGroup.tsx` | Field renderer and buttons |
| 4 | `settings/list/*.tsx` | SortableList components (careful state management) |
| 5 | `settings/AdvancedFieldTypeSettings.tsx` | Field type settings UI |
| 6 | `settings/NeoAdvancedFormFieldModal.tsx` | Field editing modal |
| 7 | `settings/NeoAdvancedFormButtonModal.tsx` | Button editing modal |
| 8 | `settings/NeoAdvancedFormCardSettings.tsx` | Main settings component |
| 9 | `chart/NeoAdvancedForm.tsx` | Main form (read from new settings structure) |
| 10 | `AdvancedFormsReportConfig.tsx` | Register with settingsComponent |
| 11 | `ExtensionConfig.tsx`, `ExtensionUtils.ts` | Register extension |

---

## 7. Testing Checklist

### Visual Builder Tests
- [ ] Add field via + button opens modal
- [ ] Edit field via pencil icon opens modal with existing values
- [ ] Delete field via X removes field WITHOUT page crash
- [ ] Drag and drop reorders fields
- [ ] Field name shows `$neodash_` prefix in list
- [ ] Helper text shows parameter usage in modal
- [ ] Save field updates the list immediately

### Form Rendering Tests
- [ ] Form renders all configured fields
- [ ] DatePicker works without errors
- [ ] Checkbox uses configured checked/unchecked values
- [ ] Submit button executes query with `$neodash_` prefixed parameters
- [ ] Reset button clears form

### Edge Cases
- [ ] Empty field list doesn't crash
- [ ] Empty button list doesn't crash
- [ ] Rapidly clicking delete doesn't crash
- [ ] Switching field types preserves common properties

---

## 8. Reference: Existing Code

The `feature/advanced-forms-extension` branch contains the implementation attempt with bugs. Key files for reference:

| File | Purpose | Issues to Fix |
|------|---------|--------------|
| `settings/NeoAdvancedFormCardSettings.tsx` | Main settings | Fix renderItem to use `item` not `fields[index]` |
| `settings/NeoAdvancedFormFieldModal.tsx` | Field modal | Review state management |
| `components/fields/DatePickerField.tsx` | Date picker | Add safety checks for onBlur |
| `utils/validation.ts` | Query params | Already has $neodash_ prefix |

---

## 9. Approval

This revised specification requires approval before re-implementation begins.

| Role | Name | Date | Approved |
|------|------|------|----------|
| Developer | | | [ ] |
| Technical Reviewer | | | [ ] |
| Product Owner | | | [ ] |
