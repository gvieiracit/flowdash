/**
 * NeoAdvancedFormFieldModal
 *
 * Modal for editing field configuration in the Advanced Form.
 * Supports two modes:
 * 1. For parameter-based fields (Node Property, Relationship Property, Custom Query, Free Text, Date Picker):
 *    Delegates to ParameterSelectCardSettings
 * 2. For custom field types (Text, Textarea, Checkbox, Toggle, Radio, Select, Link):
 *    Uses AdvancedFieldTypeSettings
 */

import React, { useState, useEffect } from 'react';
import { Button, Dialog, Dropdown } from '@neo4j-ndl/react';
import ParameterSelectCardSettings from '../../../chart/parameter/ParameterSelectCardSettings';
import AdvancedFieldTypeSettings from './AdvancedFieldTypeSettings';
import NeoCardSettingsFooter from '../../../card/settings/CardSettingsFooter';
import { FieldConfig, AdvancedFieldType } from '../utils/types';

// Field types that use ParameterSelectCardSettings
const PARAMETER_TYPES = ['node-property', 'relationship-property', 'custom-query'];
const FREE_TEXT_TYPES = ['free-text', 'date-picker-param'];

// Field types that use AdvancedFieldTypeSettings
const CUSTOM_TYPES = ['text', 'textarea', 'checkbox', 'toggle', 'radio', 'select', 'datepicker', 'link'];

// All available field types for dropdown
const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown (Static Options)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'toggle', label: 'Toggle Switch' },
  { value: 'radio', label: 'Radio Group' },
  { value: 'datepicker', label: 'Date Picker' },
  { value: 'link', label: 'Link (URL + Name)' },
  { value: 'node-property', label: 'Node Property (Dynamic)' },
  { value: 'relationship-property', label: 'Relationship Property (Dynamic)' },
  { value: 'custom-query', label: 'Custom Query (Dynamic)' },
];

// Map AdvancedFieldType to ParameterSelectCardSettings type
const TYPE_TO_PARAM_TYPE: Record<string, string> = {
  'node-property': 'Node Property',
  'relationship-property': 'Relationship Property',
  'custom-query': 'Custom Query',
};

interface NeoAdvancedFormFieldModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  index: number;
  fields: FieldConfig[];
  setFields: (fields: FieldConfig[]) => void;
  database: string;
  extensions: any;
}

const NeoAdvancedFormFieldModal: React.FC<NeoAdvancedFormFieldModalProps> = ({
  open,
  setOpen,
  index,
  fields,
  setFields,
  database,
  extensions,
}) => {
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  // Local state for the field being edited
  const [localField, setLocalField] = useState<Partial<FieldConfig> & { settings?: any; query?: string }>({});

  // Initialize local state when modal opens or index changes
  useEffect(() => {
    if (open && fields[index]) {
      const field = fields[index];
      // Convert from stored format to editing format
      setLocalField({
        ...field,
        settings: {
          parameterName: field.name,
          entityType: (field as any).entityType,
          propertyType: (field as any).propertyType,
          type: TYPE_TO_PARAM_TYPE[field.type] || field.type,
          ...(field as any).settings,
        },
        query: (field as any).query || '',
      });
    } else if (open && index === fields.length) {
      // New field
      setLocalField({
        type: 'text',
        name: '',
        label: '',
        settings: {},
        query: '',
      });
    }
  }, [open, index, fields]);

  const currentType = localField.type || 'text';
  const isParameterType = PARAMETER_TYPES.includes(currentType);

  // Handle field type change
  const handleTypeChange = (newType: AdvancedFieldType) => {
    setLocalField((prev) => ({
      ...prev,
      type: newType,
      settings: {
        ...prev.settings,
        type: TYPE_TO_PARAM_TYPE[newType] || newType,
      },
    }));
  };

  // Handle updates from AdvancedFieldTypeSettings
  const handleCustomFieldUpdate = (key: string, value: any) => {
    setLocalField((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle updates from ParameterSelectCardSettings
  const handleParameterSettingUpdate = (key: string, value: any) => {
    setLocalField((prev) => {
      const newSettings = { ...(prev.settings || {}), [key]: value };

      // Update name from parameterName
      if (key === 'parameterName') {
        return {
          ...prev,
          name: value,
          settings: newSettings,
        };
      }

      // Update type if changed
      if (key === 'type') {
        const typeMap: Record<string, AdvancedFieldType> = {
          'Node Property': 'node-property',
          'Relationship Property': 'relationship-property',
          'Custom Query': 'custom-query',
          'Free Text': 'text',
          'Date Picker': 'datepicker',
        };
        const newFieldType = typeMap[value] || 'text';
        return {
          ...prev,
          type: newFieldType,
          settings: newSettings,
        };
      }

      return {
        ...prev,
        settings: newSettings,
      };
    });
  };

  // Handle query updates from ParameterSelectCardSettings
  const handleQueryUpdate = (query: string) => {
    setLocalField((prev) => ({
      ...prev,
      query,
    }));
  };

  // Save changes
  const handleSave = () => {
    const newFields = [...fields];
    const fieldToSave: FieldConfig = {
      type: localField.type as AdvancedFieldType,
      name: localField.name || localField.settings?.parameterName || 'unnamed_field',
      label: localField.label || localField.settings?.entityType || 'Unnamed Field',
      required: localField.required,
      helperText: localField.helperText,
      defaultValue: localField.defaultValue,
      disabled: localField.disabled,
    } as FieldConfig;

    // Add type-specific properties
    if (localField.type === 'text' || localField.type === 'textarea') {
      (fieldToSave as any).placeholder = localField.placeholder;
      (fieldToSave as any).maxLength = localField.maxLength;
      if (localField.type === 'textarea') {
        (fieldToSave as any).rows = localField.rows;
      }
    } else if (localField.type === 'checkbox') {
      (fieldToSave as any).checkedValue = localField.checkedValue || 'Yes';
      (fieldToSave as any).uncheckedValue = localField.uncheckedValue || 'No';
    } else if (localField.type === 'toggle') {
      (fieldToSave as any).onValue = localField.onValue || 'true';
      (fieldToSave as any).offValue = localField.offValue || 'false';
    } else if (localField.type === 'radio' || localField.type === 'select') {
      (fieldToSave as any).options = localField.options || [];
      if (localField.type === 'select') {
        (fieldToSave as any).placeholder = localField.placeholder;
      }
    } else if (localField.type === 'datepicker') {
      (fieldToSave as any).format = localField.format || 'DD/MM/YYYY';
      (fieldToSave as any).outputFormat = localField.outputFormat || 'YYYY-MM-DD';
      (fieldToSave as any).placeholder = localField.placeholder;
    } else if (localField.type === 'link') {
      (fieldToSave as any).urlPlaceholder = localField.urlPlaceholder;
      (fieldToSave as any).namePlaceholder = localField.namePlaceholder;
    } else if (isParameterType) {
      // For parameter-based types, store the settings and query
      (fieldToSave as any).settings = localField.settings;
      (fieldToSave as any).query = localField.query;
      // Use parameterName as the field name
      fieldToSave.name = localField.settings?.parameterName || 'unnamed_field';
      fieldToSave.label = localField.label || localField.settings?.entityType || 'Unnamed Field';
    }

    if (index < fields.length) {
      newFields[index] = fieldToSave;
    } else {
      newFields.push(fieldToSave);
    }

    setFields(newFields);
    setOpen(false);
  };

  const isNewField = index >= fields.length;
  const title = isNewField ? 'Add New Field' : `Editing Field #${index + 1}`;

  return (
    <Dialog
      className='dialog-l'
      open={open}
      onClose={() => setOpen(false)}
      style={{ overflow: 'inherit', overflowY: 'auto' }}
      aria-labelledby='form-field-dialog-title'
    >
      <Dialog.Header id='form-field-dialog-title'>{title}</Dialog.Header>
      <Dialog.Content style={{ overflow: 'inherit' }}>
        {/* Field Type Selector */}
        <Dropdown
          id='field-type'
          selectProps={{
            onChange: (newValue) => newValue && handleTypeChange(newValue.value as AdvancedFieldType),
            options: FIELD_TYPE_OPTIONS,
            value: FIELD_TYPE_OPTIONS.find((opt) => opt.value === currentType) || FIELD_TYPE_OPTIONS[0],
            menuPlacement: 'bottom',
            menuPortalTarget: document.querySelector('#overlay'),
          }}
          label='Field Type'
          type='select'
          fluid
          style={{ marginTop: '5px', marginBottom: '15px' }}
        />

        {/* Settings based on field type */}
        {isParameterType ? (
          <>
            <ParameterSelectCardSettings
              query={localField.query || ''}
              type='select'
              database={database}
              settings={{
                inputMode: 'cypher',
                ...localField.settings,
                type: TYPE_TO_PARAM_TYPE[currentType],
              }}
              extensions={extensions}
              onReportSettingUpdate={handleParameterSettingUpdate}
              onQueryUpdate={handleQueryUpdate}
            />
            <br />
            <NeoCardSettingsFooter
              type='select'
              reportSettings={localField.settings || {}}
              reportSettingsOpen={advancedSettingsOpen}
              onToggleReportSettings={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
              onReportSettingUpdate={handleParameterSettingUpdate}
            />
          </>
        ) : (
          <AdvancedFieldTypeSettings
            fieldType={currentType}
            fieldConfig={localField}
            onUpdate={handleCustomFieldUpdate}
          />
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setOpen(false)} fill='outlined' style={{ marginRight: 10 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} color='primary'>
            Save
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

export default NeoAdvancedFormFieldModal;
