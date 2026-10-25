import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { cn } from '../lib/cn';
import { TJ } from '../lib/ui2/inputs/sdk';
import { field, useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { TOKEN } from '../lib/styleDefaults';
import { ClearX, boundsRule, isEnter, useReseed, useRuleCheck } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import { FieldLoading } from '../lib/ui2/loading/look';
import { useValueSetter } from '../lib/sameValue';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ...field(),
  ['stepperBackgroundColor', 'Step button background', '--lk-step-bg', 'transparent'],
  ['stepperIconColor', 'Step button icon color', '--lk-step-fg', TOKEN.mutedText],
  ['stepperHoverColor', 'Step button hover background', '--lk-step-hover', TOKEN.muted],
  ['affixColor', 'Prefix and suffix color', '--lk-affix', TOKEN.mutedText],
];

export const NumberInput = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Quantity' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = TJ.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '0' });
  const [defaultValue] = TJ.useStateNumber({ name: 'defaultValue', label: 'Default value', initialValue: 1 });
  const [decimalPlaces] = TJ.useStateNumber({ name: 'decimalPlaces', label: 'Decimal places', initialValue: 2 });
  const [step] = TJ.useStateNumber({ name: 'step', label: 'Step', initialValue: 1 });
  const [stepper] = TJ.useStateEnumeration({
    name: 'stepper',
    label: 'Step buttons',
    enumDefinition: ['split', 'stacked', 'none'],
    enumLabels: { split: 'Split -/+', stacked: 'Stacked', none: 'None' },
    initialValue: 'split',
    inspector: 'switch',
  });
  const [prefix] = TJ.useStateString({ name: 'prefix', label: 'Prefix (inside the box)', initialValue: '' });
  const [suffix] = TJ.useStateString({ name: 'suffix', label: 'Suffix (inside the box)', initialValue: '' });
  const [thousandSeparator] = TJ.useStateBoolean({ name: 'thousandSeparator', label: 'Thousands separators', initialValue: true });
  const [showClearBtn] = TJ.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // UI 2.0 keeps these in its Validation section, which has no number kind for packs: they are properties here.
  const [minValue] = TJ.useStateString({ name: 'minValue', label: 'Min value', description: 'Leave empty for no limit.', initialValue: '' });
  const [maxValue] = TJ.useStateString({ name: 'maxValue', label: 'Max value', description: 'Leave empty for no limit.', initialValue: '' });
  const [rawValue, setValue] = TJ.useStateNumber({ name: 'value', initialValue: defaultValue, inspector: 'hidden' });
  // The pack's earlier names, honoured when set: min, max, required and disabled.
  const [legacyMin] = TJ.useStateString({ name: 'min', label: 'Min', initialValue: '', inspector: 'hidden' });
  const [legacyMax] = TJ.useStateString({ name: 'max', label: 'Max', initialValue: '', inspector: 'hidden' });
  const [legacyRequired] = TJ.useStateBoolean({ name: 'required', label: 'Required', initialValue: false, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });
  const onEnterPressed = TJ.useEventCallback({ name: 'onEnterPressed' });
  const onFocus = TJ.useEventCallback({ name: 'onFocus' });
  const onBlur = TJ.useEventCallback({ name: 'onBlur' });

  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const decimals = M.clampInt(decimalPlaces, 0, 10, 2);
  const round = (n: number | null) => M.roundTo(n, decimals);
  const value = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : M.parseNumber(rawValue);
  const lo = M.parseNumber(minValue) ?? M.parseNumber(legacyMin);
  const hi = M.parseNumber(maxValue) ?? M.parseNumber(legacyMax);

  const publish = (next: number | null) => setValue(next as number);
  // From the latest value, so a second call in one batch compares with the first's (lib/sameValue).
  const valueSetter = useValueSetter<number | null>(value, publish);
  /** Sets the value as the user does: onChange when it changed. */
  const commit = (next: number | null) => {
    if (valueSetter.set(next)) onChange();
  };
  /** Sets the value from an action (setText, clear): onChange only when the number changes. */
  const set = (v: unknown) => {
    setDraft(null);
    rule.touch();
    if (valueSetter.set(round(M.parseNumber(v)))) onChange();
  };
  // On mount an untouched Default value leaves a number the app set (`value`, the pack's earlier name) alone.
  useReseed(
    defaultValue,
    () => {
      setDraft(null);
      publish(round(M.parseNumber(defaultValue)));
    },
    { onMount: !(defaultValue === 1 && value !== null) }
  );
  // A Form's clear empties `value` itself; the typed draft is the widget's own, and a focused box would keep showing it
  // over the cleared value until blur.
  TJ.useFormClear(() => {
    setDraft(null);
    publish(null);
  });

  TJ.useAction({ name: 'setText', displayName: 'Set text', params: [{ handle: 'value', displayName: 'Value' }] }, set);
  TJ.useAction({ name: 'clear', displayName: 'Clear' }, () => set(null));
  TJ.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => inputRef.current?.focus());
  TJ.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => inputRef.current?.blur());

  const fieldId = TJ.useFieldId();
  const control = TJ.useControlState();
  const check = TJ.useValidation({ section: 'choice', value, present: value !== null });
  const rule = useRuleCheck(
    check,
    boundsRule(value, lo, hi) || (legacyRequired && value === null ? 'This field is mandatory' : '')
  );
  const looks = useLooks(LOOKS);
  TJ.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });

  const disabled = legacyDisabled || control.disabled;
  const bump = (dir: number) => {
    if (disabled) return;
    const next = M.stepValue(value, step, dir, { min: lo, max: hi, decimals });
    if (draft !== null) setDraft(next === null ? '' : String(next));
    commit(next);
  };
  const layout = ['split', 'stacked', 'none'].includes(stepper) ? stepper : 'split';
  const steppers = layout !== 'none' && !control.loading;
  const atMin = lo !== null && value !== null && value <= lo;
  const atMax = hi !== null && value !== null && value >= hi;
  const shown = draft !== null ? draft : M.formatNumber(value, { decimals, grouping: thousandSeparator !== false });
  const clearable = showClearBtn && (value !== null || !!draft) && !disabled && !control.loading;

  return (
    <div className="ui ui2-in" style={looks}>
      <Field label={label} description={description} htmlFor={fieldId} error={rule.error} required={rule.required}>
        <FieldLoading loading={control.loading}>
          <div className={cn('ui-input ui2-group', disabled && 'is-disabled')}>
            {steppers && layout === 'split' ? (
              <button type="button" tabIndex={-1} aria-label="Decrease" className="ui2-step is-start" disabled={disabled || atMin} onClick={() => bump(-1)}>
                <Minus size={16} />
              </button>
            ) : null}
            {prefix ? (
              <span className="ui2-affix is-start">
                <span>{prefix}</span>
              </span>
            ) : null}
            <input
              ref={inputRef}
              {...fieldAria(fieldId, rule.error, rule.required, !!description)}
              role="spinbutton"
              aria-valuenow={value ?? undefined}
              aria-valuemin={lo ?? undefined}
              aria-valuemax={hi ?? undefined}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className={cn(
                'ui2-inner ui2-tabular',
                prefix && 'has-start',
                suffix && 'has-end',
                layout === 'split' && !prefix && !suffix && 'is-centered'
              )}
              placeholder={placeholder}
              disabled={disabled}
              value={shown}
              onChange={(e) => {
                const typed = M.numericText(e.target.value);
                setDraft(typed);
                commit(round(M.parseNumber(typed)));
              }}
              onFocus={() => {
                setDraft(value === null ? '' : String(value));
                onFocus();
              }}
              onBlur={() => {
                setDraft(null);
                rule.touch();
                onBlur();
              }}
              onKeyDown={(e) => {
                if (isEnter(e)) onEnterPressed();
                else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  bump(e.key === 'ArrowUp' ? 1 : -1);
                }
              }}
            />
            {suffix ? (
              <span className="ui2-affix is-end">
                <span>{suffix}</span>
              </span>
            ) : null}
            {clearable ? (
              <ClearX
                onClear={() => {
                  setDraft((d) => (d === null ? null : ''));
                  commit(null);
                  inputRef.current?.focus();
                }}
              />
            ) : null}
            {steppers && layout === 'split' ? (
              <button type="button" tabIndex={-1} aria-label="Increase" className="ui2-step is-end" disabled={disabled || atMax} onClick={() => bump(1)}>
                <Plus size={16} />
              </button>
            ) : null}
            {steppers && layout === 'stacked' ? (
              <div className="ui2-steps">
                <button type="button" tabIndex={-1} aria-label="Increase" className="ui2-step" disabled={disabled || atMax} onClick={() => bump(1)}>
                  <ChevronUp size={14} />
                </button>
                <button type="button" tabIndex={-1} aria-label="Decrease" className="ui2-step" disabled={disabled || atMin} onClick={() => bump(-1)}>
                  <ChevronDown size={14} />
                </button>
              </div>
            ) : null}
          </div>
        </FieldLoading>
      </Field>
    </div>
  );
};
