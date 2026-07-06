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

/** Base CSA set for the useInput family. `setValue` MUST stay in this
 *  object — useControlledInput.ts dispatches `action: 'setValue'`
 *  internally for every keystroke/increment/decrement (see
 *  useControlledInput.ts:216,265,273,282,312 and NumberInput.jsx's
 *  handleChange/handleIncrement/handleDecrement/handleClear, all of which
 *  call `setInputValue` → that dispatch). Removing it breaks typing itself,
 *  not just an external API surface — confirmed by tracing the dispatch
 *  path before making this change (an earlier attempt at this fix removed
 *  it and would have broken every TextInput-family widget's typing).
 *  The deprecated `loading` alias, by contrast, never existed in old
 *  useInput.js for any input type and IS safe to drop — nothing dispatches
 *  `action: 'loading'` internally, it was only ever a would-be external
 *  alias name. */
const baseInputActions: ComponentTypeContract['stateActions'] = {
  setValue: (_cur, [value]) => ({ value }),
  setText: (_cur, [text]) => ({ value: text }),
  clear: () => ({ value: '' }),
  setVisibility: (_cur, [visible]) => ({ isVisible: !!visible }),
  setDisable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
  setLoading: (_cur, [loading]) => ({ isLoading: !!loading }),
};

// setValue is a dispatch target only for these four types — the
// pre-migration widgets never exposed it externally (only Currency/Phone
// did). `internalOnlyActions` tells useControlledInput.ts's mount effect to
// keep dispatching through it (typing must keep working) without
// publishing it into the widget's exposed-variables/Inspector surface.
const TEXT_FAMILY_INTERNAL_ONLY = ['setValue'];

export const TextInputContract: ComponentTypeContract = {
  type: 'TextInput',
  stateActions: {
    ...baseInputActions,
    // deprecated aliases — TextInput-specific in old useInput.js:215-224.
    visibility: (_cur, [visible]) => ({ isVisible: !!visible }),
    disable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
  },
  effectActions: ['setFocus', 'setBlur'],
  internalOnlyActions: TEXT_FAMILY_INTERNAL_ONLY,
};

registerContract(TextInputContract);
// Password/Email/TextArea share setValue/setText/clear/the trio with
// TextInput (setValue is structurally required, see comment above) but
// never got the deprecated aliases (old useInput.js only added those for
// inputType === 'TextInput' specifically).
registerContract({
  type: 'PasswordInput',
  stateActions: baseInputActions,
  effectActions: ['setFocus', 'setBlur'],
  internalOnlyActions: TEXT_FAMILY_INTERNAL_ONLY,
});
registerContract({
  type: 'EmailInput',
  stateActions: baseInputActions,
  effectActions: ['setFocus', 'setBlur'],
  internalOnlyActions: TEXT_FAMILY_INTERNAL_ONLY,
});
registerContract({
  type: 'TextArea',
  stateActions: baseInputActions,
  effectActions: ['setFocus', 'setBlur'],
  internalOnlyActions: TEXT_FAMILY_INTERNAL_ONLY,
});

/** NumberInput owns the NaN→null normalization (today a post-hoc widget
 *  effect, NumberInput.jsx old :86-90). setValue is structurally required
 *  here too — handleChange/handleIncrement/handleDecrement/handleClear all
 *  dispatch through it (see comment on baseInputActions above) — but old
 *  NumberInput never exposed a value-setting CSA externally either
 *  (increment/decrement were UI-only), so it's internal-only here too. */
registerContract({
  type: 'NumberInput',
  stateActions: {
    ...baseInputActions,
    setValue: (_cur, [value]) => {
      const parsed = value === null || value === undefined || value === '' ? null : Number(value);
      return { value: parsed === null || Number.isNaN(parsed) ? null : parsed };
    },
    clear: () => ({ value: null }),
  },
  effectActions: ['setFocus', 'setBlur'],
  internalOnlyActions: TEXT_FAMILY_INTERNAL_ONLY,
});

/* ── CurrencyInput / PhoneInput (Phase 3a steps 5-6) ─────────────────────────
 * Old useInput.js re-registered phone/currency setValue closures on every
 * `country` change because closures went stale (useInput.js:169,180). Reducers
 * read country/decimalPlaces/numberFormat from CURRENT state instead —
 * decimalPlaces/numberFormat are injected by the widget via the hook's
 * `contractState` (they are resolved properties, not exposed values). */

// Currency/phone never exposed setText (they had their own setValue instead).
const { setText: _setText, ...sharedInputActions } = baseInputActions;

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
