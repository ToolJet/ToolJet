/**
 * Wave 4 contract group — heavy widget families (Phase 3c).
 *
 * Unlike selectionB.ts/mediaC.ts (Phase 3b), these contracts did not exist
 * before this batch — each is designed from the widget's OLD per-instance
 * closures during conversion, not lifted from a pre-written spec.
 *
 * Widgets side-effect-import this module so registration happens before their
 * first csaShims() call.
 */
import { registerContract } from '../contracts';
import type { CsaReducer } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const setVisibilityCoerced: CsaReducer = (_cur, [visible]) => ({ isVisible: !!visible });

/* ── Steps ────────────────────────────────────────────────────────────────
 * Old closures: setStepVisible/setStepDisable mutate the exposed `steps`
 * array by id (no event); resetSteps re-derives currentStepId from the
 * CURRENT exposed steps' first visible entry; setStep/setVisibility/
 * setDisabled are the exposed action names verbatim (note: `setDisabled`,
 * not `setDisable` — matches the old widget exactly). The old CSA `setStep`
 * guarded against the resolved `disabledState` PROP (not exposed isDisabled)
 * — that guard is applied by the widget wrapper before dispatch, not here,
 * since reducers only see exposed state.
 */
registerContract({
  type: 'Steps',
  stateActions: {
    setStepVisible: (cur, [stepId, visible]) => ({
      steps: ((cur.steps as any[]) || []).map((item) => (item.id == stepId ? { ...item, visible } : item)),
    }),
    setStepDisable: (cur, [stepId, disabled]) => ({
      steps: ((cur.steps as any[]) || []).map((item) => (item.id == stepId ? { ...item, disabled } : item)),
    }),
    resetSteps: (cur) => {
      const first = ((cur.steps as any[]) || []).filter((step) => step.visible)?.[0];
      return { currentStepId: first?.id };
    },
    setStep: (_cur, [stepId]) => ({ currentStepId: stepId }),
    setVisibility: setVisibilityCoerced,
    setDisabled: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
  },
});

/* ── TreeSelect ───────────────────────────────────────────────────────────
 * Old selectOptions closure REPLACED `checked` wholesale (not additive);
 * deselectOptions removed the given values from the CURRENT checked array —
 * both preserved exactly. The derived checkedPathArray/checkedPathStrings/
 * leafPathArray/leafPathStrings can't be computed here (they depend on the
 * resolved `data` prop, not exposed state) — the widget's useTreeSelect hook
 * republishes them via its own effect whenever `checked` changes.
 */
const normalizeTreeValues = (input: unknown): unknown[] => {
  if (Array.isArray(input)) return input;
  if (input != null) return [input];
  return [];
};

registerContract({
  type: 'TreeSelect',
  stateActions: {
    setVisibility: setVisibilityCoerced,
    setDisable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
    setLoading: (_cur, [loading]) => ({ isLoading: !!loading }),
    selectOptions: (_cur, [values]) => ({ checked: normalizeTreeValues(values) }),
    deselectOptions: (cur, [values]) => {
      const toRemove = new Set(normalizeTreeValues(values));
      return { checked: ((cur.checked as any[]) || []).filter((v) => !toRemove.has(v)) };
    },
  },
});

/* ── Multiselect (legacy) ─────────────────────────────────────────────────
 * Old widget never exposed isVisible/isDisabled/isLoading at all (render
 * reads the resolved styles/props directly) — no trio here, matching that.
 * Membership-in-selectOptions and already-selected guards are checked by
 * the widget wrapper before dispatch (they need the resolved values/
 * display_values props, not exposed state); these reducers are the
 * unconditional mutation once the guard has already passed.
 */
registerContract({
  type: 'Multiselect',
  stateActions: {
    selectOption: (cur, [value]) => ({ values: [...(((cur.values as any[]) || [])), value] }),
    deselectOption: (cur, [value]) => ({ values: ((cur.values as any[]) || []).filter((v) => v !== value) }),
    clearSelections: () => ({ values: [] }),
  },
});

/* ── Kanban ───────────────────────────────────────────────────────────────
 * No Bucket B state at all: updateCardData/moveCard/addCard/deleteCard all
 * mutate the widget's local drag-and-drop `items` state (needed for the
 * dnd-kit SortableContext) alongside the exposed writes — none of it can be
 * a pure store reducer. All four stay Bucket C effectActions, unchanged
 * logic, just re-registered via registerEffects instead of raw
 * setExposedVariable calls.
 */
registerContract({
  type: 'Kanban',
  stateActions: {},
  effectActions: ['updateCardData', 'moveCard', 'addCard', 'deleteCard'],
});

/* ── Modal / ModalV2 ──────────────────────────────────────────────────────
 * open/close are pure Bucket C: they mutate the widget's local `showModal`
 * state and trigger real DOM side effects (canvas overflow, focus, resize
 * observers) via onShowSideEffects/onHideSideEffects — there is no store
 * patch that could represent "the modal is animating open." Modal (V1)
 * never exposed a disable/loading/visibility trio, so it declares no
 * stateActions. ModalV2's trio uses non-standard names (setDisableTrigger/
 * setDisableModal — two independent disabled flags, not the usual single
 * setDisable) so it needs its own contract rather than the standard-3
 * factory.
 */
registerContract({ type: 'Modal', stateActions: {}, effectActions: ['open', 'close'] });
registerContract({
  type: 'ModalV2',
  stateActions: {
    // Old useModalCSA closures published the RAW argument for all four —
    // no !! coercion (unlike most other trio contracts).
    setVisibility: (_cur, [value]) => ({ isVisible: value }),
    setLoading: (_cur, [value]) => ({ isLoading: value }),
    setDisableTrigger: (_cur, [value]) => ({ isDisabledTrigger: value }),
    setDisableModal: (_cur, [value]) => ({ isDisabledModal: value }),
  },
  effectActions: ['open', 'close'],
});

/* ── MultiselectV2 ────────────────────────────────────────────────────────
 * selectOptions/deselectOptions patches are pre-computed by the widget
 * wrapper (they need selectOptions/maxSelectionLimit, not exposed state) —
 * `setSelection` just applies the finished { values, selectedOptions }
 * patch. Old widget's `clear` CSA reset both keys to empty arrays.
 */
registerContract({
  type: 'MultiselectV2',
  stateActions: {
    setVisibility: setVisibilityCoerced,
    setDisable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
    setLoading: (_cur, [loading]) => ({ isLoading: !!loading }),
    clear: () => ({ values: [], selectedOptions: [] }),
    setSelection: (_cur, [patch]) => patch as Record<string, unknown>,
  },
});
