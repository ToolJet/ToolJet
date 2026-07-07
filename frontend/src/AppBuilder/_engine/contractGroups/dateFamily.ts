/**
 * Date family contract group (Phase 3c / Wave 4) — Datepicker(legacy, no
 * CSAs, not registered here), DatePickerV2, DatetimePickerV2, DaterangePicker.
 *
 * Only the isVisible/isDisabled/isLoading trio (shared via useDatetimeInput)
 * is genuine Bucket B — pure booleans, no derivation. Everything else
 * (minDate/maxDate/excludedDates, minTime/maxTime, and each widget's own
 * value/timestamp/date/time/timezone CSAs) stays Bucket C: the underlying
 * state is a tangle of interlocking useEffects (unix timestamp ⇄ selected
 * timestamp ⇄ display timezone ⇄ store timezone, moment/DST math) that
 * isn't a good fit for a pure reducer — re-deriving it from exposed state
 * alone would risk a subtle timezone bug for no real benefit. These CSAs
 * are re-registered via registerEffects with their exact old logic
 * unchanged; only the registration mechanism moves onto the new seam.
 */
import { registerContract } from '../contracts';
import type { CsaReducer } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Old useDatetimeInput closures published the RAW argument (no !! coercion).
const trioActions: Record<string, CsaReducer> = {
  setVisibility: (_cur, [value]) => ({ isVisible: value }),
  setLoading: (_cur, [value]) => ({ isLoading: value }),
  setDisable: (_cur, [value]) => ({ isDisabled: value }),
};

// Verified against useDatetimeInput.js's own mount snapshot
// (properties.visibility/loadingState/disabledState → isVisible/isLoading/
// isDisabled, :108-110) — shared by all three date-family widgets. The
// actual `value`/`timestamp`/timezone state is Bucket C (see file header);
// omitted here.
const deriveDateFamilyTrio = (properties: Record<string, unknown>) => ({
  isVisible: properties?.visibility,
  isLoading: properties?.loadingState,
  isDisabled: properties?.disabledState,
});

const dateFamilyEffectActions = [
  'setFocus',
  'setBlur',
  'setMinDate',
  'setMaxDate',
  'setDisabledDates',
  'clearDisabledDates',
];

registerContract({
  type: 'DatePickerV2',
  stateActions: { ...trioActions },
  effectActions: [...dateFamilyEffectActions, 'setValue', 'clearValue', 'setValueInTimestamp', 'setDate'],
  deriveExposed: deriveDateFamilyTrio,
});

registerContract({
  type: 'DatetimePickerV2',
  stateActions: { ...trioActions },
  effectActions: [
    ...dateFamilyEffectActions,
    'setMinTime',
    'setMaxTime',
    'setValue',
    'clearValue',
    'setValueInTimestamp',
    'setDate',
    'setTime',
    'setDisplayTimezone',
    'setStoreTimezone',
  ],
  deriveExposed: deriveDateFamilyTrio,
});

registerContract({
  type: 'DaterangePicker',
  stateActions: { ...trioActions },
  effectActions: [
    ...dateFamilyEffectActions,
    'clearDateRange',
    'setDateRange',
    'clearStartDate',
    'clearEndDate',
    'setStartDate',
    'setEndDate',
  ],
  deriveExposed: deriveDateFamilyTrio,
});
