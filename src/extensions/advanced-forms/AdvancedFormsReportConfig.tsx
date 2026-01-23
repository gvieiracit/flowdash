/**
 * Advanced Forms Report Configuration
 *
 * Registers the Advanced Form report type with FlowDash.
 */

import React from 'react';
import { SELECTION_TYPES } from '../../config/CardConfig';
import NeoAdvancedForm from './chart/NeoAdvancedForm';
import NeoAdvancedFormCardSettings from './settings/NeoAdvancedFormCardSettings';

// Default fields for new Advanced Form reports
const DEFAULT_FIELDS = [
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
];

// Default buttons for new Advanced Form reports
const DEFAULT_BUTTONS = [
  {
    label: 'Submit',
    variant: 'primary',
    query: 'RETURN $example_text AS text, $example_select AS selection',
    requiresFields: [],
  },
];

export const ADVANCED_FORMS = {
  'advanced-form': {
    label: 'Advanced Form',
    component: NeoAdvancedForm,
    settingsComponent: NeoAdvancedFormCardSettings,
    textOnly: true,
    helperText: (
      <div>
        Advanced Form provides multi-field forms with configurable field types (text, textarea, dropdown, checkbox,
        radio, date picker, link), conditional validation, multiple submit buttons with independent Cypher queries, and
        an always-visible reset option. Configure fields and buttons using the visual builder.
      </div>
    ),
    maxRecords: 1,
    settings: {
      backgroundColor: {
        label: 'Background Color',
        type: SELECTION_TYPES.COLOR,
        default: '#fafafa',
      },
      advancedFormFields: {
        label: 'Form Fields',
        type: SELECTION_TYPES.LIST,
        default: DEFAULT_FIELDS,
      },
      advancedFormButtons: {
        label: 'Form Buttons',
        type: SELECTION_TYPES.LIST,
        default: DEFAULT_BUTTONS,
      },
      showReset: {
        label: 'Show Reset Button',
        type: SELECTION_TYPES.LIST,
        values: [true, false],
        default: true,
      },
      resetLabel: {
        label: 'Reset Button Label',
        type: SELECTION_TYPES.TEXT,
        default: 'Clear Form',
      },
      resetPosition: {
        label: 'Reset Button Position',
        type: SELECTION_TYPES.LIST,
        values: ['left', 'right', 'inline'],
        default: 'left',
      },
      successMessage: {
        label: 'Success Message',
        type: SELECTION_TYPES.TEXT,
        default: 'Form submitted successfully.',
      },
      clearAfterSubmit: {
        label: 'Clear after submit',
        type: SELECTION_TYPES.LIST,
        values: [true, false],
        default: false,
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
