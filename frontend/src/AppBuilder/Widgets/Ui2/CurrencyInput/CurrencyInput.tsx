import React, { useEffect, useRef, useState } from 'react';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useTextBox, useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useExposed, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import {
  ADDON,
  ADDON_HOVER,
  AFFIX,
  EDGE,
  Group,
  INNER,
  text,
  useLatest,
  useNumberBox,
} from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Currency input ------------------------------------------------------------------------------------------------

const currencyName = (code: string, locale: string): string => {
  try {
    return new Intl.DisplayNames([locale || 'en-US', 'en-US'], { type: 'currency' }).of(code) || code;
  } catch {
    return code;
  }
};

export const ShadCurrencyInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id, componentType, styles } = props;
  const locale = M.isBlank(properties.locale) || typeof properties.locale !== 'string' ? 'en-US' : properties.locale;
  const options = M.toCurrencyList(properties.currencyOptions);
  const initialCurrency = M.toCurrency(properties.currency, options[0] ?? 'USD');
  const [currency, setCurrency] = useState(initialCurrency);
  useEffect(() => setCurrency(initialCurrency), [initialCurrency]);
  const currencyRef = useLatest(currency);
  const decimals = M.currencyDecimals(currency, properties.decimalPlaces);
  const round = (n: unknown) => M.roundTo(n, decimals);
  const initial = M.roundTo(
    M.parseNumber(properties.defaultValue, locale),
    M.currencyDecimals(initialCurrency, properties.decimalPlaces)
  );
  const box = useNumberBox(props, { initial, round, parse: (v) => M.parseNumber(v, locale) });
  const { value, draft, setDraft } = box;
  const formatted = (n: number | null, code = currency) =>
    M.formatCurrency(n, { currency: code, locale, decimals: M.currencyDecimals(code, properties.decimalPlaces) });
  const latest = useLatest({ locale, decimalPlaces: properties.decimalPlaces });
  useExposed(setExposedVariables, properties, {
    value,
    formattedValue: formatted(value),
    currency,
    // setValue(value, currency): the native Currency input takes the currency with the value. The amount is rounded
    // to the decimals of the currency it ends up in (setValue(12.345, 'JPY') is 12, not the old currency's 12.35).
    setValue: async (v: unknown, code: unknown) => {
      const next = code !== undefined && code !== null && code !== '' ? M.toCurrency(code, currencyRef.current) : null;
      if (next) setCurrency(next);
      const places = M.currencyDecimals(next ?? currencyRef.current, latest.current.decimalPlaces);
      box.set(M.roundTo(M.parseNumber(v, latest.current.locale), places));
    },
    setCurrency: async (code: unknown) => setCurrency(M.toCurrency(code, currencyRef.current)),
    clear: async () => box.set(null),
  });
  const commit = (next: number | null) => box.commit(next, (n) => ({ formattedValue: formatted(n) }));
  const check = useValidation(props, value, () => commit(null));
  const textBox = useTextBox(props, check.touch);
  const disabled = busy(properties);
  const display = ['symbol', 'narrowSymbol', 'code'].includes(properties.currencyDisplay)
    ? properties.currencyDisplay
    : 'symbol';
  const selectable = options.length > 1 || (options.length === 1 && options[0] !== currency);
  const choices = selectable && !options.includes(currency) ? [currency, ...options] : options;
  const sign = M.currencySign(currency, locale, display);
  const showSign = !(selectable && display === 'code');
  const shown =
    draft !== null
      ? draft
      : M.formatNumber(value, { decimals, grouping: properties.thousandSeparator !== false, locale, fixed: true });
  const vars = lookVars(componentType, styles);
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Group disabled={disabled}>
          {selectable ? (
            <Select
              value={currency}
              disabled={disabled}
              onValueChange={(code) => {
                const next = M.toCurrency(code, currency);
                if (next === currency) return;
                const rounded = M.roundTo(value, M.currencyDecimals(next, properties.decimalPlaces));
                setCurrency(next);
                box.valueRef.current = rounded;
                box.set(rounded);
                setExposedVariables({ currency: next, value: rounded, formattedValue: formatted(rounded, next) });
                fireEvent('onChange');
              }}
            >
              <SelectTrigger
                aria-label="Currency"
                className={cn(
                  ADDON,
                  ADDON_HOVER,
                  EDGE,
                  'h-full w-auto justify-start rounded-none py-0 font-medium focus:ring-0'
                )}
              >
                <SelectValue>{currency}</SelectValue>
              </SelectTrigger>
              <SelectContent style={vars} className="max-h-72">
                {choices.map((code) => (
                  <SelectItem key={code} value={code}>
                    <span className="font-medium">{code}</span>
                    <span className="ml-2 text-[color:var(--sc-muted-foreground)]">{currencyName(code, locale)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {showSign && !sign.after ? <span className={cn(AFFIX, 'pl-3')}>{sign.sign}</span> : null}
          <input
            ref={textBox.ref}
            id={`shad-${id}`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={!!check.error || undefined}
            className={cn(
              INNER,
              'tabular-nums',
              showSign && !sign.after && 'pl-1.5',
              showSign && sign.after && 'pr-1.5'
            )}
            value={shown}
            placeholder={text(properties.placeholder)}
            disabled={disabled}
            onFocus={() => {
              setDraft(value === null ? '' : M.formatNumber(value, { decimals, grouping: false, locale }));
              textBox.onFocus();
            }}
            onBlur={() => {
              setDraft(null);
              textBox.onBlur();
            }}
            onChange={(e) => {
              const typed = M.numericText(e.target.value);
              setDraft(typed);
              commit(round(M.parseNumber(typed, locale)));
            }}
            onKeyDown={(e) => e.key === 'Enter' && fireEvent('onEnterPressed')}
          />
          {showSign && sign.after ? <span className={cn(AFFIX, 'pr-3')}>{sign.sign}</span> : null}
        </Group>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadCurrencyInput);
