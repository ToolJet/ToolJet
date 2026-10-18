/**
 * NumberInput: what actually lands in `components.<name>.value`, and the rest
 * of the widget's approved contract (frontend/ee/test/app-builder/widgets/NumberInput/TESTING.md).
 * Shared setup lives in Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real NumberInput / BaseInput / useInput.
 * Nothing about the widget is mocked.
 *
 * Why the RTL layer and not the store layer: for a numeric field the whole
 * question is *which value, and of which type*, a DOM interaction produces.
 * Apps do arithmetic on `{{components.numberinput1.value}}`, so `'0'` vs `0` vs
 * `null` vs `NaN` is the contract, and only the widget can answer it. Every
 * test therefore asserts against the real store after a real interaction.
 *
 * Deliberately NOT duplicated here: the min/max/mandatory/regex/customRule
 * validator engine itself, already covered at store level in
 * _stores/slices/__tests__/integration/validateWidget.spec.js. What this file
 * adds is whether each rule is reachable by a *user* of the widget.
 *
 * Test titles carry their approved scenario ID
 * (frontend/ee/test/app-builder/widgets/NumberInput/TESTING.md) as a
 * `[NumberInput-FAMILY-NNN]` prefix, per the widget-testing-contract validator.
 */
import React from 'react';
import { waitFor, fireEvent as rtlFireEvent } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { componentDefinition, seedApp, binding as rawBinding } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  drain,
  setVariableOn,
  widgetProps,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'num1';
const NAME = 'numberinput1';

const widget = createWidgetHarness({
  componentType: 'NumberInput',
  handle: NAME,
  id: ID,
  // Baseline is `numberinput.js`'s own `definition.properties`, copied
  // verbatim — not invented defaults. `decimalPlaces` is the one that bites:
  // NumberInput calls `.toFixed(props.properties.decimalPlaces)`
  // (NumberInput.jsx:14, :34) and `toFixed(undefined)` silently means ZERO
  // decimals, so omitting it would quietly turn every decimal test into an
  // integer test.
  defaultProperties: {
    value: binding('0'),
    label: binding('Label'),
    placeholder: binding('0'),
    decimalPlaces: binding('{{2}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showClearBtn: binding('{{false}}'),
    disableStepControls: binding('{{false}}'),
  },
});

const input = () => document.querySelector('input');
const exposed = (key = 'value') => widget.exposed()?.[key];
const stepArrows = () => document.querySelectorAll('.number-input-arrow');
const clearButton = () => document.querySelector('.tj-input-clear-btn');
const errorText = () => document.querySelector(`[data-cy="${NAME}-invalid-feedback"]`)?.textContent;

/** Retypes the field from scratch, the way a user replacing a number does. */
async function retype(text) {
  await widget.session.user.clear(input());
  if (text !== '') await widget.session.user.type(input(), text);
}

/**
 * A real onChange handler, wired the way a user wires one: a `set-custom-variable`
 * action whose value is a binding to the widget's own exposed value. The variable
 * is the probe — if it holds the PREVIOUS number, the event observed pre-write
 * state.
 */
const ON_CHANGE_CAPTURE = [
  {
    id: 'evt-on-change',
    name: 'onChange',
    index: 0,
    sourceId: ID,
    target: 'component',
    event: {
      eventId: 'onChange',
      actionId: 'set-custom-variable',
      key: 'seenByHandler',
      value: `{{components.${NAME}.value}}`,
    },
  },
];

/** Same capture pattern as onChange, for onEnterPressed: proves the value is
 * already committed by the time the handler observes it. */
const ON_ENTER_CAPTURE = [
  {
    id: 'evt-on-enter',
    name: 'onEnterPressed',
    index: 0,
    sourceId: ID,
    target: 'component',
    event: {
      eventId: 'onEnterPressed',
      actionId: 'set-custom-variable',
      key: 'seenOnEnter',
      value: `{{components.${NAME}.value}}`,
    },
  },
];

const handlerSaw = () => store().getVariable('seenByHandler', MODULE_ID);

describe('NumberInput: default value and the type of the exposed value', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-DEF-001] renders an input carrying its configured default value', async () => {
    widget.render({ properties: { value: binding('{{42}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveValue(42);
  });

  test('[NumberInput-DEF-002] exposes the default value as a NUMBER even though it is authored as a string', async () => {
    // `definition.properties.value` ships as the STRING '0', and the inspector
    // lets a user type `7`. Apps then do arithmetic on
    // `{{components.numberinput1.value}}`, so this coercion IS the contract —
    // pinning it here is the point of the whole file.
    widget.render({ properties: { value: binding('7') } });

    await waitFor(() => expect(exposed()).toBe(7));
    expect(typeof exposed()).toBe('number');
  });

  test('[NumberInput-DEF-003] rounds the default value to the configured decimal places on mount', async () => {
    widget.render({ properties: { value: binding('{{1.987}}'), decimalPlaces: binding('{{2}}') } });

    await waitFor(() => expect(exposed()).toBe(1.99));
  });

  test('[NumberInput-DEF-004] an empty default value exposes null, not NaN', async () => {
    // `parseFloat('')` is NaN, and NaN leaking into an app is far worse than a
    // null: `{{value + 1}}` renders "NaN" forever with no clue why.
    widget.render({ properties: { value: binding('') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(exposed()).toBeNull();
    expect(input()).toHaveValue(null);
  });
});

describe('NumberInput: typing', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-TYPE-001] typing a number updates the exposed value, as a number', async () => {
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('12');

    expect(exposed()).toBe(12);
    expect(typeof exposed()).toBe('number');
  });

  test('[NumberInput-TYPE-002] typing 0 exposes the number 0 — zero is a value, not an empty field', async () => {
    // The whole `||`-swallows-falsy bug family lives here. A NumberInput holding
    // zero is ANSWERED, and the exposed value must be `0`, never null/''.
    widget.render({ properties: { value: binding('{{5}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('0');

    expect(exposed()).toBe(0);
    expect(Object.is(exposed(), 0)).toBe(true);
    expect(input()).toHaveValue(0);
  });

  test('[NumberInput-TYPE-003] typing a negative number exposes it with its sign intact', async () => {
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('-5');

    expect(exposed()).toBe(-5);
  });

  // BUG (unfixed): NumberInput.jsx's handleChange routes every keystroke through
  // `inputLogic.setInputValue(newValue)`, which applies `beforeSetInputValue`
  // (decimal rounding) unconditionally — useInput.js:261-270. Rounding is meant
  // to happen only on blur/mount/action paths, not per keystroke; per-keystroke
  // rounding fights the user's caret and corrupts the value while typing (typing
  // '3.14159' with decimalPlaces:2 lands on '3.16', not '3.14159'). Fix: give
  // `setInputValue` an opt-in `{ skipTransform: true }` and have handleChange
  // pass it so ordinary typing bypasses the rounding transform.
  test.failing(
    '[NumberInput-TYPE-004] typing a decimal exposes the full precision while the user is still typing',
    async () => {
      widget.render({ properties: { decimalPlaces: binding('{{2}}') } });
      await waitFor(() => expect(input()).toBeInTheDocument());

      await retype('3.14159');

      expect(exposed()).toBe(3.14159);
    }
  );

  // BUG (unfixed): same root cause as NumberInput-TYPE-004 — the value is
  // already corrupted by the time blur runs, so rounding-on-blur rounds the
  // wrong number.
  test.failing('[NumberInput-TYPE-005] blurring rounds the value down to the configured decimal places', async () => {
    widget.render({ properties: { decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    await retype('3.14159');

    rtlFireEvent.blur(input());

    await waitFor(() => expect(exposed()).toBe(3.14));
    expect(input()).toHaveValue(3.14);
  });

  test('[NumberInput-TYPE-006] clearing the field exposes null, not 0 and not an empty string', async () => {
    // Pinned because all four candidates are plausible and apps branch on it:
    // `{{value === null}}` is the only check that works if this is null.
    widget.render({ properties: { value: binding('{{5}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('');

    expect(exposed()).toBeNull();
    expect(exposed()).not.toBe(0);
    expect(exposed()).not.toBe('');
  });
});

describe('NumberInput: onChange', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-CHG-001] the onChange handler sees the value just typed, not the previous one', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('8');
    expect(handlerSaw()).toBe(8);

    // The second edit is where a one-interaction lag shows up: a stale read
    // returns 8 again instead of 9.
    await retype('9');
    expect(handlerSaw()).toBe(9);
  });

  test('[NumberInput-CHG-002] the onChange handler sees 0 when the user types 0', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('0');

    expect(handlerSaw()).toBe(0);
  });

  test('[NumberInput-CHG-003] clearing the field fires onChange', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(input()).toBeInTheDocument());
    await retype('7');

    await retype('');

    // What the handler *sees* on this path is a separate, buggy story — see the
    // `known bugs` block. All this asserts is that the event fires at all.
    expect(handlerSaw()).not.toBe(7);
  });
});

describe('NumberInput: focus, blur, and enter events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-EVT-001] onFocus fires when the input receives focus', async () => {
    widget.render({ events: setVariableOn(ID, 'onFocus') });
    await waitFor(() => expect(input()).toBeInTheDocument());

    input().focus();
    // handleFocus fires onFocus inside a setTimeout(0) (useInput.js:328-331).
    await drain();

    await waitFor(() => expect(store().getVariable('seen', MODULE_ID)).toBe('YES'));
  });

  test('[NumberInput-EVT-002] onBlur fires when the input loses focus', async () => {
    widget.render({ events: setVariableOn(ID, 'onBlur') });
    await waitFor(() => expect(input()).toBeInTheDocument());

    rtlFireEvent.blur(input());

    await waitFor(() => expect(store().getVariable('seen', MODULE_ID)).toBe('YES'));
  });

  test('[NumberInput-EVT-003] onEnterPressed fires when Enter is pressed, with the value already committed', async () => {
    // Break this catches: useInput.js's handleKeyUp firing onEnterPressed
    // before calling setInputValue — the handler would observe the value
    // BEFORE the Enter-triggered commit instead of after.
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_ENTER_CAPTURE });
    await waitFor(() => expect(input()).toBeInTheDocument());
    await retype('9');

    rtlFireEvent.keyUp(input(), { key: 'Enter' });

    await waitFor(() => expect(store().getVariable('seenOnEnter', MODULE_ID)).toBe(9));
  });
});

describe('NumberInput: min and max', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-VAL-001] configured min and max reach the DOM as the input element bounds', async () => {
    widget.render({ validation: { minValue: binding('{{2}}'), maxValue: binding('{{10}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('min', '2');
    expect(input()).toHaveAttribute('max', '10');
  });

  test('[NumberInput-VAL-002] with no min/max configured the input carries no bounds at all', async () => {
    widget.render();

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).not.toHaveAttribute('min');
    expect(input()).not.toHaveAttribute('max');
  });

  test('[NumberInput-VAL-003] a value over the maximum exposes isValid false and shows the error on blur', async () => {
    widget.render({ validation: { maxValue: binding('{{10}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('99');
    expect(exposed('isValid')).toBe(false);
    // The message stays hidden until the field is left — that is the shared
    // showValidationError contract, and NumberInput opts in via handleBlur.
    expect(errorText()).toBeUndefined();

    rtlFireEvent.blur(input());

    await waitFor(() => expect(errorText()).toBe('Maximum value is 10'));
  });

  test('[NumberInput-VAL-004] a value under the minimum exposes isValid false', async () => {
    widget.render({ validation: { minValue: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('1');

    expect(exposed('isValid')).toBe(false);
  });

  test('[NumberInput-VAL-005] a value inside the bounds is valid', async () => {
    // Control: without it, every assertion above would still pass if the widget
    // reported isValid false unconditionally.
    widget.render({ validation: { minValue: binding('{{2}}'), maxValue: binding('{{10}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('5');

    expect(exposed('isValid')).toBe(true);
    expect(errorText()).toBeUndefined();
  });

  // BUG (unfixed, same one pinned at store level in
  // _stores/slices/__tests__/integration/validateWidget.spec.js): componentsSlice.js:825
  // does `resolveValue(minValue) || undefined`, so a configured minimum of 0
  // collapses to `undefined` and the check is skipped entirely.
  //
  // Not a duplicate of the store-level pair — this answers a different
  // question: is the bug reachable through the widget? It is, and the widget
  // is visibly inconsistent with itself while it lasts, because
  // NumberInput.jsx:156-157 uses `??` and therefore DOES put min="0"/max="0"
  // on the input element. The user sees a bound advertised in the DOM that
  // validation ignores.
  test.failing('[NumberInput-VAL-006] a min of 0 must reject a negative number typed into the widget', async () => {
    widget.render({ validation: { minValue: binding('{{0}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('min', '0');

    await retype('-5');
    rtlFireEvent.blur(input());

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Minimum value is 0');
  });

  // BUG (unfixed): the maxValue twin of the above — componentsSlice.js:835.
  test.failing('[NumberInput-VAL-007] a max of 0 must reject a positive number typed into the widget', async () => {
    widget.render({ validation: { maxValue: binding('{{0}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('max', '0');

    await retype('5');
    rtlFireEvent.blur(input());

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Maximum value is 0');
  });

  test('[NumberInput-VAL-008] leaving min/max unconfigured never rejects a value', async () => {
    // Break this catches: a future fix for VAL-006/007 using a naive
    // `?? undefined` instead of an explicit undefined/null/'' check — the
    // unconfigured default (`{ value: '' }`) would then wrongly read as a
    // configured bound.
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('-999999');
    rtlFireEvent.blur(input());

    expect(exposed('isValid')).toBe(true);
    // The error div renders once the field has been touched (blurred) — even
    // when valid, it stays in the DOM but empty, rather than being absent.
    expect(errorText()).toBe('');
  });
});

describe('NumberInput: mandatory, regex, and customRule', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-VAL-009] a mandatory field rejects an empty value, message shown on blur, aria-required set', async () => {
    // Following the same "reachable through the widget" pattern already
    // established for min/max above — the rule engine itself is covered
    // generically at the store level (validateWidget.spec.js).
    widget.render({ properties: { value: binding('{{5}}') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('aria-required', 'true');

    await retype('');
    rtlFireEvent.blur(input());

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Field cannot be empty');
  });

  test('[NumberInput-VAL-010] a configured regex rejects a non-matching value typed into the widget', async () => {
    widget.render({ validation: { regex: binding('^[0-9]{3,}$') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('5');
    rtlFireEvent.blur(input());
    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('The input should match pattern');

    // Control: a matching value passes the same configured rule.
    await retype('500');
    await waitFor(() => expect(exposed('isValid')).toBe(true));
  });

  test('[NumberInput-VAL-011] a configured customRule resolving to a string becomes the validation error', async () => {
    widget.render({ validation: { customRule: binding(`{{components.${NAME}.value > 100 && 'Too big'}}`) } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('200');
    rtlFireEvent.blur(input());
    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Too big');

    // Control: a falsy-resolved rule passes.
    await retype('50');
    await waitFor(() => expect(exposed('isValid')).toBe(true));
  });

  test('[NumberInput-VAL-012] isMandatory tracks the mandatory validation property dynamically', async () => {
    widget.render({ validation: { mandatory: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(exposed('isMandatory')).toBe(false);

    widget.render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isMandatory')).toBe(true));
  });
});

describe('NumberInput: step controls', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-STEP-001] the increment control raises the value by one', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    await widget.session.user.click(stepArrows()[0]);

    expect(exposed()).toBe(6);
    expect(input()).toHaveValue(6);
    expect(handlerSaw()).toBe(6);
  });

  test('[NumberInput-STEP-002] the decrement control lowers the value by one', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    await widget.session.user.click(stepArrows()[1]);

    expect(exposed()).toBe(4);
    expect(handlerSaw()).toBe(4);
  });

  test('[NumberInput-STEP-003] incrementing from 0 gives 1 — the falsy-value guard does not lose the zero', async () => {
    // `(inputLogic.value || 0) + 1` (NumberInput.jsx:41) is the exact shape that
    // swallows a legitimate falsy elsewhere in the codebase. Here `0 || 0` is
    // still 0, so it happens to be correct — this test is what keeps it correct.
    widget.render({ properties: { value: binding('{{0}}') } });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    await widget.session.user.click(stepArrows()[0]);

    expect(exposed()).toBe(1);
  });

  test('[NumberInput-STEP-004] decrementing an empty field starts from 0, giving -1', async () => {
    widget.render({ properties: { value: binding('{{5}}') } });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));
    await retype('');

    await widget.session.user.click(stepArrows()[1]);

    expect(exposed()).toBe(-1);
  });

  test('[NumberInput-STEP-005] stepping past a bound reveals the validation error without waiting for blur', async () => {
    // Unlike typing, the step controls call setShowValidationError(true)
    // themselves (NumberInput.jsx:43, :53) — a click has no "leaving the field"
    // moment to hang the message off.
    widget.render({ properties: { value: binding('{{10}}') }, validation: { maxValue: binding('{{10}}') } });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    await widget.session.user.click(stepArrows()[0]);

    expect(exposed()).toBe(11);
    expect(errorText()).toBe('Maximum value is 10');
  });

  test('[NumberInput-STEP-006] disableStepControls removes the increment/decrement controls entirely', async () => {
    widget.render({ properties: { disableStepControls: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(stepArrows()).toHaveLength(0);
  });

  test('[NumberInput-STEP-007] repeated decrementing a decimal value never drifts into floating-point noise', async () => {
    // 37.88 isn't exactly representable in IEEE-754 double precision; six raw
    // `- 1` steps land on the exact reported repro (31.880000000000003) without
    // re-rounding on every step — fewer steps happen not to drift for this value.
    widget.render({ properties: { value: binding('{{37.88}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    for (let i = 0; i < 6; i++) {
      await widget.session.user.click(stepArrows()[1]);
    }

    expect(exposed()).toBe(31.88);
  });

  test('[NumberInput-STEP-008] disableStepControls also suppresses ArrowUp/ArrowDown keyboard stepping', async () => {
    // Break this catches: NumberInput.jsx's handleKeyDown dropping its
    // `disableStepControls &&` guard, or dropping `e.preventDefault()` — either
    // leaves a keyboard back door open after the arrows are hidden.
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());
    // Control: with step controls enabled, ArrowUp is not prevented.
    expect(rtlFireEvent.keyDown(input(), { key: 'ArrowUp' })).toBe(true);

    widget.render({ properties: { disableStepControls: binding('{{true}}') } });
    await waitFor(() => expect(stepArrows()).toHaveLength(0));

    expect(rtlFireEvent.keyDown(input(), { key: 'ArrowUp' })).toBe(false);
    expect(rtlFireEvent.keyDown(input(), { key: 'ArrowDown' })).toBe(false);
  });
});

describe('NumberInput: clear button', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-CLR-001] the clear button appears only when enabled and the field holds a value', async () => {
    widget.render({ properties: { value: binding('{{5}}'), showClearBtn: binding('{{true}}') } });

    await waitFor(() => expect(clearButton()).toBeInTheDocument());
  });

  test('[NumberInput-CLR-002] no clear button when the property is off', async () => {
    widget.render({ properties: { value: binding('{{5}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(clearButton()).toBeNull();
  });

  test('[NumberInput-CLR-003] clicking clear empties the field and exposes null', async () => {
    widget.render({
      properties: { value: binding('{{5}}'), showClearBtn: binding('{{true}}') },
      events: ON_CHANGE_CAPTURE,
    });
    await waitFor(() => expect(clearButton()).toBeInTheDocument());

    await widget.session.user.click(clearButton());

    expect(exposed()).toBeNull();
    expect(input()).toHaveValue(null);
    // The button removes itself once there is nothing left to clear.
    expect(clearButton()).toBeNull();
  });
});

describe('NumberInput: placeholder, disabled, loading, and visibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-STATE-001] the configured placeholder reaches the input', async () => {
    widget.render({ properties: { value: binding(''), placeholder: binding('Enter a quantity') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('placeholder', 'Enter a quantity');
  });

  test('[NumberInput-STATE-002] disabledState disables the input', async () => {
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[NumberInput-STATE-003] an enabled input is not disabled', async () => {
    widget.render();

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).not.toBeDisabled();
  });

  test('[NumberInput-STATE-004] visibility false hides the field from sight and from assistive tech', async () => {
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(document.querySelector('.text-input')).toHaveClass('invisible');
    expect(input()).toHaveAttribute('aria-hidden', 'true');
  });

  test('[NumberInput-STATE-005] a visible field carries no invisible class', async () => {
    widget.render();

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(document.querySelector('.text-input')).not.toHaveClass('invisible');
  });

  test('[NumberInput-STATE-006] loadingState disables the input and shows the loader instead of the step controls', async () => {
    // Break this catches: BaseInput.jsx dropping `loading` from its
    // `disabled={disable || loading}` check, or from the loader/rightIcon
    // ternary — a loading field must be inert the same way a disabled one is,
    // independent of disabledState.
    widget.render({ properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toBeDisabled();
    expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument();
    expect(stepArrows()).toHaveLength(0);
  });
});

describe('NumberInput: state precedence (client action versus property)', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-STATE-007] setDisable survives an unrelated property re-resolve', async () => {
    // Break this catches: useInput.js's `disable !== disabledState &&
    // setDisable(disabledState)` effect widening its dependency array beyond
    // `[disabledState]` — it would then re-run (and clobber the CSA-set value)
    // on ANY unrelated re-render, not only when disabledState itself changes.
    widget.render({ properties: { disabledState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).not.toBeDisabled();

    await widget.act('setDisable', true);
    expect(input()).toBeDisabled();

    // Unrelated re-resolve: placeholder changes, disabledState stays false.
    widget.render({ properties: { disabledState: binding('{{false}}'), placeholder: binding('changed') } });
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'changed'));

    expect(input()).toBeDisabled();
  });

  test('[NumberInput-STATE-008] setVisibility survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { visibility: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await widget.act('setVisibility', false);
    await waitFor(() => expect(document.querySelector('.text-input')).toHaveClass('invisible'));

    widget.render({ properties: { visibility: binding('{{true}}'), placeholder: binding('changed') } });
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'changed'));

    expect(document.querySelector('.text-input')).toHaveClass('invisible');
  });

  test('[NumberInput-STATE-009] setLoading survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { loadingState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await widget.act('setLoading', true);
    await waitFor(() => expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument());

    widget.render({ properties: { loadingState: binding('{{false}}'), placeholder: binding('changed') } });
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'changed'));

    expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument();
  });
});

describe('NumberInput: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-ACT-001] every action declared in the schema is exposed as a callable', async () => {
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    // Exactly the `actions` list in WidgetManager/widgets/numberinput.js.
    for (const handle of ['setText', 'clear', 'setFocus', 'setBlur', 'setVisibility', 'setDisable', 'setLoading']) {
      expect(typeof exposed(handle)).toBe('function');
    }
  });

  test('[NumberInput-ACT-002] a non-numeric setText empties the field instead of exposing a string', async () => {
    // `setText` is a shared-hook action that takes raw text, so it is the one
    // way a string can reach a numeric field. NumberInput's NaN guard
    // (NumberInput.jsx:138-142) is what stops `'abc'` — or a NaN — from
    // becoming the exposed value of a number input.
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    await widget.session.store.act(async () => {
      await widget.exposed().setText(100);
    });
    expect(exposed()).toBe(100);

    await widget.session.store.act(async () => {
      await widget.exposed().setText('abc');
    });

    expect(exposed()).toBeNull();
  });

  test('[NumberInput-ACT-003] the clear action empties the field and exposes null', async () => {
    widget.render({ properties: { value: binding('{{5}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await widget.session.store.act(async () => {
      await widget.exposed().clear();
    });

    expect(exposed()).toBeNull();
    expect(input()).toHaveValue(null);
  });

  test('[NumberInput-ACT-004] calling setFocus moves focus to the real input element', async () => {
    // Regression: NumberInput used to declare its own local `inputRef` (for the
    // scroll-wheel feature) and pass it to BaseInput AFTER `{...inputLogic}` was
    // spread, so it won the prop collision. useInput()'s own `inputRef` — the one
    // setFocus/setBlur actually close over — never attached to the DOM node.
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    await widget.session.store.act(async () => {
      await widget.exposed().setFocus();
    });

    expect(input()).toHaveFocus();
  });

  test('[NumberInput-ACT-005] calling setBlur removes focus from the input element', async () => {
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());
    input().focus();
    expect(input()).toHaveFocus();

    await widget.session.store.act(async () => {
      await widget.exposed().setBlur();
    });

    expect(input()).not.toHaveFocus();
  });

  test('[NumberInput-ACT-006] setText rounds an over-precise value to decimalPlaces, matching the typed/blurred path', async () => {
    // setText used to store the raw value untouched. beforeSetInputValue
    // (useInput.js's setInputValue) now rounds every value-setting path,
    // including this one, not just handleChange/handleBlur.
    widget.render({ properties: { decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await widget.session.store.act(async () => {
      await widget.exposed().setText(3.14159);
    });

    expect(exposed()).toBe(3.14);
  });
});

describe('NumberInput: accessibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-A11Y-001] a mandatory, invalid field is marked aria-required and aria-invalid', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('aria-required', 'true');
    expect(input()).toHaveAttribute('aria-invalid', 'false');

    await retype('');
    rtlFireEvent.blur(input());

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'true'));
  });
});

describe('NumberInput: saved-app compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[NumberInput-COMPAT-001] a definition predating disableStepControls/showClearBtn/legacyInputSize still renders with pre-feature defaults', async () => {
    // Break this catches: NumberInput.jsx or useInput.js reading any of these
    // three properties without a falsy-safe default (e.g. `properties.disableStepControls`
    // instead of `!disableStepControls`), which would crash or misrender the
    // moment a real, pre-migration saved app definition — one that simply
    // never had this key — reaches the widget.
    const definition = componentDefinition(ID, NAME, 'NumberInput', {
      value: rawBinding('{{5}}'),
      label: rawBinding('Label'),
      placeholder: rawBinding('0'),
      decimalPlaces: rawBinding('{{2}}'),
      visibility: rawBinding('{{true}}'),
      // disableStepControls, showClearBtn, legacyInputSize deliberately omitted.
    });
    seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);

    widget.session.render(<RenderWidget {...widgetProps(ID, 'NumberInput')} />);

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(stepArrows()).toHaveLength(2);
    expect(clearButton()).toBeNull();
    expect(input()).not.toBeDisabled();
  });
});

describe('NumberInput: known bugs (unfixed)', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // BUG (unfixed, characterized per contract decision D-03): NumberInput.jsx:66-69.
  // `handleClear` writes the EMPTY STRING and fires onChange in the same tick,
  // so an onChange action reading `{{components.numberinput1.value}}` sees
  // `''` — a string, out of a numeric field. The `''` is only corrected to
  // `null` afterwards, by the effect at NumberInput.jsx:138-142, which cannot
  // run until React re-renders.
  //
  // Clearing with the keyboard takes the other branch (NumberInput.jsx:22),
  // which writes `null` BEFORE firing, so the two ways of emptying the same
  // field hand the same handler two different values. The clear button is the
  // odd one out.
  //
  // Wrong: the handler sees ''. Right: it sees null, like the keyboard path.
  // Fix (not applied — see D-03): `inputLogic.setInputValue(null)` at NumberInput.jsx:67.
  test.failing(
    '[NumberInput-BUG-002] the clear button must hand onChange the same null the keyboard path does',
    async () => {
      widget.render({
        properties: { value: binding('{{5}}'), showClearBtn: binding('{{true}}') },
        events: ON_CHANGE_CAPTURE,
      });
      await waitFor(() => expect(clearButton()).toBeInTheDocument());

      await widget.session.user.click(clearButton());

      expect(handlerSaw()).toBeNull();
    }
  );
});
