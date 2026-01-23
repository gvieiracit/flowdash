/**
 * ToggleField Component
 *
 * Toggle switch field with admin-configurable on/off values.
 * Uses MUI Switch for visual toggle effect.
 */

import React from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { FieldProps, ToggleFieldConfig } from '../../utils/types';

export const ToggleField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  const fieldConfig = config as ToggleFieldConfig;

  // Determine if toggle is on based on current value
  const isOn = value === fieldConfig.onValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked ? fieldConfig.onValue : fieldConfig.offValue;
    onChange(newValue);
  };

  return (
    <div style={{ marginBottom: 10, marginLeft: 15 }}>
      <FormControlLabel
        control={
          <Switch
            checked={isOn}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled || fieldConfig.disabled}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: 'var(--ciandt-primary, #018bff)',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: 'var(--ciandt-primary, #018bff)',
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

export default ToggleField;
