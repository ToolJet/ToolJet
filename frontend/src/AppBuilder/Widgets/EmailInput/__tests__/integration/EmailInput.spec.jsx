/**
 * EmailInput widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/EmailInput/TESTING.md
 * Every test title starts with its approved scenario ID; the `// Break this catches:`
 * comment names the production edit its oracle is meant to catch.
 *
 * EmailInput passes no `inputType` to useInput, so it takes the hook's generic
 * branch: it receives `setText` but NOT the deprecated `disable`/`visibility`
 * handles, which are registered only for `inputType === 'TextInput'`.
 */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createWidgetHarness,
  binding,
  countInvocationsOn,
  drain,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import {
  getLabelFontSize,
  getLabelHeight,
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
  checkIfInputWidgetTypeIsDeprecated,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';

const harness = createWidgetHarness({ componentType: 'EmailInput', handle: 'emailinput1', id: 'ei1' });

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

// data-cy hooks RenderWidget hands this widget.
const input = () => document.getElementById('component-ei1');
const widgetNode = () => document.querySelector('.canvas-component');
const label = () => document.querySelector('[data-cy="emailinput1-label"]');
const fieldBox = () => document.querySelector('[data-cy="emailinput1-actionable-section"]');
const errorText = () => document.querySelector('[data-cy="emailinput1-invalid-feedback"]');
const leftIcon = () => document.querySelector('[data-cy="emailinput1-icon"]');
const clearButton = () => screen.queryByRole('button', { name: 'Clear' });
const callCount = (key = 'calls') => harness.variables()?.[key] ?? 0;
/**
 * The `style` attribute, lower-cased. jsdom drops `var(--token)` on standard
 * properties (custom properties survive) and normalises `background-color` to
 * rgb() while leaving `border-color` as authored hex — so legacy-sentinel
 * assertions check that the literal is ABSENT rather than that a token is present.
 */
const inlineStyle = (node) => (node.getAttribute('style') ?? '').toLowerCase();

describe('default value and identity', () => {
  // Break this catches: removing the `[properties.value]` effect (useInput.js:164-173)
  // or the `value` entry from the mount effect — a field with a configured Default
  // value would render empty, or render but publish nothing.
  test('[EmailInput-PROP-003] the Default value seeds both the field and the exposed value at mount', async () => {
    harness.render({ properties: { value: binding('ada@tooljet.com') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('ada@tooljet.com');
    expect(harness.exposed().value).toBe('ada@tooljet.com');
  });
});

describe('events', () => {
  // Break this catches: moving `fireEvent('onChange')` out of `handleChange`, or
  // firing it twice per keystroke — the count, not a truthy marker, makes a
  // double-fire visible.
  test('[EmailInput-EVT-001] typing fires onChange once per keystroke and republishes the value', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ei1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(callCount()).toBe(0);

    await userEvent.type(input(), 'ada');

    await waitFor(() => expect(callCount()).toBe(3));
    expect(harness.exposed().value).toBe('ada');
  });
});

describe('component-specific actions', () => {
  // Break this catches: dropping `fireEvent('onChange')` from the `setText` handle —
  // a query-driven write would update bound components but skip the builder's handler.
  test('[EmailInput-CSA-001] setText writes the value, publishes it, and fires onChange once', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ei1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setText', 'grace@tooljet.com');

    expect(input().value).toBe('grace@tooljet.com');
    expect(harness.exposed().value).toBe('grace@tooljet.com');
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: adding setShowValidationError(true) to clearValue, which would
  // make Form clearForm paint an untouched form red; or adding a false write, which
  // would hide an error the user has already been shown.
  test('[EmailInput-CSA-003] clear empties the field and fires onChange without changing message visibility', async () => {
    harness.render({
      properties: { value: binding('ada@tooljet.com') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('ei1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('clear');

    expect(input().value).toBe('');
    expect(harness.exposed().value).toBe('');
    await waitFor(() => expect(callCount()).toBe(1));
    expect(errorText()).toBeNull(); // never blurred, so still quiet

    // An already-blurred field keeps its error over the now-empty box.
    harness.render({
      properties: { value: binding('ada@tooljet.com') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    fireEvent.blur(input());
    await drain();

    await harness.act('clear');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });
});

describe('disabled, loading and visibility', () => {
  // Break this catches: removing the `disabled` attribute (BaseInput.jsx:283) — the
  // field would look disabled but still accept typing and stay in the tab order.
  test('[EmailInput-STATE-001] disabledState renders a disabled input that rejects typing', async () => {
    harness.render({ properties: { value: binding('locked@tooljet.com'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().disabled).toBe(true);
    await userEvent.type(input(), 'more');

    expect(input().value).toBe('locked@tooljet.com');
    expect(harness.exposed().value).toBe('locked@tooljet.com');
  });

  // Break this catches: widening useInput's `disable` seed back to
  // `disabledState || loadingState`. RenderWidget prefers the exposed `isDisabled`
  // over the resolved property and feeds it the `disabled` class, so a field that
  // merely loads would stay greyed out and unclickable after loading cleared.
  test('[EmailInput-STATE-005] a field that mounts loading is interactive again once loading clears', async () => {
    harness.render({
      properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().disabled).toBe(true); // legitimately locked while loading

    await harness.act('setLoading', false);
    await waitFor(() => expect(harness.exposed().isLoading).toBe(false));

    expect(harness.exposed().isDisabled).toBe(false);
    expect(input().disabled).toBe(false);
    expect(widgetNode().className).not.toMatch(/\bdisabled\b/);
  });
});

describe('validation', () => {
  // Break this catches: making useShowValidationOnFormSubmit reveal unconditionally
  // (FormSignalContext.tsx `setVisible(submitAttemptCount > 0)`) — every mandatory
  // field in the app would load pre-accused.
  //
  // Verified by fault injection: useInput's `useState(false)` seed is NOT
  // load-bearing, because that hook writes the flag on mount regardless.
  test('[EmailInput-VAL-002] the message is hidden until the user leaves the field', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(errorText()).toBeNull();
    expect(harness.exposed().isValid).toBe(false); // invalid all along, just not shown

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: dropping any setExposedVariable('isValid', ...) from the
  // value-writing paths — an app gating submit on {{...isValid}} would act on a
  // stale verdict. Note the email rule makes a partial address invalid.
  test('[EmailInput-VAL-005] isValid is published and tracks every value write', async () => {
    harness.render({ properties: { value: binding('') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    await userEvent.type(input(), 'ada@tooljet.com');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await harness.act('clear');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    await harness.act('setText', 'grace@tooljet.com');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));
  });
});

describe('inside a Form', () => {
  const formExposed = () => harness.exposed('form1');
  const formAct = async (name, ...args) => {
    await waitFor(() => expect(formExposed()[name]).toBeInstanceOf(Function));
    let result;
    await harness.session.store.act(async () => {
      result = await formExposed()[name](...args);
    });
    return result;
  };

  // Break this catches: dropping the FormSignalContext subscription
  // (useInput.js:74) — a user could press Submit on a form full of empty required
  // fields and be shown nothing.
  test('[EmailInput-FORM-001] submitting the Form reveals the child’s message without a blur', async () => {
    harness.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    await formAct('submitForm');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });
});

describe('properties and bindings', () => {
  // Break this catches: dropping the `[label]` republish (useInput.js:121-124) — a
  // builder renaming a field would leave {{...label}} on the old text.
  test('[EmailInput-PROP-001] the configured label labels the field and is published as `label`', async () => {
    harness.render({ properties: { label: binding('Email ID') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(label()).toHaveTextContent('Email ID');
    expect(harness.exposed().label).toBe('Email ID');

    harness.setComponentProperty('ei1', 'label', 'Work email', 'properties');
    await waitFor(() => expect(harness.exposed().label).toBe('Work email'));
    expect(label()).toHaveTextContent('Work email');
  });

  // Break this catches: gating the [properties.value] effect on a "field is untouched"
  // flag (stranding binding-driven resets), or adding fireEvent('onChange') to
  // setInputValue (re-running every On change handler on a late-resolving default).
  test('[EmailInput-PROP-004] a re-resolved Default value replaces typed text and fires no onChange', async () => {
    harness.render({
      properties: { value: binding('seed@tooljet.com') },
      events: countInvocationsOn('ei1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(callCount()).toBe(0);

    harness.setComponentProperty('ei1', 'value', 'from-query@tooljet.com', 'properties');

    await waitFor(() => expect(input().value).toBe('from-query@tooljet.com'));
    expect(harness.exposed().value).toBe('from-query@tooljet.com');
    expect(callCount()).toBe(0); // the overwrite is silent
  });
});

describe('more events', () => {
  // Break this catches: dropping the `e.key === 'Enter'` guard in handleKeyUp, which
  // would fire onEnterPressed on every key.
  test('[EmailInput-EVT-002] Enter fires onEnterPressed once, with the value already published', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ei1', 'onEnterPressed') });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), 'ab');
    expect(callCount()).toBe(0); // plain characters must not trigger it

    await userEvent.type(input(), '{enter}');

    await waitFor(() => expect(callCount()).toBe(1));
    expect(harness.exposed().value).toBe('ab');
  });

  // Break this catches: removing setShowValidationError(true) from handleBlur — the
  // user would leave an invalid field and never be told.
  test('[EmailInput-EVT-004] blurring fires onBlur once and reveals a pending validation message', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, events: countInvocationsOn('ei1', 'onBlur') });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(input());

    await waitFor(() => expect(callCount()).toBe(1));
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });
});

describe('remaining actions', () => {
  // Break this catches: removing setShowValidationError(true) from setText. A
  // programmatic write validates loudly even on an untouched field — the deliberate
  // exception to the blur rule.
  test('[EmailInput-CSA-002] setText reveals a validation message on a field the user never touched', async () => {
    harness.render({
      properties: { value: binding('ada@tooljet.com') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    await harness.act('setText', '');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: dropping the paired setExposedVariable('isVisible', ...) — the
  // widget would hide while {{...isVisible}} still read true.
  test('[EmailInput-CSA-006] setVisibility hides the field and republishes isVisible', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);

    await harness.act('setVisibility', false);

    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));
    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);

    await harness.act('setVisibility', 'yes'); // truthy non-boolean is coerced
    await waitFor(() => expect(harness.exposed().isVisible).toBe(true));
  });

  // Break this catches: dropping the paired setExposedVariable('isDisabled', ...) —
  // the same drift class as [EmailInput-STATE-005].
  test('[EmailInput-CSA-007] setDisable disables the field and republishes isDisabled', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().disabled).toBe(false);

    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    expect(input().disabled).toBe(true);

    await harness.act('setDisable', 0); // falsy non-boolean is coerced
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(input().disabled).toBe(false);
  });

  // Break this catches: dropping the paired setExposedVariable('isLoading', ...), or
  // rendering the loader without disabling the input.
  test('[EmailInput-CSA-008] setLoading shows the loader, blocks input, and republishes isLoading', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.querySelector('.tj-widget-loader')).toBeNull();

    await harness.act('setLoading', true);

    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
  });

  // Break this catches: removing the setDisable(disabledState) write from the
  // [disabledState] effect — a property change could no longer correct a CSA-set
  // state, so a stale CSA would outlive every rebind.
  //
  // The sticky half has no faultable line of its own: it falls out of React's
  // dependency comparison, so a same-value re-resolve never re-runs the effect.
  test('[EmailInput-CSA-010] a CSA state is sticky until the matching property actually changes', async () => {
    harness.render({ properties: { value: binding('seed@tooljet.com'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setText', 'set-by-csa@tooljet.com');
    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    // A no-op rewrite must not revert the CSA.
    harness.setComponentProperty('ei1', 'disabledState', '{{false}}', 'properties');
    await drain();
    expect(harness.exposed().isDisabled).toBe(true);
    expect(input().value).toBe('set-by-csa@tooljet.com');

    // A genuine change wins and republishes.
    harness.setComponentProperty('ei1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    harness.setComponentProperty('ei1', 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(input().disabled).toBe(false);

    harness.setComponentProperty('ei1', 'value', 'set-by-property@tooljet.com', 'properties');
    await waitFor(() => expect(input().value).toBe('set-by-property@tooljet.com'));
  });
});

describe('remaining states', () => {
  // Break this catches: rendering the loader without folding `loading` into the
  // input's disabled state — a user could edit a field whose value is about to be
  // replaced by the query still loading.
  test('[EmailInput-STATE-002] loadingState renders the loader and blocks input', async () => {
    harness.render({ properties: { value: binding('x@y.com'), loadingState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute('aria-busy', 'true');
  });

  // Break this catches: dropping `visibility` from the error block's guard — a hidden
  // mandatory field would render its error text into the layout while invisible.
  test('[EmailInput-STATE-003] visibility false hides the field and suppresses its validation message', async () => {
    harness.render({
      properties: { visibility: binding('{{false}}') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);
    expect(input()).toHaveAttribute('aria-hidden', 'true');

    fireEvent.blur(input()); // reveal the error, which must still not render
    await drain();
    expect(errorText()).toBeNull();
  });

  // Break this catches: removing any of the property effects — a rebound toggle would
  // change the DOM while the exposed variable other components read stayed stale.
  test('[EmailInput-STATE-004] isVisible and isLoading track their properties on change', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);
    expect(harness.exposed().isLoading).toBe(false);

    harness.setComponentProperty('ei1', 'visibility', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));

    harness.setComponentProperty('ei1', 'loadingState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(input().disabled).toBe(true);
  });
});

describe('remaining validation', () => {
  // Break this catches: dropping aria-required or the isMandatory republish — a
  // required field would not announce itself and {{...isMandatory}} would go stale.
  test('[EmailInput-VAL-001] mandatory marks the input required and publishes isMandatory', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('aria-required', 'true');
    expect(harness.exposed().isMandatory).toBe(true);
    expect(label()).toHaveTextContent('*');
  });

  // Break this catches: reverting 6713df59a2 — setInputValue reading the `validate`
  // prop directly instead of validateRef.current means a value written after a rule
  // edit is judged by the OLD rule.
  test('[EmailInput-VAL-004] editing a rule re-validates the current value with no keystroke', async () => {
    harness.render({ properties: { value: binding('ada@tooljet.com') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);

    harness.setComponentProperty('ei1', 'minLength', '50', 'validation');

    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    // A value written AFTER the rule change is judged by the new rule.
    await harness.act('setText', 'grace@tooljet.com');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
  });

  // Break this catches: dropping aria-invalid or the is-invalid class — the field
  // would show a message with nothing marking the control itself invalid.
  test('[EmailInput-VAL-006] a revealed invalid field is marked invalid on the control', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-invalid', 'false');

    fireEvent.blur(input());

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'true'));
    expect(input().className).toMatch(/\bis-invalid\b/);
  });
});

describe('clear button and Form', () => {
  // Break this catches: removing the onMouseDown preventDefault — clicking clear would
  // blur the field, revealing a validation error mid-edit; or dropping
  // fireEvent('onChange') from EmailInput's own handleClear.
  test('[EmailInput-CLR-003] clicking clear empties the field, fires onChange, and keeps focus', async () => {
    harness.render({
      properties: { value: binding('ada@tooljet.com'), showClearBtn: binding('{{true}}') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('ei1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());
    input().focus();

    await userEvent.click(clearButton());

    expect(input().value).toBe('');
    expect(harness.exposed().value).toBe('');
    await waitFor(() => expect(callCount()).toBe(1));
    expect(document.activeElement).toBe(input());
    expect(errorText()).toBeNull(); // no mid-edit accusation
  });

  // Break this catches: reverting the clear button's vertical offset to a fixed
  // `calc(50% + 10px)`. The button is positioned against the WHOLE widget, but a
  // top-aligned label takes a share of that widget which grows with its font size, so a
  // constant offset leaves the button riding up over the label instead of centred on the
  // field. 10px happens to be correct only at the default 12px label.
  //
  // This is a shared BaseInput fix: TextInput and NumberInput enable the same clear
  // button and had the same bug, so this test guards all three.
  test('[EmailInput-CLR-004] the clear button stays centred on the field as the label grows', async () => {
    const withLabelSize = async (labelFontSize) => {
      harness.render({
        properties: { value: binding('ada@tooljet.com'), showClearBtn: binding('{{true}}'), label: binding('Email') },
        styles: { alignment: binding('top'), labelFontSize },
      });
      await waitFor(() => expect(clearButton()).toBeTruthy());
      return clearButton().style.top;
    };

    // The offset is half the label's own height, so the button lands on the middle of
    // the field rather than the middle of the widget.
    expect(await withLabelSize(binding('{{12}}'))).toBe('calc(50% + 10px)');
    expect(await withLabelSize(binding('{{20}}'))).toBe('calc(50% + 14px)');
    expect(await withLabelSize(binding('{{32}}'))).toBe('calc(50% + 20px)');

    // A non-numeric size falls back to the 12px default rather than producing NaN.
    expect(await withLabelSize(binding('abc'))).toBe('calc(50% + 10px)');

    // A side-aligned label takes no vertical space, so there is nothing to offset.
    harness.render({
      properties: { value: binding('ada@tooljet.com'), showClearBtn: binding('{{true}}'), label: binding('Email') },
      styles: { alignment: binding('side'), labelFontSize: binding('{{32}}') },
    });
    await waitFor(() => expect(clearButton()).toBeTruthy());
    expect(clearButton().style.top).toBe('50%');
  });

  const formExposed = () => harness.exposed('form1');
  const formAct = async (name, ...args) => {
    await waitFor(() => expect(formExposed()[name]).toBeInstanceOf(Function));
    await harness.session.store.act(async () => {
      await formExposed()[name](...args);
    });
  };

  // Break this catches: dropping useFormClear(clearValue) — the Form's clearForm
  // action could no longer empty its fields.
  test('[EmailInput-FORM-002] the Form clearForm action empties the child field', async () => {
    harness.renderInsideForm({ properties: { value: binding('ada@tooljet.com') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('ada@tooljet.com');

    await formAct('clearForm');

    await waitFor(() => expect(input().value).toBe(''));
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: dropping the `children` map from the Form's exposed variables
  // — eventsSlice looks a child's action up there by name, so every Control Component
  // action targeting a field inside a Form would break.
  test('[EmailInput-FORM-003] the child’s actions are reachable through the Form’s children map', async () => {
    harness.renderInsideForm({ properties: { value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await waitFor(() => expect(formExposed()?.children?.emailinput1?.setText).toBeInstanceOf(Function));
    await harness.session.store.act(async () => {
      await formExposed().children.emailinput1.setText('via-the-form@tooljet.com');
    });

    await waitFor(() => expect(input().value).toBe('via-the-form@tooljet.com'));
  });
});

describe('accessibility and input type', () => {
  // Break this catches: dropping any of the aria attributes — a screen-reader user
  // would not be told the field is required, busy, disabled or hidden.
  test('[EmailInput-A11Y-001] aria state attributes reflect the widget’s real state', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-disabled', 'false');
    expect(input()).toHaveAttribute('aria-busy', 'false');
    expect(input()).toHaveAttribute('aria-required', 'false');
    expect(input()).toHaveAttribute('aria-hidden', 'false');

    harness.render({
      properties: {
        disabledState: binding('{{true}}'),
        loadingState: binding('{{true}}'),
        visibility: binding('{{false}}'),
      },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-disabled', 'true');
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toHaveAttribute('aria-required', 'true');
    expect(input()).toHaveAttribute('aria-hidden', 'true');
  });

  // Break this catches: changing EmailInput's `inputType="email"` to "text" — the
  // control would lose native email semantics (mobile keyboard, browser validity)
  // while the widget's own isValid kept reporting the same verdict.
  test('[EmailInput-TYPE-001] the control is a native email input', async () => {
    harness.render({ properties: { value: binding('not-an-email') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('type', 'email');
    // The widget's own verdict is what apps read, and it rejects this value.
    expect(harness.exposed().isValid).toBe(false);
  });
});

describe('autofill hint and instance identity', () => {
  // RED/GREEN. D-02's original premise — that the autofill hint never reached the
  // control — was wrong: React renders `autocomplete` to the DOM anyway. The real
  // defect is that it warns on every render, and relying on React's tolerance of a
  // misspelled prop is the risk. The guarantee is therefore: the hint reaches the
  // control AND the widget renders without React rejecting the property.
  //
  // Break this catches: reverting `autoComplete` to lowercase `autocomplete` in
  // EmailInput.jsx's additionalInputProps.
  test('[EmailInput-TYPE-002] the autofill hint reaches the control through a valid DOM property', async () => {
    const rejected = [];
    const spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const text = args.map(String).join(' ');
      if (/Invalid DOM property/.test(text)) rejected.push(text);
    });

    try {
      harness.render();
      await waitFor(() => expect(input()).toBeTruthy());

      // The hint is on the control, so browser autofill works...
      expect(input()).toHaveAttribute('autocomplete', 'email');
      // ...and React accepted the property rather than tolerating a misspelling.
      expect(rejected).toEqual([]);
    } finally {
      spy.mockRestore();
    }
  });

  // Break this catches: deriving `name` per instance instead of the constant 'email'.
  // D-02 pinned the constant deliberately — an app or browser autofill may depend on
  // it — so this is characterization of a known, accepted quirk, paired with proof
  // that the shared name does NOT leak state between instances.
  test('[EmailInput-TYPE-003] every instance renders the fixed control name and stays independent', async () => {
    // The sibling is BOTH seeded (extraComponents) and rendered (also): `also` alone
    // mounts a RenderWidget for an id the store has never heard of, which renders
    // nothing and would make every two-instance assertion below vacuous.
    harness.render({
      properties: { value: binding('first@tooljet.com') },
      extraComponents: {
        ei2: componentDefinition('ei2', 'emailinput2', 'EmailInput', { value: binding('second@tooljet.com') }),
      },
      also: [{ id: 'ei2', componentType: 'EmailInput' }],
    });
    await waitFor(() => expect(document.querySelectorAll('input')).toHaveLength(2));

    const inputs = [...document.querySelectorAll('input')];
    expect(inputs.every((i) => i.getAttribute('name') === 'email')).toBe(true);

    // Acting on one instance leaves the other's public state alone.
    await harness.act('setText', 'changed@tooljet.com');
    // Both the rendered field and the published variable, because they can diverge:
    // hoisting the hook's value state out of the component updates every field on
    // screen while each id's exposed `value` still looks untouched.
    expect([...document.querySelectorAll('input')].map((i) => i.value)).toEqual([
      'changed@tooljet.com',
      'second@tooljet.com',
    ]);
    expect(harness.exposed('ei1').value).toBe('changed@tooljet.com');
    expect(harness.exposed('ei2').value).toBe('second@tooljet.com');
  });
});

describe('remaining properties and actions', () => {
  // Break this catches: passing `placeholder` as the input's value instead of its
  // placeholder — the field would look pre-filled and publish placeholder text.
  test('[EmailInput-PROP-002] the placeholder is rendered as a placeholder, never as the value', async () => {
    harness.render({ properties: { placeholder: binding('you@example.com'), value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('placeholder', 'you@example.com');
    expect(input().value).toBe('');
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: moving `defaultValue` inside the `value` schema, which would
  // make a broken binding render the literal words instead of leaving it empty.
  test('[EmailInput-PROP-005] a number Default value renders as a string; an unconvertible one renders empty', async () => {
    harness.render({ properties: { value: binding('{{42}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('42');

    harness.render({ properties: { value: binding('{{ ({ id: 1 }) }}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('');
    expect(input().value).not.toBe('Default value');
  });

  // Break this catches: dropping `fireEvent('onFocus')` from handleFocus, or the
  // stopPropagation swallowing it. The setTimeout(0) deferral is deliberate and
  // covered by [EmailInput-ASYNC-001].
  test('[EmailInput-EVT-003] focusing the field fires onFocus once', async () => {
    harness.render({ events: countInvocationsOn('ei1', 'onFocus') });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    await drain();

    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: pointing setFocus at the wrong ref — a builder's "focus the
  // first field" flow would silently no-op.
  test('[EmailInput-CSA-004] setFocus puts DOM focus in the field', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.activeElement).not.toBe(input());

    await harness.act('setFocus');

    expect(document.activeElement).toBe(input());
  });

  // Break this catches: setBlur calling something other than the input's blur —
  // focus would stay trapped in the field.
  test('[EmailInput-CSA-005] setBlur removes DOM focus and runs the blur path', async () => {
    harness.render({ events: countInvocationsOn('ei1', 'onBlur') });
    await waitFor(() => expect(input()).toBeTruthy());
    input().focus();
    expect(document.activeElement).toBe(input());

    await harness.act('setBlur');

    expect(document.activeElement).not.toBe(input());
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: widening useInput's `inputType === 'TextInput'` branch so
  // EmailInput also receives the deprecated handles. Documentation, registration and
  // runtime all agree on exactly seven actions.
  test('[EmailInput-CSA-009] EmailInput publishes exactly the seven documented actions', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());

    const handles = Object.entries(harness.exposed())
      .filter(([, v]) => typeof v === 'function')
      .map(([k]) => k)
      .sort();

    expect(handles).toEqual(
      ['clear', 'setBlur', 'setDisable', 'setFocus', 'setLoading', 'setText', 'setVisibility'].sort()
    );
    expect(handles).not.toContain('disable');
    expect(handles).not.toContain('visibility');
  });
});

describe('clear button visibility', () => {
  // Break this catches: dropping the `hasValue` gate — an empty field would show a
  // clear affordance with nothing to clear.
  test('[EmailInput-CLR-001] the clear button appears only when enabled and the field has a value', async () => {
    harness.render({ properties: { value: binding('a@b.com'), showClearBtn: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    harness.render({ properties: { value: binding(''), showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    harness.render({ properties: { value: binding('a@b.com'), showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeTruthy();
  });

  // Break this catches: dropping `!disable` or `!loading` from shouldShowClearBtn —
  // a user could clear a field they are not allowed to edit.
  test('[EmailInput-CLR-002] the clear button is suppressed while disabled or loading', async () => {
    harness.render({
      properties: { value: binding('a@b.com'), showClearBtn: binding('{{true}}'), disabledState: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    harness.render({
      properties: { value: binding('a@b.com'), showClearBtn: binding('{{true}}'), loadingState: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();
  });
});

describe('async lifecycle', () => {
  // Break this catches: removing the unmount guard around the deferred onFocus
  // dispatch, or making handleBlur async — a focus/blur pair would lose an event, or
  // the deferred dispatch would fire into an unmounted widget.
  test('[EmailInput-ASYNC-001] a fast focus-then-blur delivers both handlers', async () => {
    harness.render({
      events: [
        ...countInvocationsOn('ei1', 'onFocus', { key: 'focusCalls' }),
        ...countInvocationsOn('ei1', 'onBlur', { key: 'blurCalls' }),
      ],
    });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    fireEvent.blur(input());
    await drain();

    // Both are delivered; their relative order is deliberately not asserted.
    await waitFor(() => expect(callCount('focusCalls')).toBe(1));
    expect(callCount('blurCalls')).toBe(1);
  });

  // A second mount under the same scenario ID, because harness.render() re-renders
  // rather than remounts and this case needs a real unmount.
  //
  // CHARACTERIZATION of a leak, not a guarantee we want: handleFocus schedules
  // fireEvent('onFocus') on a setTimeout that nothing ever cancels, and there is no
  // mounted guard (useInput.js:326-332). So a field focused in the same tick the page
  // navigates away still runs the builder's On focus handler after the widget is gone.
  // This contract previously claimed the OPPOSITE and marked it verified with no test.
  // Fixing it is a shared-hook change across seven widgets, so it is pinned here as a
  // known gap awaiting a product decision rather than fixed under this contract.
  //
  // Break this catches: the day someone adds the clearTimeout or the mounted guard —
  // which would be a real improvement — this fails and forces the guarantee, the
  // contract row and D-03 to be revisited together rather than drifting.
  test('[EmailInput-ASYNC-001] the deferred onFocus still fires after unmount', async () => {
    const root = harness.render({ events: countInvocationsOn('ei1', 'onFocus', { key: 'focusCalls' }) });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    root.unmount(); // the React tree only; the store is left intact
    await drain();

    expect(callCount('focusCalls')).toBe(1);
  });
});

describe('styles', () => {
  // Break this catches: dropping either guard in the label-size helpers — a cleared
  // or fx-broken Size field would collapse the label, or make the top-aligned height
  // calculation NaN.
  test('[EmailInput-STYLE-001] labelFontSize drives the label size and falls back to 12px', async () => {
    expect(getLabelFontSize(18)).toBe('18px');
    expect(getLabelFontSize('18')).toBe('18px');
    expect(getLabelFontSize(0)).toBe('12px');
    expect(getLabelFontSize(-4)).toBe('12px');
    expect(getLabelFontSize(undefined)).toBe('12px');
    expect(getLabelFontSize('abc')).toBe('12px');
    expect(getLabelHeight(18)).toBe(26);
    expect(getLabelHeight('abc')).toBe(20);

    harness.render({ styles: { labelFontSize: binding('{{20}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(label())).toContain('font-size: 20px');
  });

  // Break this catches: widening the width branch so a top-aligned or auto-width
  // label starts stealing width from the field.
  test('[EmailInput-STYLE-002] the field width is derived from widthType, auto and alignment together', () => {
    expect(getWidthTypeOfComponentStyles('ofComponent', 33, false, 'side')).toEqual({ width: '67%', minWidth: '20%' });
    expect(getWidthTypeOfComponentStyles('ofComponent', 33, true, 'side')).toEqual({
      width: '100%',
      minWidth: undefined,
    });
    expect(getWidthTypeOfComponentStyles('ofField', 33, false, 'side')).toEqual({ width: '100%', minWidth: undefined });
    expect(getWidthTypeOfComponentStyles('ofComponent', 33, false, 'top')).toEqual({
      width: '100%',
      minWidth: undefined,
    });
  });

  // Break this catches: dropping the ofField scaling, which would silently
  // re-proportion every label in an app saved on the deprecated width type.
  test('[EmailInput-STYLE-003] a deprecated ofField width is scaled to 70% of the configured value', () => {
    expect(getLabelWidthOfInput('ofComponent', 40)).toBe(40);
    expect(getLabelWidthOfInput('ofField', 40)).toBe(28);
    expect(checkIfInputWidgetTypeIsDeprecated('ofField')).toBe(true);
    expect(checkIfInputWidgetTypeIsDeprecated('ofComponent')).toBe(false);
  });

  // Break this catches: dropping the label?.length tests from the layout branches,
  // which makes a top-aligned field with an empty label reserve label space.
  test('[EmailInput-STYLE-004] alignment and direction reposition the label around the field', async () => {
    const wrapper = () => fieldBox().closest('.text-input');

    harness.render({ styles: { alignment: binding('top') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(wrapper().className).toMatch(/\bflex-column\b/);

    harness.render({ styles: { alignment: binding('side'), direction: binding('right') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(wrapper().className).toMatch(/\bflex-row-reverse\b/);

    harness.render({ properties: { label: binding('') }, styles: { alignment: binding('top') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(wrapper().className).not.toMatch(/\bflex-column\b/);
  });

  // Break this catches: dropping a legacy sentinel comparison — a pre-theme app whose
  // background is still literally `#fff` would render that flat white.
  test('[EmailInput-STYLE-005] radius, background, border and shadow reach the field, with legacy fallbacks', async () => {
    harness.render({
      styles: {
        borderRadius: binding('{{14}}'),
        backgroundColor: binding('#123456'),
        borderColor: binding('#654321'),
        boxShadow: binding('2px 4px 6px 0px #00000040'),
      },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    const configured = inlineStyle(fieldBox());
    expect(configured).toContain('border-radius: 14px');
    expect(configured).toContain('rgb(18, 52, 86)');
    expect(configured).toContain('#654321');
    expect(configured).toContain('box-shadow: 2px 4px 6px 0px');

    harness.render({ styles: { backgroundColor: binding('#fff'), borderColor: binding('#CCD1D5') } });
    await waitFor(() => expect(input()).toBeTruthy());
    const legacy = inlineStyle(fieldBox());
    expect(legacy).not.toContain('#fff');
    expect(legacy).not.toContain('rgb(255, 255, 255)');
    expect(legacy).not.toContain('#ccd1d5');
  });

  // Break this catches: flipping EmailInput's registered `iconVisibility` default to
  // false, or rendering the icon unconditionally. EmailInput ships its icon ON — the
  // opposite of TextInput — so the default render differs between the siblings.
  test('[EmailInput-STYLE-006] the mail icon renders by default and iconVisibility gates it', async () => {
    harness.render(); // registered defaults: iconVisibility true, icon IconMail
    await waitFor(() => expect(leftIcon()).toBeTruthy());

    harness.render({ styles: { iconVisibility: { value: false } } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(leftIcon()).toBeNull();
  });

  // Break this catches: dropping the iconColor pass-through. EmailInput registers no
  // placeholderTextColor, so unlike TextInput there is no override path here.
  test('[EmailInput-STYLE-007] the icon colour comes from iconColor', async () => {
    harness.render({ styles: { iconColor: binding('#00ff00'), iconVisibility: { value: true } } });
    await waitFor(() => expect(leftIcon()).toBeTruthy());
    expect(inlineStyle(leftIcon())).toContain('rgb(0, 255, 0)');
  });

  // Break this catches: dropping the isFocused branch from the border resolution —
  // the field would give no visual focus feedback.
  test('[EmailInput-STYLE-008] focusing the field swaps its border to the accent colour', async () => {
    harness.render({ styles: { accentColor: binding('#ff00ff'), borderColor: binding('#123456') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('#123456');

    fireEvent.focus(input());

    await waitFor(() => expect(inlineStyle(fieldBox())).toContain('#ff00ff'));
  });

  // Break this catches: dropping errTextColor from the message's inline style.
  // The field border's error-beats-focus precedence is browser-owned
  // ([EmailInput-BRW-005]) because jsdom drops var() on standard properties.
  test('[EmailInput-STYLE-009] a revealed invalid field colours its message with errTextColor', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, styles: { errTextColor: binding('#abcdef') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
    expect(inlineStyle(errorText())).toContain('rgb(171, 205, 239)');
  });

  // Break this catches: dropping the legacy text-colour blocklist — a pre-theme app
  // would render hard #1B1F24 text on a disabled field.
  test('[EmailInput-STYLE-010] a legacy text colour resolves to the theme token, per state', async () => {
    for (const disabled of ['{{false}}', '{{true}}']) {
      harness.render({ styles: { textColor: binding('#1B1F24') }, properties: { disabledState: binding(disabled) } });
      await waitFor(() => expect(input()).toBeTruthy());
      expect(inlineStyle(input())).not.toContain('#1b1f24');
      expect(inlineStyle(input())).not.toContain('rgb(27, 31, 36)');
    }
    for (const disabled of ['{{false}}', '{{true}}']) {
      harness.render({ styles: { textColor: binding('#ff0000') }, properties: { disabledState: binding(disabled) } });
      await waitFor(() => expect(input()).toBeTruthy());
      expect(inlineStyle(input())).toContain('rgb(255, 0, 0)');
    }
  });

  // Break this catches: dropping the BOX_PADDING term from the top-alignment height —
  // a top-aligned field would overflow its widget box by the canvas padding.
  test('[EmailInput-STYLE-011] padding none removes the box padding from the top-aligned height', async () => {
    harness.render({
      styles: { alignment: binding('top'), padding: binding('default'), labelFontSize: binding('{{12}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('calc(100% - 20px - 4px)');

    harness.render({
      styles: { alignment: binding('top'), padding: binding('none'), labelFontSize: binding('{{12}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('calc(100% - 20px - 0px)');
  });

  // Break this catches: putting the mandatory asterisk back on top of the label instead of
  // beside it — dropping `flex-shrink: 0`, or moving the ellipsis off the text span, or
  // restoring the absolute positioning it used to have.
  //
  // The star used to be absolutely positioned, so it took no width and a constant
  // `padding-right` was the only thing holding the text out from under it. The star's own
  // advance grows with the label font, so past roughly a 16px label the text ran under it:
  // measured in Chrome, 8.47px of overlap at 32px. Reserving a computed width would only
  // move the problem, since the `*` advance ranges 0.28em-0.60em across font families and
  // the label font is about to become user-configurable. Laying it out in flow instead
  // makes the browser reserve exactly the right room, whatever the font.
  //
  // This is a shared `_ui/Label` fix, so it guards every widget that renders a mandatory
  // label — the other inputs, Dropdown, Multiselect, Date, Rating and the rest.
  test('[EmailInput-STYLE-012] a mandatory label lays its asterisk out beside the text, not over it', async () => {
    const labelBox = () => label().querySelector('p');
    const textSpan = () => labelBox().querySelector('span');
    const asterisk = () => labelBox().querySelectorAll('span')[1];

    harness.render({
      properties: { label: binding('Label') },
      styles: { labelFontSize: binding('{{32}}') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    // The star is in normal flow, so it occupies width the text cannot be laid into. jsdom
    // computes no geometry, so the guarantee is pinned structurally instead.
    expect(asterisk()).toHaveTextContent('*');
    expect(asterisk().style.position).not.toBe('absolute');
    expect(asterisk().style.flexShrink).toBe('0');
    expect(labelBox().style.display).toBe('flex');

    // The ellipsis belongs to the text alone. If it sat on the row, an over-long label would
    // truncate the asterisk away with it and the field would lose its required marker.
    expect(textSpan()).toHaveTextContent('Label');
    expect(textSpan().style.textOverflow).toBe('ellipsis');
    expect(textSpan().style.overflow).toBe('hidden');
    expect(labelBox().style.textOverflow).not.toBe('ellipsis');

    // The row hands its reserve over to the asterisk rather than keeping both. Holding the
    // full 12px as well would pay for the same gap twice and widen EVERY mandatory label by
    // the glyph's width — measured in Chrome, 8px wider even at the default size, where
    // nothing was wrong. Dropping to the 4px the star used to be inset by reproduces the old
    // box exactly at 12px, so only an enlarged label grows, and only by what its star needs.
    expect(labelBox().style.paddingRight).toBe('4px');

    // An optional field has no star to make room for, so it keeps the padding it always had
    // and its box is unchanged at every size.
    harness.render({
      properties: { label: binding('Label') },
      styles: { labelFontSize: binding('{{32}}') },
      validation: { mandatory: binding('{{false}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(labelBox().querySelectorAll('span')).toHaveLength(1);
    expect(textSpan()).toHaveTextContent('Label');
    expect(labelBox().style.paddingRight).toBe('12px');

    // A right-aligned label pinned its star flush to the edge, so it gives up all of its
    // padding instead of 8px of it.
    harness.render({
      properties: { label: binding('Label') },
      styles: { labelFontSize: binding('{{32}}'), direction: binding('right') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(labelBox().style.paddingRight).toBe('0px');
  });
});

describe('remaining accessibility', () => {
  // Break this catches: making htmlFor unconditional in Label.jsx (clicking a label on
  // the canvas would steal focus and break copy/paste), or dropping it entirely (a
  // running app's label would no longer reach its field).
  test('[EmailInput-A11Y-002] the label targets the input in the Viewer, and deliberately not in the editor', async () => {
    harness.render({ properties: { label: binding('Email ID') }, currentMode: 'view' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).toHaveAttribute('for', 'component-ei1');
    expect(screen.getByLabelText('Email ID')).toBe(input());

    harness.render({ properties: { label: binding('Email ID') }, currentMode: 'edit' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).not.toHaveAttribute('for');
  });

  // Break this catches: dropping the aria-label fallback — a fixed-width label that
  // has not been laid out would leave the input with no accessible name.
  test('[EmailInput-A11Y-003] an unmeasured fixed-width label falls back to an aria-label', async () => {
    harness.render({ properties: { label: binding('Email ID') }, styles: { auto: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-label', 'Email ID');

    harness.render({ properties: { label: binding('Email ID') }, styles: { auto: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).not.toHaveAttribute('aria-label');
  });
});
