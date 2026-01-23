/**
 * Advanced Form Extension - Type Definitions
 *
 * TypeScript interfaces for all Advanced Form configurations,
 * field types, and component props.
 */

// Field type definitions
export type AdvancedFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'toggle'
  | 'radio'
  | 'datepicker'
  | 'link'
  | 'node-property'
  | 'relationship-property'
  | 'custom-query';

// Base field configuration shared by all field types
export interface BaseFieldConfig {
  name: string;
  label: string;
  type: AdvancedFieldType;
  required?: boolean;
  requiredIf?: {
    field: string;
    equals: string | string[];
  };
  defaultValue?: any;
  helperText?: string;
  disabled?: boolean;
}

// Text field configuration (single line input)
export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
}

// Textarea field configuration (multi-line input)
export interface TextAreaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

// Select field configuration (dropdown with static options)
export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// Checkbox field configuration (with configurable checked/unchecked values)
export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox';
  checkedValue: string;
  uncheckedValue: string;
}

// Toggle field configuration (switch with configurable on/off values)
export interface ToggleFieldConfig extends BaseFieldConfig {
  type: 'toggle';
  onValue: string;
  offValue: string;
}

// Radio group field configuration (with configurable options and values)
export interface RadioGroupFieldConfig extends BaseFieldConfig {
  type: 'radio';
  options: Array<{ value: string; label: string }>;
}

// Date picker field configuration (with configurable format)
export interface DatePickerFieldConfig extends BaseFieldConfig {
  type: 'datepicker';
  format?: string; // Display format (e.g., 'DD/MM/YYYY')
  outputFormat?: string; // Query format (e.g., 'YYYY-MM-DD')
  placeholder?: string;
}

// Link field configuration (compound URL + display name)
export interface LinkFieldConfig extends BaseFieldConfig {
  type: 'link';
  urlPlaceholder?: string;
  namePlaceholder?: string;
}

// Node property field configuration (reuses existing functionality)
export interface NodePropertyFieldConfig extends BaseFieldConfig {
  type: 'node-property';
  query?: string;
}

// Relationship property field configuration (reuses existing functionality)
export interface RelationshipPropertyFieldConfig extends BaseFieldConfig {
  type: 'relationship-property';
  query?: string;
}

// Custom query field configuration (reuses existing functionality)
export interface CustomQueryFieldConfig extends BaseFieldConfig {
  type: 'custom-query';
  query: string;
}

// Union type for all field configs
export type FieldConfig =
  | TextFieldConfig
  | TextAreaFieldConfig
  | SelectFieldConfig
  | CheckboxFieldConfig
  | ToggleFieldConfig
  | RadioGroupFieldConfig
  | DatePickerFieldConfig
  | LinkFieldConfig
  | NodePropertyFieldConfig
  | RelationshipPropertyFieldConfig
  | CustomQueryFieldConfig;

// Button configuration for form submission
export interface ButtonConfig {
  label: string;
  variant: 'primary' | 'secondary';
  query: string;
  requiresFields?: string[];
}

// Complete form configuration (from Advanced Settings JSON)
export interface AdvancedFormConfig {
  fields: FieldConfig[];
  buttons: ButtonConfig[];
  showReset?: boolean;
  resetLabel?: string;
  resetPosition?: 'left' | 'right' | 'inline';
  successMessage?: string;
  clearAfterSubmit?: boolean;
}

// Form state management
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Link field value structure
export interface LinkValue {
  url: string;
  name: string;
}

// Field component props interface
export interface FieldProps {
  config: FieldConfig;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  onBlur: () => void;
  disabled?: boolean;
}

// Field renderer additional props for parameter-based fields
export interface FieldRendererProps extends Omit<FieldProps, 'config'> {
  field: FieldConfig;
  parameters?: Record<string, any>;
  queryCallback?: (query: string | undefined, parameters: Record<string, any>, setRecords: any) => void;
  setGlobalParameter?: (name: string, value: any) => void;
  getGlobalParameter?: (name: string) => string;
}

// Button group component props
export interface ButtonGroupProps {
  buttons: ButtonConfig[];
  showReset: boolean;
  resetLabel: string;
  resetPosition: 'left' | 'right' | 'inline';
  onSubmit: (button: ButtonConfig) => void;
  onReset: () => void;
  isSubmitting: boolean;
  submitDisabled: boolean;
}

// Form status enum
export enum FormStatus {
  DATA_ENTRY = 0,
  RUNNING = 1,
  SUBMITTED = 2,
  ERROR = 3,
}
