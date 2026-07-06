/**
 * Contract group "display A" (Phase 3b wave 3 batch A).
 *
 * Bucket B CSAs for the display-family widgets, defined once per component
 * type as pure reducers (replacing the per-instance closures those widgets
 * registered on mount). Bucket C names (Button/Icon `click`, IFrame `reload`,
 * RichTextEditor `setValue`) stay widget-executed through the effect registry.
 *
 * Loaded via side-effect import from each converted widget (contracts.ts is a
 * shared file this batch does not touch).
 *
 * Reducer semantics mirror the OLD widget closures exactly — including where
 * they coerced with `!!` and where they published the raw argument.
 */
import { registerContract } from '../contracts';
import type { CsaReducer } from '../types';

const setVisibility: CsaReducer = (_cur, [value]) => ({ isVisible: !!value });
const setDisable: CsaReducer = (_cur, [value]) => ({ isDisabled: !!value });
const setLoading: CsaReducer = (_cur, [value]) => ({ isLoading: !!value });

/* Button — exposed text lives under `buttonText`; `click` is Bucket C (the
 * old CSA fired onClick only when enabled — the widget's handler keeps that
 * guard). Deprecated aliases disable/visibility/loading match Button.jsx's
 * old exposedVariables block. */
registerContract({
  type: 'Button',
  stateActions: {
    setText: (_cur, [text]) => ({ buttonText: text }),
    setLoading,
    setVisibility,
    setDisable,
    // deprecated aliases (old Button.jsx registered these alongside setX)
    loading: setLoading,
    visibility: setVisibility,
    disable: setDisable,
  },
  effectActions: ['click'],
});

/* Checkbox — setChecked is a legacy alias of setValue (both published the raw
 * status and fired onCheck/onUnCheck; events are appended by the widget's
 * shim override). toggle reads current value. Validation (isValid) folds in
 * via the dispatch ctx's validate, matching old setInputValue. */
const checkboxSetValue: CsaReducer = (_cur, [status]) => ({ value: status });
registerContract({
  type: 'Checkbox',
  stateActions: {
    setValue: checkboxSetValue,
    setChecked: checkboxSetValue,
    toggle: (cur) => ({ value: !cur.value }),
    setLoading,
    setVisibility,
    setDisable,
  },
});

/* ToggleSwitchV2 — setValue publishes the raw argument (old setOn(value));
 * toggle flips current value. onChange for the CSA `toggle` is appended by
 * the widget's shim override (the plain reducer stays event-free for the
 * widget's own input-click path, which never fired onChange). */
registerContract({
  type: 'ToggleSwitchV2',
  stateActions: {
    setValue: (_cur, [value]) => ({ value }),
    toggle: (cur) => ({ value: !cur.value }),
    setLoading,
    setVisibility,
    setDisable,
  },
});

/* Icon — click fires onClick unconditionally (old CSA had no enabled guard). */
registerContract({
  type: 'Icon',
  stateActions: {
    setVisibility,
    setLoading,
    setDisable,
  },
  effectActions: ['click'],
});

/* Text — exposed text lives under `text`; `visibility` is the deprecated
 * alias the old widget registered alongside setVisibility. */
registerContract({
  type: 'Text',
  stateActions: {
    setText: (_cur, [text]) => ({ text }),
    clear: () => ({ text: '' }),
    setVisibility,
    setLoading,
    setDisable,
    // deprecated alias (old Text.jsx registered `visibility`)
    visibility: setVisibility,
  },
});

/* CircularProgressBar — the old CSAs published the RAW argument for all
 * three actions (no !! coercion), so these reducers do too. */
registerContract({
  type: 'CircularProgressBar',
  stateActions: {
    setValue: (_cur, [value]) => ({ value }),
    setVisibility: (_cur, [value]) => ({ isVisible: value }),
    setLoading: (_cur, [value]) => ({ isLoading: value }),
  },
});

/* ProgressBar — value is clamped to [0, 100] exactly like the old CSA. */
registerContract({
  type: 'ProgressBar',
  stateActions: {
    setValue: (_cur, [value]) => ({ value: Math.min(Math.max((value as number) || 0, 0), 100) }),
    setVisibility,
    setLoading,
  },
});

/* Statistics — primary/secondary values publish the raw argument. */
registerContract({
  type: 'Statistics',
  stateActions: {
    setPrimaryValue: (_cur, [value]) => ({ primaryValue: value }),
    setSecondaryValue: (_cur, [value]) => ({ secondaryValue: value }),
    setLoading,
    setVisibility,
  },
});

/* Html — setRawHTML normalizes falsy input to '' like the old closure. */
registerContract({
  type: 'Html',
  stateActions: {
    setRawHTML: (_cur, [value]) => ({ rawHTML: value || '' }),
    setVisibility,
    setLoading,
    setDisable,
  },
});

/* IFrame — setUrl only accepts strings (old guard); reload is Bucket C (needs
 * the iframe ref). */
registerContract({
  type: 'IFrame',
  stateActions: {
    setUrl: (_cur, [url]) => (typeof url === 'string' ? { url } : {}),
    setDisable,
    setVisibility,
    setLoading,
  },
  effectActions: ['reload'],
});

/* RichTextEditor (DraftEditor) — setValue must rebuild the mounted editor's
 * Draft.js EditorState (sanitize → stateFromHTML → stateToHTML), so it stays
 * a widget-executed effect; the handler also publishes the derived `value`,
 * matching the old closure exactly. */
registerContract({
  type: 'RichTextEditor',
  stateActions: {
    setDisable,
    setVisibility,
    setLoading,
  },
  effectActions: ['setValue'],
});
