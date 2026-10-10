import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Command } from 'cmdk';
// eslint-disable-next-line import/no-unresolved
import PhoneNumberInput from 'react-phone-number-input/input';
// eslint-disable-next-line import/no-unresolved
import flags from 'react-phone-number-input/flags';
import { isValidPhoneNumber } from 'react-phone-number-input';
import {
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Clock,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Search,
} from 'lucide-react';
import { CONTROL, Field, HELP, Shell, busy, useTextBox, useValidation, useValue } from './Shadcn';
import { useExposed, useAutoHeight } from '../packHooks';
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from './ui';
import { lookVars } from './shadcnLook';
import * as M from './inputsModel';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// shadcn/ui pack (experiment): inputs widgets: number, password, phone, currency, OTP, time and date-time. Pure logic
// lives in inputsModel.js; configs in WidgetManager/shadcnSource.inputs.js; style variables in looks/inputs.js.

// ---- Building blocks -----------------------------------------------------------------------------------------------

const useLatest = (value) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

/** The widget's props with an extra rule checked before the Validation section's (a malformed phone number, a time
 *  outside its bounds): useValidation then exposes isValid and shows the message the native way. */
const withRule = (props, rule) => ({
  ...props,
  validate: (value) => {
    const problem = rule(value);
    if (problem) return { isValid: false, validationError: problem };
    return typeof props.validate === 'function' ? props.validate(value) : { isValid: true };
  },
});

// A text box made of parts (sign, input, buttons) in one bordered box: ShadInput's size and focus ring, CONTROL's
// colours (background, text, border, radius, error border).
const GROUP =
  'flex h-9 w-full items-stretch overflow-hidden border text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring';
const INNER =
  'h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3 py-1 text-sm text-[color:var(--lk-fg,var(--sc-foreground))] shadow-none outline-none placeholder:text-[color:var(--lk-placeholder,var(--sc-muted-foreground))] focus:outline-none focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed';
const EDGE = 'border-[color:var(--lk-invalid,var(--lk-border,var(--sc-input)))]';
// Text inside the box beside the value: a prefix, suffix or currency sign.
const AFFIX =
  'flex shrink-0 select-none items-center whitespace-nowrap text-sm text-[color:var(--lk-affix,var(--sc-muted-foreground))]';
// Stepper buttons attached to the box.
const STEP =
  'flex shrink-0 items-center justify-center p-0 bg-[color:var(--lk-step-bg,transparent)] text-[color:var(--lk-step-fg,var(--sc-muted-foreground))] transition-colors hover:bg-[color:var(--lk-step-hover,var(--sc-accent))] hover:text-[color:var(--lk-step-fg,var(--sc-accent-foreground))] disabled:pointer-events-none disabled:opacity-50';
// A segment at the start of the box (the country or currency picker).
const ADDON =
  'flex shrink-0 items-center gap-1.5 border-0 border-r px-3 text-sm bg-[color:var(--lk-addon-bg,transparent)] text-[color:var(--lk-addon-fg,var(--lk-fg,var(--sc-foreground)))] shadow-none transition-colors focus:outline-none focus-visible:bg-[color:var(--lk-addon-hover,var(--sc-accent))] disabled:cursor-not-allowed';
const ADDON_HOVER = 'hover:bg-[color:var(--lk-addon-hover,var(--sc-accent))]';
const ICON = 'h-4 w-4 shrink-0 text-[color:var(--lk-icon,var(--sc-muted-foreground))]';

const Group = ({ disabled, className, children }) => (
  <div className={cn(GROUP, CONTROL, disabled && 'cursor-not-allowed opacity-50', className)}>{children}</div>
);

const BareInput = React.forwardRef((props, ref) => <input ref={ref} {...props} />);
BareInput.displayName = 'BareInput';

const text = (v) => (v === undefined || v === null || typeof v === 'object' ? '' : String(v));

/** A number text box's value and the text shown while it is edited (formatted again on blur). `parse` turns typed
 *  text into a number; `round` keeps it to the decimal places. */
const useNumberBox = (props, { initial, round, parse }) => {
  const { setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState(null);
  useEffect(() => {
    setValue(initial);
    setDraft(null);
  }, [initial]);
  const valueRef = useLatest(value);
  const commit = (next, extra = {}) => {
    if (next === valueRef.current) return;
    valueRef.current = next;
    setValue(next);
    setExposedVariables({ value: next, ...extra(next) });
    fireEvent('onChange');
  };
  const set = (v) => {
    setDraft(null);
    setValue(round(typeof v === 'number' ? v : parse(v)));
  };
  return { value, valueRef, draft, setDraft, commit, set };
};

// ---- Number input --------------------------------------------------------------------------------------------------

export const ShadNumberInput = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, validation, setExposedVariables, fireEvent, id } = props;
  const decimals = M.clampInt(properties.decimalPlaces, 0, 10, 2);
  const round = (n) => M.roundTo(n, decimals);
  const initial = round(M.parseNumber(properties.defaultValue));
  const box = useNumberBox(props, { initial, round, parse: (v) => M.parseNumber(v) });
  const { value, draft, setDraft } = box;
  const latest = useLatest({ round });
  useExposed(setExposedVariables, properties, {
    value,
    setValue: async (v) => box.set(latest.current.round(M.parseNumber(v))),
    clear: async () => box.set(null),
  });
  const commit = (next) => box.commit(next, () => ({}));
  const check = useValidation(props, value, () => commit(null));
  const textBox = useTextBox(props, check.touch);
  const disabled = busy(properties);
  const loading = !!properties.loadingState;
  const lo = M.parseNumber(validation?.minValue);
  const hi = M.parseNumber(validation?.maxValue);
  const step = (dir) => {
    if (disabled) return;
    const next = M.stepValue(box.valueRef.current, properties.step, dir, { min: lo, max: hi, decimals });
    if (draft !== null) setDraft(next === null ? '' : String(next));
    commit(next);
  };
  const layout = ['split', 'stacked', 'none'].includes(properties.stepper) ? properties.stepper : 'split';
  const steppers = layout !== 'none' && !loading;
  const atMin = lo !== null && value !== null && value <= lo;
  const atMax = hi !== null && value !== null && value >= hi;
  const prefix = text(properties.prefix);
  const suffix = text(properties.suffix);
  const shown =
    draft !== null ? draft : M.formatNumber(value, { decimals, grouping: properties.thousandSeparator !== false });
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
          {steppers && layout === 'split' ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Decrease"
              className={cn(STEP, EDGE, 'w-9 border-r')}
              disabled={disabled || atMin}
              onClick={() => step(-1)}
            >
              <Minus className="h-4 w-4" />
            </button>
          ) : null}
          {prefix ? <span className={cn(AFFIX, 'pl-3')}>{prefix}</span> : null}
          <input
            ref={textBox.ref}
            id={`shad-${id}`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            role="spinbutton"
            aria-valuenow={value ?? undefined}
            aria-valuemin={lo ?? undefined}
            aria-valuemax={hi ?? undefined}
            aria-invalid={!!check.error || undefined}
            className={cn(
              INNER,
              prefix && 'pl-1.5',
              suffix && 'pr-1.5',
              layout === 'split' && !prefix && !suffix && 'text-center'
            )}
            value={shown}
            placeholder={text(properties.placeholder)}
            disabled={disabled}
            onFocus={() => {
              setDraft(value === null ? '' : String(value));
              textBox.onFocus();
            }}
            onBlur={() => {
              setDraft(null);
              textBox.onBlur();
            }}
            onChange={(e) => {
              const typed = M.numericText(e.target.value);
              setDraft(typed);
              commit(round(M.parseNumber(typed)));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fireEvent('onEnterPressed');
              else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                step(e.key === 'ArrowUp' ? 1 : -1);
              }
            }}
          />
          {suffix ? <span className={cn(AFFIX, 'pr-3')}>{suffix}</span> : null}
          {steppers && layout === 'split' ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Increase"
              className={cn(STEP, EDGE, 'w-9 border-l')}
              disabled={disabled || atMax}
              onClick={() => step(1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : null}
          {steppers && layout === 'stacked' ? (
            <div className={cn('flex w-7 shrink-0 flex-col border-l', EDGE)}>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Increase"
                className={cn(STEP, 'h-1/2 w-full')}
                disabled={disabled || atMax}
                onClick={() => step(1)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Decrease"
                className={cn(STEP, EDGE, 'h-1/2 w-full border-t')}
                disabled={disabled || atMin}
                onClick={() => step(-1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </Group>
      </Field>
    </Shell>
  );
};

// ---- Currency input ------------------------------------------------------------------------------------------------

const currencyName = (code, locale) => {
  try {
    return new Intl.DisplayNames([locale || 'en-US', 'en-US'], { type: 'currency' }).of(code) || code;
  } catch {
    return code;
  }
};

export const ShadCurrencyInput = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id, componentType, styles } = props;
  const locale = M.isBlank(properties.locale) || typeof properties.locale !== 'string' ? 'en-US' : properties.locale;
  const options = M.toCurrencyList(properties.currencyOptions);
  const initialCurrency = M.toCurrency(properties.currency, options[0] ?? 'USD');
  const [currency, setCurrency] = useState(initialCurrency);
  useEffect(() => setCurrency(initialCurrency), [initialCurrency]);
  const currencyRef = useLatest(currency);
  const decimals = M.currencyDecimals(currency, properties.decimalPlaces);
  const round = (n) => M.roundTo(n, decimals);
  const initial = M.roundTo(
    M.parseNumber(properties.defaultValue, locale),
    M.currencyDecimals(initialCurrency, properties.decimalPlaces)
  );
  const box = useNumberBox(props, { initial, round, parse: (v) => M.parseNumber(v, locale) });
  const { value, draft, setDraft } = box;
  const formatted = (n, code = currency) =>
    M.formatCurrency(n, { currency: code, locale, decimals: M.currencyDecimals(code, properties.decimalPlaces) });
  const latest = useLatest({ round, locale });
  useExposed(setExposedVariables, properties, {
    value,
    formattedValue: formatted(value),
    currency,
    setValue: async (v) => box.set(latest.current.round(M.parseNumber(v, latest.current.locale))),
    setCurrency: async (code) => setCurrency(M.toCurrency(code, currencyRef.current)),
    clear: async () => box.set(null),
  });
  const commit = (next) => box.commit(next, (n) => ({ formattedValue: formatted(n) }));
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

// ---- Password input ------------------------------------------------------------------------------------------------

const STRENGTH_BAR = {
  weak: 'bg-[color:var(--lk-weak,var(--sc-destructive))]',
  fair: 'bg-[color:var(--lk-fair,var(--sc-warning))]',
  strong: 'bg-[color:var(--lk-strong,var(--sc-success))]',
};
const STRENGTH_TEXT = {
  weak: 'text-[color:var(--lk-weak,var(--sc-destructive))]',
  fair: 'text-[color:var(--lk-fair,var(--sc-warning))]',
  strong: 'text-[color:var(--lk-strong,var(--sc-success))]',
};

export const ShadPasswordInput = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariable, setExposedVariables, fireEvent, id } = props;
  const [value, change] = useValue(props, text(properties.defaultValue), (set) => ({
    setText: async (t) => set(text(t)),
    clear: async () => set(''),
  }));
  const strength = M.passwordStrength(value);
  useExposed(setExposedVariables, properties, { strength: strength.level });
  const onChange = (next) => {
    setExposedVariable('strength', M.passwordStrength(next).level);
    change(next);
  };
  const check = useValidation(props, value, () => onChange(''));
  const textBox = useTextBox(props, check.touch);
  const [visible, setVisible] = useState(false);
  const disabled = busy(properties);
  const loading = !!properties.loadingState;
  const meter = properties.showStrength === true && !loading;
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
          <input
            ref={textBox.ref}
            id={`shad-${id}`}
            type={visible ? 'text' : 'password'}
            autoComplete={properties.showStrength === true ? 'new-password' : 'current-password'}
            aria-invalid={!!check.error || undefined}
            className={cn(INNER, properties.showToggle !== false && 'pr-1')}
            value={value}
            placeholder={text(properties.placeholder)}
            disabled={disabled}
            onFocus={textBox.onFocus}
            onBlur={textBox.onBlur}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fireEvent('onEnterPressed')}
          />
          {properties.showToggle !== false && !loading ? (
            <button
              type="button"
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
              className="flex w-9 shrink-0 items-center justify-center p-0 text-[color:var(--lk-icon,var(--sc-muted-foreground))] transition-colors hover:text-[color:var(--lk-fg,var(--sc-foreground))] focus:outline-none focus-visible:text-[color:var(--lk-fg,var(--sc-foreground))] disabled:pointer-events-none"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
        </Group>
        {meter ? (
          <div className="flex items-center gap-3" data-strength={strength.level || 'empty'}>
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < strength.segments ? STRENGTH_BAR[strength.level] : 'bg-[color:var(--lk-track,var(--sc-muted))]'
                  )}
                />
              ))}
            </div>
            <span
              aria-live="polite"
              className={cn('min-w-[3rem] text-right text-xs font-medium', STRENGTH_TEXT[strength.level] || HELP)}
            >
              {strength.label}
            </span>
          </div>
        ) : null}
      </Field>
    </Shell>
  );
};

// ---- Phone input ---------------------------------------------------------------------------------------------------

const POPOVER_LIST = 'max-h-[300px] overflow-y-auto overflow-x-hidden';
const COMMAND_ITEM =
  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50';

const FlagIcon = ({ country, title }) => {
  const Flag = flags[country];
  return (
    <span className="flex h-4 w-6 shrink-0 overflow-hidden rounded-sm bg-[color:var(--sc-muted)] [&_svg]:h-full [&_svg]:w-full">
      {Flag ? <Flag title={title} /> : null}
    </span>
  );
};

export const ShadPhoneInput = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id, componentType, styles } = props;
  const listKey = JSON.stringify(Array.isArray(properties.onlyCountries) ? properties.onlyCountries : null);
  const start = useMemo(
    () => M.phoneStart(properties.defaultValue, properties.defaultCountry, properties.onlyCountries),
    [text(properties.defaultValue), text(properties.defaultCountry), listKey] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const { countries } = start;
  const [state, setState] = useState({ value: start.value, country: start.country });
  useEffect(() => setState({ value: start.value, country: start.country }), [start]);
  const stateRef = useLatest(state);
  const info = M.phoneInfo(state.value, state.country);
  const update = (next, fire = true) => {
    const prev = stateRef.current;
    if (next.value === prev.value && next.country === prev.country) return;
    stateRef.current = next;
    setState(next);
    if (!fire) return;
    setExposedVariables(M.phoneInfo(next.value, next.country));
    fireEvent('onChange');
  };
  const toCountry = (c) => {
    const prev = stateRef.current;
    return { country: c, value: M.rebasePhone(prev.value, prev.country, c) };
  };
  useExposed(setExposedVariables, properties, {
    ...info,
    setValue: async (v) => {
      const prev = stateRef.current;
      const value = M.toPhoneValue(v, prev.country);
      const detected = M.phoneCountry(value, countries);
      update({ value, country: detected || prev.country }, false);
    },
    setCountry: async (c) => {
      const country = M.countryFromInput(c, countries);
      if (country) update(toCountry(country), false);
    },
    clear: async () => update({ ...stateRef.current, value: '' }, false),
  });
  const check = useValidation(
    withRule(props, (v) => (v && !isValidPhoneNumber(String(v)) ? 'Enter a valid phone number' : '')),
    state.value,
    () => update({ ...stateRef.current, value: '' })
  );
  const textBox = useTextBox(props, check.touch);
  const [open, setOpen] = useState(false);
  const disabled = busy(properties);
  const canChange = properties.isCountryChangeEnabled !== false && countries.length > 1;
  const showFlag = properties.showFlag !== false;
  const name = M.countryName(state.country);
  const code = M.callingCode(state.country);
  const vars = lookVars(componentType, styles);
  const current = (
    <>
      {showFlag ? <FlagIcon country={state.country} title={name} /> : null}
      <span className="tabular-nums">+{code}</span>
    </>
  );
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
          {canChange ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Country: ${name}`}
                  disabled={disabled}
                  className={cn(ADDON, ADDON_HOVER, EDGE)}
                >
                  {current}
                  <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[300px] p-0"
                align="start"
                style={vars}
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  textBox.ref.current?.focus();
                }}
              >
                <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Command.Input
                      placeholder="Search country..."
                      className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm text-[color:inherit] shadow-none outline-none placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                  <Command.List className={POPOVER_LIST}>
                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                      No country found.
                    </Command.Empty>
                    <Command.Group className="overflow-hidden p-1">
                      {countries.map((c) => {
                        const label = M.countryName(c);
                        return (
                          <Command.Item
                            key={c}
                            value={`${label} +${M.callingCode(c)} ${c}`}
                            className={COMMAND_ITEM}
                            onSelect={() => {
                              update(toCountry(c));
                              setOpen(false);
                            }}
                          >
                            {showFlag ? <FlagIcon country={c} title={label} /> : null}
                            <span className="flex-1 truncate">{label}</span>
                            <span className="text-xs tabular-nums text-muted-foreground">+{M.callingCode(c)}</span>
                            <Check className={cn('h-4 w-4', c === state.country ? 'opacity-100' : 'opacity-0')} />
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  </Command.List>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <span className={cn(ADDON, EDGE, 'cursor-default')} aria-label={`Country: ${name}`}>
              {current}
            </span>
          )}
          <PhoneNumberInput
            ref={textBox.ref}
            id={`shad-${id}`}
            country={state.country}
            international={false}
            value={state.value || undefined}
            inputComponent={BareInput}
            autoComplete="tel"
            aria-invalid={!!check.error || undefined}
            className={INNER}
            placeholder={text(properties.placeholder)}
            disabled={disabled}
            onFocus={textBox.onFocus}
            onBlur={textBox.onBlur}
            onChange={(v) => update({ ...stateRef.current, value: v || '' })}
            onKeyDown={(e) => e.key === 'Enter' && fireEvent('onEnterPressed')}
          />
        </Group>
      </Field>
    </Shell>
  );
};

// ---- OTP input -----------------------------------------------------------------------------------------------------

const SLOT_SIZE = 'h-[var(--lk-slot,2.25rem)] w-[var(--lk-slot,2.25rem)]';
const SLOT =
  'relative flex items-center justify-center text-[length:calc(var(--lk-slot,2.25rem)*0.42)] bg-[color:var(--lk-bg,transparent)] text-[color:var(--lk-fg,var(--sc-foreground))] shadow-sm transition-all';
const SLOT_RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';
const SLOT_JOINED =
  'border-y border-r first:border-l first:rounded-l-[var(--lk-radius,calc(var(--sc-radius)-2px))] last:rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const ShadOtpInput = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id } = props;
  const length = M.otpLength(properties.length);
  const characters = properties.characters === 'alphanumeric' ? 'alphanumeric' : 'numeric';
  const initial = M.otpSanitize(properties.defaultValue, length, characters);
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const code = value.slice(0, length);
  const isComplete = code.length === length;
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  useExposed(setExposedVariables, properties, {
    value: code,
    isComplete,
    clear: async () => setValue(''),
    setFocus: async () => inputRef.current?.focus(),
  });
  const change = (raw) => {
    const next = M.otpSanitize(raw, length, characters);
    if (next === code) return;
    setValue(next);
    const done = next.length === length;
    setExposedVariables({ value: next, isComplete: done });
    fireEvent('onChange');
    if (done) fireEvent('onComplete');
  };
  const check = useValidation(
    withRule(props, (v) => (v && String(v).length < length ? `Enter all ${length} characters` : '')),
    code,
    () => change('')
  );
  const disabled = busy(properties);
  const joined = properties.slotStyle !== 'separate';
  const placeholder = text(properties.placeholder).slice(0, 1);
  const active = focused ? Math.min(code.length, length - 1) : -1;
  const half = Math.ceil(length / 2);
  const groups =
    properties.separator === true
      ? [
          [0, half],
          [half, length],
        ]
      : [[0, length]];
  const slot = (i) => {
    const char = code[i];
    return (
      <div
        key={i}
        data-slot="otp"
        data-active={i === active || undefined}
        className={cn(
          SLOT,
          SLOT_SIZE,
          EDGE,
          joined ? SLOT_JOINED : cn('border', SLOT_RADIUS),
          i === active && 'z-10 ring-1 ring-ring'
        )}
      >
        {char ? (
          properties.masked === true ? (
            '•'
          ) : (
            char
          )
        ) : placeholder ? (
          <span className="text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]">{placeholder}</span>
        ) : null}
        {i === active && !char ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-pulse bg-[color:var(--lk-fg,var(--sc-foreground))]" />
          </div>
        ) : null}
      </div>
    );
  };
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <div
          className={cn(
            'relative flex w-fit max-w-full items-center gap-2',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {groups.map(([from, to], g) => (
            <React.Fragment key={g}>
              {g > 0 ? (
                <div
                  role="separator"
                  className="flex items-center text-[color:var(--lk-sep,var(--sc-muted-foreground))]"
                >
                  <Minus className="h-4 w-4" />
                </div>
              ) : null}
              <div className={cn('flex items-center', !joined && 'gap-2')}>
                {Array.from({ length: to - from }, (_, k) => slot(from + k))}
              </div>
            </React.Fragment>
          ))}
          <input
            ref={inputRef}
            id={`shad-${id}`}
            aria-label={text(properties.label) || 'One-time code'}
            aria-invalid={!!check.error || undefined}
            inputMode={characters === 'numeric' ? 'numeric' : 'text'}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            className="absolute inset-0 h-full w-full cursor-text border-0 bg-transparent p-0 text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
            value={code}
            disabled={disabled}
            onChange={(e) => change(e.target.value)}
            onFocus={() => {
              setFocused(true);
              setTimeout(() => fireEvent('onFocus'), 0);
            }}
            onBlur={() => {
              setFocused(false);
              check.touch();
            }}
            onSelect={(e) => {
              // The caret stays at the end (select-all is kept, so a paste replaces the code).
              const el = e.target;
              const end = el.value.length;
              const all = el.selectionStart === 0 && el.selectionEnd === end;
              if (!all && (el.selectionStart !== end || el.selectionEnd !== end)) el.setSelectionRange(end, end);
            }}
          />
        </div>
      </Field>
    </Shell>
  );
};

// ---- Time picker ---------------------------------------------------------------------------------------------------

const OPTION =
  'flex h-8 w-full shrink-0 items-center justify-center rounded-md border-0 p-0 text-sm tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40';
const OPTION_IDLE = 'hover:bg-accent hover:text-accent-foreground';
const OPTION_ON = 'bg-primary text-primary-foreground hover:bg-primary';
const TRIGGER = 'w-full justify-start gap-2 px-3 text-left font-normal';

/** A scrolling column of options (hours, minutes, AM/PM) that opens scrolled to its selected option. */
const OptionColumn = ({ label, options, className }) => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const col = ref.current;
    const selected = col?.querySelector('[data-selected="true"]');
    if (col && selected) col.scrollTop = selected.offsetTop - col.clientHeight / 2 + selected.clientHeight / 2;
  }, []);
  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      className={cn('relative flex h-56 w-16 flex-col gap-1 overflow-y-auto p-1', className)}
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="option"
          aria-selected={o.selected}
          data-selected={o.selected || undefined}
          disabled={o.disabled}
          className={cn(OPTION, o.selected ? OPTION_ON : OPTION_IDLE)}
          onClick={o.onClick}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

const pad2 = (n) => String(n).padStart(2, '0');

/** The hour, minute and AM/PM columns for a time (minutes since midnight, or null), within bounds. */
const timeColumns = ({ minutes, use24, step, bounds, onPick }) => {
  const mins = M.minuteOptions(step);
  const hour = minutes === null ? null : Math.floor(minutes / 60);
  const minute = minutes === null ? null : minutes % 60;
  const pm = hour !== null ? hour >= 12 : bounds.lo >= 720;
  const fits = (h) => mins.some((m) => M.inTimeRange(h * 60 + m, bounds));
  const pickAt = (h, m) => onPick(M.clampTime(h * 60 + m, bounds));
  const hours = use24
    ? Array.from({ length: 24 }, (_, h) => ({ h, label: pad2(h) }))
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h12) => ({ h: (h12 % 12) + (pm ? 12 : 0), label: pad2(h12) }));
  const baseHour = hour ?? Math.floor(bounds.lo / 60);
  const columns = [
    {
      label: 'Hours',
      options: hours.map(({ h, label }) => ({
        key: `h${h}`,
        label,
        selected: h === hour,
        disabled: !fits(h),
        onClick: () => pickAt(h, minute ?? mins.find((m) => M.inTimeRange(h * 60 + m, bounds)) ?? 0),
      })),
    },
    {
      label: 'Minutes',
      options: mins.map((m) => ({
        key: `m${m}`,
        label: pad2(m),
        selected: m === minute,
        disabled: !M.inTimeRange(baseHour * 60 + m, bounds),
        onClick: () => pickAt(baseHour, m),
      })),
    },
  ];
  if (!use24) {
    const half = (isPm) => {
      const from = isPm ? 720 : 0;
      return bounds.hi >= from && bounds.lo <= from + 719;
    };
    columns.push({
      label: 'AM or PM',
      options: ['AM', 'PM'].map((label) => {
        const isPm = label === 'PM';
        return {
          key: label,
          label,
          selected: hour !== null && pm === isPm,
          disabled: !half(isPm),
          onClick: () => {
            const h = hour === null ? (isPm ? 12 : 0) : (hour % 12) + (isPm ? 12 : 0);
            pickAt(h, minute ?? 0);
          },
        };
      }),
    });
  }
  return columns;
};

export const ShadTimePicker = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id, componentType, styles } = props;
  const use24 = M.is24h(properties.timeFormat);
  const step = M.minuteStep(properties.minuteStep, 15);
  const bounds = M.timeBounds(properties.minTime, properties.maxTime);
  const initial = M.parseTime(properties.defaultValue);
  const [minutes, setMinutes] = useState(initial);
  useEffect(() => setMinutes(initial), [initial]);
  const [open, setOpen] = useState(false);
  const exposed = (m) => ({ value: M.toHHmm(m), formattedValue: M.formatTime(m, use24) });
  useExposed(setExposedVariables, properties, {
    ...exposed(minutes),
    setTime: async (t) => {
      const m = M.parseTime(t);
      if (m !== null || M.isBlank(t)) setMinutes(m);
    },
    clear: async () => setMinutes(null),
  });
  const pick = (m, close = false) => {
    if (close) setOpen(false);
    if (m === minutes) return;
    setMinutes(m);
    setExposedVariables(exposed(m));
    fireEvent('onChange');
  };
  const check = useValidation(
    withRule(props, (v) => {
      const m = M.parseTime(v);
      return m !== null && !M.inTimeRange(m, bounds)
        ? `Pick a time between ${M.formatTime(bounds.lo, use24)} and ${M.formatTime(bounds.hi, use24)}`
        : '';
    }),
    M.toHHmm(minutes),
    () => pick(null)
  );
  const disabled = busy(properties);
  const shown = M.formatTime(minutes, use24);
  const listMode = properties.pickerStyle === 'list';
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) check.touch();
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={`shad-${id}`}
              variant="outline"
              disabled={disabled}
              aria-invalid={!!check.error || undefined}
              className={cn(
                TRIGGER,
                CONTROL,
                'tabular-nums',
                !shown && 'text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
              )}
            >
              <Clock className={ICON} />
              {shown || text(properties.placeholder)}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            style={lookVars(componentType, styles)}
            className={listMode ? 'w-[var(--radix-popover-trigger-width)] min-w-[9rem] p-0' : 'w-auto p-0'}
          >
            {listMode ? (
              <OptionColumn
                label="Times"
                className="h-auto max-h-64 w-full"
                options={M.timeSlots(step, properties.minTime, properties.maxTime).map((t) => ({
                  key: t,
                  label: M.formatTime(t, use24),
                  selected: t === minutes,
                  onClick: () => pick(t, true),
                }))}
              />
            ) : (
              <div className="flex divide-x divide-[color:var(--sc-border)]">
                {timeColumns({ minutes, use24, step, bounds, onPick: (m) => pick(m) }).map((col) => (
                  <OptionColumn key={col.label} label={col.label} options={col.options} />
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

// ---- Date and time picker ------------------------------------------------------------------------------------------

const SMALL_SELECT =
  'h-8 w-[4.25rem] gap-1 px-2 tabular-nums text-[color:var(--sc-popover-foreground)] border-[color:var(--sc-input)]';

const TimeSelect = ({ label, value, options, onChange, disabled, style }) => (
  <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger aria-label={label} className={SMALL_SELECT}>
      <SelectValue placeholder="--" />
    </SelectTrigger>
    <SelectContent className="max-h-60" style={style}>
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const ShadDateTimePicker = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id, componentType, styles } = props;
  const dateFormat =
    typeof properties.dateFormat === 'string' && properties.dateFormat.trim() ? properties.dateFormat : 'DD MMM YYYY';
  const use24 = M.is24h(properties.timeFormat);
  const displayFormat = `${dateFormat} ${use24 ? 'HH:mm' : 'h:mm A'}`;
  const step = M.minuteStep(properties.minuteStep, 5);
  const rulesKey = JSON.stringify([
    properties.minDate ?? null,
    properties.maxDate ?? null,
    properties.disabledDates ?? null,
  ]);
  const rules = useMemo(
    () =>
      M.dateRules({
        minDate: properties.minDate,
        maxDate: properties.maxDate,
        disabledDates: properties.disabledDates,
        format: dateFormat,
      }),
    [rulesKey, dateFormat] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const initial = M.parseDateTime(properties.defaultValue, displayFormat)?.valueOf() ?? null;
  const [ts, setTs] = useState(initial);
  useEffect(() => setTs(initial), [initial]);
  const [open, setOpen] = useState(false);
  const date = ts === null ? null : dayjs(ts);
  const exposed = M.dateTimeExposed(date, displayFormat);
  useExposed(setExposedVariables, properties, {
    ...exposed,
    setDate: async (v) => {
      const d = M.parseDateTime(v, displayFormat);
      if (d || M.isBlank(v)) setTs(d ? d.valueOf() : null);
    },
    clear: async () => setTs(null),
  });
  const commit = (next) => {
    if (next === ts) return;
    setTs(next);
    setExposedVariables(M.dateTimeExposed(next === null ? null : dayjs(next), displayFormat));
    fireEvent('onChange');
  };
  const check = useValidation(
    withRule(props, () => M.dateProblem(date, rules)),
    exposed.value,
    () => commit(null)
  );
  const disabled = busy(properties);
  const now = dayjs();
  const nowMinutes = Math.floor((now.hour() * 60 + now.minute()) / step) * step;
  const timeOf = (d) => (d ? d.hour() * 60 + d.minute() : nowMinutes);
  // Changing the time before picking a day uses today (or the first allowed day).
  const baseDay = () => {
    if (date) return date;
    const today = now.startOf('day');
    if (!M.dateProblem(today, rules)) return today;
    return rules.min ?? today;
  };
  const setTime = (minutes) => commit(M.atTime(baseDay(), minutes).valueOf());
  const minutes = date ? timeOf(date) : null;
  const hour = minutes === null ? null : Math.floor(minutes / 60);
  const minute = minutes === null ? null : minutes % 60;
  const pm = hour !== null && hour >= 12;
  const minuteChoices = M.minuteOptions(step);
  if (minute !== null && !minuteChoices.includes(minute)) minuteChoices.push(minute);
  minuteChoices.sort((a, b) => a - b);
  const hourOptions = use24
    ? Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: pad2(h) }))
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h12) => ({ value: String(h12 % 12), label: pad2(h12) }));
  const disabledMatchers = [
    ...(rules.min ? [{ before: rules.min.toDate() }] : []),
    ...(rules.max ? [{ after: rules.max.toDate() }] : []),
    ...rules.disabled.map((d) => dayjs(d).toDate()),
  ];
  const shown = date ? M.safeFormat(date, displayFormat) : '';
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
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) check.touch();
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={`shad-${id}`}
              variant="outline"
              disabled={disabled}
              aria-invalid={!!check.error || undefined}
              className={cn(
                TRIGGER,
                CONTROL,
                !shown && 'text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
              )}
            >
              <CalendarIcon className={ICON} />
              <span className="truncate">{shown || text(properties.placeholder)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" style={vars}>
            <Calendar
              mode="single"
              selected={date ? date.toDate() : undefined}
              defaultMonth={
                date ? date.toDate() : rules.min && now.isBefore(rules.min) ? rules.min.toDate() : undefined
              }
              startMonth={rules.min ? rules.min.toDate() : undefined}
              endMonth={rules.max ? rules.max.toDate() : undefined}
              disabled={disabledMatchers}
              onSelect={(day) => {
                if (!day) return;
                commit(M.atTime(dayjs(day), timeOf(date)).valueOf());
              }}
            />
            <div className="flex items-center gap-2 border-t px-3 py-2.5">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="mr-auto text-sm text-muted-foreground">Time</span>
              <TimeSelect
                label="Hour"
                style={vars}
                value={hour === null ? '' : String(use24 ? hour : hour % 12)}
                options={hourOptions}
                onChange={(h) => setTime(((Number(h) % 24) + (!use24 && pm ? 12 : 0)) * 60 + (minute ?? 0))}
              />
              <span className="text-sm text-muted-foreground">:</span>
              <TimeSelect
                label="Minute"
                style={vars}
                value={minute === null ? '' : String(minute)}
                options={minuteChoices.map((m) => ({ value: String(m), label: pad2(m) }))}
                onChange={(m) => setTime((hour ?? Math.floor(nowMinutes / 60)) * 60 + Number(m))}
              />
              {!use24 ? (
                <div
                  className="ml-1 flex rounded-md border border-[color:var(--sc-input)] p-0.5"
                  role="group"
                  aria-label="AM or PM"
                >
                  {['AM', 'PM'].map((label) => {
                    const on = hour !== null && pm === (label === 'PM');
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        className={cn(
                          'h-6 rounded-sm border-0 px-1.5 text-xs font-medium transition-colors',
                          on ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                        )}
                        onClick={() => {
                          const base = minutes ?? nowMinutes;
                          const h = Math.floor(base / 60) % 12;
                          setTime((h + (label === 'PM' ? 12 : 0)) * 60 + (base % 60));
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};
