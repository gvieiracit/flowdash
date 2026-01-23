/**
 * Advanced Form Extension - Validation Engine
 *
 * Centralized validation logic supporting required fields,
 * conditional required fields, and query parameter generation.
 */

import { FieldConfig, LinkValue } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Check if a value is considered empty
 */
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  // Check for empty link value
  if (typeof value === 'object' && 'url' in value && 'name' in value) {
    const linkValue = value as LinkValue;
    return linkValue.url.trim() === '' && linkValue.name.trim() === '';
  }
  return false;
}

/**
 * Validates a single field value against its configuration
 *
 * @param field - The field configuration
 * @param value - The current field value
 * @param allValues - All field values (for conditional validation)
 * @returns Error message string or null if valid
 */
export function validateField(
  field: FieldConfig,
  value: any,
  allValues: Record<string, any>
): string | null {
  // Check required validation
  if (field.required && isEmpty(value)) {
    return `${field.label} is required`;
  }

  // Check conditional required validation
  if (field.requiredIf) {
    const dependentValue = allValues[field.requiredIf.field];
    const targetValues = Array.isArray(field.requiredIf.equals)
      ? field.requiredIf.equals
      : [field.requiredIf.equals];

    if (targetValues.includes(dependentValue) && isEmpty(value)) {
      return `${field.label} is required when ${field.requiredIf.field} is "${dependentValue}"`;
    }
  }

  return null;
}

/**
 * Validates all fields for a specific button's requirements
 *
 * @param fields - Array of field configurations
 * @param values - Current form values
 * @param requiredFields - Optional array of field names required for this button
 * @returns Validation result with isValid flag and errors object
 */
export function validateForButton(
  fields: FieldConfig[],
  values: Record<string, any>,
  requiredFields?: string[]
): ValidationResult {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    // If button specifies required fields, only validate those
    if (requiredFields && requiredFields.length > 0) {
      if (!requiredFields.includes(field.name)) {
        // Still check conditional required even if not in requiresFields
        if (field.requiredIf) {
          const error = validateField(field, values[field.name], values);
          if (error) {
            errors[field.name] = error;
          }
        }
        return;
      }
    }

    const error = validateField(field, values[field.name], values);
    if (error) {
      errors[field.name] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get field values formatted for Cypher query parameters
 *
 * All parameters are prefixed with `neodash_` to follow the standard convention.
 * Handles special cases like link fields which produce two parameters:
 * - `neodash_${fieldname}_url` for the URL
 * - `neodash_${fieldname}_name` for the display name
 *
 * @param fields - Array of field configurations
 * @param values - Current form values
 * @returns Object with query parameters
 */
export function getQueryParameters(
  fields: FieldConfig[],
  values: Record<string, any>
): Record<string, any> {
  const params: Record<string, any> = {};

  fields.forEach((field) => {
    const value = values[field.name];
    const paramName = `neodash_${field.name}`;

    if (field.type === 'link') {
      // Link field produces two parameters
      const linkValue: LinkValue = value || { url: '', name: '' };
      params[`${paramName}_url`] = linkValue.url || '';
      params[`${paramName}_name`] = linkValue.name || '';
    } else {
      // All other fields produce a single parameter
      params[paramName] = value ?? '';
    }
  });

  return params;
}

/**
 * Get the default value for a field based on its type
 *
 * @param field - The field configuration
 * @returns Default value appropriate for the field type
 */
export function getDefaultValueForField(field: FieldConfig): any {
  // If field has explicit default, use it
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  // Otherwise, return type-appropriate default
  switch (field.type) {
    case 'checkbox':
      return (field as any).uncheckedValue || '';
    case 'toggle':
      return (field as any).offValue || '';
    case 'link':
      return { url: '', name: '' };
    case 'radio':
    case 'select':
      return '';
    case 'datepicker':
      return '';
    default:
      return '';
  }
}

/**
 * Initialize form values from field configurations
 *
 * @param fields - Array of field configurations
 * @returns Initial values object
 */
export function initializeFormValues(fields: FieldConfig[]): Record<string, any> {
  const values: Record<string, any> = {};

  fields.forEach((field) => {
    values[field.name] = getDefaultValueForField(field);
  });

  return values;
}
