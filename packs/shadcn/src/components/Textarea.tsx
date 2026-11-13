import React, { useRef } from 'react';
import { Field, fieldAria } from '../lib/Field';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { FIELD, useLooks } from '../lib/ui2/inputs/looks';
import { isEnter, useReseed } from '../lib/ui2/inputs/parts';
import { FieldLoading } from '../lib/ui2/loading/look';
import { useValueSetter } from '../lib/sameValue';
import '../styles/ui2-inputs.css';

export const Textarea = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Label' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({
    name: 'placeholder',
    label: 'Placeholder',
    initialValue: 'Enter text',
  });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  // The value: exposed, and seeded from the Default value (an app that sets `value` itself keeps working).
  const [rawValue, setValue] = ToolJet.useStateString({
    name: 'value',
    initialValue: defaultValue,
    inspector: 'hidden',
  });
  const [legacyDisabled] = ToolJet.useStateBoolean({
    name: 'disabled',
    label: 'Disable',
    initialValue: false,
    inspector: 'hidden',
  });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onEnterPressed = ToolJet.useEventCallback({ name: 'onEnterPressed' });
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  // A setText or clear that leaves the value as it is fires nothing (lib/sameValue); typing always fires.
  const valueSetter = useValueSetter<unknown>(rawValue, (v) => setValue(v as string));
  const change = (next: string, fromAction = false) => {
    if (!valueSetter.set(next) && fromAction) return;
    onChange();
  };
  useReseed(defaultValue, () => setValue(String(defaultValue ?? '')));

  const setText = (next: unknown) => {
    change(next === null || next === undefined ? '' : String(next), true);
    check.touch();
  };
  ToolJet.useAction(
    { name: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text' }] },
    setText
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => setText(''));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => areaRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => areaRef.current?.blur());

  const fieldId = ToolJet.useFieldId();
  const control = ToolJet.useControlState();
  const check = ToolJet.useValidation({ kind: 'text', value });
  const looks = useLooks(FIELD);
  ToolJet.useComponentSettings({ role: 'textarea', fit: true, loading: 'own', defaultWidth: 14, defaultHeight: 12 });

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
