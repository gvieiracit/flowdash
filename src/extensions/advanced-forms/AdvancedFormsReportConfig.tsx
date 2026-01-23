/**
 * Advanced Forms Report Configuration
 *
 * Registers the Advanced Form report type with FlowDash.
 */

import React from 'react';
import { SELECTION_TYPES } from '../../config/CardConfig';
import NeoAdvancedForm from './chart/NeoAdvancedForm';

// Default form configuration for new Advanced Form reports
const DEFAULT_FORM_CONFIG = {
  fields: [
    {
      name: 'example_text',
      label: 'Example Text Field',
      type: 'text',
      placeholder: 'Enter text...',
      required: false,
    },
    {
      name: 'example_select',
      label: 'Example Dropdown',
      type: 'select',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ],
      required: false,
    },
  ],
  buttons: [
    {
      label: 'Submit',
      variant: 'primary',
      query: 'RETURN $example_text AS text, $example_select AS selection',
      requiresFields: [],
    },
  ],
  showReset: true,
  resetLabel: 'Clear Form',
  resetPosition: 'left',
  successMessage: 'Form submitted successfully.',
  clearAfterSubmit: false,
};

export const ADVANCED_FORMS = {
  'advanced-form': {
    label: 'Advanced Form',
    component: NeoAdvancedForm,
    textOnly: true,
    helperText: (
      <div>
        Advanced Form provides multi-field forms with configurable field types (text, textarea, dropdown, checkbox,
        radio, date picker, link), conditional validation, multiple submit buttons with independent Cypher queries, and
        an always-visible reset option. Configure fields and buttons via Advanced Settings.
      </div>
    ),
    maxRecords: 1,
    settings: {
      backgroundColor: {
        label: 'Background Color',
        type: SELECTION_TYPES.COLOR,
        default: '#fafafa',
      },
      advancedFormConfig: {
        label: 'Form Configuration (JSON)',
        type: SELECTION_TYPES.MULTILINE_TEXT,
        default: JSON.stringify(DEFAULT_FORM_CONFIG, null, 2),
      },
      refreshButtonEnabled: {
        label: 'Refreshable',
        type: SELECTION_TYPES.LIST,
        values: [true, false],
        default: false,
      },
      fullscreenEnabled: {
        label: 'Fullscreen enabled',
        type: SELECTION_TYPES.LIST,
        values: [true, false],
        default: false,
      },
      downloadImageEnabled: {
        label: 'Download Image enabled',
        type: SELECTION_TYPES.LIST,
        values: [true, false],
        default: false,
      },
      description: {
        label: 'Report Description',
        type: SELECTION_TYPES.MULTILINE_TEXT,
        default: 'Enter markdown here...',
      },
    },
  },
};
