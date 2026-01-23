/**
 * LinkField Component
 *
 * Compound field for URL and display name.
 * Produces two query parameters: ${fieldname}_url and ${fieldname}_name
 */

import React from 'react';
import { TextInput } from '@neo4j-ndl/react';
import { FieldProps, LinkFieldConfig, LinkValue } from '../../utils/types';

export const LinkField: React.FC<FieldProps> = ({ config, value, error, onChange, onBlur, disabled }) => {
  const fieldConfig = config as LinkFieldConfig;

  const linkValue: LinkValue = value || { url: '', name: '' };

  const handleUrlChange = (url: string) => {
    onChange({ ...linkValue, url });
  };

  const handleNameChange = (name: string) => {
    onChange({ ...linkValue, name });
  };

  return (
    <div style={{ marginBottom: 10, marginLeft: 15, marginRight: 15 }}>
      <div style={{ marginBottom: 8 }}>
        <TextInput
          label={`${fieldConfig.label} - URL`}
          value={linkValue.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onBlur={onBlur}
          placeholder={fieldConfig.urlPlaceholder || 'https://...'}
          disabled={disabled || fieldConfig.disabled}
          errorText={error}
          fluid
        />
      </div>
      <div>
        <TextInput
          label={`${fieldConfig.label} - Display Name`}
          value={linkValue.name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={onBlur}
          placeholder={fieldConfig.namePlaceholder || 'Link display name'}
          disabled={disabled || fieldConfig.disabled}
          helpText={fieldConfig.helperText}
          fluid
        />
      </div>
    </div>
  );
};

export default LinkField;
