/**
 * TextAreaField Component
 *
 * Multi-line text input field using NDL Textarea component.
 */

import React from 'react';
import { Textarea } from '@neo4j-ndl/react';
import { FieldProps, TextAreaFieldConfig } from '../../utils/types';

export const TextAreaField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  const fieldConfig = config as TextAreaFieldConfig;
  const rows = fieldConfig.rows || 4;

  return (
    <div style={{ marginBottom: 10, marginLeft: 15, marginRight: 15 }}>
      <Textarea
        label={fieldConfig.label}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={fieldConfig.placeholder}
        disabled={disabled || fieldConfig.disabled}
        errorText={error}
        helpText={!error ? fieldConfig.helperText : undefined}
        style={{ minHeight: `${rows * 24}px` }}
        fluid
      />
    </div>
  );
};

export default TextAreaField;
