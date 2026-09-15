/**
 * PasswordInput widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/PasswordInput/TESTING.md
 * Every test title starts with its approved scenario ID; the `// Break this catches:`
 * comment names the production edit its oracle is meant to catch.
 *
 * Two things are specific to this widget:
 *   1. The reveal (eye) control switches the rendered input between `password` and
 *      `text`. Its state lives in PasswordInput itself, not in useInput (D-02).
 *   2. `styles.iconVisibility` is the LEFT-icon gate and is unrelated to reveal.
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

const harness = createWidgetHarness({ componentType: 'PasswordInput', handle: 'passwordinput1', id: 'pi1' });

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

const input = () => document.getElementById('component-pi1');
const widgetNode = () => document.querySelector('.canvas-component');
const label = () => document.querySelector('[data-cy="passwordinput1-label"]');
const fieldBox = () => document.querySelector('[data-cy="passwordinput1-actionable-section"]');
const errorText = () => document.querySelector('[data-cy="passwordinput1-invalid-feedback"]');
const leftIcon = () => document.querySelector('[data-cy="passwordinput1-icon"]');
const revealControl = () => document.querySelector('[data-cy="password-visibility-icon"]');
const callCount = (key = 'calls') => harness.variables()?.[key] ?? 0;
/**
 * The `style` attribute, lower-cased. jsdom drops `var(--token)` on standard
 * properties (custom properties survive) and normalises `background-color` to
 * rgb() while leaving `border-color` as authored hex — so legacy-sentinel
 * assertions check that the literal is ABSENT rather than that a token is present.
 */
const inlineStyle = (node) => (node.getAttribute('style') ?? '').toLowerCase();

describe('concealing and revealing', () => {
  // Break this catches: flipping PasswordInput's `isRevealed` initial state to true,
  // or inverting the inputType branch — a password would be on screen on load, which
  // is the one thing the documentation promises cannot happen.
  test('[PasswordInput-REVEAL-001] the field conceals its value until the user reveals it', async () => {
    harness.render({ properties: { value: binding('hunter2') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('type', 'password');
    expect(input().value).toBe('hunter2'); // the value is there, just concealed
  });

  // Break this catches: dropping the onClick from the reveal control, or making the
  // toggle one-way — a user could not check what they typed, or could not re-hide it.
  test('[PasswordInput-REVEAL-002] clicking the eye reveals the value, and clicking again conceals it', async () => {
    harness.render({ properties: { value: binding('hunter2') } });
    await waitFor(() => expect(revealControl()).toBeTruthy());
    expect(input()).toHaveAttribute('type', 'password');

    await userEvent.click(revealControl());
    expect(input()).toHaveAttribute('type', 'text');

    await userEvent.click(revealControl());
    expect(input()).toHaveAttribute('type', 'password');
  });

  // Break this catches: hoisting the reveal flag back into useInput or any shared
  // store — revealing one password field would expose every other one on the page.
  //
  // The sibling is BOTH seeded (extraComponents) and rendered (also): `also` alone
  // mounts a RenderWidget for an id the store has never heard of, which renders
  // nothing and makes a two-instance assertion silently vacuous.
  test('[PasswordInput-REVEAL-003] revealing one field does not reveal another', async () => {
    harness.render({
      properties: { value: binding('first-secret') },
      extraComponents: {
        pi2: componentDefinition('pi2', 'passwordinput2', 'PasswordInput', { value: binding('second-secret') }),
      },
      also: [{ id: 'pi2', componentType: 'PasswordInput' }],
    });
    await waitFor(() => expect(document.querySelectorAll('input')).toHaveLength(2));

    const controls = document.querySelectorAll('[data-cy="password-visibility-icon"]');
    expect(controls).toHaveLength(2);
    expect([...document.querySelectorAll('input')].every((i) => i.getAttribute('type') === 'password')).toBe(true);

    await userEvent.click(controls[0]);

    const types = [...document.querySelectorAll('input')].map((i) => i.getAttribute('type'));
    expect(types.filter((t) => t === 'text')).toHaveLength(1);
    expect(types.filter((t) => t === 'password')).toHaveLength(1);
  });
});

describe('value and identity', () => {
  // Break this catches: removing the [properties.value] effect or the `value` entry
  // from the mount effect — a configured Default value would not reach the field.
  test('[PasswordInput-PROP-003] the Default value seeds the field and the exposed value at mount', async () => {
    harness.render({ properties: { value: binding('seeded-secret') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('seeded-secret');
    expect(harness.exposed().value).toBe('seeded-secret');
    expect(input()).toHaveAttribute('type', 'password'); // still concealed
  });
});

describe('events', () => {
  // Break this catches: moving fireEvent('onChange') out of handleChange, or firing
  // it twice per keystroke.
  test('[PasswordInput-EVT-001] typing fires onChange once per keystroke and republishes the value', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('pi1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), 'abc');

    await waitFor(() => expect(callCount()).toBe(3));
    expect(harness.exposed().value).toBe('abc');
  });
});

describe('component-specific actions', () => {
  // Break this catches: dropping fireEvent('onChange') from the setText handle.
  test('[PasswordInput-CSA-001] setText writes the value, publishes it, and fires onChange once', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('pi1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setText', 'from-a-query');

    expect(input().value).toBe('from-a-query');
    expect(harness.exposed().value).toBe('from-a-query');
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: adding setShowValidationError(true) to clearValue, which
  // would make Form clearForm paint an untouched form red.
  test('[PasswordInput-CSA-003] clear empties the field and fires onChange without changing message visibility', async () => {
    harness.render({
      properties: { value: binding('secret') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('pi1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('clear');

    expect(input().value).toBe('');
    await waitFor(() => expect(callCount()).toBe(1));
    expect(errorText()).toBeNull();
  });
});

describe('disabled, loading and visibility', () => {
  // Break this catches: removing the `disabled` attribute (BaseInput.jsx:283).
  test('[PasswordInput-STATE-001] disabledState renders a disabled input that rejects typing', async () => {
    harness.render({ properties: { value: binding('locked'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().disabled).toBe(true);
    await userEvent.type(input(), 'more');

    expect(input().value).toBe('locked');
  });

  // Break this catches: widening useInput's `disable` seed back to
  // `disabledState || loadingState` — a field that merely loads would stay greyed
  // out and unclickable after loading cleared.
  test('[PasswordInput-STATE-005] a field that mounts loading is interactive again once loading clears', async () => {
    harness.render({ properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().disabled).toBe(true);

    await harness.act('setLoading', false);
    await waitFor(() => expect(harness.exposed().isLoading).toBe(false));

    expect(harness.exposed().isDisabled).toBe(false);
    expect(input().disabled).toBe(false);
    expect(widgetNode().className).not.toMatch(/\bdisabled\b/);
  });
});

describe('validation', () => {
  // Break this catches: making useShowValidationOnFormSubmit reveal unconditionally
  // — every mandatory field would load pre-accused. (useInput's useState(false) seed
  // is NOT load-bearing; that hook writes the flag on mount regardless.)
  test('[PasswordInput-VAL-002] the message is hidden until the user leaves the field', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(errorText()).toBeNull();
    expect(harness.exposed().isValid).toBe(false);

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: dropping any setExposedVariable('isValid', ...) from the
  // value-writing paths — an app gating submit would act on a stale verdict.
  test('[PasswordInput-VAL-005] isValid is published and tracks every value write', async () => {
    harness.render({ properties: { value: binding('') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    await userEvent.type(input(), 'secret');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await harness.act('clear');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
  });
});

describe('inside a Form', () => {
  const formExposed = () => harness.exposed('form1');
  const formAct = async (name, ...args) => {
    await waitFor(() => expect(formExposed()[name]).toBeInstanceOf(Function));
    await harness.session.store.act(async () => {
      await formExposed()[name](...args);
    });
  };

  // Break this catches: dropping the FormSignalContext subscription (useInput.js:74).
  test('[PasswordInput-FORM-001] submitting the Form reveals the child’s message without a blur', async () => {
    harness.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    await formAct('submitForm');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: dropping useFormClear(clearValue) — the Form's clearForm
  // action could no longer empty its fields, so a credential typed into a form would
  // survive a reset.
  test('[PasswordInput-FORM-002] the Form clearForm action empties the child field', async () => {
    harness.renderInsideForm({ properties: { value: binding('secret') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('secret');

    await formAct('clearForm');

    await waitFor(() => expect(input().value).toBe(''));
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: dropping the `children` map from the Form's exposed variables
  // — eventsSlice looks a child's action up there by name, so every Control Component
  // action targeting a field inside a Form would break.
  test('[PasswordInput-FORM-003] the child’s actions are reachable through the Form’s children map', async () => {
    harness.renderInsideForm({ properties: { value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await waitFor(() => expect(formExposed()?.children?.passwordinput1?.setText).toBeInstanceOf(Function));
    await harness.session.store.act(async () => {
      await formExposed().children.passwordinput1.setText('via-the-form');
    });

    await waitFor(() => expect(input().value).toBe('via-the-form'));
    expect(input()).toHaveAttribute('type', 'password'); // written, still concealed
  });
});

describe('reveal control, continued', () => {
  // Break this catches: dropping the `!inputLogic.loading` guard on rightIcon — the
  // eye and the loader would stack in the same slot, and a field whose value is still
  // arriving could be revealed.
  test('[PasswordInput-REVEAL-004] the loader replaces the reveal control while the field is loading', async () => {
    harness.render({ properties: { value: binding('hunter2'), loadingState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(revealControl()).toBeNull();

    await harness.act('setLoading', false);

    await waitFor(() => expect(revealControl()).toBeTruthy());
    expect(document.querySelector('.tj-widget-loader')).toBeNull();
  });

  // Break this catches: dropping additionalInputProps, or mis-casing it the way
  // EmailInput's `autocomplete` was (D-02 there) — a browser would offer to fill a
  // stored credential into a field the app may be using to SET one.
  test('[PasswordInput-REVEAL-005] the field asks browsers not to autofill a saved password', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('autocomplete', 'new-password');
  });

  // Characterization of a known gap (D-01). Break this catches: someone "tidying" the
  // reveal control by adding a role or tab stop without updating the contract — the
  // accessibility debt must be paid deliberately, not drift in or out.
  test('[PasswordInput-REVEAL-006] the reveal control is mouse-only and unnamed', async () => {
    harness.render({ properties: { value: binding('hunter2') } });
    await waitFor(() => expect(revealControl()).toBeTruthy());

    expect(revealControl().tagName).toBe('DIV');
    expect(revealControl()).not.toHaveAttribute('role');
    expect(revealControl()).not.toHaveAttribute('tabindex');
    expect(revealControl()).not.toHaveAttribute('aria-label');
    expect(revealControl().textContent).toBe('');
    // Nothing names it, so no accessible-name query can reach it.
    expect(screen.queryByRole('button', { name: /show|reveal|password/i })).toBeNull();
  });

  // Characterization of a known gap (D-01). Break this catches: moving the reveal
  // control inside the input's disabled subtree — which WOULD be the fix, and must
  // land as a deliberate contract change rather than a silent one.
  test('[PasswordInput-REVEAL-007] a disabled field can still be revealed', async () => {
    harness.render({ properties: { value: binding('hunter2'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute('type', 'password');

    await userEvent.click(revealControl());

    expect(input()).toHaveAttribute('type', 'text');
    expect(input().disabled).toBe(true); // still not editable, just readable
  });

  // Characterization under D-03. Break this catches: publishing the reveal flag as an
  // exposed variable — which would be a real feature, but changes what an app can
  // observe about a credential and must be contracted first.
  test('[PasswordInput-REVEAL-008] the reveal state is not published to the app', async () => {
    harness.render({ properties: { value: binding('hunter2') } });
    await waitFor(() => expect(revealControl()).toBeTruthy());
    const before = { ...harness.exposed() };

    await userEvent.click(revealControl());
    await drain();
    expect(input()).toHaveAttribute('type', 'text');

    const after = harness.exposed();
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
    for (const key of Object.keys(before)) {
      if (typeof before[key] === 'function') continue;
      expect(after[key]).toEqual(before[key]);
    }
    // `isVisible` is the widget's own visibility, not the reveal flag.
    expect(after.isVisible).toBe(true);
  });

  // Characterization under D-03. Break this catches: adding a reset of `isRevealed`
  // on blur or on a value write — a deliberate hardening, but one that changes
  // behaviour builders may already rely on.
  test('[PasswordInput-REVEAL-009] revealing survives blur and a replaced value', async () => {
    harness.render({ properties: { value: binding('hunter2') } });
    await waitFor(() => expect(revealControl()).toBeTruthy());

    await userEvent.click(revealControl());
    expect(input()).toHaveAttribute('type', 'text');

    fireEvent.blur(input());
    await drain();
    expect(input()).toHaveAttribute('type', 'text');

    await harness.act('setText', 'a-new-secret');
    expect(input().value).toBe('a-new-secret');
    expect(input()).toHaveAttribute('type', 'text'); // shown in clear text

    await harness.act('clear');
    expect(input().value).toBe('');
    expect(input()).toHaveAttribute('type', 'text');
  });

  // Break this catches: re-merging the two flags that were both once called
  // `iconVisibility` — the Field accordion's icon toggle would reveal the password,
  // or revealing would make a lock icon appear.
  test('[PasswordInput-REVEAL-010] the left icon and the reveal control are independent', async () => {
    harness.render({ properties: { value: binding('hunter2') }, styles: { iconVisibility: { value: true } } });
    await waitFor(() => expect(leftIcon()).toBeTruthy());
    expect(input()).toHaveAttribute('type', 'password'); // icon on, still concealed

    harness.render({ properties: { value: binding('hunter2') }, styles: { iconVisibility: { value: false } } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(leftIcon()).toBeNull();
    expect(revealControl()).toBeTruthy(); // the reveal control is not gated by it

    await userEvent.click(revealControl());
    expect(input()).toHaveAttribute('type', 'text');
    expect(leftIcon()).toBeNull(); // revealing renders no left icon
  });
});

describe('label, placeholder and default value', () => {
  // Break this catches: dropping the `[label]` republish (useInput.js:121-124) — a
  // builder renaming a field would leave {{...label}} on the old text.
  test('[PasswordInput-PROP-001] the configured label labels the field and is published as `label`', async () => {
    harness.render({ properties: { label: binding('Password') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(label()).toHaveTextContent('Password');
    expect(harness.exposed().label).toBe('Password');

    harness.setComponentProperty('pi1', 'label', 'Passphrase', 'properties');
    await waitFor(() => expect(harness.exposed().label).toBe('Passphrase'));
    expect(label()).toHaveTextContent('Passphrase');
  });

  // Break this catches: passing `placeholder` as the input's value instead of its
  // placeholder — the field would look pre-filled and publish placeholder text as a
  // credential.
  test('[PasswordInput-PROP-002] the placeholder renders as a placeholder, never as the value', async () => {
    harness.render({ properties: { placeholder: binding('Enter password'), value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('placeholder', 'Enter password');
    expect(input().value).toBe('');
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: gating the [properties.value] effect on a "field is untouched"
  // flag (stranding binding-driven resets), or adding fireEvent('onChange') to
  // setInputValue (re-running every On change handler on a late-resolving default).
  test('[PasswordInput-PROP-004] a re-resolved Default value replaces typed text and fires no onChange', async () => {
    harness.render({
      properties: { value: binding('seed-secret') },
      events: countInvocationsOn('pi1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(callCount()).toBe(0);

    harness.setComponentProperty('pi1', 'value', 'from-query-secret', 'properties');

    await waitFor(() => expect(input().value).toBe('from-query-secret'));
    expect(harness.exposed().value).toBe('from-query-secret');
    expect(callCount()).toBe(0); // the overwrite is silent
  });

  // Break this catches: moving `defaultValue: 'default value'` from beside the schema
  // into it. `validateProperty` only reads `validation.schema.defaultValue`, so today
  // an unconvertible binding falls back to the string schema's own empty default. Move
  // it one level in and a broken binding renders the literal words as the password.
  test('[PasswordInput-PROP-005] a number Default value renders as a string; an unconvertible one renders empty', async () => {
    harness.render({ properties: { value: binding('{{42}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('42');

    harness.render({ properties: { value: binding('{{ ({ id: 1 }) }}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('');
    expect(input().value).not.toBe('default value');
  });
});

describe('more events', () => {
  // Break this catches: dropping the `e.key === 'Enter'` guard in handleKeyUp, which
  // would fire onEnterPressed on every key — including every character of a password.
  test('[PasswordInput-EVT-002] Enter fires onEnterPressed once, with the value already published', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('pi1', 'onEnterPressed') });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), 'ab');
    expect(callCount()).toBe(0); // plain characters must not trigger it

    await userEvent.type(input(), '{enter}');

    await waitFor(() => expect(callCount()).toBe(1));
    expect(harness.exposed().value).toBe('ab');
  });

  // Break this catches: dropping `fireEvent('onFocus')` from handleFocus, or the
  // stopPropagation swallowing it. The setTimeout(0) deferral is deliberate and
  // covered by [PasswordInput-ASYNC-001].
  test('[PasswordInput-EVT-003] focusing the field fires onFocus once', async () => {
    harness.render({ events: countInvocationsOn('pi1', 'onFocus') });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    await drain();

    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: removing setShowValidationError(true) from handleBlur — the
  // user would leave an invalid field and never be told.
  test('[PasswordInput-EVT-004] blurring fires onBlur once and reveals a pending validation message', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, events: countInvocationsOn('pi1', 'onBlur') });
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
  test('[PasswordInput-CSA-002] setText reveals a validation message on a field the user never touched', async () => {
    harness.render({
      properties: { value: binding('secret') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    await harness.act('setText', '');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: pointing setFocus at the wrong ref — a builder's "focus the
  // password field after the username" flow would silently no-op.
  test('[PasswordInput-CSA-004] setFocus puts DOM focus in the field', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.activeElement).not.toBe(input());

    await harness.act('setFocus');

    expect(document.activeElement).toBe(input());
  });

  // Break this catches: setBlur calling something other than the input's blur —
  // focus would stay trapped in the field.
  test('[PasswordInput-CSA-005] setBlur removes DOM focus and runs the blur path', async () => {
    harness.render({ events: countInvocationsOn('pi1', 'onBlur') });
    await waitFor(() => expect(input()).toBeTruthy());
    input().focus();
    expect(document.activeElement).toBe(input());

    await harness.act('setBlur');

    expect(document.activeElement).not.toBe(input());
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: dropping the paired setExposedVariable('isVisible', ...) — the
  // widget would hide while {{...isVisible}} still read true.
  test('[PasswordInput-CSA-006] setVisibility hides the field and republishes isVisible', async () => {
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
  // the same drift class as [PasswordInput-STATE-005].
  test('[PasswordInput-CSA-007] setDisable disables the field and republishes isDisabled', async () => {
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
  test('[PasswordInput-CSA-008] setLoading shows the loader, blocks input, and republishes isLoading', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.querySelector('.tj-widget-loader')).toBeNull();

    await harness.act('setLoading', true);

    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
  });

  // Break this catches: widening useInput's `inputType === 'TextInput'` branch so
  // PasswordInput also receives the deprecated handles. Documentation, registration
  // and runtime all agree on exactly seven actions, and none of them reveals the
  // password — see [PasswordInput-REVEAL-008].
  test('[PasswordInput-CSA-009] PasswordInput publishes exactly the seven documented actions', async () => {
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

  // Break this catches: removing the setDisable(disabledState) write from the
  // [disabledState] effect — a property change could no longer correct a CSA-set
  // state, so a stale CSA would outlive every rebind.
  //
  // The sticky half has no faultable line of its own: it falls out of React's
  // dependency comparison, so a same-value re-resolve never re-runs the effect.
  test('[PasswordInput-CSA-010] a CSA state is sticky until the matching property actually changes', async () => {
    harness.render({ properties: { value: binding('seed-secret'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setText', 'set-by-csa');
    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    // A no-op rewrite must not revert the CSA.
    harness.setComponentProperty('pi1', 'disabledState', '{{false}}', 'properties');
    await drain();
    expect(harness.exposed().isDisabled).toBe(true);
    expect(input().value).toBe('set-by-csa');

    // A genuine change wins and republishes.
    harness.setComponentProperty('pi1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    harness.setComponentProperty('pi1', 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(input().disabled).toBe(false);

    harness.setComponentProperty('pi1', 'value', 'set-by-property', 'properties');
    await waitFor(() => expect(input().value).toBe('set-by-property'));
  });
});

describe('remaining state', () => {
  // Break this catches: rendering the loader without folding `loading` into the
  // input's disabled state — a user could type a password into a field whose value
  // is about to be replaced by the query still loading.
  test('[PasswordInput-STATE-002] loadingState renders the loader and blocks input', async () => {
    harness.render({ properties: { value: binding('secret'), loadingState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute('aria-busy', 'true');
  });

  // Break this catches: dropping `visibility` from the error block's guard — a hidden
  // mandatory field would render its error text into the layout while invisible.
  test('[PasswordInput-STATE-003] visibility false hides the field and suppresses its validation message', async () => {
    harness.render({
      properties: { visibility: binding('{{false}}') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);
    expect(input()).toHaveAttribute('aria-hidden', 'true');

    await userEvent.click(revealControl()); // hidden, revealed and invalid at once
    fireEvent.blur(input());
    await drain();
    expect(errorText()).toBeNull();
  });

  // Break this catches: removing any of the property effects — a rebound toggle would
  // change the DOM while the exposed variable other components read stayed stale.
  test('[PasswordInput-STATE-004] isVisible, isDisabled and isLoading track their properties on change', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);
    expect(harness.exposed().isDisabled).toBe(false);
    expect(harness.exposed().isLoading).toBe(false);

    harness.setComponentProperty('pi1', 'visibility', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));

    harness.setComponentProperty('pi1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    harness.setComponentProperty('pi1', 'loadingState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(input().disabled).toBe(true);
  });
});

describe('remaining validation', () => {
  // Break this catches: dropping aria-required or the isMandatory republish — a
  // required field would not announce itself and {{...isMandatory}} would go stale.
  test('[PasswordInput-VAL-001] mandatory marks the input required and publishes isMandatory', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('aria-required', 'true');
    expect(harness.exposed().isMandatory).toBe(true);
    expect(label()).toHaveTextContent('*');
  });

  // Break this catches: reverting 6713df59a2 — setInputValue reading the `validate`
  // prop directly instead of validateRef.current means a value written after a rule
  // edit is judged by the OLD rule. For a password field that is a policy change
  // that silently does not apply.
  test('[PasswordInput-VAL-004] editing a rule re-validates the current value with no keystroke', async () => {
    harness.render({ properties: { value: binding('short') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);

    harness.setComponentProperty('pi1', 'minLength', '12', 'validation');

    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    // A value written AFTER the rule change is judged by the new rule.
    await harness.act('setText', 'alsoshort');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    await harness.act('setText', 'long-enough-passphrase');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));
  });

  // Break this catches: dropping aria-invalid or the is-invalid class — the field
  // would show a message with nothing marking the control itself invalid.
  test('[PasswordInput-VAL-006] a revealed invalid field is marked invalid on the control', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-invalid', 'false');

    fireEvent.blur(input());

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'true'));
    expect(input().className).toMatch(/\bis-invalid\b/);
  });
});

describe('asynchronous delivery', () => {
  // Break this catches: removing the unmount guard around the deferred onFocus
  // dispatch, or making handleBlur async — a focus/blur pair would lose an event, or
  // the deferred dispatch would fire into an unmounted widget.
  test('[PasswordInput-ASYNC-001] a fast focus-then-blur delivers both handlers', async () => {
    harness.render({
      events: [
        ...countInvocationsOn('pi1', 'onFocus', { key: 'focusCalls' }),
        ...countInvocationsOn('pi1', 'onBlur', { key: 'blurCalls' }),
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
});

describe('styles', () => {
  // Break this catches: dropping either guard in the label-size helpers — a cleared
  // or fx-broken Size field would collapse the label, or make the top-aligned height
  // calculation NaN.
  test('[PasswordInput-STYLE-001] labelFontSize drives the label size and falls back to 12px', async () => {
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
  test('[PasswordInput-STYLE-002] the field width is derived from widthType, auto and alignment together', () => {
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
  test('[PasswordInput-STYLE-003] a deprecated ofField width is scaled to 70% of the configured value', () => {
    expect(getLabelWidthOfInput('ofComponent', 40)).toBe(40);
    expect(getLabelWidthOfInput('ofField', 40)).toBe(28);
    expect(checkIfInputWidgetTypeIsDeprecated('ofField')).toBe(true);
    expect(checkIfInputWidgetTypeIsDeprecated('ofComponent')).toBe(false);
  });

  // Break this catches: dropping the label?.length tests from the layout branches,
  // which makes a top-aligned field with an empty label reserve label space.
  test('[PasswordInput-STYLE-004] alignment and direction reposition the label around the field', async () => {
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
  test('[PasswordInput-STYLE-005] radius, background, border and shadow reach the field, with legacy fallbacks', async () => {
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

  // Break this catches: rendering the left icon unconditionally, or flipping
  // PasswordInput's registered `iconVisibility` default to false. This is the LEFT
  // icon only — the reveal control is never gated by it ([PasswordInput-REVEAL-010]).
  test('[PasswordInput-STYLE-006] the lock icon renders by default and iconVisibility gates it', async () => {
    harness.render(); // registered defaults: iconVisibility true, icon IconLock
    await waitFor(() => expect(leftIcon()).toBeTruthy());

    harness.render({ styles: { iconVisibility: { value: false } } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(leftIcon()).toBeNull();
  });

  // Break this catches: dropping either half of the placeholder-colour override.
  // Unlike EmailInput, PasswordInput registers `placeholderTextColor`, so this path
  // is reachable from the inspector and a regression would ship.
  test('[PasswordInput-STYLE-007] a custom placeholder colour also drives the left icon colour', async () => {
    harness.render({ styles: { placeholderTextColor: binding('#abcdef') } });
    await waitFor(() => expect(input()).toBeTruthy());
    // Custom properties survive jsdom; the placeholder variable is overridden in place.
    expect(inlineStyle(input())).toContain('--cc-placeholder-text: #abcdef');
    expect(inlineStyle(leftIcon())).toContain('rgb(171, 205, 239)');

    // An explicitly chosen icon colour wins over the placeholder colour.
    harness.render({ styles: { placeholderTextColor: binding('#abcdef'), iconColor: binding('#ff0000') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(input())).toContain('--cc-placeholder-text: #abcdef');
    expect(inlineStyle(leftIcon())).toContain('rgb(255, 0, 0)');

    // The registered default is treated as "not overridden" and changes nothing.
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(input())).not.toContain('--cc-placeholder-text');
  });

  // Break this catches: dropping the isFocused branch from the border resolution —
  // the field would give no visual focus feedback.
  test('[PasswordInput-STYLE-008] focusing the field swaps its border to the accent colour', async () => {
    harness.render({ styles: { accentColor: binding('#ff00ff'), borderColor: binding('#123456') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('#123456');

    fireEvent.focus(input());

    await waitFor(() => expect(inlineStyle(fieldBox())).toContain('#ff00ff'));
  });

  // Break this catches: dropping errTextColor from the message's inline style.
  // The field border's error-beats-focus precedence is browser-owned
  // ([PasswordInput-BRW-005]) because jsdom drops var() on standard properties.
  test('[PasswordInput-STYLE-009] a revealed invalid field colours its message with errTextColor', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, styles: { errTextColor: binding('#abcdef') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
    expect(inlineStyle(errorText())).toContain('rgb(171, 205, 239)');
  });

  // Break this catches: dropping the legacy text-colour blocklist — a pre-theme app
  // would render hard #1B1F24 text on a disabled field. The revealed password is the
  // one case where this text is actually readable, so it is asserted revealed too.
  test('[PasswordInput-STYLE-010] a legacy text colour resolves to the theme token, per state', async () => {
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
  test('[PasswordInput-STYLE-011] padding none removes the box padding from the top-aligned height', async () => {
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
});

describe('accessibility', () => {
  // Break this catches: dropping any of the aria attributes — a screen-reader user
  // would not be told the field is required, busy, disabled or hidden.
  test('[PasswordInput-A11Y-001] aria state attributes reflect the widget’s real state', async () => {
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

  // Break this catches: making htmlFor unconditional in Label.jsx (clicking a label on
  // the canvas would steal focus and break copy/paste), or dropping it entirely (a
  // running app's label would no longer reach its field).
  test('[PasswordInput-A11Y-002] the label targets the input in the Viewer, and deliberately not in the editor', async () => {
    harness.render({ properties: { label: binding('Password') }, currentMode: 'view' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).toHaveAttribute('for', 'component-pi1');
    expect(screen.getByLabelText('Password')).toBe(input());

    harness.render({ properties: { label: binding('Password') }, currentMode: 'edit' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).not.toHaveAttribute('for');
  });

  // Break this catches: dropping the aria-label fallback — a fixed-width label that
  // has not been laid out would leave the input with no accessible name.
  test('[PasswordInput-A11Y-003] an unmeasured fixed-width label falls back to an aria-label', async () => {
    harness.render({ properties: { label: binding('Password') }, styles: { auto: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-label', 'Password');

    harness.render({ properties: { label: binding('Password') }, styles: { auto: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).not.toHaveAttribute('aria-label');
  });
});
