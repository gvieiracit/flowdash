/**
 * AdvancedFieldTypeSettings
 *
 * Settings UI for custom field types (checkbox, toggle, radio, select, datepicker, link, text, textarea).
 * Used within the NeoAdvancedFormFieldModal to configure field-specific settings.
 */

import React from 'react';
import { TextInput, Checkbox, IconButton } from '@neo4j-ndl/react';
import { PlusIconOutline, XMarkIconOutline } from '@neo4j-ndl/react/icons';
import NeoField from '../../../component/field/Field';
import {
  FieldConfig,
  TextFieldConfig,
  TextAreaFieldConfig,
  CheckboxFieldConfig,
  ToggleFieldConfig,
  RadioGroupFieldConfig,
  SelectFieldConfig,
  DatePickerFieldConfig,
  LinkFieldConfig,
} from '../utils/types';

interface AdvancedFieldTypeSettingsProps {
  fieldType: string;
  fieldConfig: Partial<FieldConfig>;
  onUpdate: (key: string, value: any) => void;
}

/**
 * Options list editor for Radio and Select fields
 */
const OptionsEditor: React.FC<{
  options: Array<{ value: string; label: string }>;
  onChange: (options: Array<{ value: string; label: string }>) => void;
}> = ({ options = [], onChange }) => {
  const addOption = () => {
    onChange([...options, { value: '', label: '' }]);
  };

  const updateOption = (index: number, field: 'value' | 'label', newValue: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: newValue };
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <span style={{ fontSize: 12, color: 'grey' }}>Options:</span>
      {options.map((option, index) => (
        <div key={index} style={{ display: 'flex', gap: 8, marginTop: 5, alignItems: 'center' }}>
          <TextInput
            fluid
            size='small'
            placeholder='Value'
            value={option.value}
            onChange={(e) => updateOption(index, 'value', e.target.value)}
            style={{ flex: 1 }}
          />
          <TextInput
            fluid
            size='small'
            placeholder='Label'
            value={option.label}
            onChange={(e) => updateOption(index, 'label', e.target.value)}
            style={{ flex: 1 }}
          />
          <IconButton aria-label='Remove option' size='small' onClick={() => removeOption(index)}>
            <XMarkIconOutline />
          </IconButton>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <IconButton aria-label='Add option' size='small' floating onClick={addOption}>
          <PlusIconOutline />
        </IconButton>
      </div>
    </div>
  );
};

const AdvancedFieldTypeSettings: React.FC<AdvancedFieldTypeSettingsProps> = ({ fieldType, fieldConfig, onUpdate }) => {
  // Common fields for all types
  const renderCommonFields = () => (
    <>
      <NeoField
        label='Field Name'
        key='name'
        value={fieldConfig.name || ''}
        defaultValue=''
        placeholder='e.g., customer_name'
        style={{ marginBottom: 10 }}
        onChange={(value) => onUpdate('name', value)}
      />
      <NeoField
        label='Label'
        key='label'
        value={fieldConfig.label || ''}
        defaultValue=''
        placeholder='Display label for the field'
        style={{ marginBottom: 10 }}
        onChange={(value) => onUpdate('label', value)}
      />
      <NeoField
        label='Helper Text'
        key='helperText'
        value={fieldConfig.helperText || ''}
        defaultValue=''
        placeholder='Optional help text'
        style={{ marginBottom: 10 }}
        onChange={(value) => onUpdate('helperText', value)}
      />
      <div style={{ marginBottom: 10, marginLeft: 5 }}>
        <Checkbox
          label='Required'
          checked={fieldConfig.required || false}
          onChange={(e) => onUpdate('required', e.target.checked)}
        />
      </div>
    </>
  );

  // Text field settings
  if (fieldType === 'text') {
    const config = fieldConfig as Partial<TextFieldConfig>;
    return (
      <div>
        {renderCommonFields()}
        <NeoField
          label='Placeholder'
          key='placeholder'
          value={config.placeholder || ''}
          defaultValue=''
          placeholder='Placeholder text'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('placeholder', value)}
        />
        <NeoField
          label='Max Length'
          key='maxLength'
          value={config.maxLength?.toString() || ''}
          defaultValue=''
          placeholder='Maximum characters (optional)'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('maxLength', value ? parseInt(value, 10) : undefined)}
        />
      </div>
    );
  }

  // Textarea field settings
  if (fieldType === 'textarea') {
    const config = fieldConfig as Partial<TextAreaFieldConfig>;
    return (
      <div>
        {renderCommonFields()}
        <NeoField
          label='Placeholder'
          key='placeholder'
          value={config.placeholder || ''}
          defaultValue=''
          placeholder='Placeholder text'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('placeholder', value)}
        />
        <NeoField
          label='Rows'
          key='rows'
          value={config.rows?.toString() || '3'}
          defaultValue='3'
          placeholder='Number of visible rows'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('rows', value ? parseInt(value, 10) : 3)}
        />
        <NeoField
          label='Max Length'
          key='maxLength'
          value={config.maxLength?.toString() || ''}
          defaultValue=''
          placeholder='Maximum characters (optional)'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('maxLength', value ? parseInt(value, 10) : undefined)}
        />
      </div>
    );
  }

  // Checkbox field settings
  if (fieldType === 'checkbox') {
    const config = fieldConfig as Partial<CheckboxFieldConfig>;
    return (
      <div>
        {renderCommonFields()}
        <NeoField
          label='Checked Value'
          key='checkedValue'
          value={config.checkedValue || 'Yes'}
          defaultValue='Yes'
          placeholder='Value when checked'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('checkedValue', value)}
        />
        <NeoField
          label='Unchecked Value'
          key='uncheckedValue'
          value={config.uncheckedValue || 'No'}
          defaultValue='No'
          placeholder='Value when unchecked'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('uncheckedValue', value)}
        />
      </div>
    );
  }

  // Toggle field settings
  if (fieldType === 'toggle') {
    const config = fieldConfig as Partial<ToggleFieldConfig>;
    return (
      <div>
        {renderCommonFields()}
        <NeoField
          label='On Value'
          key='onValue'
          value={config.onValue || 'true'}
          defaultValue='true'
          placeholder='Value when on'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('onValue', value)}
        />
        <NeoField
          label='Off Value'
          key='offValue'
          value={config.offValue || 'false'}
          defaultValue='false'
          placeholder='Value when off'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('offValue', value)}
        />
      </div>
    );
  }

  // Radio group field settings
  if (fieldType === 'radio') {
    const config = fieldConfig as Partial<RadioGroupFieldConfig>;
    return (
      <div>
        {renderCommonFields()}
        <OptionsEditor options={config.options || []} onChange={(options) => onUpdate('options', options)} />
      </div>
    );
  }

  // Select (dropdown) field settings
  if (fieldType === 'select') {
    const config = fieldConfig as Partial<SelectFieldConfig>;
    return (
      <div>
        {renderCommonFields()}
        <NeoField
          label='Placeholder'
          key='placeholder'
          value={config.placeholder || ''}
          defaultValue=''
          placeholder='Placeholder text'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('placeholder', value)}
        />
        <OptionsEditor options={config.options || []} onChange={(options) => onUpdate('options', options)} />
      </div>
    );
  }

  // Date picker field settings
  if (fieldType === 'datepicker') {
    const config = fieldConfig as Partial<DatePickerFieldConfig>;
    return (
      <div>
        {renderCommonFields()}
        <NeoField
          label='Display Format'
          key='format'
          value={config.format || 'DD/MM/YYYY'}
          defaultValue='DD/MM/YYYY'
          placeholder='e.g., DD/MM/YYYY'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('format', value)}
        />
        <NeoField
          label='Output Format (for queries)'
          key='outputFormat'
          value={config.outputFormat || 'YYYY-MM-DD'}
          defaultValue='YYYY-MM-DD'
          placeholder='e.g., YYYY-MM-DD'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('outputFormat', value)}
        />
        <NeoField
          label='Placeholder'
          key='placeholder'
          value={config.placeholder || ''}
          defaultValue=''
          placeholder='Placeholder text'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('placeholder', value)}
        />
      </div>
    );
  }

  // Link field settings
  if (fieldType === 'link') {
    const config = fieldConfig as Partial<LinkFieldConfig>;
    return (
      <div>
        {renderCommonFields()}
        <NeoField
          label='URL Placeholder'
          key='urlPlaceholder'
          value={config.urlPlaceholder || 'https://...'}
          defaultValue='https://...'
          placeholder='Placeholder for URL input'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('urlPlaceholder', value)}
        />
        <NeoField
          label='Name Placeholder'
          key='namePlaceholder'
          value={config.namePlaceholder || 'Link name'}
          defaultValue='Link name'
          placeholder='Placeholder for name input'
          style={{ marginBottom: 10 }}
          onChange={(value) => onUpdate('namePlaceholder', value)}
        />
      </div>
    );
  }

  // Default: just common fields
  return <div>{renderCommonFields()}</div>;
};

export default AdvancedFieldTypeSettings;
