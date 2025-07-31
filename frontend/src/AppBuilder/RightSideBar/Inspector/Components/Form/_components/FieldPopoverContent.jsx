import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isEqual } from 'lodash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import Dropdown from '@/components/ui/Dropdown/Index';
import Popover from 'react-bootstrap/Popover';
import { Button } from '@/components/ui/Button/Button';
import { getInputTypeOptions, isPropertyFxControlled, isTrueValue } from '../utils/utils';

const FieldPopoverContent = ({
  field,
  onChange,
  onClose,
  darkMode = false,
  mode = 'edit',
  onDropdownOpen,
  onDropdownClose,
  setSelectedComponents,
}) => {
  const [localField, setLocalField] = useState(field ?? {});

  useEffect(() => {
    setLocalField({ ...field });
  }, [field]);

  // Memoize expensive computations
  const isVisibilityFxControlled = useMemo(
    () => (mode === 'edit' ? isPropertyFxControlled(localField.visibility) : false),
    [mode, localField.visibility]
  );

  const isCurrentlyVisibility = useMemo(
    () => (mode === 'edit' ? isTrueValue(localField.visibility?.value) : false),
    [mode, localField.visibility?.value]
  );

  const inputTypeOptions = useMemo(() => getInputTypeOptions(darkMode), [darkMode]);

  const handleFieldChange = useCallback((property, value) => {
    if (property === 'mandatory' || property === 'visibility') {
      return setLocalField((prevField) => ({
        ...prevField,
        [property]: { ...prevField[property], value },
      }));
    }
    setLocalField((prevField) => ({ ...prevField, [property]: value }));
  }, []);

  const handleFxChange = useCallback((property, fxActive) => {
    setLocalField((prevField) => ({
      ...prevField,
      [property]: { ...prevField[property], fxActive },
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    onChange?.(localField);
    if (mode !== 'edit') {
      onClose?.();
    }
  }, [localField, onChange, onClose, mode]);

  const renderPlaceholder = () => {
    if (
      [
        'Checkbox',
        'RadioButtonV2',
        'Datepicker',
        'DatetimePickerV2',
        'Checkbox',
        'ToggleSwitchV2',
        'DatePickerV2',
        'TimePicker',
        'DaterangePicker',
      ].includes(localField.componentType)
    )
      return null;
    return (
      <div>
        <label className="tw-text-text-default base-medium">Placeholder</label>
        <CodeHinter
          type={'basic'}
          initialValue={localField.placeholder || ''}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          onChange={(value) => handleFieldChange('placeholder', value)}
        />
      </div>
    );
  };

  const renderDefaultValue = () => {
    if (['RadioButtonV2', 'DropdownV2', 'MultiselectV2'].includes(localField.componentType)) return null;

    return (
      <div>
        <label className="tw-text-text-default base-medium">Default value</label>
        <CodeHinter
          type={'basic'}
          initialValue={localField.value || ''}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          onChange={(value) => handleFieldChange('value', value)}
        />
      </div>
    );
  };

  return (
    <>
      <Popover.Header className="d-flex justify-content-between align-items-center tw-px-4 tw-py-2 form-field-popover-header bg-white">
        <span className="tw-text-text-default base-medium">{mode === 'edit' ? 'Edit field' : 'New custom field'}</span>
        <div className="tw-flex">
          {mode === 'edit' ? (
            <>
              <Button
                iconOnly
                leadingIcon="inspect"
                variant="ghost"
                size="medium"
                onClick={() => setSelectedComponents([field.componentId])}
              />
              <Button
                iconOnly
                leadingIcon={isCurrentlyVisibility ? 'eye' : 'eyedisable'}
                variant="ghost"
                size="medium"
                disabled={isVisibilityFxControlled}
                className={`${isVisibilityFxControlled ? 'tw-opacity-50' : ''}`}
                onClick={() => {
                  handleFieldChange('visibility', !isCurrentlyVisibility);
                }}
              />
            </>
          ) : (
            <Button iconOnly leadingIcon="remove" variant="ghost" size="medium" onClick={onClose} />
          )}
        </div>
      </Popover.Header>
      <Popover.Body className="bg-white tw-p-4 form-field-popover-body">
        <div className="tw-space-y-[12px]">
          <div>
            <Dropdown
              options={inputTypeOptions}
              name="field-type"
              id="field-type"
              size="medium"
              zIndex={9999}
              value={localField.componentType || 'TextInput'}
              leadingIcon={inputTypeOptions[localField.componentType || 'TextInput'].leadingIcon}
              onChange={(value) => {
                handleFieldChange('componentType', value);
              }}
              width="100%"
              label="Component"
              onOpen={onDropdownOpen}
              onClose={onDropdownClose}
            />
          </div>

          <div>
            <label className="tw-text-text-default base-medium">Label</label>
            <CodeHinter
              type={'basic'}
              initialValue={localField.label || ''}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              onChange={(value) => handleFieldChange('label', value)}
            />
          </div>

          {renderPlaceholder()}
          {renderDefaultValue()}

          <div className="field mb-2">
            <CodeHinter
              initialValue={localField.mandatory?.value ?? false}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              type={'fxEditor'}
              paramLabel={'Make this field mandatory'}
              paramName={'isMandatory'}
              fxActive={localField.mandatory?.fxActive ?? false}
              fieldMeta={{
                type: 'toggle',
                displayName: 'Make editable',
              }}
              paramType={'toggle'}
              onChange={(value) => handleFieldChange('mandatory', value)}
              onFxPress={(active) => handleFxChange('mandatory', active)}
            />
          </div>
          {mode === 'edit' && (
            <div className="field m-0">
              <CodeHinter
                initialValue={localField.visibility?.value ?? true}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                type={'fxEditor'}
                paramLabel={'Visibility'}
                paramName={'visible'}
                fxActive={localField.visibility?.fxActive ?? false}
                fieldMeta={{
                  type: 'toggle',
                  displayName: 'Make editable',
                }}
                paramType={'toggle'}
                onChange={(value) => handleFieldChange('visibility', value)}
                onFxPress={(active) => handleFxChange('visibility', active)}
              />
            </div>
          )}
          <Button
            leadingIcon={mode === 'edit' ? 'save' : 'plus'}
            variant="secondary"
            onClick={handleSubmit}
            className="tw-w-full tw-rounded-[6px]"
            disabled={field && isEqual(localField, field)}
          >
            {mode === 'edit' ? 'Save' : 'Add Field'}
          </Button>
        </div>
      </Popover.Body>
    </>
  );
};

export default React.memo(FieldPopoverContent);
