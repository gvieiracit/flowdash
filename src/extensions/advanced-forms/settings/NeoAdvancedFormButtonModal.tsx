/**
 * NeoAdvancedFormButtonModal
 *
 * Modal for editing button configuration in the Advanced Form.
 * Allows configuring:
 * - Button label
 * - Button variant (primary/secondary)
 * - Cypher query to execute
 * - Required fields (multi-select checkboxes)
 */

import React, { useState, useEffect } from 'react';
import { Button, Dialog, Dropdown, Checkbox } from '@neo4j-ndl/react';
import NeoField from '../../../component/field/Field';
import NeoCodeEditorComponent, {
  DEFAULT_CARD_SETTINGS_HELPER_TEXT_STYLE,
} from '../../../component/editor/CodeEditorComponent';
import { ButtonConfig, FieldConfig } from '../utils/types';

const VARIANT_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
];

interface NeoAdvancedFormButtonModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  index: number;
  buttons: ButtonConfig[];
  setButtons: (buttons: ButtonConfig[]) => void;
  fields: FieldConfig[];
}

const NeoAdvancedFormButtonModal: React.FC<NeoAdvancedFormButtonModalProps> = ({
  open,
  setOpen,
  index,
  buttons,
  setButtons,
  fields,
}) => {
  // Local state for the button being edited
  const [localButton, setLocalButton] = useState<ButtonConfig>({
    label: 'Submit',
    variant: 'primary',
    query: '',
    requiresFields: [],
  });

  // Initialize local state when modal opens or index changes
  useEffect(() => {
    if (open && buttons[index]) {
      setLocalButton({ ...buttons[index] });
    } else if (open && index === buttons.length) {
      // New button
      setLocalButton({
        label: 'Submit',
        variant: 'primary',
        query: '',
        requiresFields: [],
      });
    }
  }, [open, index, buttons]);

  // Handle field updates
  const handleUpdate = (key: keyof ButtonConfig, value: any) => {
    setLocalButton((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle required fields checkbox toggle
  const handleRequiredFieldToggle = (fieldName: string, checked: boolean) => {
    setLocalButton((prev) => {
      const currentRequired = prev.requiresFields || [];
      if (checked) {
        return {
          ...prev,
          requiresFields: [...currentRequired, fieldName],
        };
      }
      return {
        ...prev,
        requiresFields: currentRequired.filter((f) => f !== fieldName),
      };
    });
  };

  // Save changes
  const handleSave = () => {
    const newButtons = [...buttons];

    if (index < buttons.length) {
      newButtons[index] = localButton;
    } else {
      newButtons.push(localButton);
    }

    setButtons(newButtons);
    setOpen(false);
  };

  const isNewButton = index >= buttons.length;
  const title = isNewButton ? 'Add New Button' : `Editing Button #${index + 1}`;

  // Get field names for the required fields selector
  const fieldNames = fields.map((f) => f.name).filter((name) => name);

  return (
    <Dialog
      className='dialog-l'
      open={open}
      onClose={() => setOpen(false)}
      style={{ overflow: 'inherit', overflowY: 'auto' }}
      aria-labelledby='form-button-dialog-title'
    >
      <Dialog.Header id='form-button-dialog-title'>{title}</Dialog.Header>
      <Dialog.Content style={{ overflow: 'inherit' }}>
        {/* Button Label */}
        <NeoField
          label='Button Label'
          key='label'
          value={localButton.label}
          defaultValue='Submit'
          placeholder='e.g., Submit, Save Draft'
          style={{ marginBottom: 15 }}
          onChange={(value) => handleUpdate('label', value)}
        />

        {/* Button Variant */}
        <Dropdown
          id='button-variant'
          selectProps={{
            onChange: (newValue) => newValue && handleUpdate('variant', newValue.value),
            options: VARIANT_OPTIONS,
            value: VARIANT_OPTIONS.find((opt) => opt.value === localButton.variant) || VARIANT_OPTIONS[0],
            menuPlacement: 'bottom',
            menuPortalTarget: document.querySelector('#overlay'),
          }}
          label='Button Style'
          type='select'
          fluid
          style={{ marginBottom: 15 }}
        />

        {/* Cypher Query */}
        <div style={{ marginBottom: 15 }}>
          <span style={{ fontSize: 12, color: 'grey' }}>Cypher Query:</span>
          <NeoCodeEditorComponent
            value={localButton.query}
            editable={true}
            language='cypher'
            onChange={(value) => handleUpdate('query', value)}
            placeholder='Enter Cypher query to execute when button is clicked...'
          />
          <div style={DEFAULT_CARD_SETTINGS_HELPER_TEXT_STYLE}>
            Use $fieldName to reference form field values (e.g., $customer_name, $rating).
          </div>
        </div>

        {/* Required Fields */}
        {fieldNames.length > 0 && (
          <div style={{ marginBottom: 15 }}>
            <span style={{ fontSize: 12, color: 'grey', display: 'block', marginBottom: 8 }}>
              Required Fields (must be filled before this button can be clicked):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {fieldNames.map((fieldName) => (
                <Checkbox
                  key={fieldName}
                  label={`$${fieldName}`}
                  checked={(localButton.requiresFields || []).includes(fieldName)}
                  onChange={(e) => handleRequiredFieldToggle(fieldName, e.target.checked)}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setOpen(false)} fill='outlined' style={{ marginRight: 10 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} color='primary'>
            Save
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

export default NeoAdvancedFormButtonModal;
