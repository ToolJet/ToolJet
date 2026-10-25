import React, { useRef } from 'react';
import { Field, fieldAria } from '../lib/Field';
import { TJ } from '../lib/ui2/inputs/sdk';
import { FIELD, useLooks } from '../lib/ui2/inputs/looks';
import { isEnter, useReseed } from '../lib/ui2/inputs/parts';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-inputs.css';

export const Textarea = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Label' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = TJ.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Enter text' });
  const [defaultValue] = TJ.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  // The value: exposed, and seeded from the Default value (an app that sets `value` itself keeps working).
  const [rawValue, setValue] = TJ.useStateString({ name: 'value', initialValue: defaultValue, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onFocus = TJ.useEventCallback({ name: 'onFocus' });
  const onBlur = TJ.useEventCallback({ name: 'onBlur' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });
  const onEnterPressed = TJ.useEventCallback({ name: 'onEnterPressed' });
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  const change = (next: string) => {
    setValue(next);
    onChange();
  };
  useReseed(defaultValue, () => setValue(String(defaultValue ?? '')));

  const setText = (next: unknown) => {
    change(next === null || next === undefined ? '' : String(next));
    check.touch();
  };
  TJ.useAction({ name: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text' }] }, setText);
  TJ.useAction({ name: 'clear', displayName: 'Clear' }, () => setText(''));
  TJ.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => areaRef.current?.focus());
  TJ.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => areaRef.current?.blur());

  const fieldId = TJ.useFieldId();
  const control = TJ.useControlState();
  const check = TJ.useValidation({ section: 'text', value });
  const looks = useLooks(FIELD);
  TJ.useComponentSettings({ defaultWidth: 14, defaultHeight: 12 });

  return (
    <div className="ui ui2-in ui2-textarea-root" style={looks}>
      <Field label={label} description={description} htmlFor={fieldId} error={check.error} required={check.required}>
        <FieldLoading loading={control.loading} grow>
          <textarea
            ref={areaRef}
            {...fieldAria(fieldId, check.error, check.required, !!description)}
            className="ui-textarea"
            value={value}
            placeholder={placeholder}
            disabled={legacyDisabled || control.disabled}
            onChange={(e) => change(e.target.value)}
            // Enter without Shift fires On enter pressed; the new line is still typed, as in UI 2.0.
            onKeyDown={(e) => isEnter(e) && !e.shiftKey && onEnterPressed()}
            onFocus={onFocus}
            onBlur={() => {
              check.touch();
              onBlur();
            }}
          />
        </FieldLoading>
      </Field>
    </div>
  );
};
