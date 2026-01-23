/**
 * NeoAdvancedForm Component
 *
 * Main Advanced Form component that renders the form, manages state,
 * handles validation, and executes Cypher queries on submission.
 *
 * Features:
 * - Multi-field forms with independent state persistence
 * - Configurable field types (text, textarea, select, checkbox, radio, date picker, link)
 * - Conditional validation rules
 * - Multiple submit buttons with independent queries
 * - Always-visible reset button (when configured)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ChartProps } from '../../../chart/Chart';
import debounce from 'lodash/debounce';
import { RUN_QUERY_DELAY_MS } from '../../../config/ReportConfig';
import { REPORT_LOADING_ICON } from '../../../report/Report';
import NeoCodeViewerComponent from '../../../component/editor/CodeViewerComponent';
import { FieldRenderer } from '../components/FieldRenderer';
import { ButtonGroup } from '../components/ButtonGroup';
import { AdvancedFormConfig, ButtonConfig, FormState, FormStatus } from '../utils/types';
import { validateForButton, getQueryParameters, initializeFormValues } from '../utils/validation';

/**
 * Parse the form configuration from settings
 * Supports both new settings structure (advancedFormFields/advancedFormButtons)
 * and legacy JSON string format (advancedFormConfig) for backwards compatibility
 */
function parseFormConfig(settings: Record<string, any> | undefined): AdvancedFormConfig {
  const defaultConfig: AdvancedFormConfig = {
    fields: [],
    buttons: [],
    showReset: true,
    resetLabel: 'Clear Form',
    resetPosition: 'left',
    successMessage: 'Form submitted successfully.',
    clearAfterSubmit: false,
  };

  if (!settings) {
    return defaultConfig;
  }

  // New settings structure (visual builder)
  if (settings.advancedFormFields || settings.advancedFormButtons) {
    return {
      fields: settings.advancedFormFields || [],
      buttons: settings.advancedFormButtons || [],
      showReset: settings.showReset !== false,
      resetLabel: settings.resetLabel || 'Clear Form',
      resetPosition: settings.resetPosition || 'left',
      successMessage: settings.successMessage || 'Form submitted successfully.',
      clearAfterSubmit: settings.clearAfterSubmit === true,
    };
  }

  // Legacy JSON string format (backwards compatibility)
  if (settings.advancedFormConfig) {
    let config = settings.advancedFormConfig;

    // Parse JSON string if needed
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        console.error('Failed to parse Advanced Form configuration:', e);
        return defaultConfig;
      }
    }

    return {
      ...defaultConfig,
      ...config,
    };
  }

  return defaultConfig;
}

const NeoAdvancedForm: React.FC<ChartProps> = (props) => {
  const { settings, parameters, queryCallback, setGlobalParameter, getGlobalParameter, createNotification } = props;

  // Parse form configuration from advanced settings
  const formConfig = parseFormConfig(settings);

  // Form state
  const [formState, setFormState] = useState<FormState>(() => ({
    values: initializeFormValues(formConfig.fields),
    errors: {},
    touched: {},
  }));

  const [status, setStatus] = useState<FormStatus>(FormStatus.DATA_ENTRY);
  const [formResults, setFormResults] = useState<any[]>([]);

  // Debounced query execution
  const debouncedRunQuery = useCallback(
    debounce((query: string, params: Record<string, any>, callback: any) => {
      if (queryCallback) {
        queryCallback(query, params, callback);
      }
    }, RUN_QUERY_DELAY_MS),
    [queryCallback]
  );

  // Re-initialize form values when config changes
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      values: initializeFormValues(formConfig.fields),
    }));
  }, [JSON.stringify(formConfig.fields)]);

  /**
   * Update a single field value
   */
  const setFieldValue = (fieldName: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [fieldName]: value,
      },
      // Clear error when field is modified
      errors: {
        ...prev.errors,
        [fieldName]: '',
      },
    }));
  };

  /**
   * Mark field as touched (for validation display)
   */
  const setFieldTouched = (fieldName: string) => {
    setFormState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        [fieldName]: true,
      },
    }));
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormState({
      values: initializeFormValues(formConfig.fields),
      errors: {},
      touched: {},
    });
    setStatus(FormStatus.DATA_ENTRY);
  };

  /**
   * Handle form submission for a specific button
   */
  const handleSubmit = (button: ButtonConfig) => {
    // Validate form for this button's requirements
    const validation = validateForButton(formConfig.fields, formState.values, button.requiresFields);

    if (!validation.isValid) {
      setFormState((prev) => ({
        ...prev,
        errors: validation.errors,
      }));
      return;
    }

    // Check if query exists
    if (!button.query || !button.query.trim()) {
      if (createNotification) {
        createNotification('No query specified', 'The button has no query defined to execute.');
      }
      return;
    }

    // Build query parameters (merge global parameters with form values)
    const formParams = getQueryParameters(formConfig.fields, formState.values);
    const queryParams = {
      ...parameters,
      ...formParams,
    };

    setStatus(FormStatus.RUNNING);

    debouncedRunQuery(button.query, queryParams, (records: any[]) => {
      setFormResults(records);

      if (records?.[0]?.error) {
        setStatus(FormStatus.ERROR);
      } else if (formConfig.clearAfterSubmit) {
        resetForm();
      } else {
        setStatus(FormStatus.SUBMITTED);
      }
    });
  };

  // Render: Data Entry Mode or Submitted Mode
  if (status === FormStatus.DATA_ENTRY || status === FormStatus.SUBMITTED) {
    return (
      <div style={{ padding: 5 }}>
        {/* Success message */}
        {status === FormStatus.SUBMITTED && formConfig.successMessage && (
          <div
            style={{
              marginBottom: 15,
              marginLeft: 15,
              marginRight: 15,
              padding: 12,
              backgroundColor: 'var(--ciandt-accent, #4caf50)',
              borderRadius: 4,
              color: 'white',
              fontWeight: 500,
            }}
          >
            {formConfig.successMessage}
          </div>
        )}

        {/* Form fields */}
        {formConfig.fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={formState.values[field.name]}
            error={formState.errors[field.name]}
            onChange={(value) => setFieldValue(field.name, value)}
            onBlur={() => setFieldTouched(field.name)}
            disabled={status === FormStatus.RUNNING}
            parameters={parameters}
            queryCallback={queryCallback}
            setGlobalParameter={setGlobalParameter}
            getGlobalParameter={getGlobalParameter}
          />
        ))}

        {/* Buttons */}
        <ButtonGroup
          buttons={formConfig.buttons}
          showReset={formConfig.showReset ?? true}
          resetLabel={formConfig.resetLabel ?? 'Clear Form'}
          resetPosition={formConfig.resetPosition ?? 'left'}
          onSubmit={handleSubmit}
          onReset={resetForm}
          isSubmitting={status === FormStatus.RUNNING}
          submitDisabled={false}
        />
      </div>
    );
  }

  // Render: Running Mode (loading spinner)
  if (status === FormStatus.RUNNING) {
    return (
      <div
        style={{
          margin: 10,
          minHeight: 200,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {REPORT_LOADING_ICON}
      </div>
    );
  }

  // Render: Error Mode
  if (status === FormStatus.ERROR) {
    return (
      <div style={{ padding: 10 }}>
        <div
          style={{
            marginBottom: 10,
            marginLeft: 15,
            color: '#d32f2f',
            fontWeight: 500,
          }}
        >
          Unable to submit form. A query error has occurred:
        </div>
        <div style={{ marginLeft: 15, marginRight: 15 }}>
          <NeoCodeViewerComponent
            value={formResults?.[0]?.error || 'Unknown error'}
            placeholder='Unknown query error, check the browser console.'
          />
        </div>
        <div style={{ marginTop: 15 }}>
          <ButtonGroup
            buttons={[]}
            showReset={true}
            resetLabel='Try Again'
            resetPosition='left'
            onSubmit={() => {}}
            onReset={resetForm}
            isSubmitting={false}
            submitDisabled={false}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default NeoAdvancedForm;
