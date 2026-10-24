import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, InputNumber, Progress, Select, Space, Spin } from 'antd';
import type { InputRef } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, usePopupTheme, useTokenStyles } from '../lib/AntProvider';
import { ControlSkeleton, SpinOver } from '../lib/Loading';
import { FormField, useControlLook, useFieldProps } from '../lib/FormField';
import { str, toOptions } from '../lib/data';
import { toNumber } from '../lib/format';
import { countryOf, flagOf, nationalOf, phoneCountries, phoneCountry, phoneInfo, type Country } from '../lib/ui2/inputs/phone';

const useFocusActions = (ref: React.RefObject<{ focus: () => void; blur: () => void }>) => {
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());
  ToolJet.useAction({ name: 'blur', displayName: 'Blur' }, () => ref.current?.blur());
};

// ---- Combobox --------------------------------------------------------------------------------------------------------

// Ant's searchable Select (showSearch): label, options [{ label, value }], value, placeholder, notFoundContent,
// allowClear, filterOption (off for options a query fetches on onSearch); selectedOption, selectedLabel and
// searchValue exposed; events onChange, onSelect, onSearch, onFocus, onBlur; actions setFieldValue, resetFields.
export const Combobox = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'City' });
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', initialValue: [
    { label: 'Austin', value: 'austin' },
    { label: 'Berlin', value: 'berlin' },
    { label: 'Lisbon', value: 'lisbon' },
    { label: 'Singapore', value: 'singapore' },
    { label: 'Toronto', value: 'toronto' },
  ] });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Search' });
  const [notFoundContent] = ToolJet.useStateString({ name: 'notFoundContent', label: 'Not found content', initialValue: 'No matches' });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: true });
  const [filterOption] = ToolJet.useStateBoolean({ name: 'filterOption', label: 'Filter option', description: 'Off when a query fetches the options on onSearch.', initialValue: true });
  const [, setSelectedOption] = ToolJet.useStateObject({ name: 'selectedOption', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedLabel] = ToolJet.useStateString({ name: 'selectedLabel', initialValue: '', inspector: 'hidden' });
  const [, setSearchValue] = ToolJet.useStateString({ name: 'searchValue', initialValue: '', inspector: 'hidden' });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onSearch = ToolJet.useEventCallback({ name: 'onSearch' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const ref = useRef<{ focus: () => void; blur: () => void }>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'choice', value, present: value !== '' });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  const options = toOptions(rawOptions);
  const change = (v: unknown) => {
    const next = v === undefined || v === null ? '' : str(v);
    const opt = options.find((o) => o.value === next);
    setValue(next);
    setSelectedOption(opt ?? {});
    setSelectedLabel(opt?.label ?? '');
    onChange();
  };
  ToolJet.useAction({ name: 'setFieldValue', displayName: 'Set field value', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => change(v));
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(props.value));
  useFocusActions(ref);
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <Select
          ref={ref as never}
          id={fieldId}
          style={{ width: '100%' }}
          showSearch
          options={options}
          value={value !== '' ? value : undefined}
          placeholder={placeholder || undefined}
          notFoundContent={loading ? <Spin size="small" /> : notFoundContent || undefined}
          allowClear={allowClear}
          filterOption={filterOption ? (input, o) => str(o?.label).toLowerCase().includes(input.toLowerCase()) : false}
          loading={loading}
          disabled={disabled}
          variant={look.variant}
          size={look.size}
          status={check.error ? 'error' : undefined}
          classNames={{ popup: { root: popup.className } }}
          styles={{ popup: { root: popup.style } }}
          onChange={(v) => change(v)}
          onSelect={() => onSelect()}
          onSearch={(text) => {
            setSearchValue(text);
            onSearch();
          }}
          onFocus={() => onFocus()}
          onBlur={() => {
            check.touch();
            onBlur();
          }}
        />
      </FormField>
    </AntProvider>
  );
};

// ---- OTP -------------------------------------------------------------------------------------------------------------

// Ant's Input.OTP: label, length, mask (hide the characters), characters (numeric, alphanumeric), value; isComplete
// exposed; events onChange (every character), onComplete (all filled); actions setFieldValue, resetFields, focus.
export const OTP = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Verification code' });
  const [length] = ToolJet.useStateNumber({ name: 'length', label: 'Length', initialValue: 6, min: 2, max: 12 });
  const [characters] = ToolJet.useStateEnumeration({ name: 'characters', label: 'Characters', enumDefinition: ['numeric', 'alphanumeric'], initialValue: 'numeric' });
  const [mask] = ToolJet.useStateBoolean({ name: 'mask', label: 'Mask', initialValue: false });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '' });
  const [, setIsComplete] = ToolJet.useStateBoolean({ name: 'isComplete', initialValue: false, inspector: 'hidden' });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onComplete = ToolJet.useEventCallback({ name: 'onComplete' });
  const { disabled, loading } = ToolJet.useControlState();
  const check = ToolJet.useValidation({ section: 'text', value });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 6 });
  const n = Math.max(2, Math.min(12, Number(length) || 6));
  const ref = useRef<InputRef>(null);
  const change = (v: string) => {
    const next = v.slice(0, n);
    setValue(next);
    setIsComplete(next.length === n);
    onChange();
    if (next.length === n) onComplete();
  };
  ToolJet.useAction({ name: 'setFieldValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => change(str(v)));
  ToolJet.useAction({ name: 'resetFields', displayName: 'Clear' }, () => change(str(props.value)));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check}>
        <SpinOver loading={loading} as="inline">
          {/* Touched when focus leaves the boxes, so the message waits until the code is entered. */}
          <span
            className="tj-ant-otp"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) check.touch();
            }}
          >
            <Input.OTP
              ref={ref as never}
              length={n}
              value={value}
              mask={mask}
              disabled={disabled}
              variant={look.variant}
              size={look.size}
              status={check.error ? 'error' : undefined}
              formatter={(s) => (characters === 'numeric' ? s.replace(/\D/g, '') : s.replace(/[^\da-z]/gi, '').toUpperCase())}
              onInput={(cells) => change(cells.join(''))}
              onChange={(v) => v !== value && change(v)}
            />
          </span>
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};

// ---- CurrencyInput ---------------------------------------------------------------------------------------------------

const symbolOf = (currency: string, locale?: string, display = 'symbol') => {
  try {
    return (
      new Intl.NumberFormat(locale || undefined, { style: 'currency', currency, currencyDisplay: display as 'symbol' })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    );
  } catch {
    return currency;
  }
};

// Ant's InputNumber with a currency formatter (Ant's own grouping example): label, value (a number), currency, a
// currency Select before it (currencyOptions), locale, precision, currencyDisplay (symbol, narrowSymbol, code), min,
// max, placeholder, allowClear; formattedValue exposed; events onChange, onPressEnter, onFocus, onBlur; actions
// setFieldValue, setCurrency, resetFields, focus, blur.
export const CurrencyInput = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Amount' });
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', initialValue: undefined as unknown as number });
  const [currency, setCurrency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD' });
  const [currencyOptions] = ToolJet.useStateArray({ name: 'currencyOptions', label: 'Currency options', description: "['USD', 'EUR', 'INR']; empty: one currency.", initialValue: [] });
  const [locale] = ToolJet.useStateString({ name: 'locale', label: 'Locale', initialValue: '' });
  const [precision] = ToolJet.useStateNumber({ name: 'precision', label: 'Precision', initialValue: 2, min: 0, max: 6 });
  const [currencyDisplay] = ToolJet.useStateEnumeration({ name: 'currencyDisplay', label: 'Currency display', enumDefinition: ['symbol', 'narrowSymbol', 'code'], initialValue: 'symbol' });
  const [min] = ToolJet.useStateNumber({ name: 'min', label: 'Min', initialValue: undefined as unknown as number });
  const [max] = ToolJet.useStateNumber({ name: 'max', label: 'Max', initialValue: undefined as unknown as number });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '0.00' });
  const [, setFormattedValue] = ToolJet.useStateString({ name: 'formattedValue', initialValue: '', inspector: 'hidden' });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onPressEnter = ToolJet.useEventCallback({ name: 'onPressEnter' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const ref = useRef<{ focus: () => void; blur: () => void }>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const n = toNumber(value);
  const check = ToolJet.useValidation({ section: 'text', value: n === null ? '' : String(n), present: n !== null });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  const cur = str(currency).trim().toUpperCase() || 'USD';
  const digits = Math.max(0, Math.min(6, toNumber(precision) ?? 2));
  const fmt = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: cur, currencyDisplay: currencyDisplay as 'symbol', minimumFractionDigits: digits, maximumFractionDigits: digits });
    } catch {
      return null;
    }
  }, [locale, cur, currencyDisplay, digits]);
  useEffect(() => {
    setFormattedValue(n === null ? '' : fmt ? fmt.format(n) : String(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, fmt]);
  const change = (v: number | null) => {
    setValue(v as number);
    onChange();
  };
  ToolJet.useAction({ name: 'setFieldValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => change(toNumber(v)));
  ToolJet.useAction({ name: 'setCurrency', displayName: 'Set currency', params: [{ handle: 'currency', displayName: 'Currency code' }] }, (c) => setCurrency(str(c).toUpperCase()));
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(toNumber(props.value)));
  useFocusActions(ref);
  const choices = (Array.isArray(currencyOptions) ? currencyOptions : []).map((c) => str(c).toUpperCase()).filter(Boolean);
  const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <InputNumber<number>
            ref={ref as never}
            id={fieldId}
            style={{ width: '100%' }}
            value={n}
            min={toNumber(min) ?? undefined}
            max={toNumber(max) ?? undefined}
            precision={digits}
            placeholder={placeholder || undefined}
            prefix={choices.length ? undefined : symbolOf(cur, locale, currencyDisplay)}
            addonBefore={
              choices.length ? (
                <Select
                  value={cur}
                  options={choices.map((c) => ({ label: c, value: c }))}
                  onChange={(c) => setCurrency(c)}
                  style={{ width: 90 }}
                  classNames={{ popup: { root: popup.className } }}
                  disabled={disabled}
                />
              ) : undefined
            }
            formatter={(v, info) => (info.userTyping ? info.input : v === undefined || v === null || v === ('' as never) ? '' : group(String(v)))}
            parser={(v) => Number(String(v ?? '').replace(/[^\d.-]/g, '')) as number}
            disabled={disabled}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : undefined}
            onChange={(v) => change(typeof v === 'number' ? v : toNumber(v))}
            onPressEnter={() => onPressEnter()}
            onFocus={() => onFocus()}
            onBlur={() => {
              check.touch();
              onBlur();
            }}
          />
        </ControlSkeleton>
      </FormField>
    </AntProvider>
  );
};

// ---- PhoneInput ------------------------------------------------------------------------------------------------------

// An Ant Input with a country Select before it (flag and calling code): label, value (E.164, +14155550123),
// defaultCountry, onlyCountries, allowCountryChange, showFlag, placeholder, allowClear; country, countryCode,
// formattedValue and isValidNumber exposed; events onChange, onPressEnter, onFocus, onBlur; actions setFieldValue,
// setCountryCode, resetFields, focus, blur.
export const PhoneInput = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Phone' });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'E.164: +14155550123', initialValue: '' });
  const [defaultCountry] = ToolJet.useStateString({ name: 'defaultCountry', label: 'Default country', initialValue: 'US' });
  const [onlyCountries] = ToolJet.useStateArray({ name: 'onlyCountries', label: 'Only countries', description: "['US', 'GB', 'IN']; empty: all.", initialValue: [] });
  const [allowCountryChange] = ToolJet.useStateBoolean({ name: 'allowCountryChange', label: 'Allow country change', initialValue: true });
  const [showFlag] = ToolJet.useStateBoolean({ name: 'showFlag', label: 'Show flag', initialValue: true });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Enter a phone number' });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: false });
  const [, setCountry] = ToolJet.useStateString({ name: 'country', initialValue: '', inspector: 'hidden' });
  const [, setCountryCode] = ToolJet.useStateString({ name: 'countryCode', initialValue: '', inspector: 'hidden' });
  const [, setFormattedValue] = ToolJet.useStateString({ name: 'formattedValue', initialValue: '', inspector: 'hidden' });
  const [, setIsValidNumber] = ToolJet.useStateBoolean({ name: 'isValidNumber', initialValue: false, inspector: 'hidden' });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onPressEnter = ToolJet.useEventCallback({ name: 'onPressEnter' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const ref = useRef<InputRef>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 6 });
  const countries = useMemo(() => phoneCountries(onlyCountries), [onlyCountries]);
  const fallback: Country = countryOf(defaultCountry) ?? countries[0]!;
  const [picked, setPicked] = useState<Country>(() => phoneCountry(value, countries, fallback) ?? fallback);
  useEffect(() => {
    const c = phoneCountry(value, countries, picked);
    if (c && c !== picked) setPicked(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const national = nationalOf(value, picked);
  const info = phoneInfo(national, picked);
  const check = ToolJet.useValidation({ section: 'text', value: info.value, present: !!info.value });
  useEffect(() => {
    setCountry(info.country);
    setCountryCode(info.countryCode);
    setFormattedValue(info.formattedValue);
    setIsValidNumber(info.isValidNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.value, info.country]);
  const commit = (digits: string, c: Country) => {
    setValue(phoneInfo(digits, c).value);
    onChange();
  };
  ToolJet.useAction({ name: 'setFieldValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Number' }] }, (v) => {
    const c = phoneCountry(v, countries, picked) ?? picked;
    setPicked(c);
    commit(nationalOf(v, c), c);
  });
  ToolJet.useAction({ name: 'setCountryCode', displayName: 'Set country', params: [{ handle: 'country', displayName: 'Country (ISO code)' }] }, (code) => {
    const c = countryOf(code);
    if (c) {
      setPicked(c);
      commit(national, c);
    }
  });
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => setValue(str(props.value)));
  useFocusActions(ref);
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              value={picked.code}
              disabled={disabled || !allowCountryChange}
              showSearch
              popupMatchSelectWidth={false}
              optionFilterProp="search"
              style={{ width: showFlag ? 104 : 84, flex: 'none' }}
              size={look.size}
              variant={look.variant}
              classNames={{ popup: { root: popup.className } }}
              options={countries.map((c) => ({ value: c.code, search: `${c.code} +${c.dial}`, label: `${showFlag ? `${flagOf(c)} ` : ''}+${c.dial}` }))}
              onChange={(code) => {
                const c = countryOf(code) ?? picked;
                setPicked(c);
                commit(national, c);
              }}
            />
            <Input
              ref={ref}
              id={fieldId}
              inputMode="tel"
              value={national ? info.formattedValue.replace(/^\+\d+\s*/, '') : ''}
              placeholder={placeholder || undefined}
              allowClear={allowClear}
              disabled={disabled}
              size={look.size}
              variant={look.variant}
              status={check.error ? 'error' : undefined}
              onChange={(e) => commit(e.target.value.replace(/\D/g, '').slice(0, 15), picked)}
              onPressEnter={() => onPressEnter()}
              onFocus={() => onFocus()}
              onBlur={() => {
                check.touch();
                onBlur();
              }}
            />
          </Space.Compact>
        </ControlSkeleton>
      </FormField>
    </AntProvider>
  );
};

// ---- Password --------------------------------------------------------------------------------------------------------

const strengthOf = (v: string): { score: number; label: string } => {
  if (!v) return { score: 0, label: '' };
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^\w\s]/.test(v)) s++;
  const score = Math.max(1, Math.min(4, s));
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score]! };
};

// Ant's Input.Password: label, value, placeholder, visibilityToggle, showStrength (a four-step Progress under it),
// minLength, allowClear; strength exposed; events onChange, onPressEnter, onFocus, onBlur; actions setFieldValue,
// resetFields, focus, blur.
export const Password = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Password' });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Enter your password' });
  const [visibilityToggle] = ToolJet.useStateBoolean({ name: 'visibilityToggle', label: 'Visibility toggle', initialValue: true });
  const [showStrength] = ToolJet.useStateBoolean({ name: 'showStrength', label: 'Show strength', initialValue: false });
  const [minLength] = ToolJet.useStateNumber({ name: 'minLength', label: 'Min length', initialValue: 0, min: 0 });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: false });
  const [, setStrength] = ToolJet.useStateString({ name: 'strength', initialValue: '', inspector: 'hidden' });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onPressEnter = ToolJet.useEventCallback({ name: 'onPressEnter' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const ref = useRef<InputRef>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'text', value });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  const st = strengthOf(value);
  const short = Number(minLength) > 0 && value.length > 0 && value.length < Number(minLength);
  useEffect(() => {
    setStrength(st.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.label]);
  const change = (v: string) => {
    setValue(v);
    onChange();
  };
  ToolJet.useAction({ name: 'setFieldValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => change(str(v)));
  ToolJet.useAction({ name: 'resetFields', displayName: 'Clear' }, () => change(str(props.value)));
  useFocusActions(ref);
  const colors = ['', 'var(--ant-color-error)', 'var(--ant-color-warning)', 'var(--ant-color-primary)', 'var(--ant-color-success)'];
  return (
    <AntProvider tokens={tokens}>
      <FormField
        {...field}
        extra={short ? `At least ${Number(minLength)} characters` : field.extra}
        check={check}
        htmlFor={fieldId}
      >
        <ControlSkeleton loading={loading} size={look.size}>
          <Input.Password
            ref={ref}
            id={fieldId}
            value={value}
            placeholder={placeholder || undefined}
            visibilityToggle={visibilityToggle}
            allowClear={allowClear}
            disabled={disabled}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : short ? 'warning' : undefined}
            onChange={(e) => change(e.target.value)}
            onPressEnter={() => onPressEnter()}
            onFocus={() => onFocus()}
            onBlur={() => {
              check.touch();
              onBlur();
            }}
          />
        </ControlSkeleton>
        {showStrength && value ? (
          <div className="tj-ant-strength">
            <Progress percent={st.score * 25} steps={4} showInfo={false} strokeColor={colors[st.score]} size={[40, 4]} />
            <span style={{ color: colors[st.score] }}>{st.label}</span>
          </div>
        ) : null}
      </FormField>
    </AntProvider>
  );
};
