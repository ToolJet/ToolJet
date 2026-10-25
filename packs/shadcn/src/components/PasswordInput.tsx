import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { cn } from '../lib/cn';
import { TJ } from '../lib/ui2/inputs/sdk';
import { field, useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { TOKEN } from '../lib/styleDefaults';
import { isEnter, useReseed, useRuleCheck } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import { FieldLoading } from '../lib/ui2/loading/look';
import { useValueSetter } from '../lib/sameValue';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ...field(),
  ['iconColor', 'Eye icon color', '--lk-icon', TOKEN.mutedText],
  ['weakColor', 'Strength color: weak', '--lk-weak', TOKEN.error],
  ['fairColor', 'Strength color: fair', '--lk-fair', TOKEN.warning],
  ['strongColor', 'Strength color: strong', '--lk-strong', TOKEN.success],
  ['meterTrackColor', 'Strength meter track color', '--lk-track', TOKEN.muted],
];

export const PasswordInput = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Password' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = TJ.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Enter password' });
  const [defaultValue] = TJ.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  const [showToggle] = TJ.useStateBoolean({ name: 'showToggle', label: 'Show/hide button', initialValue: true });
  const [showStrength] = TJ.useStateBoolean({ name: 'showStrength', label: 'Strength meter', initialValue: false });
  const [rawValue, setValue] = TJ.useStateString({ name: 'value', initialValue: defaultValue, inspector: 'hidden' });
  const [, setStrength] = TJ.useStateString({ name: 'strength', initialValue: '', inspector: 'hidden' });
  // The pack's earlier names, honoured when set; the Validation section's Min length and Mandatory replace them.
  const [legacyMinLength] = TJ.useStateNumber({ name: 'minLength', label: 'Min length', initialValue: 0, inspector: 'hidden' });
  const [legacyRequired] = TJ.useStateBoolean({ name: 'required', label: 'Required', initialValue: false, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });
  const onEnterPressed = TJ.useEventCallback({ name: 'onEnterPressed' });
  const onFocus = TJ.useEventCallback({ name: 'onFocus' });
  const onBlur = TJ.useEventCallback({ name: 'onBlur' });

  const inputRef = useRef<HTMLInputElement>(null);
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  const strength = M.passwordStrength(value);
  // A setText or clear that leaves the value as it is fires nothing (lib/sameValue); typing always fires.
  const valueSetter = useValueSetter<unknown>(rawValue, (v) => {
    setValue(v as string);
    setStrength(M.passwordStrength(String(v ?? '')).level);
  });
  const publish = (next: string) => valueSetter.set(next);
  const change = (next: string, fromAction = false) => {
    if (!publish(next) && fromAction) return;
    onChange();
  };
  useReseed(defaultValue, () => {
    setValue(String(defaultValue ?? ''));
    setStrength(M.passwordStrength(String(defaultValue ?? '')).level);
  });

  const setText = (next: unknown) => {
    change(next === null || next === undefined ? '' : String(next), true);
    rule.touch();
  };
  TJ.useAction({ name: 'setText', displayName: 'Set text', params: [{ handle: 'value', displayName: 'Value' }] }, setText);
  TJ.useAction({ name: 'clear', displayName: 'Clear' }, () => setText(''));
  TJ.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => inputRef.current?.focus());
  TJ.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => inputRef.current?.blur());

  const fieldId = TJ.useFieldId();
  const control = TJ.useControlState();
  const check = TJ.useValidation({ section: 'text', value });
  const minLength = Number(legacyMinLength) || 0;
  const rule = useRuleCheck(
    check,
    legacyRequired && !value
      ? 'This field is mandatory'
      : value && value.length < minLength
        ? `Minimum ${minLength} characters is needed`
        : ''
  );
  const looks = useLooks(LOOKS);
  TJ.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });

  // Turning the toggle off masks a password it revealed, and turning it back on starts masked.
  const canReveal = showToggle !== false;
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!canReveal) setRevealed(false);
  }, [canReveal]);
  const visible = revealed && canReveal;
  const disabled = legacyDisabled || control.disabled;
  const meter = showStrength === true && !control.loading;

  return (
    <div className="ui ui2-in" style={looks}>
      <Field label={label} description={description} htmlFor={fieldId} error={rule.error} required={rule.required}>
        <FieldLoading loading={control.loading}>
          <div className={cn('ui-input ui2-group', disabled && 'is-disabled')}>
            <input
              ref={inputRef}
              {...fieldAria(fieldId, rule.error, rule.required, !!description)}
              type={visible ? 'text' : 'password'}
              autoComplete={showStrength ? 'new-password' : 'current-password'}
              className="ui2-inner"
              style={canReveal ? { paddingRight: 4 } : undefined}
              value={value}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(e) => change(e.target.value)}
              onKeyDown={(e) => isEnter(e) && onEnterPressed()}
              onFocus={onFocus}
              onBlur={() => {
                rule.touch();
                onBlur();
              }}
            />
            {canReveal && !control.loading ? (
              <button
                type="button"
                className="ui2-end-btn"
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setRevealed((v) => !v)}
              >
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ) : null}
          </div>
          {meter ? (
            <div className="ui2-meter" data-strength={strength.level || 'empty'}>
              <div className="ui2-meter-bars" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={cn('ui2-meter-bar', i < strength.segments && `is-${strength.level}`)} />
                ))}
              </div>
              <span aria-live="polite" className={cn('ui2-meter-word', strength.level && `is-${strength.level}`)}>
                {strength.label}
              </span>
            </div>
          ) : null}
        </FieldLoading>
      </Field>
    </div>
  );
};
