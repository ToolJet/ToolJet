import React, { useRef } from 'react';
import { Field, fieldAria } from '../lib/Field';
import { cn } from '../lib/cn';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { FIELD, useLooks } from '../lib/ui2/inputs/looks';
import { ClearX, isEnter, useReseed } from '../lib/ui2/inputs/parts';
import { FieldLoading } from '../lib/ui2/loading/look';
import { useValueSetter } from '../lib/sameValue';
import '../styles/ui2-inputs.css';

// UI 2.0's format check for type email and url (Ui2/Input/Input.tsx), before the Validation section's rules.
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const typeRule = (type: string, value: string): string => {
  const text = value.trim();
  if (!text) return '';
  if (type === 'email') return EMAIL.test(text) ? '' : 'Enter a valid email address';
  if (type === 'url') {
    try {
      new URL(text); // eslint-disable-line no-new
      return '';
    } catch {
      return 'Enter a valid URL';
    }
  }
  return '';
};

const TYPES = ['text', 'email', 'url', 'number', 'password', 'search', 'tel'];

export const Input = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Label' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({
    name: 'placeholder',
    label: 'Placeholder',
    initialValue: 'Enter text',
  });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  const [inputType] = ToolJet.useStateEnumeration({
    name: 'inputType',
    label: 'Type',
    enumDefinition: ['text', 'email', 'url', 'number', 'password', 'search', 'tel'],
    enumLabels: {
      text: 'Text',
      email: 'Email',
      url: 'URL',
      number: 'Number',
      password: 'Password',
      search: 'Search',
      tel: 'Phone',
    },
    initialValue: 'text',
  });
  const [showClearBtn] = ToolJet.useStateBoolean({
    name: 'showClearBtn',
    label: 'Show clear button',
    initialValue: false,
  });
  // The value: exposed, and seeded from the Default value (an app that sets `value` itself keeps working).
  const [rawValue, setValue] = ToolJet.useStateString({
    name: 'value',
    initialValue: defaultValue,
    inspector: 'hidden',
  });
  // The pack's own Disable, before the host's (disabledState, read through useControlState).
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
  const inputRef = useRef<HTMLInputElement>(null);
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  const type = TYPES.includes(String(inputType).toLowerCase()) ? String(inputType).toLowerCase() : 'text';
  const isNumber = type === 'number';
  // Type number publishes a number (null when empty), as UI 2.0's number box does.
  // A setText or clear that leaves the value as it is fires nothing (lib/sameValue); typing always fires.
  const valueSetter = useValueSetter<unknown>(rawValue, (v) => setValue(v as string));
  const publish = (text: string) => {
    const n = text.trim() === '' ? null : Number(text);
    return valueSetter.set(isNumber ? (n !== null && Number.isFinite(n) ? n : null) : text);
  };
  const change = (text: string, fromAction = false) => {
    if (!publish(text) && fromAction) return;
    onChange();
  };
  useReseed(defaultValue, () => publish(String(defaultValue ?? '')));

  const setText = (next: unknown) => {
    change(next === null || next === undefined ? '' : String(next), true);
    rule.touch();
  };
  ToolJet.useAction(
    { name: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text' }] },
    setText
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => setText(''));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => inputRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => inputRef.current?.blur());

  const fieldId = ToolJet.useFieldId();
  const control = ToolJet.useControlState();
  const rule = ToolJet.useValidation({
    kind: 'text',
    value: isNumber && value !== '' ? Number(value) : value,
    rule: typeRule(type, value),
  });
  const looks = useLooks(FIELD);
  ToolJet.useComponentSettings({
    role: 'input',
    fit: true,
    loading: 'own',
    usage: 'A text field with a label: value is its text (also the default); the Validation section sets isValid.',
    defaultWidth: 10,
    defaultHeight: 7,
  });

  const disabled = legacyDisabled || control.disabled;
  // Type search clears as a browser's search box does (an x, and Escape); Show clear button gives every type the x.
  const withClear = type === 'search' || showClearBtn;
  const clearable = withClear && !!value && !disabled && !control.loading;
  const box = (
    <input
      ref={inputRef}
      {...fieldAria(fieldId, rule.error, rule.required, !!description)}
      className="ui-input"
      type={type}
      inputMode={type === 'url' ? 'url' : isNumber ? 'decimal' : undefined}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => change(e.target.value)}
      onKeyDown={(e) => {
        if (isEnter(e)) onEnterPressed();
        else if (type === 'search' && e.key === 'Escape' && value) {
          e.preventDefault();
          change('');
        }
      }}
      onFocus={onFocus}
      onBlur={() => {
        rule.touch();
        onBlur();
      }}
    />
  );

  return (
    <div className="ui ui2-in" style={looks}>
      <Field label={label} description={description} htmlFor={fieldId} error={rule.error} required={rule.required}>
        <FieldLoading loading={control.loading}>
          {withClear ? (
            <div className={cn('ui2-with-clear', clearable && 'has-x')}>
              {box}
              {clearable ? (
                <ClearX
                  onClear={() => {
                    change('');
                    inputRef.current?.focus();
                  }}
                />
              ) : null}
            </div>
          ) : (
            box
          )}
        </FieldLoading>
      </Field>
    </div>
  );
};
