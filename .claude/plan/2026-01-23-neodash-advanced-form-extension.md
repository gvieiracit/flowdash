# FlowDash Advanced Form Extension

## Technical Planning Document

**Version:** 1.1
**Date:** 23 January 2026
**Author:** CI&T AI Engineering
**Status:** Draft for Review

---

## Executive Summary

The current FlowDash Form widget has fundamental limitations that prevent effective data entry workflows for the MSTR Object migration dashboard. This document evaluates options for addressing these limitations and recommends building a custom "Advanced Form" extension rather than attempting to fix the existing component.

**Note:** FlowDash is CI&T's fork of NeoDash (neo4j-labs/neodash). All development occurs in the `gvieiracit/flowdash` repository.

---

## 1. Problem Statement (Why)

### 1.1 Context

The MSTR Object dependency analysis dashboard in FlowDash requires administrators to update multiple properties on selected graph nodes. These updates include migration status, ownership categorisation, layer availability flags, source/target mappings, and contextual notes.

### 1.2 Current State Issues

#### Issue 1: Field State Not Persisting (Critical Bug)

**Observed Behaviour:** When a user fills in Field A and moves focus to Field B, Field A is cleared (see Images 3→4 in original screenshots).

**Impact:** It is impossible to complete a multi-field form submission. Users cannot fill in more than one field at a time.

**Root Cause (Hypothesised):** The Form component's state management resets all field values when any individual field triggers a change event. This is likely a Redux state mutation issue where the form state object is being replaced rather than merged.

#### Issue 2: All Fields Required by Design

**Observed Behaviour:** Every field within a Form widget must be populated before submission is allowed.

**Impact:** Users must create separate Form widgets for each logically-optional field group, resulting in the fragmented UI shown in Image 1 (8 separate form widgets on one dashboard page).

**Root Cause:** The Form component was designed for simple, atomic operations (e.g., "delete a node by name") rather than complex data entry workflows with conditional requirements.

#### Issue 3: Limited Field Types

**Current Selection Types Available:**
- Node Property
- Relationship Property
- Free Text (single line only)
- Custom Query
- Date Picker

**Missing Field Types Required:**
| Required Type | Use Case | Current Workaround |
|---------------|----------|-------------------|
| Checkbox / Toggle | Yes/No or custom values (e.g., "1"/"0", "Active"/"Inactive") | Dropdown via Custom Query - poor UX |
| Dropdown with Static Options | Migration Status (Complete/Planned/Drop) | Custom Query against lookup data |
| Multi-line Text Area | Notes / Comments field | Free Text - limited to single line |
| Radio Button Group | Mutually exclusive options with custom values (e.g., 1-5 rating) | Not possible |
| Link | URL with display name for reference documentation | Not possible |

#### Issue 4: Single Button Per Form

**Observed Behaviour:** Each Form widget supports exactly one submit button with one associated Cypher query.

**Impact:** Related operations that should be grouped (e.g., "Update Status", "Add Note Only", "Reset to Default") require separate Form widgets.

#### Issue 5: No Conditional Validation Logic

**Required Behaviour:** "If Migration Status = 'Not Planned', then Notes field becomes required."

**Current State:** No mechanism exists to define field requirements based on other field values.

#### Issue 6: Reset Button Only Available Post-Submit

**Observed Behaviour:** The reset button only appears after a form submission completes.

**Impact:** Users cannot clear/reset form values during data entry without submitting first.

### 1.3 Business Impact

| Impact Area | Description | Severity |
|-------------|-------------|----------|
| Data Quality | Incomplete records due to inability to fill all fields | High |
| User Productivity | ~5x more clicks required due to form fragmentation | Medium |
| Dashboard Maintainability | 8 widgets vs 1 widget; 8 queries to maintain | Medium |
| Training Overhead | Non-intuitive workflow requires documentation | Low |

---

## 2. Requirements (What)

### 2.1 Functional Requirements

#### FR-1: Multi-Field Form with Independent Persistence
The form shall maintain field values independently such that updating one field does not affect the values of other fields.

**Acceptance Criteria:**
- [ ] User fills Field A with value "Complete"
- [ ] User moves focus to Field B
- [ ] Field A retains value "Complete"
- [ ] User fills Field B with value "Sales"
- [ ] Both fields retain their values until submission or explicit reset

#### FR-2: Configurable Field Requirement Rules
The form shall support defining whether each field is required, optional, or conditionally required based on another field's value.

**Acceptance Criteria:**
- [ ] Administrator can mark a field as "always required"
- [ ] Administrator can mark a field as "always optional"
- [ ] Administrator can define rule: "required if [FieldX] equals [Value]"
- [ ] Validation prevents submission when required fields are empty
- [ ] Validation errors are displayed inline next to the relevant field

#### FR-3: Extended Field Types
The form shall support the following field types with admin-configurable values:

| Field Type | Configuration Options | Acceptance Criteria |
|------------|----------------------|---------------------|
| Text (single line) | Placeholder, max length | [ ] Renders as NDL `TextInput` component |
| Text Area (multi-line) | Placeholder, rows, max length | [ ] Renders as NDL `Textarea` with configurable height |
| Select (dropdown) | Static options array (value/label pairs), placeholder | [ ] Renders as NDL `Dropdown` with predefined values |
| Checkbox | Admin-defined `checkedValue` and `uncheckedValue` (e.g., "Yes"/"No", "1"/"0", "Active"/"Inactive") | [ ] Single toggle returning configured value to query |
| Toggle Switch | Admin-defined `onValue` and `offValue` | [ ] Visual toggle component returning configured value |
| Radio Button Group | Admin-defined `options` array with value/label pairs (e.g., `[{value: "1", label: "Low"}, {value: "5", label: "High"}]`) | [ ] Radio buttons returning selected value to query |
| Date Picker | Admin-defined `format` (e.g., "YYYY-MM-DD", "DD/MM/YYYY", "MM-DD") and optional `outputFormat` for query | [ ] Calendar picker with configurable display and output formats |
| Link | Two sub-fields: `url` (the link) and `displayName` (shown text); both values passed to query | [ ] Compound field with URL input and display name input |
| Node Property | (existing behaviour) | [ ] Maintain compatibility |
| Relationship Property | (existing behaviour) | [ ] Maintain compatibility |
| Custom Query | (existing behaviour) | [ ] Maintain compatibility |

#### FR-4: Multiple Submit Buttons
The form shall support multiple submit buttons, each with its own label and Cypher query.

**Acceptance Criteria:**
- [ ] Administrator can define 1-N buttons in form configuration
- [ ] Each button has: label, Cypher query, optional validation subset
- [ ] Buttons can be styled as primary/secondary (using NDL button variants)
- [ ] Each button can specify which fields are required for that action
- [ ] Clicking a button executes only its associated query

#### FR-5: Form Reset Capability
The form shall provide a reset mechanism to clear all field values and return to initial state.

**Acceptance Criteria:**
- [ ] Reset button is **always visible** in the form when `showReset: true` (not only after submission)
- [ ] Reset button clears all field values to their default/empty state
- [ ] Reset is available **before and after** submission (allows users to clear during data entry)
- [ ] Reset button position is configurable: `"resetPosition": "left" | "right" | "inline"`
- [ ] Reset button label is configurable via `resetLabel`

#### FR-6: Integration with FlowDash Selection System
The form shall integrate with FlowDash's global parameter system for operating on user-selected graph nodes.

**Acceptance Criteria:**
- [ ] Form queries can reference `$neodash_selected_guid` and other global parameters
- [ ] Form fields can reference other dashboard parameters
- [ ] Form can set dashboard parameters after submission

### 2.2 Non-Functional Requirements

#### NFR-1: Backward Compatibility
The extension shall not modify or break existing Form widget functionality. Existing dashboards using the current Form component shall continue to work unchanged.

#### NFR-2: Configuration via Advanced Settings
All form configuration (fields, buttons, validation rules) shall be definable through the FlowDash Advanced Settings panel without requiring code changes.

#### NFR-3: Performance
Form rendering and state updates shall complete within 100ms for forms with up to 20 fields.

#### NFR-4: Styling Consistency
The form shall match FlowDash's existing visual design language:
- Use Neo4j Design Language (NDL) components: `TextInput`, `Textarea`, `Dropdown`, `Button`
- Follow FlowDash CSS variable system (`--ciandt-primary`, `--ciandt-accent`, etc.)
- Use inline styles for layout (margins: 10-15px standard)
- Use CSS classes for semantic styling

### 2.3 Out of Scope

The following are explicitly excluded from this initiative:

- Multi-step wizard forms
- File upload fields
- Rich text editor fields
- Form templates / reusable field groups
- Undo/redo functionality
- Auto-save / draft persistence
- Field-level permissions

---

## 3. Options Analysis (How)

### 3.1 Option A: Fix Existing Form Component

**Approach:** Submit pull requests to the neo4j-labs/neodash repository to address the identified issues.

#### Implementation Steps
1. Fork neo4j-labs/neodash repository
2. Identify and fix state management bug (field clearing)
3. Add conditional required field logic to form schema
4. Implement new field types (checkbox, textarea, static dropdown)
5. Refactor submit button to support multiple buttons
6. Submit PRs for each change
7. Await review and merge from Neo4j Labs maintainers

#### Pros
| Benefit | Description |
|---------|-------------|
| Community benefit | Fixes benefit all NeoDash users |
| No fork maintenance | Changes merged upstream |
| Official support | Becomes part of supported product |

#### Cons
| Drawback | Description |
|----------|-------------|
| Acceptance uncertainty | PRs may be rejected or require significant rework |
| Timeline dependency | Subject to maintainer availability and release cycle |
| Scope constraints | May need to implement "their way" vs optimal for our use case |
| Breaking change risk | Changes could affect existing Form users |
| Review cycles | Multiple round-trips for feedback |

#### Effort Estimate
- Development: 2-3 weeks
- PR review cycles: 2-6 weeks (unpredictable)
- **Total: 4-9 weeks**

#### Risk Assessment: **HIGH**

The fundamental architecture of the Form component may not support our requirements without significant refactoring that maintainers are unlikely to accept.

---

### 3.2 Option B: Create Custom Extension (Recommended)

**Approach:** Build a new "Advanced Form" report type as a FlowDash extension, leaving the existing Form unchanged.

#### Implementation Steps
1. Set up local FlowDash development environment
2. Create new report type in `src/config/ReportConfig.tsx`
3. Build `NeoAdvancedFormReport` React component
4. Implement field type components (text, textarea, select, checkbox, radio, datepicker, link)
5. Implement form state management with proper isolation
6. Implement validation engine with conditional rules
7. Implement multi-button submission logic
8. Add Advanced Settings schema for configuration
9. Test with MSTR dashboard use case
10. Merge to FlowDash fork via PR to `gvieiracit/flowdash`

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NeoAdvancedFormReport                            │
├─────────────────────────────────────────────────────────────────────┤
│  Props (from FlowDash ChartProps)                                   │
│  ├── settings: FormConfig (from Advanced Settings JSON)            │
│  ├── parameters: Record<string, any> (global dashboard params)     │
│  ├── queryCallback: (query, params, callback) => void              │
│  ├── getGlobalParameter: (name) => value                           │
│  ├── setGlobalParameter: (name, value) => void                     │
│  └── createNotification: (title, message) => void                  │
├─────────────────────────────────────────────────────────────────────┤
│  Internal State (React useState/useReducer)                         │
│  ├── fieldValues: Record<string, any>                              │
│  ├── fieldErrors: Record<string, string>                           │
│  ├── isSubmitting: boolean                                         │
│  └── submitResult: { success: boolean, message: string } | null    │
├─────────────────────────────────────────────────────────────────────┤
│  Components (using NDL + MUI)                                       │
│  ├── FieldRenderer (switch on field.type)                          │
│  │   ├── TextFieldComponent (NDL TextInput)                        │
│  │   ├── TextAreaComponent (NDL Textarea)                          │
│  │   ├── SelectComponent (NDL Dropdown)                            │
│  │   ├── CheckboxComponent (MUI Checkbox)                          │
│  │   ├── ToggleComponent (MUI Switch)                              │
│  │   ├── RadioGroupComponent (MUI RadioGroup)                      │
│  │   ├── DatePickerComponent (MUI DatePicker + dayjs)              │
│  │   ├── LinkFieldComponent (compound: URL + display name)         │
│  │   ├── NodePropertySelector (reuse existing)                     │
│  │   └── RelationshipPropertySelector (reuse existing)             │
│  ├── ValidationEngine                                              │
│  │   ├── validateRequired(field, value)                            │
│  │   ├── validateConditional(field, allValues)                     │
│  │   └── validatePattern(field, value)                             │
│  └── ButtonGroup                                                   │
│      ├── ResetButton (always visible when configured)              │
│      └── SubmitButton[] (map from config)                          │
├─────────────────────────────────────────────────────────────────────┤
│  Cypher Execution                                                   │
│  └── queryCallback(query, params) → Neo4j Driver                   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Configuration Schema (Advanced Settings JSON)

```json
{
  "fields": [
    {
      "name": "migration_status",
      "label": "Migration Status",
      "type": "select",
      "options": [
        { "value": "Complete", "label": "Complete" },
        { "value": "Planned", "label": "Planned" },
        { "value": "Drop", "label": "Drop" },
        { "value": "Not Planned", "label": "Not Planned" }
      ],
      "required": true,
      "defaultValue": null,
      "helperText": "Select the migration status for this object"
    },
    {
      "name": "priority_level",
      "label": "Priority Level",
      "type": "radio",
      "options": [
        { "value": "1", "label": "1 - Low" },
        { "value": "2", "label": "2 - Medium" },
        { "value": "3", "label": "3 - High" },
        { "value": "4", "label": "4 - Critical" },
        { "value": "5", "label": "5 - Urgent" }
      ],
      "required": false,
      "helperText": "Select priority from 1 (lowest) to 5 (highest)"
    },
    {
      "name": "category_group",
      "label": "Category Group",
      "type": "text",
      "placeholder": "e.g., Sales, Finance",
      "required": false
    },
    {
      "name": "sub_category",
      "label": "Sub-category within group",
      "type": "text",
      "required": false
    },
    {
      "name": "responsible_team",
      "label": "Responsible team for migration",
      "type": "text",
      "required": false
    },
    {
      "name": "target_date",
      "label": "Target Completion Date",
      "type": "datepicker",
      "format": "DD/MM/YYYY",
      "outputFormat": "YYYY-MM-DD",
      "placeholder": "Select target date",
      "required": false
    },
    {
      "name": "available_raw",
      "label": "Available in RAW layer?",
      "type": "checkbox",
      "checkedValue": "Yes",
      "uncheckedValue": "No",
      "defaultValue": "No"
    },
    {
      "name": "available_serve",
      "label": "Available in SERVE layer?",
      "type": "checkbox",
      "checkedValue": "1",
      "uncheckedValue": "0",
      "defaultValue": "0"
    },
    {
      "name": "in_pbi_semantic",
      "label": "In Power BI Semantic?",
      "type": "toggle",
      "onValue": "Active",
      "offValue": "Inactive",
      "defaultValue": "Inactive"
    },
    {
      "name": "essential_db",
      "label": "Essential for DB migration?",
      "type": "checkbox",
      "checkedValue": "true",
      "uncheckedValue": "false",
      "defaultValue": "false"
    },
    {
      "name": "essential_pbi",
      "label": "Essential for PBI migration?",
      "type": "checkbox",
      "checkedValue": "true",
      "uncheckedValue": "false",
      "defaultValue": "false"
    },
    {
      "name": "documentation_link",
      "label": "Documentation Reference",
      "type": "link",
      "urlPlaceholder": "https://confluence.example.com/...",
      "namePlaceholder": "e.g., Migration Guide v2",
      "required": false,
      "helperText": "Link to related documentation"
    },
    {
      "name": "notes",
      "label": "Notes",
      "type": "textarea",
      "rows": 4,
      "placeholder": "Additional comments or context",
      "required": false,
      "requiredIf": {
        "field": "migration_status",
        "equals": "Not Planned"
      }
    }
  ],
  "buttons": [
    {
      "label": "Update All",
      "variant": "primary",
      "query": "WITH $neodash_selected_guid AS guid WHERE guid IS NOT NULL MATCH (n:MSTRObject {guid: guid}) SET n.migrationStatus = $migration_status, n.priorityLevel = $priority_level, n.categoryGroup = $category_group, n.subCategory = $sub_category, n.responsibleTeam = $responsible_team, n.targetDate = $target_date, n.availableRaw = $available_raw, n.availableServe = $available_serve, n.inPbiSemantic = $in_pbi_semantic, n.essentialDb = $essential_db, n.essentialPbi = $essential_pbi, n.docUrl = $documentation_link_url, n.docName = $documentation_link_name, n.notes = $notes RETURN n.name AS updated",
      "requiresFields": ["migration_status"]
    },
    {
      "label": "Update Status Only",
      "variant": "secondary",
      "query": "WITH $neodash_selected_guid AS guid WHERE guid IS NOT NULL MATCH (n:MSTRObject {guid: guid}) SET n.migrationStatus = $migration_status RETURN n.name AS updated",
      "requiresFields": ["migration_status"]
    },
    {
      "label": "Add Note",
      "variant": "secondary",
      "query": "WITH $neodash_selected_guid AS guid WHERE guid IS NOT NULL MATCH (n:MSTRObject {guid: guid}) SET n.notes = $notes RETURN n.name AS updated",
      "requiresFields": ["notes"]
    }
  ],
  "showReset": true,
  "resetLabel": "Clear Form",
  "resetPosition": "left",
  "successMessage": "Object updated successfully",
  "clearAfterSubmit": false
}
```

#### Field Type Details

##### Checkbox Field
Admin configures the exact values returned when checked/unchecked:
```json
{
  "type": "checkbox",
  "checkedValue": "Yes",      // Value passed to query when checked
  "uncheckedValue": "No"      // Value passed to query when unchecked
}
```
Other examples: `"1"/"0"`, `"true"/"false"`, `"Active"/"Inactive"`

##### Radio Button Group Field
Admin configures the full list of options with their values:
```json
{
  "type": "radio",
  "options": [
    { "value": "1", "label": "1 - Very Low" },
    { "value": "2", "label": "2 - Low" },
    { "value": "3", "label": "3 - Medium" },
    { "value": "4", "label": "4 - High" },
    { "value": "5", "label": "5 - Very High" }
  ]
}
```
The `value` is what gets passed to the Cypher query; the `label` is displayed to users.

##### Date Picker Field
Admin configures display format and optional output format:
```json
{
  "type": "datepicker",
  "format": "DD/MM/YYYY",        // Display format shown to user
  "outputFormat": "YYYY-MM-DD"   // Format sent to query (optional, defaults to format)
}
```
Supported format patterns (via dayjs):
| Pattern | Example |
|---------|---------|
| `YYYY-MM-DD` | 2026-01-23 |
| `DD/MM/YYYY` | 23/01/2026 |
| `MM-DD-YYYY` | 01-23-2026 |
| `DD-MM-YY` | 23-01-26 |
| `MM-DD` | 01-23 |
| `YYYY/MM/DD` | 2026/01/23 |

##### Link Field
A compound field that captures both URL and display name:
```json
{
  "type": "link",
  "urlPlaceholder": "https://...",
  "namePlaceholder": "Link display name",
  "required": false
}
```
This creates two parameters for the query:
- `$fieldname_url` - The URL value
- `$fieldname_name` - The display name value

Example in Cypher: `SET n.docUrl = $documentation_link_url, n.docName = $documentation_link_name`

#### Pros
| Benefit | Description |
|---------|-------------|
| Full control | Implement exactly what we need |
| Isolated risk | No impact on existing Form users |
| Faster delivery | No PR review dependencies |
| Reusable | Can be used across other FlowDash dashboards |
| Maintainable | Clear ownership and modification path |

#### Cons
| Drawback | Description |
|----------|-------------|
| Fork overhead | Must maintain in FlowDash fork |
| Upgrade path | Need to verify compatibility when merging upstream changes |
| No community benefit | Changes stay in FlowDash fork (unless contributed back) |

#### Effort Estimate
- Environment setup: 1 day
- Core component structure: 3 days
- Field type implementations: 6 days (including new types: radio, link, datepicker formats)
- Validation engine: 2 days
- Multi-button logic: 2 days
- Reset button (always visible): 1 day
- Integration testing: 3 days
- Documentation: 1 day
- **Total: 3-4 weeks**

#### Risk Assessment: **LOW**

Isolated development with no external dependencies. Clear path to production via PR to `gvieiracit/flowdash`.

---

### 3.3 Recommendation

**Recommended Option: B - Create Custom Extension in FlowDash**

| Criterion | Option A (Upstream PR) | Option B (FlowDash Extension) |
|-----------|------------------------|-------------------------------|
| Time to Production | 4-9 weeks | 3-4 weeks |
| Risk Level | High | Low |
| Maintenance Burden | Low | Medium |
| Feature Completeness | Constrained | Full |
| Control | Limited | Full |

Option B provides the best balance of delivery speed, risk mitigation, and feature completeness. Development occurs entirely within the FlowDash fork with full control over implementation.

---

## 4. Acceptance Criteria Summary

### 4.1 Minimum Viable Product (MVP)

The following must be complete for initial deployment:

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-1 | Form fields retain values when focus changes between fields | P0 |
| AC-2 | Text area field type available for multi-line input | P0 |
| AC-3 | Select dropdown with static options configurable | P0 |
| AC-4 | Checkbox field type with admin-configurable checked/unchecked values | P0 |
| AC-5 | Radio button group with admin-configurable options and values | P0 |
| AC-6 | Date picker with configurable display and output formats | P0 |
| AC-7 | Link field type capturing URL and display name | P0 |
| AC-8 | Multiple submit buttons with independent queries | P0 |
| AC-9 | Conditional required field validation | P0 |
| AC-10 | Form integrates with FlowDash global parameters | P0 |
| AC-11 | Form displays validation errors inline | P1 |
| AC-12 | Reset button always visible when configured (not only post-submit) | P1 |
| AC-13 | Success/error message displayed after submission | P1 |

### 4.2 Definition of Done

- [ ] All P0 acceptance criteria pass manual testing
- [ ] Component renders correctly in FlowDash dashboard
- [ ] Uses NDL components and FlowDash styling conventions
- [ ] Configuration schema documented
- [ ] Example configuration provided for MSTR use case
- [ ] No console errors during normal operation
- [ ] Tested in Chrome, Firefox, Edge
- [ ] Code reviewed by peer
- [ ] PR merged to `gvieiracit/flowdash`

### 4.3 Test Scenarios

#### Scenario 1: Basic Multi-Field Entry
1. Select an MSTR object in the graph
2. Open Advanced Form widget
3. Set Migration Status = "Complete"
4. Set Category Group = "Sales"
5. Set Sub-category = "Revenue"
6. Click "Update All"
7. **Expected:** All three values persisted to Neo4j node

#### Scenario 2: Conditional Validation
1. Select an MSTR object
2. Set Migration Status = "Not Planned"
3. Leave Notes field empty
4. Click "Update All"
5. **Expected:** Validation error on Notes field: "Required when status is Not Planned"
6. Fill in Notes field
7. Click "Update All"
8. **Expected:** Submission succeeds

#### Scenario 3: Selective Button Submission
1. Fill in Migration Status and Notes
2. Click "Add Note" button
3. **Expected:** Only Notes field value sent to Neo4j (per button's query)

#### Scenario 4: Form Reset (Always Available)
1. Fill in multiple fields (before any submission)
2. Click "Clear Form" reset button
3. **Expected:** All fields return to empty/default state
4. Fill in fields again and submit
5. Click "Clear Form" again
6. **Expected:** All fields cleared, ready for new entry

#### Scenario 5: Checkbox with Custom Values
1. Configure checkbox with `checkedValue: "1"`, `uncheckedValue: "0"`
2. Check the checkbox
3. Submit form
4. **Expected:** Query receives value "1" for that parameter

#### Scenario 6: Radio Button Selection
1. Configure radio with options: `[{value: "1", label: "Low"}, {value: "3", label: "High"}]`
2. Select "High" option
3. Submit form
4. **Expected:** Query receives value "3" for that parameter

#### Scenario 7: Date Format Configuration
1. Configure date picker with `format: "DD/MM/YYYY"`, `outputFormat: "YYYY-MM-DD"`
2. Select date showing as "23/01/2026"
3. Submit form
4. **Expected:** Query receives "2026-01-23"

#### Scenario 8: Link Field
1. Configure link field named "documentation_link"
2. Enter URL: "https://example.com/doc"
3. Enter display name: "Migration Guide"
4. Submit form
5. **Expected:** Query receives `$documentation_link_url = "https://example.com/doc"` and `$documentation_link_name = "Migration Guide"`

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- Set up FlowDash development environment (`yarn install && yarn dev`)
- Create extension scaffolding in `src/extensions/advanced-forms/`
- Implement basic form container with React state management
- Implement text and textarea field types using NDL components
- Implement always-visible reset button

### Phase 2: Field Types (Week 2)
- Implement select dropdown component (NDL Dropdown)
- Implement checkbox component with configurable values
- Implement toggle switch component with configurable values
- Implement radio button group with configurable options
- Implement date picker with format configuration (dayjs)
- Implement link field (compound URL + name)
- Wire up Node Property selector (reuse existing)

### Phase 3: Validation & Submission (Week 3)
- Implement validation engine
- Implement conditional required logic (`requiredIf`)
- Implement multi-button rendering
- Implement query execution per button
- Integrate with FlowDash global parameters

### Phase 4: Polish & Integration (Week 4)
- Error display and messaging (use `createNotification`)
- Reset functionality refinement
- Configuration schema finalisation
- Integration testing with MSTR dashboard
- Documentation
- PR to `gvieiracit/flowdash`

---

## 6. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should we contribute the extension back to neo4j-labs as optional add-on? | Tech Lead | Open |
| 2 | Should existing Form bug be reported to neo4j-labs regardless of our approach? | Developer | Open |
| 3 | Are there other FlowDash dashboards that would benefit from this extension? | Product | Open |
| 4 | Should the Link field support validation (URL format)? | Developer | Open |

---

## 7. Appendix

### A. Current FlowDash Form Limitations (Screenshots Reference)

| Image | Description |
|-------|-------------|
| Image 1 | Dashboard showing 8 separate Form widgets due to inability to combine fields |
| Image 2 | Form Submission Query configuration showing current Cypher approach |
| Image 3 | Migration Status field filled with "Complete" |
| Image 4 | Same form after moving to next field - Migration Status cleared (bug) |
| Image 5 | Field Selection Type options showing limited choices |
| Image 6 | Notes widget showing single-line text limitation |

### B. Related Documentation

- FlowDash Repository: https://github.com/gvieiracit/flowdash
- NeoDash User Guide: https://neo4j.com/labs/neodash/2.4/user-guide/reports/form
- NeoDash Developer Guide: https://neo4j.com/labs/neodash/2.4/developer-guide/adding-visualizations
- Neo4j Design Language (NDL): https://www.neo4j.design/

### C. FlowDash Technical Stack Reference

| Technology | Usage |
|------------|-------|
| React 17 + TypeScript | Core framework |
| Redux + redux-persist | State management |
| @neo4j-ndl/react 1.10.8 | UI components (TextInput, Textarea, Dropdown, Button) |
| @mui/material 5.x | Additional UI components (Checkbox, Switch, Radio) |
| @mui/x-date-pickers | Date picker component |
| dayjs | Date formatting and manipulation |
| @dnd-kit | Drag-and-drop for field ordering |
| lodash.debounce | Input debouncing (250-1000ms) |

### D. Glossary

| Term | Definition |
|------|------------|
| MSTR | MicroStrategy - BI platform being migrated |
| ADE | Analytics Data Environment |
| EDW | Enterprise Data Warehouse |
| PBI | Power BI |
| FlowDash | CI&T fork of NeoDash |
| NeoDash | Neo4j Labs dashboard builder (upstream) |
| NDL | Neo4j Design Language - UI component library |

---

**Document Approval**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | | | |
| Technical Reviewer | | | |
| Product Owner | | | |
