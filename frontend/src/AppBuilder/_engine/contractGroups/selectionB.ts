/**
 * Contract group: Phase 3b wave 3 batch B (selection-style widgets).
 *
 * DropDown, DropdownV2, RadioButton, RadioButtonV2, ButtonGroupV2,
 * ColorPicker, RangeSliderV2, Pagination, Navigation, PopoverMenu.
 *
 * Reducers replicate the widgets' old per-instance CSA closures exactly.
 * Events (onSelect / onSelectionChange / onChange / onPageChange) are NOT
 * fired here — they are appended as FIRE_EVENT commands by the widget's shim
 * overrides, preserving the old conditional-event semantics (e.g. DropdownV2
 * only fires onSelect when the option exists and is enabled).
 *
 * Where a reducer needs data the component does not expose (option lists that
 * live only in resolved properties), the widget shim pre-computes it with a
 * latest-ref and passes it as extra args — documented per action below.
 */
import { registerContract } from '../contracts';
import type { CsaReducer } from '../types';
import { pick } from 'lodash';
import { getExposedColorState, getTinyColorInstance } from '@/AppBuilder/Widgets/ColorPicker/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Shared boolean-coercing runtime-flag reducers (the common CSA trio).
const setVisibility: CsaReducer = (_cur, [visible]) => ({ isVisible: !!visible });
const setDisable: CsaReducer = (_cur, [disabled]) => ({ isDisabled: !!disabled });
const setLoading: CsaReducer = (_cur, [loading]) => ({ isLoading: !!loading });

/* ── DropDown (legacy) ───────────────────────────────────────────────────────
 * Old selectOption resolved value/label against resolved `values` /
 * `display_values` (not exposed). The widget shim performs that lookup and
 * dispatches args [value, selectedOptionLabel] — [undefined, undefined] when
 * the value is not in `values` (old setExposedItem(undefined, ...) path).
 * The seam folds isValid via the widget's validate (old setInputValue). */
registerContract({
  type: 'DropDown',
  stateActions: {
    selectOption: (_cur, [value, selectedOptionLabel]) => ({ value, selectedOptionLabel }),
  },
});

/* ── DropdownV2 ──────────────────────────────────────────────────────────────
 * selectOption receives an optional pre-resolved option (widget shim / UI
 * path pass it); otherwise falls back to the exposed `options` list. Patch
 * mirrors old setInputValue: { value, selectedOption } (+ isValid folded). */
const toSelectedOption = (option: any) =>
  option ? { ...pick(option, ['label', 'value']), caption: option?.caption ?? null } : null;

registerContract({
  type: 'DropdownV2',
  stateActions: {
    selectOption: (cur, [value, option]) => {
      const found =
        option ?? (Array.isArray(cur.options) ? (cur.options as any[]).find((o) => o?.value === value) : undefined);
      return { value, selectedOption: toSelectedOption(found) };
    },
    clear: () => ({ value: null, selectedOption: null }),
    setVisibility,
    setLoading,
    setDisable,
  },
});

/* ── RadioButton (legacy) ────────────────────────────────────────────────────
 * Old onSelect exposed the raw option value with no membership check and no
 * validation. The widget dispatch appends FIRE_EVENT onSelectionChange. */
registerContract({
  type: 'RadioButton',
  stateActions: {
    selectOption: (_cur, [option]) => ({ value: option }),
  },
});

/* ── RadioButtonV2 ───────────────────────────────────────────────────────────
 * Old onSelect unwrapped { value } objects, exposed value, validated (isValid
 * folded by the seam). No membership check (old behavior). */
const unwrapOptionValue = (value: unknown) =>
  typeof value === 'object' && value !== null && 'value' in (value as any) ? (value as any).value : value;

registerContract({
  type: 'RadioButtonV2',
  stateActions: {
    selectOption: (_cur, [value]) => ({ value: unwrapOptionValue(value) }),
    deselectOption: () => ({ value: null }),
    setVisibility,
    setDisable,
    setLoading,
  },
});

/* ── ButtonGroupV2 ───────────────────────────────────────────────────────────
 * Old setSelected filtered against resolved option values + multiSelection
 * (not exposed) — the widget shim normalizes and dispatches the final array.
 * isValid is exposed by the widget's selected-change effect (old batched
 * effect), not folded here (validation key is `selected`, not `value`). */
registerContract({
  type: 'ButtonGroupV2',
  stateActions: {
    clear: () => ({ selected: [] }),
    setSelected: (_cur, [selected]) => ({ selected }),
    setDisable,
    setVisibility,
    setLoading,
  },
});

/* ── ColorPicker ─────────────────────────────────────────────────────────────
 * setColor derives the hex/rgb/rgba trio from CURRENT exposed allowOpacity
 * (old closure read exposedVariablesTemporaryState.allowOpacity). isValid is
 * exposed by the widget's hex-change effect. */
registerContract({
  type: 'ColorPicker',
  stateActions: {
    setColor: (cur, [value]) => getExposedColorState(getTinyColorInstance(value as string), cur.allowOpacity as boolean),
    setDisable,
    setVisibility,
    setLoading,
  },
});

/* ── RangeSliderV2 ───────────────────────────────────────────────────────────
 * setDisable/setLoading intentionally expose the RAW argument (old closures
 * did not coerce with !!). setValue exposes Number(value) (old closure). */
registerContract({
  type: 'RangeSliderV2',
  stateActions: {
    setValue: (_cur, [value]) => ({ value: Number(value) }),
    setRangeValue: (_cur, [num1, num2]) => ({ value: [num1, num2] }),
    setVisibility,
    setDisable: (_cur, [disabled]) => ({ isDisabled: disabled }),
    setLoading: (_cur, [loading]) => ({ isLoading: loading }),
  },
});

/* ── Pagination ──────────────────────────────────────────────────────────────
 * setPage clamps into [1, totalPages] reading CURRENT exposed totalPages
 * (write-through-synced from properties.numberOfPages). Invalid input → no
 * patch; the widget shim mirrors the check so onPageChange only fires for
 * valid input (old conditional-event behavior). */
registerContract({
  type: 'Pagination',
  stateActions: {
    setPage: (cur, [pageIndex]) => {
      const total = Number(cur.totalPages);
      const n = Number(pageIndex);
      if (!Number.isFinite(n) || !Number.isFinite(total) || total < 1) return {};
      return { currentPageIndex: Math.min(Math.max(1, Math.floor(n)), total) };
    },
    setVisibility,
    setDisable,
    setLoading,
  },
});

/* ── Navigation ──────────────────────────────────────────────────────────────
 * selectItem: the widget shim resolves itemId → clickData ({ id, label,
 * groupId, groupLabel }) against resolved menuItems (not exposed) and only
 * dispatches for existing non-group items (old guard). previousSelectedItem
 * comes from CURRENT exposed selectedItem (old selectedItemRef mirror). */
registerContract({
  type: 'Navigation',
  stateActions: {
    selectItem: (cur, [clickData]) => ({
      selectedItem: clickData,
      previousSelectedItem: cur.selectedItem ?? null,
    }),
    setDisable,
    setVisibility,
    setLoading,
  },
});

/* ── PopoverMenu ─────────────────────────────────────────────────────────── */
registerContract({
  type: 'PopoverMenu',
  stateActions: {
    setDisable,
    setVisibility,
    setLoading,
  },
});
