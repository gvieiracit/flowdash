# Form Widget UI Improvements - Technical Specification

## Files to Modify

### 1. `src/chart/parameter/ParameterSelectCardSettings.tsx`

**What**: Add a "Field Width" dropdown setting for form fields

**Where**: After line 222, following the "Selection Type" dropdown

**Changes**:
```tsx
// Add after the Selection Type Dropdown (line 222)
<Dropdown
  id='fieldSize'
  selectProps={{
    onChange: (newValue) => newValue && onReportSettingUpdate('fieldSize', newValue.value),
    options: [
      { label: 'Full Width', value: 'full' },
      { label: 'Half Width', value: 'half' },
      { label: 'Third Width', value: 'third' },
    ],
    value: {
      label: settings.fieldSize === 'half' ? 'Half Width' : settings.fieldSize === 'third' ? 'Third Width' : 'Full Width',
      value: settings.fieldSize || 'full'
    },
    menuPlacement: 'bottom',
    menuPortalTarget: document.querySelector('#overlay'),
  }}
  label='Field Width'
  type='select'
  fluid
  style={{ marginTop: '10px' }}
/>
```

**Why**: Allows users to configure how much horizontal space each field occupies, enabling Yes/No dropdowns to share rows

---

### 2. `src/extensions/forms/chart/NeoForm.tsx`

**What**: Replace the form layout with CSS Grid + Flexbox for better field arrangement and pinned submit button

**Where**: Lines 96-171 (the `FormStatus.DATA_ENTRY` return block)

**Changes**:

1. Add helper function before the component (around line 26):
```tsx
const getGridColumn = (fieldSize?: string): string => {
  switch (fieldSize) {
    case 'half': return 'span 3';
    case 'third': return 'span 2';
    default: return 'span 6';
  }
};
```

2. Replace lines 96-171 with:
```tsx
if (status == FormStatus.DATA_ENTRY) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '8px 0'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        flex: 1,
        alignContent: 'start',
        padding: '0 8px'
      }}>
        {settings?.formFields?.map((field, index) => (
          <div key={index} style={{ gridColumn: getGridColumn(field.settings?.fieldSize) }}>
            <NeoParameterSelectionChart
              records={[{ input: field.query }]}
              settings={field.settings}
              parameters={props.parameters}
              queryCallback={props.queryCallback}
              updateReportSetting={(key, value) => {
                if (key == 'typing' && value == true) {
                  setSubmitButtonActive(false);
                }
                if (key == 'typing' && value == undefined) {
                  setSubmitButtonActive(true);
                }
              }}
              setGlobalParameter={props.setGlobalParameter}
              getGlobalParameter={props.getGlobalParameter}
            />
          </div>
        ))}
      </div>
      {hasSubmitButton ? (
        <div style={{ marginTop: 'auto', paddingTop: '16px', paddingLeft: '8px' }}>
          <Button
            id='form-submit'
            disabled={!submitButtonActive || isSubmitDisabled(props.query)}
            onClick={() => {
              if (!props.query || !props.query.trim()) {
                props.createNotification(
                  'No query specified',
                  'There is no query defined to run on submission. Specify one in the report settings.'
                );
                return;
              }
              setStatus(FormStatus.RUNNING);
              debouncedRunCypherQuery(props.query, props.parameters, (records) => {
                setFormResults(records);
                if (records && records[0] && records[0].error) {
                  setStatus(FormStatus.ERROR);
                } else {
                  forceRefreshDependentReports();
                  if (clearParametersAfterSubmit) {
                    const formFields = props?.settings?.formFields;
                    if (formFields) {
                      const entries = formFields.map((f) => f.settings);
                      entries.forEach((entry) => {
                        if (entry.disabled !== true) {
                          if (entry.multiSelector) {
                            props.setGlobalParameter && props.setGlobalParameter(entry.parameterName, []);
                          } else {
                            props.setGlobalParameter && props.setGlobalParameter(entry.parameterName, '');
                          }
                        }
                      });
                    }
                  }
                  if (hasSubmitMessage) {
                    setStatus(FormStatus.SUBMITTED);
                  } else {
                    setStatus(FormStatus.DATA_ENTRY);
                  }
                }
              });
            }}
          >
            {buttonText}
            <PlayIconSolid className='btn-icon-base-r' />
          </Button>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
```

**Why**:
- CSS Grid with 6 columns allows flexible field sizing (full=6, half=3, third=2)
- Flexbox column layout pins submit button to bottom via `marginTop: auto`
- Consistent 12px gap replaces inconsistent per-field margins
- `alignContent: start` keeps fields at top when form has few fields

---

### 3. `src/chart/parameter/component/NodePropertyParameterSelect.tsx`

**What**: Simplify field styling to work with parent grid layout

**Where**: Lines 185-190 (Autocomplete style prop)

**Changes**:
```tsx
// Change from:
style={{
  maxWidth: 'calc(100% - 40px)',
  minWidth: `calc(100% - ${manualParameterSave ? '60' : '30'}px)`,
  marginLeft: '15px',
  marginTop: '5px',
}}

// To:
style={{
  width: manualParameterSave ? 'calc(100% - 40px)' : '100%',
}}
```

**Why**: Grid handles spacing; field fills its cell. Keep width adjustment only for manual save button.

---

### 4. `src/chart/parameter/component/FreeTextParameterSelect.tsx`

**What**: Simplify field styling to work with parent grid layout

**Where**:
- Line 59 (wrapper div style)
- Lines 68-73 (NeoField style prop)

**Changes**:

Line 59:
```tsx
// Change from:
<div className={'n-flex n-flex-row n-flex-wrap n-items-center'} style={{ width: '100%', marginTop: '5px' }}>

// To:
<div className={'n-flex n-flex-row n-flex-wrap n-items-center'} style={{ width: '100%' }}>
```

Lines 68-73:
```tsx
// Change from:
style={{
  marginBottom: '20px',
  marginRight: '10px',
  marginLeft: '15px',
  minWidth: `calc(100% - ${manualParameterSave ? '80' : '30'}px)`,
  maxWidth: 'calc(100% - 30px)',
}}

// To:
style={{
  width: manualParameterSave ? 'calc(100% - 40px)' : '100%',
}}
```

**Why**: Grid handles all spacing. Field fills its cell width, adjusted only for manual save button.

---

## Summary Table

| File | Location | Change Type |
|------|----------|-------------|
| `ParameterSelectCardSettings.tsx` | After line 222 | Add Field Width dropdown |
| `NeoForm.tsx` | Lines 96-171 | Replace with grid+flex layout |
| `NeoForm.tsx` | Before line 26 | Add `getGridColumn` helper |
| `NodePropertyParameterSelect.tsx` | Lines 185-190 | Simplify style |
| `FreeTextParameterSelect.tsx` | Line 59, 68-73 | Remove margins, simplify style |

## Testing Checklist

- [ ] Form with single full-width field displays correctly
- [ ] Two half-width fields appear on the same row
- [ ] Three third-width fields appear on the same row
- [ ] Mixed field widths arrange correctly
- [ ] Submit button stays at bottom with few fields
- [ ] Submit button stays at bottom with many fields (scrolling)
- [ ] Field Width setting persists when form is saved
- [ ] Free text fields render correctly in grid
- [ ] Dropdown fields render correctly in grid
- [ ] Manual parameter save button still works
- [ ] Form submission still works
