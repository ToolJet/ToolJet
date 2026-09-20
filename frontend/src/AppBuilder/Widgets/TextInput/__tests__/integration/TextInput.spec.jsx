/**
 * TextInput widget behaviour — see
 * ee/test/app-builder/widgets/TextInput/TESTING.md for the approved contract.
 */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
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

// No default properties/styles are passed: componentDefinition() seeds the
// widget's own registered `definition` (textinput.js), so every test below
// states only what it varies.
const harness = createWidgetHarness({ componentType: 'TextInput', handle: 'textinput1', id: 'ti1' });

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

// data-cy values RenderWidget hands this widget, and the same hooks the Cypress
// facet specs query (cypress-tests/.../components/textInput/).
const input = () => document.getElementById('component-ti1');
const widgetNode = () => document.querySelector('.canvas-component');
const label = () => document.querySelector('[data-cy="textinput1-label"]');
const fieldBox = () => document.querySelector('[data-cy="textinput1-actionable-section"]');
const errorText = () => document.querySelector('[data-cy="textinput1-invalid-feedback"]');
const leftIcon = () => document.querySelector('[data-cy="textinput1-icon"]');
const clearButton = () => screen.queryByRole('button', { name: 'Clear' });
/** The value a `set-custom-variable` handler wrote, or undefined if it never ran. */
const eventFired = (key = 'seen') => harness.variables()?.[key];
/** How many times a `countInvocationsOn` handler has run. */
const callCount = (key = 'calls') => harness.variables()?.[key] ?? 0;
/**
 * The `style` attribute of a node, lower-cased.
 *
 * Two jsdom quirks make this the only reliable style oracle here, and they are
 * why the assertions below check for the ABSENCE of legacy literals rather than
 * the presence of theme tokens:
 *   1. jsdom drops `var(--token)` values for standard properties (custom
 *      properties like `--cc-placeholder-text` do survive), so a resolved theme
 *      token is simply not in the attribute.
 *   2. jsdom normalises `background-color` to `rgb()` but leaves `border-color`
 *      as the authored hex.
 * Which token a fallback resolves to is browser-owned — the Cypress styles facet
 * asserts real computed colour. See decision D-07.
 */
const inlineStyle = (node) => (node.getAttribute('style') ?? '').toLowerCase();

describe('disabled and loading are independent states', () => {
  // Break this catches: seeding useInput's `disable` state from
  // `disabledState || loadingState` instead of `disabledState`. That seed is
  // captured by the mount-only effect that publishes `isDisabled`, and nothing
  // republishes it when loading clears — so RenderWidget, which PREFERS the
  // exposed `isDisabled` over the resolved property (RenderWidget.jsx:155-159),
  // keeps the widget's `disabled` class (`pointer-events: none; opacity: .5`)
  // on a field the user is supposed to be able to type into.
  test('[TextInput-STATE-005] a field that mounts loading is interactive again once loading clears', async () => {
    harness.render({
      properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    // While loading, the field is legitimately locked.
    expect(input().disabled).toBe(true);

    await harness.act('setLoading', false);
    await waitFor(() => expect(harness.exposed().isLoading).toBe(false));

    // Disable was never turned on, so nothing should report the field disabled.
    expect(harness.exposed().isDisabled).toBe(false);
    expect(input().disabled).toBe(false);
    expect(widgetNode().className).not.toMatch(/\bdisabled\b/);
  });

  test('[TextInput-STATE-005] a field that mounts loading reports isLoading, not isDisabled', async () => {
    harness.render({
      properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().isLoading).toBe(true);
    expect(harness.exposed().isDisabled).toBe(false);
  });

  test('[TextInput-STATE-005] Disable and Loading together still report both', async () => {
    harness.render({
      properties: { loadingState: binding('{{true}}'), disabledState: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().isDisabled).toBe(true);
    expect(harness.exposed().isLoading).toBe(true);
    expect(input().disabled).toBe(true);
  });
});

describe('properties seed what the field renders and publishes', () => {
  // Break this catches: dropping `label` from BaseInput's Label props, or removing
  // the `[label]` effect that republishes it (useInput.js:117-120) — a builder
  // renaming a field would leave `{{components.textinput1.label}}` on the old text.
  test('[TextInput-PROP-001] the configured label labels the field and is published as `label`', async () => {
    harness.render({ properties: { label: binding('Full name') } });
    await waitFor(() => expect(input()).toBeTruthy());

    // Queried by the label's own node, not getByLabelText: the `for` association is
    // viewer-only by design (Label.jsx:44) — see [TextInput-A11Y-002].
    expect(label()).toHaveTextContent('Full name');
    expect(harness.exposed().label).toBe('Full name');

    harness.setComponentProperty('ti1', 'label', 'Legal name', 'properties');
    await waitFor(() => expect(harness.exposed().label).toBe('Legal name'));
    expect(label()).toHaveTextContent('Legal name');
  });

  // Break this catches: passing `placeholder` as the input's `value` instead of its
  // `placeholder` (BaseInput.jsx:274,279) — the field would look pre-filled and
  // publish placeholder text as the user's answer.
  test('[TextInput-PROP-002] the placeholder is rendered as a placeholder, never as the value', async () => {
    harness.render({ properties: { placeholder: binding('e.g. Ada Lovelace'), value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('placeholder', 'e.g. Ada Lovelace');
    expect(input().value).toBe('');
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: removing the `[properties.value]` effect (useInput.js:160-169)
  // or the `value` entry from the mount effect (useInput.js:223) — a field with a
  // configured Default value would render empty, or render but publish nothing.
  test('[TextInput-PROP-003] the Default value seeds both the field and the exposed value at mount', async () => {
    harness.render({ properties: { value: binding('Ada') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('Ada');
    expect(harness.exposed().value).toBe('Ada');
  });

  // Break this catches: gating the `[properties.value]` effect on a "field is
  // untouched" flag (which would strand binding-driven resets), or adding a
  // `fireEvent('onChange')` to `setInputValue` (which would re-run every On change
  // handler on any late-resolving Default value). See decision D-02.
  test('[TextInput-PROP-004] a re-resolved Default value replaces typed text and fires no onChange', async () => {
    harness.render({
      properties: { value: binding('') },
      events: setVariableOn('ti1', 'onChange', { key: 'changed', value: 'YES' }),
    });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), 'typed by user');
    await waitFor(() => expect(harness.exposed().value).toBe('typed by user'));
    expect(eventFired('changed')).toBe('YES');

    // A fresh page/query resolution pushes a new Default value.
    harness.setComponentProperty('ti1', 'value', 'from query', 'properties');
    await waitFor(() => expect(input().value).toBe('from query'));

    expect(harness.exposed().value).toBe('from query');
    // The overwrite is silent: no NEW onChange. Proven by clearing the marker first.
    harness.render({
      properties: { value: binding('seeded') },
      events: setVariableOn('ti1', 'onChange', { key: 'changed2', value: 'YES' }),
    });
    await waitFor(() => expect(input().value).toBe('seeded'));
    harness.setComponentProperty('ti1', 'value', 'replaced', 'properties');
    await waitFor(() => expect(input().value).toBe('replaced'));
    expect(eventFired('changed2')).toBeUndefined();
  });

  // Break this catches: moving `defaultValue: 'Default value'` inside the `value`
  // schema (textinput.js:38-43), which would make a broken binding render the words
  // "Default value" in the field instead of leaving it empty. See decision D-04.
  test('[TextInput-PROP-005] a number Default value renders as a string; an unconvertible one renders empty', async () => {
    harness.render({ properties: { value: binding('{{42}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('42');

    harness.render({ properties: { value: binding('{{ ({ id: 1 }) }}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('');
    expect(input().value).not.toBe('Default value');
  });
});

describe('events reach the builder’s handlers', () => {
  // Break this catches: moving `fireEvent('onChange')` out of `handleChange`
  // (useInput.js:303-306), or firing it twice per keystroke — the count, not a
  // truthy marker, is what makes the double-fire visible.
  test('[TextInput-EVT-001] typing fires onChange once per keystroke and republishes the value', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ti1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(callCount()).toBe(0);

    await userEvent.type(input(), 'abc');

    await waitFor(() => expect(callCount()).toBe(3));
    expect(harness.exposed().value).toBe('abc');
  });

  // Break this catches: dropping the `e.key === 'Enter'` guard in `handleKeyUp`
  // (useInput.js:323-328), which would fire onEnterPressed on every key.
  test('[TextInput-EVT-002] Enter fires onEnterPressed once, with the value already published', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ti1', 'onEnterPressed') });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), 'ab');
    expect(callCount()).toBe(0); // plain characters must not trigger it

    await userEvent.type(input(), '{enter}');

    await waitFor(() => expect(callCount()).toBe(1));
    expect(harness.exposed().value).toBe('ab');
  });

  // Break this catches: removing the `setTimeout(0)` deferral in `handleFocus`
  // would NOT break this (see decision D-06) — what breaks it is dropping
  // `fireEvent('onFocus')` entirely, or the `stopPropagation` swallowing it.
  test('[TextInput-EVT-003] focusing the field fires onFocus once', async () => {
    harness.render({ events: countInvocationsOn('ti1', 'onFocus') });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    // The dispatch is deferred through setTimeout(0) — drain it rather than
    // asserting synchronously. Order relative to onBlur is deliberately unpinned.
    await drain();

    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: removing `setShowValidationError(true)` from `handleBlur`
  // (useInput.js:308-313) — the user would leave an invalid field and never be told.
  test('[TextInput-EVT-004] blurring fires onBlur once and reveals a pending validation message', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, events: countInvocationsOn('ti1', 'onBlur') });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(input());

    await waitFor(() => expect(callCount()).toBe(1));
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });
});

describe('component-specific actions', () => {
  // Break this catches: dropping `fireEvent('onChange')` from the `setText` handle
  // (useInput.js:242-247) — a query-driven write would update bound components but
  // silently skip the builder's On change handler.
  test('[TextInput-CSA-001] setText writes the value, publishes it, and fires onChange once', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ti1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setText', 'from a query');

    expect(input().value).toBe('from a query');
    expect(harness.exposed().value).toBe('from a query');
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: removing `setShowValidationError(true)` from `setText`.
  // This is the ONE deliberate exception to the blur rule — see decision D-05.
  test('[TextInput-CSA-002] setText reveals a validation message on a field the user never touched', async () => {
    harness.render({ properties: { value: binding('Ada') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    await harness.act('setText', '');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: adding `setShowValidationError(true)` to `clearValue`
  // (useInput.js:296-301), which would make Form clearForm paint an untouched form
  // red; or adding `setShowValidationError(false)`, which would hide an error the
  // user has already been shown. See decision D-05.
  test('[TextInput-CSA-003] clear empties the field and fires onChange without changing message visibility', async () => {
    // Untouched field: stays quiet after clearing.
    harness.render({
      properties: { value: binding('Ada') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('ti1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('clear');

    expect(input().value).toBe('');
    expect(harness.exposed().value).toBe('');
    await waitFor(() => expect(callCount()).toBe(1));
    expect(errorText()).toBeNull();

    // Already-blurred field: keeps showing its error over the now-empty box.
    harness.render({ properties: { value: binding('Ada') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    fireEvent.blur(input());
    await drain();

    await harness.act('clear');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: pointing `setFocus` at the wrong ref (useInput.js:203-205)
  // — a builder's "focus the first field" flow would silently no-op.
  test('[TextInput-CSA-004] setFocus puts DOM focus in the field', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.activeElement).not.toBe(input());

    await harness.act('setFocus');

    expect(document.activeElement).toBe(input());
  });

  // Break this catches: `setBlur` calling something other than the input's blur
  // (useInput.js:206-208) — focus would stay trapped in the field.
  test('[TextInput-CSA-005] setBlur removes DOM focus and runs the blur path', async () => {
    harness.render({ events: countInvocationsOn('ti1', 'onBlur') });
    await waitFor(() => expect(input()).toBeTruthy());
    input().focus();
    expect(document.activeElement).toBe(input());

    await harness.act('setBlur');

    expect(document.activeElement).not.toBe(input());
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: dropping the `setExposedVariable('isVisible', ...)` write
  // that f0b76b5c61 added (useInput.js:209-212) — the widget would hide while
  // `{{components.textinput1.isVisible}}` still read true.
  test('[TextInput-CSA-006] setVisibility hides the field and republishes isVisible', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);

    await harness.act('setVisibility', false);

    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));
    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);

    // A truthy non-boolean is coerced, not stored raw.
    await harness.act('setVisibility', 'yes');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(true));
  });

  // Break this catches: dropping the paired `setExposedVariable('isDisabled', ...)`
  // (useInput.js:213-216) — the same drift class as [TextInput-STATE-005].
  test('[TextInput-CSA-007] setDisable disables the field and republishes isDisabled', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().disabled).toBe(false);

    await harness.act('setDisable', true);

    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    expect(input().disabled).toBe(true);

    await harness.act('setDisable', 0);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(input().disabled).toBe(false);
  });

  // Break this catches: dropping the paired `setExposedVariable('isLoading', ...)`
  // (useInput.js:217-220), or rendering the loader without disabling the input.
  test('[TextInput-CSA-008] setLoading shows the loader, blocks input, and republishes isLoading', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.querySelector('.tj-widget-loader')).toBeNull();

    await harness.act('setLoading', true);

    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
  });

  // Break this catches: removing the `inputType === 'TextInput'` branch that
  // f8dcbee6fb restored (useInput.js:230-234). TextInput is the ONLY input widget
  // that publishes this handle, and saved apps still wire it.
  test('[TextInput-CSA-009] the deprecated disable action still disables the field', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('disable', true);

    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    expect(input().disabled).toBe(true);
  });

  // Break this catches: the same branch for the visibility half (useInput.js:235-238).
  test('[TextInput-CSA-010] the deprecated visibility action still hides the field', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('visibility', false);

    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));
    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);
  });

  // Break this catches: removing the `setDisable(disabledState)` write from the
  // `[disabledState]` effect (useInput.js:123) — a property change could no longer
  // correct a CSA-set state, so a stale CSA would outlive every rebind.
  //
  // Verified by fault injection: the STICKY half has no faultable line of its own.
  // It falls out of React's dependency comparison on the effect, so a
  // same-value re-resolve simply never re-runs it. The assertion is kept because
  // it pins the observable contract, not because a single edit can break it.
  test('[TextInput-CSA-011] a CSA state is sticky until the matching property actually changes', async () => {
    harness.render({ properties: { value: binding('seed'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setText', 'set by CSA');
    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    // Re-resolving a property to the SAME value must not revert the CSA.
    harness.setComponentProperty('ti1', 'disabledState', '{{false}}', 'properties');
    await drain();
    expect(harness.exposed().isDisabled).toBe(true);
    expect(input().value).toBe('set by CSA');

    // A real change to the property wins and republishes.
    harness.setComponentProperty('ti1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    harness.setComponentProperty('ti1', 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(input().disabled).toBe(false);

    harness.setComponentProperty('ti1', 'value', 'set by property', 'properties');
    await waitFor(() => expect(input().value).toBe('set by property'));
  });
});

describe('disabled, loading and visibility states', () => {
  // Break this catches: removing the `disabled` attribute 4f159069c7 added
  // (BaseInput.jsx:283) — the field would look disabled but still accept typing
  // and stay in the tab order.
  test('[TextInput-STATE-001] disabledState renders a disabled input that rejects typing', async () => {
    harness.render({ properties: { value: binding('locked'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().disabled).toBe(true);
    await userEvent.type(input(), 'more');

    expect(input().value).toBe('locked');
    expect(harness.exposed().value).toBe('locked');
  });

  // Break this catches: rendering the loader without folding `loading` into the
  // input's disabled state (BaseInput.jsx:283,292) — a user could edit a field
  // whose value is about to be replaced by the query that is still loading.
  test('[TextInput-STATE-002] loadingState renders the loader and blocks input', async () => {
    harness.render({ properties: { value: binding('x'), loadingState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute('aria-busy', 'true');
  });

  // Break this catches: dropping `visibility` from the error block's guard
  // (BaseInput.jsx:296) — a hidden mandatory field would render its error text
  // into the layout while the field itself is invisible.
  test('[TextInput-STATE-003] visibility false hides the field and suppresses its validation message', async () => {
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

  // Break this catches: removing any of the property effects at
  // useInput.js:128-138 — a rebound Visibility/Loading toggle would change the DOM
  // while the exposed variable other components read stayed stale.
  test('[TextInput-STATE-004] isVisible and isLoading track their properties on change', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);
    expect(harness.exposed().isLoading).toBe(false);

    harness.setComponentProperty('ti1', 'visibility', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));

    harness.setComponentProperty('ti1', 'loadingState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(input().disabled).toBe(true);
  });
});

describe('validation', () => {
  // Break this catches: dropping `aria-required` (BaseInput.jsx:286) or the
  // `isMandatory` republish (useInput.js:140-143) — a required field would not
  // announce itself, and `{{...isMandatory}}` would go stale.
  test('[TextInput-VAL-001] mandatory marks the input required and publishes isMandatory', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('aria-required', 'true');
    expect(harness.exposed().isMandatory).toBe(true);
    expect(label()).toHaveTextContent('*'); // the mandatory marker
  });

  // Break this catches: making `useShowValidationOnFormSubmit` reveal
  // unconditionally (FormSignalContext.tsx:13, `setVisible(submitAttemptCount > 0)`)
  // — every mandatory field in the app would load pre-accused.
  //
  // Verified by fault injection: `useState(false)` at useInput.js:69 is NOT
  // load-bearing. That hook writes the flag on mount regardless, so flipping the
  // seed to `true` changes nothing observable.
  test('[TextInput-VAL-002] the message is hidden until the user leaves the field', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(errorText()).toBeNull();
    expect(harness.exposed().isValid).toBe(false); // invalid all along, just not shown

    fireEvent.blur(input());
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));

    // A valid field that has been blurred renders the container with no text in it.
    harness.render({ properties: { value: binding('Ada') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    fireEvent.blur(input());
    await waitFor(() => expect(errorText()).toBeTruthy());
    expect(errorText()).toHaveTextContent('');
  });

  // Break this catches: reverting 6713df59a2 — `setInputValue` reading the
  // `validate` prop directly instead of `validateRef.current` (useInput.js:49-50,257)
  // means a value written after a rule edit is judged by the OLD rule.
  test('[TextInput-VAL-004] editing a rule re-validates the current value with no keystroke', async () => {
    harness.render({ properties: { value: binding('ab') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);

    harness.setComponentProperty('ti1', 'minLength', '5', 'validation');

    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    // And a value written AFTER the rule change is judged by the new rule.
    await harness.act('setText', 'abc');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
    await harness.act('setText', 'abcdef');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));
  });

  // Break this catches: dropping any `setExposedVariable('isValid', ...)` call from
  // the value-writing paths (useInput.js:259,293) — an app gating submit on
  // `{{...isValid}}` would act on a stale verdict.
  test('[TextInput-VAL-005] isValid is published and tracks every value write', async () => {
    harness.render({ properties: { value: binding('') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    await userEvent.type(input(), 'Ada');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await harness.act('clear');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    await harness.act('setText', 'Grace');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));
  });

  // Break this catches: dropping `aria-invalid` or the `is-invalid` class
  // (BaseInput.jsx:271,288) — the field would show a message with nothing marking
  // the control itself as invalid.
  test('[TextInput-VAL-006] a revealed invalid field is marked invalid on the control', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-invalid', 'false');

    fireEvent.blur(input());

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'true'));
    expect(input().className).toMatch(/\bis-invalid\b/);
  });
});

describe('the clear button', () => {
  // Break this catches: dropping the `hasValue` gate (BaseInput.jsx:87-88) — an
  // empty field would show a clear affordance with nothing to clear.
  test('[TextInput-CLR-001] the clear button appears only when enabled and the field has a value', async () => {
    harness.render({ properties: { value: binding('Ada'), showClearBtn: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    harness.render({ properties: { value: binding(''), showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    harness.render({ properties: { value: binding('Ada'), showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeTruthy();
  });

  // Break this catches: dropping `!disable` or `!loading` from `shouldShowClearBtn`
  // (BaseInput.jsx:88) — a user could clear a field they are not allowed to edit.
  test('[TextInput-CLR-002] the clear button is suppressed while disabled or loading', async () => {
    harness.render({
      properties: { value: binding('Ada'), showClearBtn: binding('{{true}}'), disabledState: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    harness.render({
      properties: { value: binding('Ada'), showClearBtn: binding('{{true}}'), loadingState: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();
  });

  // Break this catches: removing the `onMouseDown` preventDefault
  // (BaseInput.jsx:145-148) — clicking clear would blur the field, which reveals a
  // validation error mid-edit; or dropping `fireEvent('onChange')` from
  // TextInput's own handleClear (TextInput.jsx:12-15).
  test('[TextInput-CLR-003] clicking clear empties the field, fires onChange, and keeps focus', async () => {
    harness.render({
      properties: { value: binding('Ada'), showClearBtn: binding('{{true}}') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('ti1', 'onChange'),
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

  // Break this catches: reverting cd96d19519 — without the FormSignalContext
  // subscription (useInput.js:70) a user could press Submit on a form full of
  // empty required fields and be shown nothing.
  test('[TextInput-FORM-001] submitting the Form reveals the child’s message without a blur', async () => {
    harness.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    await formAct('submitForm');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: reverting 36034d81e1 — dropping `useFormClear(clearValue)`
  // (useInput.js:330) leaves the Form's clearForm action unable to empty its fields.
  test('[TextInput-FORM-002] the Form clearForm action empties the child field', async () => {
    harness.renderInsideForm({ properties: { value: binding('Ada') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('Ada');

    await formAct('clearForm');

    await waitFor(() => expect(input().value).toBe(''));
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: dropping the `children` map from the Form's exposed
  // variables (Form.jsx:372 — the branch taken once the form HAS children; the
  // empty-form branch at Form.jsx:332 is not the one that matters here).
  // `eventsSlice.js:927-935` looks a child's action up in that map by name, so
  // every Control Component action targeting a field inside a Form would break.
  test('[TextInput-FORM-003] the child’s actions are reachable through the Form’s children map', async () => {
    harness.renderInsideForm({ properties: { value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await waitFor(() => expect(formExposed()?.children?.textinput1?.setText).toBeInstanceOf(Function));
    await harness.session.store.act(async () => {
      await formExposed().children.textinput1.setText('via the form');
    });

    await waitFor(() => expect(input().value).toBe('via the form'));
  });
});

describe('styles reach the rendered field', () => {
  // Break this catches: dropping either guard in the label-size helpers
  // (useInput.js:20-28) — a cleared or fx-broken Size field would collapse the
  // label to 0px, or make the top-aligned height calculation NaN.
  test('[TextInput-STYLE-001] labelFontSize drives the label size and falls back to 12px', async () => {
    expect(getLabelFontSize(18)).toBe('18px');
    expect(getLabelFontSize('18')).toBe('18px');
    // Non-positive and non-numeric both fall back rather than collapsing.
    expect(getLabelFontSize(0)).toBe('12px');
    expect(getLabelFontSize(-4)).toBe('12px');
    expect(getLabelFontSize(undefined)).toBe('12px');
    expect(getLabelFontSize('abc')).toBe('12px');
    expect(getLabelFontSize(0, 14)).toBe('14px');

    // getLabelHeight reserves the same size plus the 8px the label box adds.
    expect(getLabelHeight(18)).toBe(26);
    expect(getLabelHeight('abc')).toBe(20);

    harness.render({ styles: { labelFontSize: binding('{{20}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(label())).toContain('font-size: 20px');
  });

  // Break this catches: widening the `width` branch in
  // getWidthTypeOfComponentStyles (useInput.js:8-13) — a top-aligned or auto-width
  // label would start stealing width from the field.
  test('[TextInput-STYLE-002] the field width is derived from widthType, auto and alignment together', () => {
    // Only a fixed, of-the-component, side label leaves the field the remainder.
    expect(getWidthTypeOfComponentStyles('ofComponent', 33, false, 'side')).toEqual({ width: '67%', minWidth: '20%' });
    // Any one of the three flipped gives the field the full width.
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

  // Break this catches: dropping the `ofField` scaling (useInput.js:15-18), which
  // would silently re-proportion every label in an app saved on the deprecated
  // width type; or losing the deprecation flag the inspector reads.
  test('[TextInput-STYLE-003] a deprecated ofField width is scaled to 70% of the configured value', () => {
    expect(getLabelWidthOfInput('ofComponent', 40)).toBe(40);
    expect(getLabelWidthOfInput('ofField', 40)).toBe(28); // 40 * 70%
    expect(checkIfInputWidgetTypeIsDeprecated('ofField')).toBe(true);
    expect(checkIfInputWidgetTypeIsDeprecated('ofComponent')).toBe(false);
  });

  // Break this catches: reverting 139baef2ec — dropping the `label?.length` tests
  // from the layout branches (BaseInput.jsx:167-181,239-245) makes a top-aligned
  // field with an empty label reserve label space it does not need.
  test('[TextInput-STYLE-004] alignment and direction reposition the label around the field', async () => {
    const wrapper = () => fieldBox().closest('.text-input');

    harness.render({ styles: { alignment: binding('top') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(wrapper().className).toMatch(/\bflex-column\b/);

    harness.render({ styles: { alignment: binding('side'), direction: binding('right') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(wrapper().className).toMatch(/\bflex-row-reverse\b/);

    // An empty label must not trigger the stacked layout.
    harness.render({ properties: { label: binding('') }, styles: { alignment: binding('top') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(wrapper().className).not.toMatch(/\bflex-column\b/);
    expect(inlineStyle(fieldBox())).not.toContain('height: calc');
  });

  // Break this catches: dropping a legacy sentinel comparison
  // (BaseInput.jsx:229-236) — a pre-custom-theme app whose background is still
  // literally `#fff` would render that flat white instead of the theme surface.
  // See decision D-07.
  test('[TextInput-STYLE-005] radius, background, border and shadow reach the field, with legacy fallbacks', async () => {
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
    expect(configured).toContain('rgb(18, 52, 86)'); // #123456, normalised by jsdom
    expect(configured).toContain('#654321'); // border-color keeps its authored hex
    expect(configured).toContain('box-shadow: 2px 4px 6px 0px');

    // Legacy literals must never reach the DOM: they resolve to a theme token,
    // which jsdom omits — so the oracle is that the literal is gone.
    harness.render({ styles: { backgroundColor: binding('#fff'), borderColor: binding('#CCD1D5') } });
    await waitFor(() => expect(input()).toBeTruthy());
    const legacy = inlineStyle(fieldBox());
    expect(legacy).not.toContain('#fff');
    expect(legacy).not.toContain('rgb(255, 255, 255)');
    expect(legacy).not.toContain('#ccd1d5');
  });

  // Break this catches: rendering the icon unconditionally, or reading a key other
  // than `iconVisibility` for the gate (BaseInput.jsx:76,249) — every TextInput
  // would grow an unwanted left icon. See decision D-03.
  test('[TextInput-STYLE-006] the left icon renders only when iconVisibility is on', async () => {
    harness.render({ styles: { iconVisibility: { value: false }, icon: binding('IconHome2') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(leftIcon()).toBeNull();

    harness.render({ styles: { iconVisibility: { value: true }, icon: binding('IconSearch') } });
    await waitFor(() => expect(leftIcon()).toBeTruthy());
  });

  // Break this catches: dropping the placeholder-colour override
  // (BaseInput.jsx:110) or the icon-colour takeover (BaseInput.jsx:93-100) — a
  // customised placeholder colour would leave the icon on the default grey.
  test('[TextInput-STYLE-007] a custom placeholder colour also drives the icon while the icon colour is default', async () => {
    harness.render({
      styles: {
        placeholderTextColor: binding('#ff0000'),
        iconColor: binding('var(--cc-default-icon)'),
        iconVisibility: { value: true },
        icon: binding('IconHome2'),
      },
    });
    await waitFor(() => expect(leftIcon()).toBeTruthy());
    expect(inlineStyle(input())).toContain('--cc-placeholder-text: #ff0000');
    expect(inlineStyle(leftIcon())).toContain('rgb(255, 0, 0)');

    // An explicitly chosen icon colour wins over the placeholder colour.
    harness.render({
      styles: {
        placeholderTextColor: binding('#ff0000'),
        iconColor: binding('#00ff00'),
        iconVisibility: { value: true },
        icon: binding('IconHome2'),
      },
    });
    await waitFor(() => expect(leftIcon()).toBeTruthy());
    expect(inlineStyle(leftIcon())).toContain('rgb(0, 255, 0)');
  });

  // Break this catches: dropping the `isFocused` branch from the border resolution
  // (BaseInput.jsx:219-223) — the field would give no visual focus feedback.
  test('[TextInput-STYLE-008] focusing the field swaps its border to the accent colour', async () => {
    harness.render({ styles: { accentColor: binding('#ff00ff'), borderColor: binding('#123456') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('#123456');

    fireEvent.focus(input());

    await waitFor(() => expect(inlineStyle(fieldBox())).toContain('#ff00ff'));
  });

  // Break this catches: dropping `errTextColor` from the message's inline style
  // (BaseInput.jsx:300), or gating the message on something other than
  // `showValidationError && visibility`.
  //
  // Scope note: the FIELD BORDER's error-beats-focus precedence
  // (BaseInput.jsx:216-227) is deliberately NOT asserted here. jsdom rejects a
  // `var()` assignment on a standard property and silently keeps the previous
  // value, so React setting `border-color: var(--cc-error-systemStatus)` leaves
  // the attribute reading the OLD colour — the precedence chain is unobservable
  // at this layer. It is owned by [TextInput-BRW-005].
  test('[TextInput-STYLE-009] a revealed invalid field colours its message with errTextColor', async () => {
    harness.render({
      validation: { mandatory: binding('{{true}}') },
      styles: { errTextColor: binding('#abcdef') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
    expect(inlineStyle(errorText())).toContain('rgb(171, 205, 239)'); // #abcdef
    // The control itself is marked invalid — see [TextInput-VAL-006] for that pair.
    expect(input().className).toMatch(/\bis-invalid\b/);
  });

  // Break this catches: dropping the legacy text-colour blocklist
  // (BaseInput.jsx:102-107) — a pre-theme app would render hard #1B1F24 text on a
  // disabled field instead of the theme's disabled token. See decision D-07.
  test('[TextInput-STYLE-010] a legacy text colour resolves to the theme token, per state', async () => {
    // A legacy literal is swapped for a theme token in both states. jsdom omits
    // the token, so the oracle is that the literal never reaches the DOM; WHICH
    // token each state resolves to is browser-owned (D-07).
    for (const disabled of ['{{false}}', '{{true}}']) {
      harness.render({ styles: { textColor: binding('#1B1F24') }, properties: { disabledState: binding(disabled) } });
      await waitFor(() => expect(input()).toBeTruthy());
      expect(inlineStyle(input())).not.toContain('#1b1f24');
      expect(inlineStyle(input())).not.toContain('rgb(27, 31, 36)');
    }

    // A builder-chosen colour is always honoured, disabled or not.
    for (const disabled of ['{{false}}', '{{true}}']) {
      harness.render({ styles: { textColor: binding('#ff0000') }, properties: { disabledState: binding(disabled) } });
      await waitFor(() => expect(input()).toBeTruthy());
      expect(inlineStyle(input())).toContain('rgb(255, 0, 0)');
    }
  });

  // Break this catches: dropping the BOX_PADDING term from the top-alignment height
  // (BaseInput.jsx:239-245) — a top-aligned field would overflow its widget box by
  // the canvas padding.
  test('[TextInput-STYLE-011] padding none removes the box padding from the top-aligned height', async () => {
    harness.render({
      styles: { alignment: binding('top'), padding: binding('default'), labelFontSize: binding('{{12}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('calc(100% - 20px - 4px)'); // 12+8 label, 2*2 padding

    harness.render({
      styles: { alignment: binding('top'), padding: binding('none'), labelFontSize: binding('{{12}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('calc(100% - 20px - 0px)');
  });
});

describe('accessibility', () => {
  // Break this catches: dropping any of the aria attributes 47f77e84ca and
  // f29f53034c added (BaseInput.jsx:284-289) — a screen-reader user would not be
  // told the field is required, busy, disabled or invalid.
  test('[TextInput-A11Y-001] aria state attributes reflect the widget’s real state', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-disabled', 'false');
    expect(input()).toHaveAttribute('aria-busy', 'false');
    expect(input()).toHaveAttribute('aria-required', 'false');
    expect(input()).toHaveAttribute('aria-hidden', 'false');
    expect(input()).toHaveAttribute('aria-invalid', 'false');

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

  // Break this catches: making `htmlFor` unconditional in Label.jsx:44 (clicking a
  // label on the canvas would steal focus and break copy/paste), or dropping it
  // entirely (a running app's label would no longer reach its field).
  test('[TextInput-A11Y-002] the label targets the input in the Viewer, and deliberately not in the editor', async () => {
    harness.render({ properties: { label: binding('Full name') }, currentMode: 'view' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).toHaveAttribute('for', 'component-ti1');
    expect(screen.getByLabelText('Full name')).toBe(input());

    harness.render({ properties: { label: binding('Full name') }, currentMode: 'edit' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).not.toHaveAttribute('for');
  });

  // Break this catches: dropping the `aria-label` fallback (BaseInput.jsx:289) —
  // a fixed-width label that has not been laid out would leave the input with no
  // accessible name at all.
  test('[TextInput-A11Y-003] an unmeasured fixed-width label falls back to an aria-label', async () => {
    harness.render({ properties: { label: binding('Full name') }, styles: { auto: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-label', 'Full name');

    // With an auto-width label the visible label is the accessible name, so no
    // duplicate aria-label is added.
    harness.render({ properties: { label: binding('Full name') }, styles: { auto: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).not.toHaveAttribute('aria-label');
  });
});

describe('async lifecycle and instance isolation', () => {
  // Break this catches: dropping the deferred dispatch, or letting the synchronous
  // blur cancel a focus that has not drained yet — a builder wiring both handlers
  // would silently lose On focus whenever the user tabbed straight through.
  test('[TextInput-ASYNC-001] a fast focus-then-blur delivers both handlers', async () => {
    harness.render({
      events: [
        ...countInvocationsOn('ti1', 'onFocus', { key: 'focusCalls' }),
        ...countInvocationsOn('ti1', 'onBlur', { key: 'blurCalls' }),
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

  // Break this catches: hoisting useInput's value state out of the component so
  // every instance shares it — two Text Inputs on a page would type into each
  // other. The published variable is asserted alongside the rendered field
  // because the two can diverge: shared render state still leaves each id's
  // exposed `value` looking untouched.
  test('[TextInput-TYPE-001] two Text Inputs stay independent', async () => {
    // The sibling is BOTH seeded (extraComponents) and rendered (also): `also`
    // alone mounts a RenderWidget for an id the store has never heard of, which
    // renders nothing and would make every assertion below vacuous.
    harness.render({
      properties: { value: binding('first') },
      extraComponents: {
        ti2: componentDefinition('ti2', 'textinput2', 'TextInput', { value: binding('second') }),
      },
      also: [{ id: 'ti2', componentType: 'TextInput' }],
    });
    await waitFor(() => expect(document.querySelectorAll('input')).toHaveLength(2));

    await harness.act('setText', 'changed');

    expect([...document.querySelectorAll('input')].map((i) => i.value)).toEqual(['changed', 'second']);
    expect(harness.exposed('ti1').value).toBe('changed');
    expect(harness.exposed('ti2').value).toBe('second');
  });
});
