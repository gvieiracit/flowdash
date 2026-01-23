/**
 * NeoAdvancedFormCardSettings
 *
 * Main settings UI for the Advanced Form report type.
 * Provides visual builders for:
 * - Fields (sortable list with add/edit/delete)
 * - Buttons (sortable list with add/edit/delete)
 * - Reset button settings
 * - Success message
 */

import React, { useEffect, useState } from 'react';
import { Banner, IconButton, Checkbox, Dropdown, TextInput } from '@neo4j-ndl/react';
import { PencilIconOutline, PlusIconOutline, XMarkIconOutline } from '@neo4j-ndl/react/icons';
import { SortableList } from './list/SortableList';
import NeoAdvancedFormFieldModal from './NeoAdvancedFormFieldModal';
import NeoAdvancedFormButtonModal from './NeoAdvancedFormButtonModal';
import { FieldConfig, ButtonConfig } from '../utils/types';
import NeoField from '../../../component/field/Field';

const RESET_POSITION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'inline', label: 'Inline with buttons' },
];

interface NeoAdvancedFormCardSettingsProps {
  query: string;
  database: string;
  settings: {
    advancedFormFields?: FieldConfig[];
    advancedFormButtons?: ButtonConfig[];
    showReset?: boolean;
    resetLabel?: string;
    resetPosition?: 'left' | 'right' | 'inline';
    successMessage?: string;
    clearAfterSubmit?: boolean;
    [key: string]: any;
  };
  extensions: any;
  onReportSettingUpdate: (key: string, value: any) => void;
  onQueryUpdate: (query: string) => void;
}

const NeoAdvancedFormCardSettings: React.FC<NeoAdvancedFormCardSettingsProps> = ({
  database,
  settings,
  extensions,
  onReportSettingUpdate,
}) => {
  // Get fields and buttons from settings
  const fields: FieldConfig[] = settings.advancedFormFields || [];
  const buttons: ButtonConfig[] = settings.advancedFormButtons || [];

  // Modal state
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [buttonModalOpen, setButtonModalOpen] = useState(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState(-1);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState(-1);

  // Indexed items for sortable list (need id property)
  const [indexedFields, setIndexedFields] = useState<(FieldConfig & { id: number })[]>([]);
  const [indexedButtons, setIndexedButtons] = useState<(ButtonConfig & { id: number })[]>([]);

  // Update indexed fields when fields change
  useEffect(() => {
    if (fields && !(fields.length === 0 && indexedFields.length === 0)) {
      setIndexedFields(fields.map((f, index) => ({ ...f, id: index + 1 })));
    }
  }, [fields]);

  // Update indexed buttons when buttons change
  useEffect(() => {
    if (buttons && !(buttons.length === 0 && indexedButtons.length === 0)) {
      setIndexedButtons(buttons.map((b, index) => ({ ...b, id: index + 1 })));
    }
  }, [buttons]);

  // Update fields in settings
  const updateFields = (newFields: FieldConfig[]) => {
    onReportSettingUpdate('advancedFormFields', newFields);
  };

  // Update buttons in settings
  const updateButtons = (newButtons: ButtonConfig[]) => {
    onReportSettingUpdate('advancedFormButtons', newButtons);
  };

  // Get display name for a field in the list
  const getFieldDisplayName = (field: FieldConfig | undefined) => {
    if (!field) {
      return '(undefined)';
    }
    if (field.name) {
      const typeLabel = getFieldTypeLabel(field.type);
      return `$neodash_${field.name}${typeLabel ? ` (${typeLabel})` : ''}`;
    }
    return '(undefined)';
  };

  // Get human-readable type label
  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      textarea: 'Text Area',
      select: 'Dropdown',
      checkbox: 'Checkbox',
      toggle: 'Toggle',
      radio: 'Radio',
      datepicker: 'Date',
      link: 'Link',
      'node-property': 'Node Prop',
      'relationship-property': 'Rel Prop',
      'custom-query': 'Query',
    };
    return labels[type] || type;
  };

  // Get display name for a button in the list
  const getButtonDisplayName = (button: ButtonConfig | undefined) => {
    if (!button) {
      return '(undefined)';
    }
    return `${button.label} (${button.variant})`;
  };

  // Add field button
  const addFieldButton = (
    <div style={{ width: '100%', display: 'flex' }}>
      <IconButton
        className='form-add-field'
        style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: 5, marginBottom: 5 }}
        aria-label='Add field'
        size='medium'
        floating
        onClick={() => {
          setSelectedFieldIndex(fields.length);
          setFieldModalOpen(true);
        }}
      >
        <PlusIconOutline />
      </IconButton>
    </div>
  );

  // Add button button
  const addButtonButton = (
    <div style={{ width: '100%', display: 'flex' }}>
      <IconButton
        className='form-add-button'
        style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: 5, marginBottom: 5 }}
        aria-label='Add button'
        size='medium'
        floating
        onClick={() => {
          setSelectedButtonIndex(buttons.length);
          setButtonModalOpen(true);
        }}
      >
        <PlusIconOutline />
      </IconButton>
    </div>
  );

  return (
    <div>
      {/* Field Modal */}
      <NeoAdvancedFormFieldModal
        open={fieldModalOpen}
        setOpen={setFieldModalOpen}
        index={selectedFieldIndex}
        fields={fields}
        setFields={updateFields}
        database={database}
        extensions={extensions}
      />

      {/* Button Modal */}
      <NeoAdvancedFormButtonModal
        open={buttonModalOpen}
        setOpen={setButtonModalOpen}
        index={selectedButtonIndex}
        buttons={buttons}
        setButtons={updateButtons}
        fields={fields}
      />

      {/* Fields Section */}
      <div style={{ borderTop: '1px dashed lightgrey', width: '100%', paddingTop: 10 }}>
        <span style={{ fontWeight: 500 }}>Fields:</span>
        <div style={{ position: 'relative' }}>
          <SortableList
            items={indexedFields}
            onChange={(newItems) => {
              setIndexedFields([]);
              updateFields(newItems.map(({ id: _id, ...rest }) => rest as FieldConfig));
            }}
            renderItem={(item, index) => (
              <SortableList.Item id={item.id}>
                <Banner
                  key={item.id}
                  id={`field-${item.id}`}
                  description={
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <span style={{ lineHeight: '32px', display: 'flex', alignItems: 'center' }}>
                        <SortableList.DragHandle /> {getFieldDisplayName(item)}
                      </span>
                      <div style={{ marginLeft: 'auto' }}>
                        <IconButton
                          aria-label='Edit field'
                          size='small'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedFieldIndex(index);
                            setFieldModalOpen(true);
                          }}
                        >
                          <PencilIconOutline />
                        </IconButton>
                        <IconButton
                          aria-label='Remove field'
                          size='small'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newFields = fields.filter((_, i) => i !== index);
                            updateFields(newFields);
                          }}
                        >
                          <XMarkIconOutline />
                        </IconButton>
                      </div>
                    </div>
                  }
                  style={{ width: '100%' }}
                />
              </SortableList.Item>
            )}
          />
          {addFieldButton}
        </div>
      </div>

      {/* Buttons Section */}
      <div style={{ borderTop: '1px dashed lightgrey', width: '100%', paddingTop: 10, marginTop: 10 }}>
        <span style={{ fontWeight: 500 }}>Buttons:</span>
        <div style={{ position: 'relative' }}>
          <SortableList
            items={indexedButtons}
            onChange={(newItems) => {
              setIndexedButtons([]);
              updateButtons(newItems.map(({ id: _id, ...rest }) => rest as ButtonConfig));
            }}
            renderItem={(item, index) => (
              <SortableList.Item id={item.id}>
                <Banner
                  key={item.id}
                  id={`button-${item.id}`}
                  description={
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <span style={{ lineHeight: '32px', display: 'flex', alignItems: 'center' }}>
                        <SortableList.DragHandle /> {getButtonDisplayName(item)}
                      </span>
                      <div style={{ marginLeft: 'auto' }}>
                        <IconButton
                          aria-label='Edit button'
                          size='small'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedButtonIndex(index);
                            setButtonModalOpen(true);
                          }}
                        >
                          <PencilIconOutline />
                        </IconButton>
                        <IconButton
                          aria-label='Remove button'
                          size='small'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newButtons = buttons.filter((_, i) => i !== index);
                            updateButtons(newButtons);
                          }}
                        >
                          <XMarkIconOutline />
                        </IconButton>
                      </div>
                    </div>
                  }
                  style={{ width: '100%' }}
                />
              </SortableList.Item>
            )}
          />
          {addButtonButton}
        </div>
      </div>

      {/* Reset Button Settings */}
      <div style={{ borderTop: '1px dashed lightgrey', width: '100%', paddingTop: 10, marginTop: 10 }}>
        <span style={{ fontWeight: 500 }}>Reset Button Settings:</span>
        <div style={{ marginTop: 10, marginLeft: 5 }}>
          <Checkbox
            label='Show Reset Button'
            checked={settings.showReset !== false}
            onChange={(e) => onReportSettingUpdate('showReset', e.target.checked)}
          />
        </div>
        {settings.showReset !== false && (
          <>
            <div style={{ marginTop: 10 }}>
              <NeoField
                label='Reset Button Label'
                value={settings.resetLabel || 'Clear Form'}
                defaultValue='Clear Form'
                placeholder='Clear Form'
                onChange={(value) => onReportSettingUpdate('resetLabel', value)}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <Dropdown
                id='reset-position'
                selectProps={{
                  onChange: (newValue) => newValue && onReportSettingUpdate('resetPosition', newValue.value),
                  options: RESET_POSITION_OPTIONS,
                  value:
                    RESET_POSITION_OPTIONS.find((opt) => opt.value === settings.resetPosition) ||
                    RESET_POSITION_OPTIONS[0],
                  menuPlacement: 'top',
                  menuPortalTarget: document.querySelector('#overlay'),
                }}
                label='Reset Button Position'
                type='select'
                fluid
              />
            </div>
          </>
        )}
      </div>

      {/* Success Message & Clear After Submit */}
      <div style={{ borderTop: '1px dashed lightgrey', width: '100%', paddingTop: 10, marginTop: 10 }}>
        <span style={{ fontWeight: 500 }}>Form Behavior:</span>
        <div style={{ marginTop: 10 }}>
          <NeoField
            label='Success Message'
            value={settings.successMessage || 'Form submitted successfully.'}
            defaultValue='Form submitted successfully.'
            placeholder='Message shown after successful submission'
            onChange={(value) => onReportSettingUpdate('successMessage', value)}
          />
        </div>
        <div style={{ marginTop: 10, marginLeft: 5 }}>
          <Checkbox
            label='Clear form after successful submission'
            checked={settings.clearAfterSubmit === true}
            onChange={(e) => onReportSettingUpdate('clearAfterSubmit', e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default NeoAdvancedFormCardSettings;
