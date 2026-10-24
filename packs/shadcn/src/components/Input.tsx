import React, { useRef } from 'react';
import { Field, fieldAria } from '../lib/Field';
import { cn } from '../lib/cn';
import { TJ } from '../lib/ui2/inputs/sdk';
import { FIELD, useLooks } from '../lib/ui2/inputs/looks';
import { ClearX, isEnter, useReseed, useRuleCheck } from '../lib/ui2/inputs/parts';
import { FieldLoading } from '../lib/ui2/loading/look';
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
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Label' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = TJ.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Enter text' });
  const [defaultValue] = TJ.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  const [inputType] = TJ.useStateEnumeration({
    name: 'inputType',
    label: 'Type',
    enumDefinition: ['text', 'email', 'url', 'number', 'password', 'search', 'tel'],
    enumLabels: { text: 'Text', email: 'Email', url: 'URL', number: 'Number', password: 'Password', search: 'Search', tel: 'Phone' },
    initialValue: 'text',
  });
  const [showClearBtn] = TJ.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // The value: exposed, and seeded from the Default value (an app that sets `value` itself keeps working).
  const [rawValue, setValue] = TJ.useStateString({ name: 'value', initialValue: defaultValue, inspector: 'hidden' });
  // The pack's own Disable, before the host's (disabledState, read through useControlState).
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onFocus = TJ.useEventCallback({ name: 'onFocus' });
  const onBlur = TJ.useEventCallback({ name: 'onBlur' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });
  const onEnterPressed = TJ.useEventCallback({ name: 'onEnterPressed' });
  const inputRef = useRef<HTMLInputElement>(null);
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  const type = TYPES.includes(String(inputType).toLowerCase()) ? String(inputType).toLowerCase() : 'text';
  const isNumber = type === 'number';
  // Type number publishes a number (null when empty), as UI 2.0's number box does.
  const publish = (text: string) => {
    const n = text.trim() === '' ? null : Number(text);
    setValue((isNumber ? (n !== null && Number.isFinite(n) ? n : null) : text) as string);
  };
  const change = (text: string) => {
    publish(text);
    onChange();
  };
  useReseed(defaultValue, () => publish(String(defaultValue ?? '')));

  const setText = (next: unknown) => {
    change(next === null || next === undefined ? '' : String(next));
    rule.touch();
  };
  TJ.useAction({ name: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text' }] }, setText);
  TJ.useAction({ name: 'clear', displayName: 'Clear' }, () => setText(''));
  TJ.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => inputRef.current?.focus());
  TJ.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => inputRef.current?.blur());
  // The pack's earlier action names, kept for apps that use them.
  TJ.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, setText);
  TJ.useAction({ name: 'focus', displayName: 'Focus' }, () => inputRef.current?.focus());

  const fieldId = TJ.useFieldId();
  const control = TJ.useControlState();
  const check = TJ.useValidation({ section: 'text', value: isNumber && value !== '' ? Number(value) : value });
  const rule = useRuleCheck(check, typeRule(type, value));
  const looks = useLooks(FIELD);
  TJ.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });

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
