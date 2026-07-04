/**
 * Per-component-type contracts (Phase 3).
 *
 * Each Bucket B CSA is defined ONCE per component type as a pure reducer over
 * that component's runtime state — replacing today's per-instance closures
 * registered by mounted widgets (the mount-coupling this program removes).
 * Bucket C names route to EffectIntents executed by the mounted widget.
 *
 * Coverage grows with the Phase 3 widget conversions; TextInput (the useInput
 * family's contract) is the reference implementation.
 */
import type { ComponentTypeContract, CsaReducer } from './types';
// eslint-disable-next-line import/no-unresolved
import { formatPhoneNumberIntl, getCountries, getCountryCallingCode } from 'react-phone-number-input';
import { formatValue } from 'react-currency-input-field';
import {
  getCountryCallingCodeSafe,
  formatNumber,
  parseValueToNumber,
} from '@/AppBuilder/Widgets/PhoneCurrency/utils';
import { CurrencyMap } from '@/AppBuilder/Widgets/PhoneCurrency/constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

const registry = new Map<string, ComponentTypeContract>();

export function registerContract(contract: ComponentTypeContract): void {
  registry.set(contract.type, contract);
}

export function getContract(type: string): ComponentTypeContract | undefined {
  return registry.get(type);
}

/** Reference contract for the useInput family (TextInput et al.).
 *  Mirrors the CSA set registered in useInput.js:160-235 today, including the
 *  deprecated aliases (disable/visibility/loading) legacy apps still call. */
const inputStateActions: ComponentTypeContract['stateActions'] = {
  setValue: (_cur, [value]) => ({ value }),
  setText: (_cur, [text]) => ({ value: text }),
  clear: () => ({ value: '' }),
  setVisibility: (_cur, [visible]) => ({ isVisible: !!visible }),
  setDisable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
  setLoading: (_cur, [loading]) => ({ isLoading: !!loading }),
  // deprecated aliases (useInput.js:215-224)
  visibility: (_cur, [visible]) => ({ isVisible: !!visible }),
  disable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
  loading: (_cur, [loading]) => ({ isLoading: !!loading }),
};

export const TextInputContract: ComponentTypeContract = {
  type: 'TextInput',
  stateActions: inputStateActions,
  effectActions: ['setFocus', 'setBlur'],
};

registerContract(TextInputContract);
// Password/Email/TextArea share TextInput's CSA semantics verbatim.
registerContract({ ...TextInputContract, type: 'PasswordInput' });
registerContract({ ...TextInputContract, type: 'EmailInput' });
registerContract({ ...TextInputContract, type: 'TextArea' });

/** NumberInput owns the NaN→null normalization (today a post-hoc widget
 *  effect, NumberInput.jsx:86-90). */
registerContract({
  type: 'NumberInput',
  stateActions: {
    ...inputStateActions,
    setValue: (_cur, [value]) => {
      const parsed = value === null || value === undefined || value === '' ? null : Number(value);
      return { value: parsed === null || Number.isNaN(parsed) ? null : parsed };
    },
    clear: () => ({ value: null }),
  },
  effectActions: ['setFocus', 'setBlur'],
});

/* ── CurrencyInput / PhoneInput (Phase 3a steps 5-6) ─────────────────────────
 * Old useInput.js re-registered phone/currency setValue closures on every
 * `country` change because closures went stale (useInput.js:169,180). Reducers
 * read country/decimalPlaces/numberFormat from CURRENT state instead —
 * decimalPlaces/numberFormat are injected by the widget via the hook's
 * `contractState` (they are resolved properties, not exposed values). */

// Currency/phone never exposed setText nor the TextInput deprecated aliases.
const {
  setText: _setText,
  visibility: _visibility,
  disable: _disable,
  loading: _loading,
  ...sharedInputActions
} = inputStateActions;

/** value → { value: parsed number, country, formattedValue } — the derivation
 *  the CurrencyInput widget effects performed post-hoc (CurrencyInput.jsx old
 *  :210-242): exposed value is ALWAYS the parsed number. */
const deriveCurrencyPatch = (cur: Record<string, unknown>, rawValue: unknown, country: string) => {
  const numberFormat = cur.numberFormat === 'eu' ? 'eu' : 'us';
  const separators =
    numberFormat === 'eu'
      ? { groupSeparator: '.', decimalSeparator: ',' }
      : { groupSeparator: ',', decimalSeparator: '.' };
  const isEmpty = rawValue === '' || rawValue === null || rawValue === undefined;
  const parsed = parseValueToNumber(rawValue, numberFormat);
  const formatted = formatValue({ value: isEmpty ? '' : `${parsed}`, ...separators });
  return {
    value: parsed,
    country,
    formattedValue: `${(CurrencyMap as any)[country]?.prefix} ${formatted}`,
  };
};

const currencySetValue: CsaReducer = (cur, [value, countryCode]) => {
  const country = (countryCode ?? cur.country ?? 'US') as string;
  const decimalPlaces = Number(cur.decimalPlaces) || 0;
  // Old CSA semantics (useInput.js:171-180): numeric-looking values get their
  // decimals truncated to decimalPlaces; anything else passes through raw
  // (parseValueToNumber then handles locale-formatted strings).
  const base = typeof value === 'number' || !isNaN(Number(value)) ? formatNumber(value, decimalPlaces) : value;
  return deriveCurrencyPatch(cur, base, country);
};

export const CurrencyInputContract: ComponentTypeContract = {
  type: 'CurrencyInput',
  stateActions: {
    ...sharedInputActions,
    setValue: currencySetValue,
    clear: (cur) => deriveCurrencyPatch(cur, '', (cur.country ?? 'US') as string),
    setCountryCode: (cur, [code]) => {
      // Country change never republishes value (old widget only re-derived formattedValue).
      const { value: _value, ...patch } = deriveCurrencyPatch(cur, cur.value, code as string);
      return patch;
    },
  },
  effectActions: ['setFocus', 'setBlur'],
};

registerContract(CurrencyInputContract);

const phoneSetValue: CsaReducer = (cur, [value, nextCountry]) => {
  const currentCountry = (cur.country as string) || 'US';
  const raw = `${value ?? ''}`;
  // Widget keystroke path: react-phone-number-input already emits E.164 for
  // the active country — publish as-is (old setPhoneInputValue, useInput.js:249-261).
  if (raw.startsWith('+') && nextCountry === undefined) {
    const code = getCountryCallingCodeSafe(currentCountry);
    return { value: raw, country: currentCountry, countryCode: `+${code}`, formattedValue: formatPhoneNumberIntl(raw as any) };
  }
  // CSA path (useInput.js:160-168): `value` is the national number; rebase it
  // onto the TARGET country's calling code, ignoring an invalid country.
  const targetCountry = (getCountryCallingCodeSafe(nextCountry) ? nextCountry : currentCountry) as string;
  const code = getCountryCallingCodeSafe(targetCountry);
  const national = raw.replace(/\D/g, '');
  const next = national ? `+${code}${national}` : '';
  return { value: next, country: targetCountry, countryCode: `+${code}`, formattedValue: formatPhoneNumberIntl(next as any) };
};

export const PhoneInputContract: ComponentTypeContract = {
  type: 'PhoneInput',
  stateActions: {
    ...sharedInputActions,
    setValue: phoneSetValue,
    clear: (cur) => phoneSetValue(cur, ['']),
    // Accepts a country code ('CN') or a calling code ('+86'); re-bases the
    // current value onto the new calling code (old PhoneInput.jsx onCountryChange).
    setCountryCode: (cur, [code]) => {
      const resolved = getCountryCallingCodeSafe(code)
        ? (code as string)
        : getCountries().find((c: string) => `+${getCountryCallingCode(c as any)}` === code) || '';
      const newCode = getCountryCallingCodeSafe(resolved);
      if (!newCode) return {};
      const oldCode = getCountryCallingCodeSafe(cur.country);
      let localNumber = `${cur.value ?? ''}`.replace(/\D/g, '');
      if (oldCode && localNumber.startsWith(`${oldCode}`)) {
        localNumber = localNumber.slice(`${oldCode}`.length);
      }
      const nextValue = localNumber ? `+${newCode}${localNumber}` : '';
      // A re-resolved-but-unchanged country must not trigger writes/re-renders.
      if (resolved === cur.country && nextValue === cur.value) return {};
      return {
        value: nextValue,
        country: resolved,
        countryCode: `+${newCode}`,
        formattedValue: formatPhoneNumberIntl(nextValue as any),
      };
    },
  },
  effectActions: ['setFocus', 'setBlur'],
};

registerContract(PhoneInputContract);
