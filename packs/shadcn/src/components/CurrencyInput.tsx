import React, { useRef, useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../lib/usePortalContainer';
import { TJ } from '../lib/ui2/inputs/sdk';
import { POPOVER, field, useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { TOKEN } from '../lib/styleDefaults';
import { ClearX, boundsRule, isEnter, useReseed, useRuleCheck } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import { FieldLoading } from '../lib/ui2/loading/look';
import { useValueSetter } from '../lib/sameValue';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ...field(),
  ['affixColor', 'Currency sign color', '--lk-affix', TOKEN.mutedText],
  ['currencyBackgroundColor', 'Currency picker background', '--lk-addon-bg', 'transparent'],
  ['currencyTextColor', 'Currency picker text color', '--lk-addon-fg', TOKEN.text],
  ...POPOVER,
];

const currencyName = (code: string, locale: string): string => {
  try {
    return new Intl.DisplayNames([locale || 'en-US', 'en-US'], { type: 'currency' }).of(code) || code;
  } catch {
    return code;
  }
};

export const CurrencyInput = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Amount' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = TJ.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '0.00' });
  const [defaultValue] = TJ.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  // Also the exposed currency: setCurrency and the picker change it, a new Currency starts it again.
  const [currencyProp, setCurrencyState] = TJ.useStateString({ name: 'currency', label: 'Currency (ISO code)', initialValue: 'USD' });
  const [currencyOptions] = TJ.useStateArray({
    name: 'currencyOptions',
    label: 'Currencies to choose from (empty: fixed)',
    placeholder: "['USD', 'EUR', 'GBP']",
    initialValue: [],
  });
  const [localeProp] = TJ.useStateString({ name: 'locale', label: 'Number format locale', placeholder: 'en-US, de-DE, en-IN', initialValue: 'en-US' });
  const [decimalPlaces] = TJ.useStateString({ name: 'decimalPlaces', label: "Decimal places (empty: the currency's own)", initialValue: '' });
  const [currencyDisplay] = TJ.useStateEnumeration({
    name: 'currencyDisplay',
    label: 'Currency sign',
    enumDefinition: ['symbol', 'narrowSymbol', 'code'],
    enumLabels: { symbol: 'Symbol', narrowSymbol: 'Narrow', code: 'Code' },
    initialValue: 'symbol',
    inspector: 'switch',
  });
  const [showClearBtn] = TJ.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // UI 2.0 keeps these in its Validation section, which has no number kind for packs: they are properties here.
  const [minValue] = TJ.useStateString({ name: 'minValue', label: 'Min value', description: 'Leave empty for no limit.', initialValue: '' });
  const [maxValue] = TJ.useStateString({ name: 'maxValue', label: 'Max value', description: 'Leave empty for no limit.', initialValue: '' });
  const [rawValue, setValue] = TJ.useStateNumber({ name: 'value', initialValue: M.parseNumber(defaultValue) as number, inspector: 'hidden' });
  const [, setFormattedValue] = TJ.useStateString({ name: 'formattedValue', initialValue: '', inspector: 'hidden' });
  const [legacyRequired] = TJ.useStateBoolean({ name: 'required', label: 'Required', initialValue: false, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });
  const onEnterPressed = TJ.useEventCallback({ name: 'onEnterPressed' });
  const onFocus = TJ.useEventCallback({ name: 'onFocus' });
  const onBlur = TJ.useEventCallback({ name: 'onBlur' });

  const inputRef = useRef<HTMLInputElement>(null);
  const [anchorRef, container] = usePortalContainer();
  const [draft, setDraft] = useState<string | null>(null);
  const locale = M.isBlank(localeProp) || typeof localeProp !== 'string' ? 'en-US' : localeProp;
  const options = M.toCurrencyList(currencyOptions);
  const currency = M.toCurrency(currencyProp, options[0] ?? 'USD');
  const decimals = M.currencyDecimals(currency, decimalPlaces) ?? 2;
  const value = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : M.parseNumber(rawValue, locale);
  const lo = M.parseNumber(minValue);
  const hi = M.parseNumber(maxValue);
  const formatted = (n: number | null, code = currency) =>
    M.formatCurrency(n, { currency: code, locale, decimals: M.currencyDecimals(code, decimalPlaces), display: 'symbol' });

  const publish = (n: number | null, code = currency) => {
    setValue(n as number);
    setFormattedValue(formatted(n, code));
  };
  // From the latest amount, so a second call in one batch compares with the first's (lib/sameValue).
  const amount = useValueSetter<number | null>(value, (n) => setValue(n as number));
  const commit = (n: number | null) => {
    if (!amount.set(n)) return;
    setFormattedValue(formatted(n));
    onChange();
  };
  /** Sets the amount from an action (setValue, clear): onChange only when the amount or the currency changes. */
  // The currency as last set, ahead of the next render, for the same reason.
  const currencySetter = useValueSetter<string>(currency, (c) => setCurrencyState(c));
  const set = (n: number | null, code = currencySetter.latest.current) => {
    setDraft(null);
    rule.touch();
    const next = M.roundTo(n, M.currencyDecimals(code, decimalPlaces));
    const moved = amount.set(next);
    const recoded = currencySetter.set(code);
    if (!moved && !recoded) return;
    setFormattedValue(formatted(next, code));
    onChange();
  };
  useReseed(defaultValue, () => {
    setDraft(null);
    publish(M.roundTo(M.parseNumber(defaultValue, locale), decimals));
  });
  // The formatted value follows a new currency, locale or decimal places too.
  useReseed([currency, locale, decimalPlaces], () => setFormattedValue(formatted(value)), { onMount: false });
  // A Form's clear empties `value` itself, without publish(): the typed draft and formattedValue are the widget's own,
  // so a focused box would keep showing the draft and formattedValue would keep the old amount.
  TJ.useFormClear(() => {
    setDraft(null);
    publish(null);
  });

  // setValue(value, currency): UI 2.0 takes the currency with the value, rounding to the new currency's decimals.
  TJ.useAction(
    {
      name: 'setValue',
      displayName: 'Set value',
      params: [
        { handle: 'value', displayName: 'Value' },
        { handle: 'currency', displayName: 'Currency' },
      ],
    },
    (v, code) => {
      const now = currencySetter.latest.current;
      const next = code !== undefined && code !== null && code !== '' ? M.toCurrency(code, now) : now;
      set(M.parseNumber(v, locale), next);
    }
  );
  TJ.useAction({ name: 'setCurrency', displayName: 'Set currency', params: [{ handle: 'currency', displayName: 'Currency' }] }, (code) => {
    const next = M.toCurrency(code, currencySetter.latest.current);
    currencySetter.set(next);
    setFormattedValue(formatted(amount.latest.current, next));
  });
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
  const display = ['symbol', 'narrowSymbol', 'code'].includes(currencyDisplay) ? currencyDisplay : 'symbol';
  const selectable = options.length > 1 || (options.length === 1 && options[0] !== currency);
  const choices = selectable && !options.includes(currency) ? [currency, ...options] : options;
  const sign = M.currencySign(currency, locale, display);
  // With a picker showing the code, a code sign beside it says the same twice.
  const showSign = !(selectable && display === 'code');
  const shown = draft !== null ? draft : M.formatNumber(value, { decimals, grouping: true, locale, fixed: true });
  const clearable = showClearBtn && (value !== null || !!draft) && !disabled && !control.loading;
  const pick = (code: string) => {
    const next = M.toCurrency(code, currency);
    if (next === currency) return;
    const rounded = M.roundTo(value, M.currencyDecimals(next, decimalPlaces));
    setCurrencyState(next);
    setDraft(null);
    publish(rounded, next);
    onChange();
  };

  return (
    <div className="ui ui2-in" ref={anchorRef} style={looks}>
      <Field label={label} description={description} htmlFor={fieldId} error={rule.error} required={rule.required}>
        <FieldLoading loading={control.loading}>
          <div className={cn('ui-input ui2-group', disabled && 'is-disabled')}>
            {selectable ? (
              <SelectPrimitive.Root value={currency} disabled={disabled} onValueChange={pick}>
                <SelectPrimitive.Trigger className="ui2-addon" aria-label="Currency">
                  <SelectPrimitive.Value>{currency}</SelectPrimitive.Value>
                  <ChevronDown size={14} className="ui2-addon-chevron" />
                </SelectPrimitive.Trigger>
                {container ? (
                  <SelectPrimitive.Portal container={container}>
                    <SelectPrimitive.Content className="ui-popup ui2-in ui2-pop" style={looks} position="popper" sideOffset={4} align="start">
                      <SelectPrimitive.Viewport className="ui2-pop-list">
                        {choices.map((code) => (
                          <SelectPrimitive.Item key={code} value={code} className="ui2-pop-item">
                            <SelectPrimitive.ItemText>
                              <span style={{ fontWeight: 500 }}>{code}</span>
                            </SelectPrimitive.ItemText>
                            <span className="ui2-pop-item-name ui2-pop-item-note">{currencyName(code, locale)}</span>
                            <Check size={16} className="ui2-pop-check" />
                          </SelectPrimitive.Item>
                        ))}
                      </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                  </SelectPrimitive.Portal>
                ) : null}
              </SelectPrimitive.Root>
            ) : null}
            {showSign && !sign.after ? <span className="ui2-affix is-start">{sign.sign}</span> : null}
            <input
              ref={inputRef}
              {...fieldAria(fieldId, rule.error, rule.required, !!description)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className={cn('ui2-inner ui2-tabular', showSign && !sign.after && 'has-start', showSign && sign.after && 'has-end')}
              placeholder={placeholder}
              disabled={disabled}
              value={shown}
              onChange={(e) => {
                const typed = M.numericText(e.target.value);
                setDraft(typed);
                commit(M.roundTo(M.parseNumber(typed, locale), decimals));
              }}
              onFocus={() => {
                setDraft(value === null ? '' : M.formatNumber(value, { decimals, grouping: false, locale }));
                onFocus();
              }}
              onBlur={() => {
                setDraft(null);
                rule.touch();
                onBlur();
              }}
              onKeyDown={(e) => isEnter(e) && onEnterPressed()}
            />
            {showSign && sign.after ? <span className="ui2-affix is-end">{sign.sign}</span> : null}
            {clearable ? (
              <ClearX
                onClear={() => {
                  setDraft((d) => (d === null ? null : ''));
                  commit(null);
                  inputRef.current?.focus();
                }}
              />
            ) : null}
          </div>
        </FieldLoading>
      </Field>
    </div>
  );
};
