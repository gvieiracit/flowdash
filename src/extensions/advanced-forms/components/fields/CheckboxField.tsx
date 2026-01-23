/**
 * CheckboxField Component
 *
 * Checkbox field with admin-configurable checked/unchecked values.
 * Uses MUI Checkbox for visual consistency.
 */

import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { FieldProps, CheckboxFieldConfig } from '../../utils/types';

export const CheckboxField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  const fieldConfig = config as CheckboxFieldConfig;

  // Determine if checkbox should be checked based on current value
  const isChecked = value === fieldConfig.checkedValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked ? fieldConfig.checkedValue : fieldConfig.uncheckedValue;
    onChange(newValue);
  };

  return (
    <div style={{ marginBottom: 10, marginLeft: 15 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={isChecked}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled || fieldConfig.disabled}
            sx={{
              color: 'var(--ciandt-primary, #018bff)',
              '&.Mui-checked': {
                color: 'var(--ciandt-primary, #018bff)',
              },
            }}
          />
        }
        label={fieldConfig.label}
      />
      {fieldConfig.helperText && !error && (
        <FormHelperText sx={{ marginLeft: 4, marginTop: -1 }}>{fieldConfig.helperText}</FormHelperText>
      )}
      {error && (
        <FormHelperText error sx={{ marginLeft: 4, marginTop: -1 }}>
          {error}
        </FormHelperText>
      )}
    </div>
  );
};

export default CheckboxField;
