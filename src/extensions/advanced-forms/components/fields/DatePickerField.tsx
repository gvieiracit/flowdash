/**
 * DatePickerField Component
 *
 * Date picker with configurable display and output formats.
 * Uses MUI DatePicker with dayjs adapter.
 */

import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { FieldProps, DatePickerFieldConfig } from '../../utils/types';

// Enable custom parse format for dayjs
dayjs.extend(customParseFormat);

export const DatePickerField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  const fieldConfig = config as DatePickerFieldConfig;

  const displayFormat = fieldConfig.format || 'YYYY-MM-DD';
  const outputFormat = fieldConfig.outputFormat || displayFormat;

  // Parse existing value using the output format
  const dateValue = value ? dayjs(value, outputFormat) : null;

  const handleChange = (newDate: Dayjs | null) => {
    if (newDate && newDate.isValid()) {
      // Output in the configured format for the query
      onChange(newDate.format(outputFormat));
    } else {
      onChange('');
    }
  };

  return (
    <div style={{ marginBottom: 10, marginLeft: 15, marginRight: 15 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label={fieldConfig.label}
          value={dateValue}
          onChange={handleChange}
          disabled={disabled || fieldConfig.disabled}
          format={displayFormat}
          slotProps={{
            textField: {
              fullWidth: true,
              error: Boolean(error),
              helperText: error || fieldConfig.helperText,
              onBlur,
              placeholder: fieldConfig.placeholder,
              size: 'small',
              sx: {
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--ciandt-primary, #018bff)',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'var(--ciandt-primary, #018bff)',
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
};

export default DatePickerField;
