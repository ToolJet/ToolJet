import React, { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../lib/usePortalContainer';
import { useOwnerGuard } from '../lib/useOwnerGuard';
import { TJ } from '../lib/ui2/inputs/sdk';
import { POPOVER, field, useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { ClearX, isEnter, useReseed, useRuleCheck } from '../lib/ui2/inputs/parts';
import * as P from '../lib/ui2/inputs/phone';
import type { Country } from '../lib/ui2/inputs/phone';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ...field(),
  ['countryBackgroundColor', 'Country button background', '--lk-addon-bg'],
  ['countryTextColor', 'Country button text color', '--lk-addon-fg'],
  ...POPOVER,
];

export const PhoneInput = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Phone number' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = TJ.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Enter phone number' });
  const [defaultValue] = TJ.useStateString({ name: 'defaultValue', label: 'Default value (E.164 or a national number)', initialValue: '' });
  const [defaultCountry] = TJ.useStateString({ name: 'defaultCountry', label: 'Default country (ISO code)', initialValue: 'US' });
  const [onlyCountries] = TJ.useStateArray({
    name: 'onlyCountries',
    label: 'Countries offered (ISO codes; empty: all)',
    placeholder: "['US', 'CA', 'GB']",
    initialValue: [],
  });
  const [isCountryChangeEnabled] = TJ.useStateBoolean({ name: 'isCountryChangeEnabled', label: 'Enable country change', initialValue: true });
  const [showFlag] = TJ.useStateBoolean({ name: 'showFlag', label: 'Show country flag', initialValue: true });
  const [showClearBtn] = TJ.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // Exposed: the number (E.164) and its country, calling code, formatted text and validity.
  const [rawValue, setValue] = TJ.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [countryState, setCountryState] = TJ.useStateString({ name: 'country', initialValue: defaultCountry, inspector: 'hidden' });
  const [, setCountryCode] = TJ.useStateString({ name: 'countryCode', initialValue: '+1', inspector: 'hidden' });
  const [, setFormattedValue] = TJ.useStateString({ name: 'formattedValue', initialValue: '', inspector: 'hidden' });
  const [, setIsValidNumber] = TJ.useStateBoolean({ name: 'isValidNumber', initialValue: false, inspector: 'hidden' });
  const [legacyRequired] = TJ.useStateBoolean({ name: 'required', label: 'Required', initialValue: false, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });
  const onEnterPressed = TJ.useEventCallback({ name: 'onEnterPressed' });
  const onFocus = TJ.useEventCallback({ name: 'onFocus' });
  const onBlur = TJ.useEventCallback({ name: 'onBlur' });

  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [anchorRef, container] = usePortalContainer();
  const countries = P.phoneCountries(onlyCountries);
  const fallback = P.countryOf(defaultCountry) ?? countries[0];
  const offered = (c: Country | null) => (c && countries.includes(c) ? c : null);
  const country = offered(P.countryOf(countryState)) ?? (countries.includes(fallback) ? fallback : countries[0]);
  const national = P.nationalOf(rawValue, country);

  const publish = (digits: string, c: Country) => {
    const info = P.phoneInfo(digits, c);
    setValue(info.value);
    setCountryState(info.country);
    setCountryCode(info.countryCode);
    setFormattedValue(info.formattedValue);
    setIsValidNumber(info.isValidNumber);
  };
  const change = (digits: string, c: Country = country) => {
    if (digits === national && c === country) return;
    publish(digits, c);
    onChange();
  };
  /** Starts from a value (E.164 or national) and a country, the country an E.164 number names winning. */
  const start = (v: unknown, c: Country) => {
    const detected = offered(P.phoneCountry(v, countries, c));
    const to = detected ?? c;
    publish(P.nationalOf(v, to), to);
  };
  const mounted = useRef(false);
  useReseed([defaultValue, defaultCountry], () => {
    // On mount an untouched Default country leaves a country the app set (`country`, the pack's earlier name) alone.
    const keep = !mounted.current && defaultCountry === 'US';
    mounted.current = true;
    const c = offered(P.countryOf(keep ? countryState : defaultCountry)) ?? countries[0];
    // Without a default number, a number the app set (`value`, the pack's earlier name) is kept.
    start(defaultValue || rawValue, c);
  });

  TJ.useAction(
    {
      name: 'setValue',
      displayName: 'Set value',
      params: [
        { handle: 'value', displayName: 'Value' },
        { handle: 'country', displayName: 'Country' },
      ],
    },
    (v, c) => {
      start(v, offered(P.countryOf(c)) ?? country);
      onChange();
      rule.touch();
    }
  );
  TJ.useAction({ name: 'setCountryCode', displayName: 'Set country code', params: [{ handle: 'countryCode', displayName: 'Country code' }] }, (c) => {
    const text = String(c ?? '').trim();
    const next = offered(P.countryOf(text)) ?? countries.find((x) => `+${x.dial}` === text || x.dial === text) ?? null;
    if (next) publish(national, next);
  });
  TJ.useAction({ name: 'clear', displayName: 'Clear' }, () => {
    publish('', country);
    onChange();
    rule.touch();
  });
  TJ.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => inputRef.current?.focus());
  TJ.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => inputRef.current?.blur());
  // The pack's earlier action name, kept for apps that use it.
  TJ.useAction({ name: 'focus', displayName: 'Focus' }, () => inputRef.current?.focus());

  const value = P.toE164(national, country);
  const fieldId = TJ.useFieldId();
  const control = TJ.useControlState();
  const check = TJ.useValidation({ section: 'text', value });
  const rule = useRuleCheck(
    check,
    national && !P.isValidNational(national, country)
      ? 'Enter a valid phone number'
      : legacyRequired && !national
        ? 'This field is mandatory'
        : ''
  );
  const looks = useLooks(LOOKS);
  TJ.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });

  const disabled = legacyDisabled || control.disabled;
  const canChange = isCountryChangeEnabled !== false && countries.length > 1;
  const flag = showFlag !== false;
  const [open, setOpen] = useState(false);
  // An open popup closes when its owner stops taking input (disabled, or blocked or hidden by the host): useOwnerGuard.
  useOwnerGuard(anchorRef, open, () => setOpen(false), disabled);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const q = query.trim().toLowerCase().replace(/^\+/, '');
  const shown = countries.filter(
    (c) => !q || P.countryName(c).toLowerCase().includes(q) || c.dial.startsWith(q) || c.code.toLowerCase() === q
  );
  const pick = (c: Country) => {
    change(national, c);
    setOpen(false);
  };
  const current = (
    <>
      {flag ? <span className="ui2-flag" aria-hidden="true">{P.flagOf(country)}</span> : null}
      <span className="ui2-tabular">+{country.dial}</span>
    </>
  );
  const clearable = showClearBtn && !!national && !disabled && !control.loading;

  return (
    <div className="ui ui2-in" ref={anchorRef} style={looks}>
      <Field label={label} description={description} htmlFor={fieldId} error={rule.error} required={rule.required}>
        <FieldLoading loading={control.loading}>
          <div className={cn('ui-input ui2-group', disabled && 'is-disabled')}>
            {canChange ? (
              <Popover.Root
                open={open && !disabled}
                onOpenChange={(next) => {
                  setOpen(next);
                  setQuery('');
                  setActive(Math.max(0, countries.indexOf(country)));
                }}
              >
                <Popover.Trigger asChild>
                  <button type="button" className="ui2-addon" disabled={disabled} aria-label={`Country: ${P.countryName(country)}`}>
                    {current}
                    <ChevronsUpDown size={14} className="ui2-addon-chevron" />
                  </button>
                </Popover.Trigger>
                {container ? (
                  <Popover.Portal container={container}>
                    <Popover.Content
                      aria-label="Choose a country"
                      className="ui-popup ui2-in ui2-pop"
                      style={{ ...looks, width: 300 }}
                      align="start"
                      sideOffset={4}
                      onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        searchRef.current?.focus();
                      }}
                      onCloseAutoFocus={(e) => {
                        e.preventDefault();
                        inputRef.current?.focus();
                      }}
                    >
                      <div className="ui2-pop-search">
                        <Search size={16} />
                        <input
                          ref={searchRef}
                          placeholder="Search country..."
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                              e.preventDefault();
                              const dir = e.key === 'ArrowDown' ? 1 : -1;
                              setActive((i) => (shown.length ? (i + dir + shown.length) % shown.length : 0));
                            } else if (isEnter(e) && shown[active]) {
                              e.preventDefault();
                              pick(shown[active]);
                            }
                          }}
                        />
                      </div>
                      <div className="ui2-pop-list" role="listbox" aria-label="Countries">
                        {shown.length ? (
                          shown.map((c, i) => (
                            <button
                              key={c.code}
                              type="button"
                              role="option"
                              aria-selected={c === country}
                              data-active={i === active || undefined}
                              className={cn('ui2-pop-item', c === country && 'is-selected')}
                              onMouseEnter={() => setActive(i)}
                              onClick={() => pick(c)}
                            >
                              {flag ? <span className="ui2-flag" aria-hidden="true">{P.flagOf(c)}</span> : null}
                              <span className="ui2-pop-item-name">{P.countryName(c)}</span>
                              <span className="ui2-pop-item-note">+{c.dial}</span>
                              <Check size={16} className="ui2-pop-check" />
                            </button>
                          ))
                        ) : (
                          <div className="ui2-pop-empty">No country found.</div>
                        )}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                ) : null}
              </Popover.Root>
            ) : (
              <span className="ui2-addon" aria-label={`Country: ${P.countryName(country)}`}>
                {current}
              </span>
            )}
            <input
              ref={inputRef}
              {...fieldAria(fieldId, rule.error, rule.required, !!description)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="ui2-inner ui2-tabular"
              placeholder={placeholder}
              disabled={disabled}
              value={P.groupDigits(national)}
              onChange={(e) => {
                const text = e.target.value;
                // A pasted international number picks its country.
                const pasted = text.trim().startsWith('+') ? offered(P.phoneCountry(text, countries, country)) : null;
                const to = pasted ?? country;
                change(P.nationalOf(text, to), to);
              }}
              onKeyDown={(e) => isEnter(e) && onEnterPressed()}
              onFocus={onFocus}
              onBlur={() => {
                rule.touch();
                onBlur();
              }}
            />
            {clearable ? (
              <ClearX
                onClear={() => {
                  change('');
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
