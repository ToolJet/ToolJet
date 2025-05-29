import React, { useState, useEffect } from 'react';
import CodeHinter from '@/AppBuilder/CodeEditor';
import Dropdown from '@/components/ui/Dropdown/Index';
import Popover from 'react-bootstrap/Popover';
import { Button } from '@/components/ui/Button/Button';
import { getInputTypeOptions } from './utils';

const FieldPopoverContent = ({
  field,
  onChange,
  onClose,
  darkMode = false,
  mode = 'edit',
  onDropdownOpen,
  onDropdownClose,
}) => {
  // Initialize local state with the provided field
  const [localField, setLocalField] = useState(field ?? {});

  // Update local state if external field prop changes
  useEffect(() => {
    setLocalField({ ...field });
  }, [field]);

  const inputTypeOptions = getInputTypeOptions(darkMode);

  // Handle changes to any field property
  const handleFieldChange = (property, value) => {
    if (property === 'mandatory' || property === 'selected') {
      return setLocalField((prevField) => ({
        ...prevField,
        [property]: { ...prevField[property], value },
      }));
    }
    setLocalField((prevField) => ({ ...prevField, [property]: value }));
  };

  const handleFxChange = (property, fxActive) => {
    setLocalField((prevField) => ({
      ...prevField,
      [property]: { ...prevField[property], fxActive },
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    onChange?.(localField);
    if (mode !== 'edit') {
      onClose?.();
    }
  };

  const renderPlaceholder = () => {
    if (['Checkbox', 'RadioButtonV2', 'Datepicker'].includes(localField.componentType)) return null;
    return (
      <div>
        <label className="tw-text-text-default base-medium">Placeholder</label>
        <CodeHinter
          type={'basic'}
          initialValue={localField.placeholder || ''}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={'Enter email id'}
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
          placeholder={'{{}}'}
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
              <Button iconOnly leadingIcon="inspect" variant="ghost" size="medium" />
              <Button iconOnly leadingIcon="eyedisable" variant="ghost" size="medium" />
            </>
          ) : (
            <Button iconOnly leadingIcon="remove" variant="ghost" size="medium" />
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
              placeholder={'Email id'}
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
                initialValue={localField.selected?.value ?? true}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                type={'fxEditor'}
                paramLabel={'Visibility'}
                paramName={'visible'}
                fxActive={localField.selected?.fxActive ?? false}
                fieldMeta={{
                  type: 'toggle',
                  displayName: 'Make editable',
                }}
                paramType={'toggle'}
                onChange={(value) => handleFieldChange('selected', value)}
                onFxPress={(active) => handleFxChange('selected', active)}
              />
            </div>
          )}
          <Button
            leadingIcon={mode === 'edit' ? 'save' : 'plus'}
            variant="primary"
            onClick={handleSubmit}
            className="tw-w-full tw-rounded-[6px]"
          >
            {mode === 'edit' ? 'Save' : 'Add Field'}
          </Button>
        </div>
      </Popover.Body>
    </>
  );
};

export default React.memo(FieldPopoverContent);
