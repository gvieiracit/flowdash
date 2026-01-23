/**
 * SelectField Component
 *
 * Dropdown select field using NDL Dropdown component with static options.
 */

import React from 'react';
import { Dropdown } from '@neo4j-ndl/react';
import { FieldProps, SelectFieldConfig } from '../../utils/types';

export const SelectField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  const fieldConfig = config as SelectFieldConfig;

  const options = fieldConfig.options.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <div style={{ marginBottom: 10, marginLeft: 15, marginRight: 15 }}>
      <Dropdown
        label={fieldConfig.label}
        selectProps={{
          value: selectedOption,
          onChange: (selected: any) => onChange(selected?.value || ''),
          onBlur,
          options,
          placeholder: fieldConfig.placeholder || 'Select...',
          isDisabled: disabled || fieldConfig.disabled,
          isClearable: !fieldConfig.required,
        }}
        errorText={error}
        helpText={!error ? fieldConfig.helperText : undefined}
        fluid
      />
    </div>
  );
};

export default SelectField;
