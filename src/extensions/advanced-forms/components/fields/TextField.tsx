/**
 * TextField Component
 *
 * Single-line text input field using NDL TextInput component.
 */

import React from 'react';
import { TextInput } from '@neo4j-ndl/react';
import { FieldProps, TextFieldConfig } from '../../utils/types';

export const TextField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  const fieldConfig = config as TextFieldConfig;

  return (
    <div style={{ marginBottom: 10, marginLeft: 15, marginRight: 15 }}>
      <TextInput
        label={fieldConfig.label}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={fieldConfig.placeholder}
        disabled={disabled || fieldConfig.disabled}
        errorText={error}
        helpText={!error ? fieldConfig.helperText : undefined}
        fluid
      />
    </div>
  );
};

export default TextField;
