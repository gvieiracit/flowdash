/**
 * RadioGroupField Component
 *
 * Radio button group with admin-configurable options and values.
 * Uses MUI RadioGroup for consistent styling.
 */

import React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { FieldProps, RadioGroupFieldConfig } from '../../utils/types';

export const RadioGroupField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  const fieldConfig = config as RadioGroupFieldConfig;

  return (
    <div style={{ marginBottom: 10, marginLeft: 15 }}>
      <FormControl component='fieldset' error={Boolean(error)} disabled={disabled || fieldConfig.disabled}>
        <FormLabel
          component='legend'
          sx={{
            '&.Mui-focused': {
              color: 'var(--ciandt-primary, #018bff)',
            },
          }}
        >
          {fieldConfig.label}
        </FormLabel>
        <RadioGroup value={value || ''} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}>
          {fieldConfig.options.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={
                <Radio
                  sx={{
                    color: 'var(--ciandt-primary, #018bff)',
                    '&.Mui-checked': {
                      color: 'var(--ciandt-primary, #018bff)',
                    },
                  }}
                />
              }
              label={option.label}
            />
          ))}
        </RadioGroup>
        {fieldConfig.helperText && !error && <FormHelperText>{fieldConfig.helperText}</FormHelperText>}
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    </div>
  );
};

export default RadioGroupField;
