import React from 'react';
import CodeHinter from '@/AppBuilder/CodeEditor';
import Dropdown from '@/components/ui/Dropdown/Index';
import Popover from 'react-bootstrap/Popover';
import { Button } from '@/components/ui/Button/Button';
import { useDropdownState } from './hooks/useDropdownState';
import { getInputTypeOptions } from './utils';

const FieldPopoverContent = ({
  field,
  onChange,
  onClose,
  darkMode = false,
  mode = 'edit',
  onDropdownOpen,
  onDropdownClose,
  shouldPreventPopoverClose,
}) => {
  // const { handleDropdownOpen, handleDropdownClose } = useDropdownState();

  const inputTypeOptions = getInputTypeOptions(darkMode);

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
              value={field.component || 'TextComponent'}
              leadingIcon={inputTypeOptions[field.component || 'TextComponent'].leadingIcon}
              onChange={(value) => {
                if (!shouldPreventPopoverClose) {
                  onChange?.({ ...field, component: value });
                }
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
              initialValue={'Hello World'}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Email id'}
              // onChange={(value) => handleLabelChange(value, index)}
            />
          </div>

          <div>
            <label className="tw-text-text-default base-medium">Placeholder</label>
            <CodeHinter
              type={'basic'}
              initialValue={'Hello World'}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Enter email id'}
              // onChange={(value) => handleLabelChange(value, index)}
            />
          </div>

          <div>
            <label className="tw-text-text-default base-medium">Default value</label>
            <CodeHinter
              type={'basic'}
              initialValue={'Hello World'}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'{{}}'}
              // onChange={(value) => handleLabelChange(value, index)}
            />
          </div>

          <div className="field mb-2">
            <CodeHinter
              initialValue={true}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              type={'fxEditor'}
              paramLabel={'Make this field mandatory'}
              paramName={'isMandatory'}
              fxActive={false}
              fieldMeta={{
                type: 'toggle',
                displayName: 'Make editable',
                isFxNotRequired: true,
              }}
              paramType={'toggle'}
            />
          </div>
          {mode === 'edit' ? (
            <div className="field m-0">
              <CodeHinter
                initialValue={true}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                type={'fxEditor'}
                paramLabel={'Visibility'}
                paramName={'visible'}
                fxActive={false}
                fieldMeta={{
                  type: 'toggle',
                  displayName: 'Make editable',
                  isFxNotRequired: true,
                }}
                paramType={'toggle'}
              />
            </div>
          ) : (
            <Button
              leadingIcon="plus"
              variant="primary"
              onClick={() => onChange?.(field)}
              className="tw-w-full tw-rounded-[6px]"
            >
              Add Field
            </Button>
          )}
        </div>
      </Popover.Body>
    </>
  );
};

export default FieldPopoverContent;
