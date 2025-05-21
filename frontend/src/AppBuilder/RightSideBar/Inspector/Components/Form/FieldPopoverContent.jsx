import React from 'react';
import CodeHinter from '@/AppBuilder/CodeEditor';
import Dropdown from '@/components/ui/Dropdown/Index';
import Popover from 'react-bootstrap/Popover';
import { Button } from '@/components/ui/Button/Button';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { useDropdownState } from './hooks/useDropdownState';

const darkMode = false; // This should be passed as a prop or context

const inputTypeOptions = {
  'Text input': {
    value: 'text',
    icon: <WidgetIcon name={'textinput'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
  },
  'Number input': {
    value: 'number',
    icon: <WidgetIcon name={'numberinput'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
  },
  'Date picker': {
    value: 'date',
    icon: <WidgetIcon name={'datepicker'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
  },
  Checkbox: {
    value: 'checkbox',
    icon: <WidgetIcon name={'checkbox'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
  },
  Dropdown: {
    value: 'dropdown',
    icon: <WidgetIcon name={'dropdown'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
  },
  Multiselect: {
    value: 'multiselect',
    icon: <WidgetIcon name={'multiselect'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
  },
};

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
  const { handleDropdownOpen, handleDropdownClose } = useDropdownState();

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
              zIndex={1071}
              value={field.type || 'text'}
              onChange={(value) => {
                if (!shouldPreventPopoverClose) {
                  onChange?.({ ...field, type: value });
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
