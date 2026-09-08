/**
 * NumberInput: what actually lands in `components.<name>.value`. Shared setup
 * lives in ./widgetHarness.js.
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
 * Deliberately NOT duplicated here: the min/max validator itself, which is
 * already covered at store level in
 * _stores/slices/__tests__/integration/validateWidget.spec.js — including its
 * documented `test.failing` pair for a configured bound of `0`. What this file
 * adds is whether that bug is reachable by a *user* of the widget. It is; see
 * the `known bugs` block at the bottom.
 */
import { waitFor, fireEvent as rtlFireEvent } from '@testing-library/react';
import { createWidgetHarness, binding, store, MODULE_ID } from './widgetHarness';

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

const handlerSaw = () => store().getVariable('seenByHandler', MODULE_ID);

describe('NumberInput: default value and the type of the exposed value', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('renders an input carrying its configured default value', async () => {
    widget.render({ properties: { value: binding('{{42}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveValue(42);
  });

  test('exposes the default value as a NUMBER even though it is authored as a string', async () => {
    // `definition.properties.value` ships as the STRING '0', and the inspector
    // lets a user type `7`. Apps then do arithmetic on
    // `{{components.numberinput1.value}}`, so this coercion IS the contract —
    // pinning it here is the point of the whole file.
    widget.render({ properties: { value: binding('7') } });

    await waitFor(() => expect(exposed()).toBe(7));
    expect(typeof exposed()).toBe('number');
  });

  test('rounds the default value to the configured decimal places on mount', async () => {
    widget.render({ properties: { value: binding('{{1.987}}'), decimalPlaces: binding('{{2}}') } });

    await waitFor(() => expect(exposed()).toBe(1.99));
  });

  test('an empty default value exposes null, not NaN', async () => {
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

  test('typing a number updates the exposed value, as a number', async () => {
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('12');

    expect(exposed()).toBe(12);
    expect(typeof exposed()).toBe('number');
  });

  test('typing 0 exposes the number 0 — zero is a value, not an empty field', async () => {
    // The whole `||`-swallows-falsy bug family lives here. A NumberInput holding
    // zero is ANSWERED, and the exposed value must be `0`, never null/''.
    widget.render({ properties: { value: binding('{{5}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('0');

    expect(exposed()).toBe(0);
    expect(Object.is(exposed(), 0)).toBe(true);
    expect(input()).toHaveValue(0);
  });

  test('typing a negative number exposes it with its sign intact', async () => {
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('-5');

    expect(exposed()).toBe(-5);
  });

  test('typing a decimal exposes the full precision while the user is still typing', async () => {
    // Rounding to `decimalPlaces` deliberately happens on BLUR, not per
    // keystroke — rounding mid-typing would fight the user's caret.
    widget.render({ properties: { decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('3.14159');

    expect(exposed()).toBe(3.14159);
  });

  test('blurring rounds the value down to the configured decimal places', async () => {
    widget.render({ properties: { decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    await retype('3.14159');

    rtlFireEvent.blur(input());

    await waitFor(() => expect(exposed()).toBe(3.14));
    expect(input()).toHaveValue(3.14);
  });

  test('clearing the field exposes null, not 0 and not an empty string', async () => {
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

  test('the onChange handler sees the value just typed, not the previous one', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('8');
    expect(handlerSaw()).toBe(8);

    // The second edit is where a one-interaction lag shows up: a stale read
    // returns 8 again instead of 9.
    await retype('9');
    expect(handlerSaw()).toBe(9);
  });

  test('the onChange handler sees 0 when the user types 0', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('0');

    expect(handlerSaw()).toBe(0);
  });

  test('clearing the field fires onChange', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(input()).toBeInTheDocument());
    await retype('7');

    await retype('');

    // What the handler *sees* on this path is a separate, buggy story — see the
    // `known bugs` block. All this asserts is that the event fires at all.
    expect(handlerSaw()).not.toBe(7);
  });
});

describe('NumberInput: min and max', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('configured min and max reach the DOM as the input element bounds', async () => {
    widget.render({ validation: { minValue: binding('{{2}}'), maxValue: binding('{{10}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('min', '2');
    expect(input()).toHaveAttribute('max', '10');
  });

  test('with no min/max configured the input carries no bounds at all', async () => {
    widget.render();

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).not.toHaveAttribute('min');
    expect(input()).not.toHaveAttribute('max');
  });

  test('a value over the maximum exposes isValid false and shows the error on blur', async () => {
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

  test('a value under the minimum exposes isValid false', async () => {
    widget.render({ validation: { minValue: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('1');

    expect(exposed('isValid')).toBe(false);
  });

  test('a value inside the bounds is valid', async () => {
    // Control: without it, every assertion above would still pass if the widget
    // reported isValid false unconditionally.
    widget.render({ validation: { minValue: binding('{{2}}'), maxValue: binding('{{10}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await retype('5');

    expect(exposed('isValid')).toBe(true);
    expect(errorText()).toBeUndefined();
  });
});

describe('NumberInput: step controls', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('the increment control raises the value by one', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    await widget.session.user.click(stepArrows()[0]);

    expect(exposed()).toBe(6);
    expect(input()).toHaveValue(6);
    expect(handlerSaw()).toBe(6);
  });

  test('the decrement control lowers the value by one', async () => {
    widget.render({ properties: { value: binding('{{5}}') }, events: ON_CHANGE_CAPTURE });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    await widget.session.user.click(stepArrows()[1]);

    expect(exposed()).toBe(4);
    expect(handlerSaw()).toBe(4);
  });

  test('incrementing from 0 gives 1 — the falsy-value guard does not lose the zero', async () => {
    // `(inputLogic.value || 0) + 1` (NumberInput.jsx:41) is the exact shape that
    // swallows a legitimate falsy elsewhere in the codebase. Here `0 || 0` is
    // still 0, so it happens to be correct — this test is what keeps it correct.
    widget.render({ properties: { value: binding('{{0}}') } });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    await widget.session.user.click(stepArrows()[0]);

    expect(exposed()).toBe(1);
  });

  test('decrementing an empty field starts from 0, giving -1', async () => {
    widget.render({ properties: { value: binding('{{5}}') } });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));
    await retype('');

    await widget.session.user.click(stepArrows()[1]);

    expect(exposed()).toBe(-1);
  });

  test('stepping past a bound reveals the validation error without waiting for blur', async () => {
    // Unlike typing, the step controls call setShowValidationError(true)
    // themselves (NumberInput.jsx:43, :53) — a click has no "leaving the field"
    // moment to hang the message off.
    widget.render({ properties: { value: binding('{{10}}') }, validation: { maxValue: binding('{{10}}') } });
    await waitFor(() => expect(stepArrows()).toHaveLength(2));

    await widget.session.user.click(stepArrows()[0]);

    expect(exposed()).toBe(11);
    expect(errorText()).toBe('Maximum value is 10');
  });

  test('disableStepControls removes the increment/decrement controls entirely', async () => {
    widget.render({ properties: { disableStepControls: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(stepArrows()).toHaveLength(0);
  });
});

describe('NumberInput: clear button', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('the clear button appears only when enabled and the field holds a value', async () => {
    widget.render({ properties: { value: binding('{{5}}'), showClearBtn: binding('{{true}}') } });

    await waitFor(() => expect(clearButton()).toBeInTheDocument());
  });

  test('no clear button when the property is off', async () => {
    widget.render({ properties: { value: binding('{{5}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(clearButton()).toBeNull();
  });

  test('clicking clear empties the field and exposes null', async () => {
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

describe('NumberInput: placeholder, disabled and visibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('the configured placeholder reaches the input', async () => {
    widget.render({ properties: { value: binding(''), placeholder: binding('Enter a quantity') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('placeholder', 'Enter a quantity');
  });

  test('disabledState disables the input', async () => {
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-disabled', 'true');
  });

  test('an enabled input is not disabled', async () => {
    widget.render();

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).not.toBeDisabled();
  });

  test('visibility false hides the field from sight and from assistive tech', async () => {
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(document.querySelector('.text-input')).toHaveClass('invisible');
    expect(input()).toHaveAttribute('aria-hidden', 'true');
  });

  test('a visible field carries no invisible class', async () => {
    widget.render();

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(document.querySelector('.text-input')).not.toHaveClass('invisible');
  });
});

describe('NumberInput: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('every action declared in the schema is exposed as a callable', async () => {
    widget.render();
    await waitFor(() => expect(input()).toBeInTheDocument());

    // Exactly the `actions` list in WidgetManager/widgets/numberinput.js.
    for (const handle of ['setText', 'clear', 'setFocus', 'setBlur', 'setVisibility', 'setDisable', 'setLoading']) {
      expect(typeof exposed(handle)).toBe('function');
    }
  });

  test('a non-numeric setText empties the field instead of exposing a string', async () => {
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

  test('the clear action empties the field and exposes null', async () => {
    widget.render({ properties: { value: binding('{{5}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());

    await widget.session.store.act(async () => {
      await widget.exposed().clear();
    });

    expect(exposed()).toBeNull();
    expect(input()).toHaveValue(null);
  });
});

describe('NumberInput: known bugs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // BUG (unfixed, same one pinned at store level in
  // _stores/slices/__tests__/integration/validateWidget.spec.js): componentsSlice.js:825
  // does `resolveValue(minValue) || undefined`, so a configured minimum of 0
  // collapses to `undefined` and the check is skipped entirely.
  //
  // These two tests are not a duplicate of the store-level pair — they answer a
  // different question: is the bug reachable through the widget? It is, and the
  // widget is visibly inconsistent with itself while it lasts, because
  // NumberInput.jsx:153-154 uses `??` and therefore DOES put min="0"/max="0" on
  // the input element. The user sees a bound advertised in the DOM that
  // validation ignores.
  //
  // Wrong: isValid stays true and no message appears.
  // Right: isValid false, 'Minimum value is 0'.
  // Fix: `??` instead of `||` at componentsSlice.js:825 and :835.
  test.failing('a min of 0 must reject a negative number typed into the widget', async () => {
    widget.render({ validation: { minValue: binding('{{0}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    // The bound is advertised on the element even though it is not enforced.
    expect(input()).toHaveAttribute('min', '0');

    await retype('-5');
    rtlFireEvent.blur(input());

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Minimum value is 0');
  });

  // BUG (unfixed): the maxValue twin of the above — componentsSlice.js:835.
  test.failing('a max of 0 must reject a positive number typed into the widget', async () => {
    widget.render({ validation: { maxValue: binding('{{0}}') } });
    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('max', '0');

    await retype('5');
    rtlFireEvent.blur(input());

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Maximum value is 0');
  });

  // BUG (unfixed): NumberInput.jsx:66-69. `handleClear` writes the EMPTY STRING
  // and fires onChange in the same tick, so an onChange action reading
  // `{{components.numberinput1.value}}` sees `''` — a string, out of a numeric
  // field. The `''` is only corrected to `null` afterwards, by the effect at
  // NumberInput.jsx:138-142, which cannot run until React re-renders.
  //
  // Clearing with the keyboard takes the other branch (NumberInput.jsx:22),
  // which writes `null` BEFORE firing, so the two ways of emptying the same
  // field hand the same handler two different values. The clear button is the
  // odd one out.
  //
  // Wrong: the handler sees ''. Right: it sees null, like the keyboard path.
  // Fix: `inputLogic.setInputValue(null)` at NumberInput.jsx:67.
  test.failing('the clear button must hand onChange the same null the keyboard path does', async () => {
    widget.render({
      properties: { value: binding('{{5}}'), showClearBtn: binding('{{true}}') },
      events: ON_CHANGE_CAPTURE,
    });
    await waitFor(() => expect(clearButton()).toBeInTheDocument());

    await widget.session.user.click(clearButton());

    expect(handlerSaw()).toBeNull();
  });
});
