/**
 * FieldRenderer Component
 *
 * Dynamic field renderer that maps field configuration to appropriate field component.
 * Supports all Advanced Form field types and falls back to existing parameter selection
 * components for node-property, relationship-property, and custom-query types.
 */

import React from 'react';
import { FieldConfig, FieldRendererProps } from '../utils/types';
import {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  ToggleField,
  RadioGroupField,
  DatePickerField,
  LinkField,
} from './fields';
import NeoParameterSelectionChart from '../../../chart/parameter/ParameterSelectionChart';

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  error,
  onChange,
  onBlur,
  disabled,
  parameters,
  queryCallback,
  setGlobalParameter,
  getGlobalParameter,
}) => {
  // Common props for custom field components
  const fieldProps = {
    config: field,
    value,
    error,
    onChange,
    onBlur,
    disabled,
  };

  switch (field.type) {
    case 'text':
      return <TextField {...fieldProps} />;

    case 'textarea':
      return <TextAreaField {...fieldProps} />;

    case 'select':
      return <SelectField {...fieldProps} />;

    case 'checkbox':
      return <CheckboxField {...fieldProps} />;

    case 'toggle':
      return <ToggleField {...fieldProps} />;

    case 'radio':
      return <RadioGroupField {...fieldProps} />;

    case 'datepicker':
      return <DatePickerField {...fieldProps} />;

    case 'link':
      return <LinkField {...fieldProps} />;

    case 'node-property':
    case 'relationship-property':
    case 'custom-query': {
      // Reuse existing parameter selection for these types
      // Map our type to the expected type string
      const typeMapping: Record<string, string> = {
        'node-property': 'Node Property',
        'relationship-property': 'Relationship Property',
        'custom-query': 'Custom Query',
      };

      return (
        <div style={{ marginBottom: 10 }}>
          <NeoParameterSelectionChart
            records={[{ input: (field as any).query || '' }]}
            settings={{
              parameterName: field.name,
              entityType: field.label,
              helperText: field.helperText,
              type: typeMapping[field.type],
              disabled: disabled || field.disabled,
            }}
            parameters={parameters}
            queryCallback={queryCallback}
            setGlobalParameter={setGlobalParameter}
            getGlobalParameter={getGlobalParameter}
          />
        </div>
      );
    }

    default:
      // Unknown field type - display error message
      return (
        <div
          style={{
            color: 'red',
            marginBottom: 10,
            marginLeft: 15,
            padding: 10,
            border: '1px solid red',
            borderRadius: 4,
          }}
        >
          Unknown field type: {(field as any).type}
        </div>
      );
  }
};

export default FieldRenderer;
