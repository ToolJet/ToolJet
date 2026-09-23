/**
 * PhoneInput widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/PhoneInput/TESTING.md
 * Every test title starts with its approved scenario ID; the `// Break this catches:`
 * comment names the production edit its oracle is meant to catch.
 *
 * Three things are specific to this widget:
 *   1. It does NOT render through BaseInput. It owns its whole DOM, so every styling
 *      and state guarantee here is re-derived rather than cited from a sibling (D-01).
 *   2. The rendered field shows the NATIONAL number while the store holds E.164
 *      including the dial code; `countryCode` is published separately (D-02).
 *   3. Validation is judged against the number WITHOUT its dial code.
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
import useStore from '@/AppBuilder/_stores/store';
import {
  getLabelFontSize,
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
  checkIfInputWidgetTypeIsDeprecated,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';

const harness = createWidgetHarness({ componentType: 'PhoneInput', handle: 'phoneinput1', id: 'ph1' });

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

// data-cy hooks RenderWidget and PhoneInput hand this widget.
const input = () => document.getElementById('component-ph1');
const label = () => document.querySelector('[data-cy="phoneinput1-label"]');
const fieldBox = () => document.querySelector('[data-cy="phoneinput1-actionable-section"]');
const countrySelect = () => document.querySelector('[data-cy="phoneinput1-country-select-dropdown"]');
const errorText = () => document.querySelector('[data-cy="phoneinput1-invalid-feedback"]');
const clearButton = () => screen.queryByRole('button', { name: 'Clear' });
const callCount = (key = 'calls') => harness.variables()?.[key] ?? 0;
/**
 * The country select is `react-select`, which styles through emotion-generated CLASSES
 * rather than inline styles, so its colours are not on the element. Emotion injects the
 * rules into `document.styleSheets`, and the control's generated class changes whenever
 * the resolved style object does; this reads the rule text back for that class.
 */
const selectControlCss = () => {
  const generated = [...document.querySelector('.country-ph1__control').classList].find((c) => c.startsWith('css-'));
  let css = '';
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of rules || []) if (rule.cssText?.includes(`.${generated}`)) css += rule.cssText;
  }
  return css;
};
const inlineStyle = (node) => (node.getAttribute('style') ?? '').toLowerCase();
/**
 * MOUNT-GATED STATE: `harness.render()` re-renders the SAME mounted tree, and the store is
 * a module singleton, so tearing the session down mid-test does not help either. Anything
 * gated on mount keeps its first value: useInput's `useState(properties.defaultCountry ||
 * 'US')` country seed, and PhoneInput's `isInitialRender` publish of
 * country/countryCode/formattedValue. A scenario that needs a second, differently-seeded
 * MOUNT therefore gets a second `test()` under the same scenario ID, so `beforeEach` gives
 * it a fresh one. Asserting both cases in one test silently re-reads the first mount.
 */

describe('default value and identity', () => {
  // Break this catches: publishing the national number instead of E.164, or rendering
  // the raw stored value instead of letting the library format it. D-02 pinned this
  // split: the field shows national, the store holds the dial code, and countryCode
  // is published separately so an app can compose the two.
  test('[PhoneInput-PROP-003] the Default value seeds the field and the exposed value at mount', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('987 654 3210'); // national, as the library formats it
    expect(harness.exposed().value).toBe('+19876543210'); // E.164, dial code included
    expect(harness.exposed().countryCode).toBe('+1');
  });

  // Break this catches: reverting the shared toE164 normaliser (D-03). Before it, the
  // three write paths each normalised differently and the Default value path did not
  // normalise at all — it concatenated the dial code onto whatever the builder typed,
  // handing the phone library a value it rejects.
  //
  // The rule deliberately strips ONLY the selected country's own dial code, and only
  // from an explicitly international value. Bare digits are always a national number,
  // and a value carrying some other country's code is applied as typed rather than
  // guessed at — that mismatch is the builder's to resolve, not ours.
  test('[PhoneInput-PROP-006] a formatted or international Default value is normalised onto the active country', async () => {
    // Formatting is stripped. This is the example printed in phone-input.md.
    harness.render({ properties: { value: binding('(999) 999-9999') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('+19999999999');

    // The selected country's own code is recognised and not doubled.
    harness.render({ properties: { value: binding('+19876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('+19876543210');
    expect(harness.exposed().value).not.toContain('+1+');

    // BARE digits are a national number and keep every digit, even when they happen to
    // begin with the selected country's dial code. The old code ate them.
    harness.render({ properties: { value: binding('1234567890') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('+11234567890');

    // A DIFFERENT country's code is left in place and the selected country applied on
    // top: we do not silently re-interpret an Indian number as a US one.
    harness.render({ properties: { value: binding('+919876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('+1919876543210');
    expect(harness.exposed().value).not.toContain('+1+');

    // An empty Default value publishes empty, not a bare dial code.
    harness.render({ properties: { value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('');
  });
});

describe('country', () => {
  // Break this catches: dropping either half of the re-basing rule — stripping the old
  // dial code or prepending the new one. Losing the strip turns a US number into a US
  // number nested inside an Indian one; losing the prepend leaves the old country's
  // code on a value the library is told belongs to the new one.
  test('[PhoneInput-CTY-005] changing country re-bases the number and republishes the country variables', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('+19876543210');

    await harness.act('setCountryCode', 'IN');
    await drain();

    expect(harness.exposed().country).toBe('IN');
    expect(harness.exposed().countryCode).toBe('+91');
    expect(harness.exposed().value).toBe('+919876543210'); // national digits preserved
    expect(harness.exposed().formattedValue).toContain('+91');

    // An empty field must stay empty rather than becoming a bare dial code, which is
    // what the clear button's emptiness rule also depends on.
    harness.render({ properties: { value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());
    await harness.act('setCountryCode', 'IN');
    await drain();
    expect(harness.exposed().value).toBe('');
    expect(input().value).toBe('');
  });
});

describe('events', () => {
  // Break this catches: moving fireEvent('onChange') out of onInputValueChange, or
  // firing it twice per keystroke.
  test('[PhoneInput-EVT-001] typing fires onChange once per keystroke and republishes the value', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ph1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), '987');

    await waitFor(() => expect(callCount()).toBe(3));
    expect(harness.exposed().value).toBe('+1987');
  });
});

describe('component-specific actions', () => {
  // Break this catches: dropping fireEvent('onChange') from the setValue handle, or
  // publishing the national number instead of the E.164 value.
  test('[PhoneInput-CSA-001] setValue writes the national number, publishes E.164, and fires onChange once', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ph1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setValue', '9998887777');
    await drain();

    expect(harness.exposed().value).toBe('+19998887777');
    expect(input().value).toBe('999 888 7777');
    await waitFor(() => expect(callCount()).toBe(1));
  });
});

describe('disabled, loading and visibility', () => {
  // Break this catches: gating only the input on the disabled state and leaving the
  // country select operable — a disabled Phone Input would still let a user change
  // the country, which rewrites the value.
  test('[PhoneInput-STATE-001] disabledState disables both the input and the country dropdown', async () => {
    harness.render({ properties: { value: binding('9876543210'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute('aria-disabled', 'true');
    await userEvent.type(input(), '5');
    expect(harness.exposed().value).toBe('+19876543210'); // unchanged

    // The select collapses to its narrow, indicator-less form when it cannot be used.
    expect(countrySelect().querySelectorAll('svg')).toHaveLength(1);
  });
});

describe('validation', () => {
  // Break this catches: validating the raw E.164 value instead of stripping the dial
  // code first. A "Min length 10" rule would then count the +1 too, so a correct
  // ten-digit number would be judged as twelve characters and silently pass a rule
  // the builder meant to enforce on the national number.
  test('[PhoneInput-VAL-002] rules are judged against the number without its dial code', async () => {
    harness.render({ properties: { value: binding('9876543210') }, validation: { minLength: binding('10') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('+19876543210'); // twelve characters
    expect(harness.exposed().isValid).toBe(true); // judged as ten

    // Nine national digits must fail the same rule.
    harness.render({ properties: { value: binding('987654321') }, validation: { minLength: binding('10') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    // A field holding only its dial code is empty as far as mandatory is concerned.
    harness.render({ properties: { value: binding('') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);
    fireEvent.blur(input());
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });
});

describe('label, placeholder and property changes', () => {
  // Break this catches: dropping the [label] republish — a builder renaming a field
  // would leave {{...label}} on the old text.
  test('[PhoneInput-PROP-001] the configured label labels the field and is published as `label`', async () => {
    harness.render({ properties: { label: binding('Contact Number') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(label()).toHaveTextContent('Contact Number');
    expect(harness.exposed().label).toBe('Contact Number');

    harness.setComponentProperty('ph1', 'label', 'Mobile', 'properties');
    await waitFor(() => expect(harness.exposed().label).toBe('Mobile'));
    expect(label()).toHaveTextContent('Mobile');
  });

  // Break this catches: passing `placeholder` as the value instead of the placeholder.
  test('[PhoneInput-PROP-002] the placeholder renders as a placeholder, never as the value', async () => {
    harness.render({ properties: { placeholder: binding('Enter your contact number'), value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('placeholder', 'Enter your contact number');
    expect(input().value).toBe('');
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: gating the [properties.value] effect on a "field is untouched"
  // flag, or adding fireEvent('onChange') to it — a late-resolving query would re-run
  // every On change handler.
  test('[PhoneInput-PROP-004] a re-resolved Default value replaces typed text and fires no onChange', async () => {
    harness.render({
      properties: { value: binding('9876543210') },
      events: countInvocationsOn('ph1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(callCount()).toBe(0);

    harness.setComponentProperty('ph1', 'value', '5551234567', 'properties');

    await waitFor(() => expect(harness.exposed().value).toBe('+15551234567'));
    // The library formats on its own render pass, so the field lands a tick after the
    // store does; asserting it synchronously here is flaky.
    await waitFor(() => expect(input().value).toBe('555 123 4567'));
    expect(callCount()).toBe(0); // the overwrite is silent
  });

  // Break this catches: dropping the debugger report for a schema-rejected binding.
  //
  // The emptiness half alone is NOT faultable on this widget: `toE164` reduces any
  // non-numeric text to '', so moving `defaultValue` into the schema — the fault that
  // works on the BaseInput siblings — still yields an empty field here (executed and
  // MISSED). The debugger log is what distinguishes "rejected" from "happened to be
  // empty", so it is the oracle.
  test('[PhoneInput-PROP-005] a number Default value is accepted; an unconvertible one is emptied and reported', async () => {
    harness.render({ properties: { value: binding('{{9876543210}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('+19876543210');
    expect(useStore.getState().debugger.logs.filter((entry) => entry.componentId === 'ph1')).toHaveLength(0);

    harness.render({ properties: { value: binding('{{ ({ id: 1 }) }}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    await drain();

    expect(harness.exposed().value).toBe('');
    expect(input().value).not.toBe('Default value');
    const [log] = useStore.getState().debugger.logs.filter((entry) => entry.componentId === 'ph1');
    expect(log).toBeDefined();
    expect(log.logLevel).toBe('error');
    expect(log.message).toBe('Expected a value of type string, but received {"id":1}');
    expect(log.error.effectiveProperty).toEqual({ value: '' });
  });
});

describe('more events', () => {
  // Break this catches: dropping the `e.key === 'Enter'` guard in PhoneInput's own
  // handleKeyUp, which would fire onEnterPressed on every digit of a phone number.
  test('[PhoneInput-EVT-002] Enter fires onEnterPressed once, and only for Enter', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ph1', 'onEnterPressed') });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), '98');
    expect(callCount()).toBe(0); // plain digits must not trigger it

    await userEvent.type(input(), '{enter}');

    await waitFor(() => expect(callCount()).toBe(1));
    expect(harness.exposed().value).toBe('+198'); // already published by onChange
  });

  // Break this catches: dropping fireEvent('onFocus') from handleFocus. The
  // setTimeout(0) deferral is deliberate and covered by [PhoneInput-ASYNC-001].
  test('[PhoneInput-EVT-003] focusing the field fires onFocus once', async () => {
    harness.render({ events: countInvocationsOn('ph1', 'onFocus') });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    await drain();

    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: removing setShowValidationError(true) from handleBlur — the
  // user would leave an invalid field and never be told.
  test('[PhoneInput-EVT-004] blurring fires onBlur once and reveals a pending validation message', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, events: countInvocationsOn('ph1', 'onBlur') });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(input());

    await waitFor(() => expect(callCount()).toBe(1));
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });
});

describe('country, continued', () => {
  // Break this catches: dropping the `properties.defaultCountry || 'US'` seed, so a
  // configured Default Country would be ignored and every field would start as US.
  test('[PhoneInput-CTY-001] a configured default country seeds the country, its dial code and the value', async () => {
    harness.render({ properties: { value: binding('9876543210'), defaultCountry: binding('IN') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().country).toBe('IN');
    expect(harness.exposed().countryCode).toBe('+91');
    expect(harness.exposed().value).toBe('+919876543210');
  });

  // Second mount for the same scenario: the country is seeded once, in useState.
  test('[PhoneInput-CTY-001] with no default country configured the widget falls back to US', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().country).toBe('US');
    expect(harness.exposed().countryCode).toBe('+1');
    expect(harness.exposed().value).toBe('+19876543210');
  });

  // Break this catches: dropping the country-code branch of setCountryCode's resolver.
  test('[PhoneInput-CTY-002] setCountryCode accepts a country code', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setCountryCode', 'GB');
    await drain();

    expect(harness.exposed().country).toBe('GB');
    expect(harness.exposed().countryCode).toBe('+44');
  });

  // Break this catches: dropping the `getCountries().find(...)` lookup, so the
  // documented `setCountryCode("+91")` form would silently do nothing.
  test('[PhoneInput-CTY-003] setCountryCode also accepts a calling code', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setCountryCode', '+44');
    await drain();

    expect(harness.exposed().country).toBe('GB');
    expect(harness.exposed().countryCode).toBe('+44');
  });

  // Break this catches: dropping either guard that keeps an unknown country away from
  // the library — the resolver's `|| ''` fallback or onCountryChange's early return.
  // Handing the library an unknown country is what 12031273ec fixed.
  test('[PhoneInput-CTY-004] setCountryCode ignores an unresolvable country', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setCountryCode', 'ZZ');
    await drain();

    expect(harness.exposed().country).toBe('US');
    expect(harness.exposed().value).toBe('+19876543210');
    expect(input().value).toBe('987 654 3210');
  });

  // Break this catches: removing onCountryChange's early return, so a binding that
  // re-resolves to the same country on every render would republish endlessly. The
  // guard requires BOTH the country and the rebased value to be unchanged.
  test('[PhoneInput-CTY-006] a re-resolved but unchanged country does not republish', async () => {
    harness.render({ properties: { value: binding('9876543210') }, events: countInvocationsOn('ph1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setCountryCode', 'IN');
    await drain();
    const after = { ...harness.exposed() };

    await harness.act('setCountryCode', 'IN'); // same country, same value
    await drain();

    expect(harness.exposed().country).toBe(after.country);
    expect(harness.exposed().value).toBe(after.value);
    expect(harness.exposed().formattedValue).toBe(after.formattedValue);
    expect(callCount()).toBe(0); // a no-op must not look like a user edit
  });

  // Break this catches: rendering the dropdown indicator unconditionally, so a builder
  // who turned country change off would still get an operable country picker.
  test('[PhoneInput-CTY-007] isCountryChangeEnabled removes the country-change affordance', async () => {
    harness.render({ properties: { isCountryChangeEnabled: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    const enabledIcons = countrySelect().querySelectorAll('svg').length;

    harness.render({ properties: { isCountryChangeEnabled: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(countrySelect().querySelectorAll('svg').length).toBeLessThan(enabledIcons);
    expect(countrySelect()).toBeTruthy(); // the flag and dial code still show
  });

  // Break this catches: dropping the [defaultCountry] effect, so a bound Default
  // Country would only ever apply at mount.
  test('[PhoneInput-CTY-008] a rebound default country changes the country after mount', async () => {
    harness.render({ properties: { value: binding('9876543210'), defaultCountry: binding('US') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().country).toBe('US');

    harness.setComponentProperty('ph1', 'defaultCountry', 'IN', 'properties');

    await waitFor(() => expect(harness.exposed().country).toBe('IN'));
    expect(harness.exposed().value).toBe('+919876543210');
  });

  // Break this catches: dropping the mount publish added by e2f9c335f9 — an app
  // reading {{...country}} or {{...countryCode}} before any interaction would get
  // undefined. The empty-field formattedValue is characterized under D-04: it is the
  // dial code and a trailing space, NOT '', which `value` correctly reports.
  test('[PhoneInput-CTY-009] the country variables are published at mount', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().country).toBe('US');
    expect(harness.exposed().countryCode).toBe('+1');
    expect(harness.exposed().formattedValue).toBe('+1 987 654 3210');
  });

  // Second mount for the same scenario. Characterization under D-04: an untouched empty
  // field publishes the dial code and a trailing space, NOT '' — which is what `value`
  // correctly reports. Pinned so any fix is deliberate.
  test('[PhoneInput-CTY-009] an untouched empty field publishes a dial code and a trailing space', async () => {
    harness.render({ properties: { value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().value).toBe('');
    expect(harness.exposed().formattedValue).toBe('+1 ');
  });
});

describe('remaining actions', () => {
  // Break this catches: ignoring setValue's second parameter, or clearing the country
  // when it cannot be resolved instead of keeping the current one. Note the fallback
  // differs from setCountryCode's, which ignores the call entirely.
  test('[PhoneInput-CSA-002] setValue’s second parameter switches the country, and falls back when unresolvable', async () => {
    harness.render({ properties: { value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setValue', '9876543210', 'IN');
    await drain();
    expect(harness.exposed().country).toBe('IN');
    expect(harness.exposed().value).toBe('+919876543210');

    // An unresolvable target keeps the current country rather than blanking it.
    await harness.act('setValue', '5551234567', 'ZZ');
    await drain();
    expect(harness.exposed().country).toBe('IN');
    expect(harness.exposed().value).toBe('+915551234567');
  });

  // Break this catches: adding setShowValidationError(true) to clearValue, which would
  // make Form clearForm paint an untouched form red.
  test('[PhoneInput-CSA-003] clear empties the field and fires onChange without changing message visibility', async () => {
    harness.render({
      properties: { value: binding('9876543210') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('ph1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('clear');
    await drain();

    expect(harness.exposed().value).toBe('');
    await waitFor(() => expect(input().value).toBe(''));
    await waitFor(() => expect(callCount()).toBe(1));
    expect(errorText()).toBeNull();
  });

  // Break this catches: pointing setFocus at the wrong ref.
  test('[PhoneInput-CSA-004] setFocus puts DOM focus in the field', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.activeElement).not.toBe(input());

    await harness.act('setFocus');

    expect(document.activeElement).toBe(input());
  });

  // Break this catches: setBlur calling something other than the input's blur.
  test('[PhoneInput-CSA-005] setBlur removes DOM focus and runs the blur path', async () => {
    harness.render({ events: countInvocationsOn('ph1', 'onBlur') });
    await waitFor(() => expect(input()).toBeTruthy());
    input().focus();
    expect(document.activeElement).toBe(input());

    await harness.act('setBlur');

    expect(document.activeElement).not.toBe(input());
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: dropping the paired setExposedVariable('isVisible', ...).
  test('[PhoneInput-CSA-006] setVisibility hides the field and republishes isVisible', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);

    await harness.act('setVisibility', false);

    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));
    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);

    await harness.act('setVisibility', 'yes'); // truthy non-boolean is coerced
    await waitFor(() => expect(harness.exposed().isVisible).toBe(true));
  });

  // Break this catches: dropping the paired setExposedVariable('isDisabled', ...).
  test('[PhoneInput-CSA-007] setDisable disables the field and republishes isDisabled', async () => {
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
  test('[PhoneInput-CSA-008] setLoading shows the loader, blocks input, and republishes isLoading', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.querySelector('.tj-widget-loader')).toBeNull();

    await harness.act('setLoading', true);

    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
  });

  // Break this catches: widening useInput's setText registration to phone inputs, or
  // registering the deprecated disable/visibility handles. Documentation, registration
  // and runtime all agree on exactly eight actions and ten variables.
  test('[PhoneInput-CSA-009] PhoneInput publishes exactly eight actions and ten variables, and no setText', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());

    const entries = Object.entries(harness.exposed());
    const handles = entries
      .filter(([, v]) => typeof v === 'function')
      .map(([k]) => k)
      .sort();
    expect(handles).toEqual(
      ['clear', 'setBlur', 'setCountryCode', 'setDisable', 'setFocus', 'setLoading', 'setValue', 'setVisibility'].sort()
    );
    expect(handles).not.toContain('setText'); // phone takes neither useInput branch
    expect(handles).not.toContain('disable');
    expect(handles).not.toContain('visibility');

    const variables = entries
      .filter(([, v]) => typeof v !== 'function')
      .map(([k]) => k)
      .filter((k) => k !== 'id');
    expect(variables.sort()).toEqual(
      [
        'country',
        'countryCode',
        'formattedValue',
        'isDisabled',
        'isLoading',
        'isMandatory',
        'isValid',
        'isVisible',
        'label',
        'value',
      ].sort()
    );
  });

  // Break this catches: removing the setDisable(disabledState) write from the
  // [disabledState] effect — a property change could no longer correct a CSA-set
  // state, so a stale CSA would outlive every rebind.
  test('[PhoneInput-CSA-010] a CSA state is sticky until the matching property actually changes', async () => {
    harness.render({ properties: { value: binding('9876543210'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setValue', '5551234567');
    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    // A no-op rewrite must not revert the CSA.
    harness.setComponentProperty('ph1', 'disabledState', '{{false}}', 'properties');
    await drain();
    expect(harness.exposed().isDisabled).toBe(true);
    expect(harness.exposed().value).toBe('+15551234567');

    // A genuine change wins and republishes.
    harness.setComponentProperty('ph1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    harness.setComponentProperty('ph1', 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(input().disabled).toBe(false);
  });
});

describe('remaining state', () => {
  // Break this catches: rendering the loader without folding `loading` into the
  // disabled state — a user could type a number that is about to be replaced.
  test('[PhoneInput-STATE-002] loadingState renders the loader and blocks input', async () => {
    harness.render({ properties: { value: binding('9876543210'), loadingState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute('aria-busy', 'true');
  });

  // Break this catches: dropping `visibility` from the error block's guard — a hidden
  // mandatory field would render its error text into the layout while invisible.
  test('[PhoneInput-STATE-003] visibility false hides the field and suppresses its validation message', async () => {
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
  test('[PhoneInput-STATE-004] isVisible, isDisabled and isLoading track their properties on change', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);
    expect(harness.exposed().isDisabled).toBe(false);
    expect(harness.exposed().isLoading).toBe(false);

    harness.setComponentProperty('ph1', 'visibility', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));

    harness.setComponentProperty('ph1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    harness.setComponentProperty('ph1', 'loadingState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(input().disabled).toBe(true);
  });

  // Break this catches: widening useInput's `disable` seed to
  // `disabledState || loadingState` — a field that merely loads would stay greyed out
  // and unclickable after loading cleared. The TextInput sibling shipped this fix.
  test('[PhoneInput-STATE-005] a field that mounts loading is interactive again once loading clears', async () => {
    harness.render({ properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().disabled).toBe(true);

    await harness.act('setLoading', false);
    await waitFor(() => expect(harness.exposed().isLoading).toBe(false));

    expect(harness.exposed().isDisabled).toBe(false);
    expect(input().disabled).toBe(false);
  });
});

describe('remaining validation', () => {
  // Break this catches: dropping aria-required or the isMandatory republish.
  test('[PhoneInput-VAL-001] mandatory marks the input required and publishes isMandatory', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('aria-required', 'true');
    expect(harness.exposed().isMandatory).toBe(true);
    expect(label()).toHaveTextContent('*');
  });

  // Break this catches: reverting 6713df59a2 — setPhoneInputValue reading the `validate`
  // prop directly instead of validateRef.current means a value written after a rule
  // edit is judged by the OLD rule.
  test('[PhoneInput-VAL-004] editing a rule re-validates the current value with no keystroke', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);

    harness.setComponentProperty('ph1', 'minLength', '15', 'validation');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    // A value written AFTER the rule change is judged by the new rule.
    await harness.act('setValue', '5551234567');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
  });

  // Break this catches: dropping any setExposedVariable('isValid', ...) from the
  // value-writing paths — an app gating submit would act on a stale verdict. A country
  // change counts as a value write, because it re-bases the number.
  test('[PhoneInput-VAL-005] isValid is published and tracks every value write', async () => {
    harness.render({ properties: { value: binding('') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    await userEvent.type(input(), '9876543210');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await harness.act('setCountryCode', 'IN');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await harness.act('clear');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
  });

  // Break this catches: making useShowValidationOnFormSubmit reveal unconditionally —
  // every mandatory field would load pre-accused.
  test('[PhoneInput-VAL-006] the message is hidden until the user leaves the field', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(errorText()).toBeNull();
    expect(harness.exposed().isValid).toBe(false);

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: dropping aria-invalid, the is-invalid class, or the country
  // select's error border — the two halves of one control would disagree about
  // whether the field is invalid.
  test('[PhoneInput-VAL-007] a revealed invalid field is marked invalid on the control and the country select', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, styles: { borderColor: binding('#123456') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-invalid', 'false');

    fireEvent.blur(input());

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'true'));
    expect(input().className).toMatch(/\bis-invalid\b/);
    // The select takes the error colour from the same pair of flags, so the two halves
    // of one control never disagree about validity.
    expect(selectControlCss()).toContain('border-color: var(--status-error-strong)');
  });
});

describe('clear button', () => {
  // Break this catches: rendering the clear button whenever the flag is on. It is an
  // undocumented option, so this contract is its only specification.
  test('[PhoneInput-CLR-001] the clear button appears only when the field holds a national number', async () => {
    harness.render({ properties: { value: binding(''), showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    await harness.act('setValue', '9876543210');
    await waitFor(() => expect(clearButton()).toBeTruthy());
  });

  // Break this catches: reverting D-03's normaliser, which is what now keeps a
  // dial-code-only value from ever existing. A saved app written BEFORE that fix can
  // still hold a literal "+1", and it must be read as empty: no clear button, and an
  // empty published value.
  //
  // Note the two layers agree here. `hasValue`'s `^\+<callingCode>` strip (5301697e02)
  // used to be the only defence; since D-03 the value is normalised to '' before it
  // ever reaches that check, so removing the strip alone is no longer observable
  // (executed and MISSED). The fault below breaks the layer that now does the work.
  test('[PhoneInput-CLR-002] a value that is only a dial code is treated as empty', async () => {
    harness.render({ properties: { value: binding('+1'), showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().value).toBe('');
    expect(input().value).toBe('');
    expect(clearButton()).toBeNull();
  });

  // Break this catches: dropping the onClick, or calling a setter that does not fire
  // On change, so an app would not learn the field was emptied.
  test('[PhoneInput-CLR-003] clicking clear empties the field and fires onChange', async () => {
    harness.render({
      properties: { value: binding('9876543210'), showClearBtn: binding('{{true}}') },
      events: countInvocationsOn('ph1', 'onChange'),
    });
    await waitFor(() => expect(clearButton()).toBeTruthy());

    await userEvent.click(clearButton());

    await waitFor(() => expect(harness.exposed().value).toBe(''));
    await waitFor(() => expect(input().value).toBe(''));
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: dropping the reveal from the clear button's onClick, which leaves it
  // to `handleBlur` alone.
  //
  // A field that loads with a default value and is never touched has `showValidationError`
  // false, and the clear button suppresses the blur that would flip it — its `onMouseDown`
  // calls `preventDefault()` so the field never loses focus. So emptying a mandatory field
  // with the button left it silently invalid: no message, no red border, and `isValid`
  // already false underneath. The reveal sits on the button rather than in
  // `onInputValueChange`, which is also the typing handler and must not accuse mid-edit.

  // Break this catches: reverting the clear button's vertical offset, or the field height, to the
  // constants this widget carried before. Both are the defect EmailInput-CLR-004 fixed in the
  // shared BaseInput; PhoneInput and CurrencyInput render their own clear button and their own
  // field box, so they kept the original bug.
  //
  // The button is positioned against the WHOLE widget, so a top-aligned label takes a share of it
  // that grows with the font, and a fixed `calc(50% + 10px)` — correct only at the 12px default —
  // left the button riding up over the label.
  //
  // The reported "component pops out of the wrapper" half is NOT fixed here, deliberately: measured
  // in Chrome across 24 wrapper-height x label-size combinations, subtracting the label height from
  // the field box changes nothing, because the flex column and the field's own min-content height
  // already decide the layout. The overflow is real at small widget heights but it IS the
  // contained-until-forced behaviour BaseInput shows too.

  // Break this catches: putting `h-100` back on the field box, or dropping either branch of the
  // height. `h-100` is `height: 100% !important` (tabler.scss:6829), so an inline height cannot
  // override it — the class has to go, which then makes BOTH branches this element's job.
  //
  // Top-aligned the field sits below the label in a flex column, so a full wrapper height is added
  // to the label's and the content spills out of its own widget box as the label grows. Measured in
  // Chrome before the fix: 16.5px of overflow at a 40px widget with a 12px label, 24.5px at 20px,
  // 32.5px at a 60px widget with a 48px label — all 0 after. The side branch restores exactly what
  // the class used to supply; without it a side-aligned field collapsed from the widget height to
  // its content, measured 100px -> 36.5px.
  //
  // jsdom computes no layout, so the geometry above is browser evidence and what is asserted here
  // is the inline style each branch emits.
  test('[PhoneInput-STYLE-011] the field box height follows a top label and fills the box otherwise', async () => {
    const boxHeightAt = async (alignment, labelFontSize) => {
      harness.render({
        properties: { value: binding('9876543210'), label: binding('Lbl') },
        styles: { alignment: binding(alignment), labelFontSize },
      });
      await waitFor(() => expect(fieldBox()).toBeTruthy());
      return fieldBox().style.height;
    };

    // Top-aligned: the label's own height comes off the box, plus the canvas box padding.
    expect(await boxHeightAt('top', binding('{{12}}'))).toBe('calc(100% - 20px - 4px)');
    expect(await boxHeightAt('top', binding('{{20}}'))).toBe('calc(100% - 28px - 4px)');
    expect(await boxHeightAt('top', binding('{{32}}'))).toBe('calc(100% - 40px - 4px)');

    // A non-numeric size falls back to the 12px default rather than producing NaN.
    expect(await boxHeightAt('top', binding('abc'))).toBe('calc(100% - 20px - 4px)');

    // Side-aligned: the label takes no vertical space, so the field fills the widget box as it
    // always did. This is the half the `h-100` removal would otherwise have silently dropped.
    expect(await boxHeightAt('side', binding('{{32}}'))).toBe('100%');
    expect(await boxHeightAt('side', binding('{{12}}'))).toBe('100%');
  });

  test('[PhoneInput-CLR-006] the clear button stays centred on the field as a top label grows', async () => {
    const atLabelSize = async (labelFontSize) => {
      harness.render({
        properties: { value: binding('9876543210'), showClearBtn: binding('{{true}}'), label: binding('Lbl') },
        styles: { alignment: binding('top'), labelFontSize },
      });
      await waitFor(() => expect(clearButton()).toBeTruthy());
      return clearButton().style.top;
    };

    // Half the label's own height, so the button lands on the middle of the field.
    expect(await atLabelSize(binding('{{12}}'))).toBe('calc(50% + 10px)');
    expect(await atLabelSize(binding('{{20}}'))).toBe('calc(50% + 14px)');
    expect(await atLabelSize(binding('{{32}}'))).toBe('calc(50% + 20px)');

    // A non-numeric size falls back to the 12px default rather than producing NaN.
    expect(await atLabelSize(binding('abc'))).toBe('calc(50% + 10px)');

    // A side-aligned label takes no vertical space, so there is nothing to offset or subtract.
    harness.render({
      properties: { value: binding('9876543210'), showClearBtn: binding('{{true}}'), label: binding('Lbl') },
      styles: { alignment: binding('side'), labelFontSize: binding('{{32}}') },
    });
    await waitFor(() => expect(clearButton()).toBeTruthy());
    expect(clearButton().style.top).toBe('50%');
  });

  test('[PhoneInput-CLR-005] clearing a mandatory field reveals the error with no prior blur', async () => {
    harness.render({
      properties: { value: binding('9876543210'), showClearBtn: binding('{{true}}') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(clearButton()).toBeTruthy());
    expect(errorText()).toBeNull();

    await userEvent.click(clearButton());

    await waitFor(() => expect(input().value).toBe(''));
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: reading only showClearBtn and the value, so a disabled or
  // loading field would still offer a working clear button.
  test('[PhoneInput-CLR-004] the clear button is hidden while the field is disabled or loading', async () => {
    harness.render({
      properties: {
        value: binding('9876543210'),
        showClearBtn: binding('{{true}}'),
        disabledState: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    harness.render({
      properties: {
        value: binding('9876543210'),
        showClearBtn: binding('{{true}}'),
        loadingState: binding('{{true}}'),
      },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();
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
  test('[PhoneInput-FORM-001] submitting the Form reveals the child’s message without a blur', async () => {
    harness.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    await formAct('submitForm');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: dropping useFormClear(clearValue) — the Form's clearForm
  // action could no longer empty its fields.
  test('[PhoneInput-FORM-002] the Form clearForm action empties the child field', async () => {
    harness.renderInsideForm({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().value).toBe('+19876543210');

    await formAct('clearForm');

    await waitFor(() => expect(harness.exposed().value).toBe(''));
    await waitFor(() => expect(input().value).toBe(''));
  });

  // Break this catches: dropping the `children` map from the Form's exposed variables —
  // eventsSlice looks a child's action up there by name.
  test('[PhoneInput-FORM-003] the child’s actions are reachable through the Form’s children map', async () => {
    harness.renderInsideForm({ properties: { value: binding('') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await waitFor(() => expect(formExposed()?.children?.phoneinput1?.setValue).toBeInstanceOf(Function));
    await harness.session.store.act(async () => {
      await formExposed().children.phoneinput1.setValue('5551234567');
    });

    await waitFor(() => expect(harness.exposed().value).toBe('+15551234567'));
  });
});

describe('styles', () => {
  // Break this catches: dropping the finite/positive guard in getLabelFontSize — a
  // cleared or fx-broken Size field would collapse the label.
  test('[PhoneInput-STYLE-001] labelFontSize drives the label size and falls back to 12px', async () => {
    expect(getLabelFontSize(18)).toBe('18px');
    expect(getLabelFontSize('18')).toBe('18px');
    expect(getLabelFontSize(0)).toBe('12px');
    expect(getLabelFontSize(-4)).toBe('12px');
    expect(getLabelFontSize('abc')).toBe('12px');

    harness.render({ styles: { labelFontSize: binding('{{20}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(label())).toContain('font-size: 20px');
  });

  // Break this catches: widening the width branch so a top-aligned or auto-width label
  // starts stealing width from the field.
  test('[PhoneInput-STYLE-002] the field width is derived from widthType, auto and alignment together', async () => {
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

    harness.render({ styles: { alignment: binding('side'), auto: binding('{{false}}'), width: binding('{{33}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('width: 67%');
  });

  // Break this catches: dropping the ofField scaling, which would re-proportion every
  // label in an app saved on the deprecated width type.
  test('[PhoneInput-STYLE-003] a deprecated ofField width scales the configured label width', () => {
    expect(getLabelWidthOfInput('ofComponent', 40)).toBe(40);
    expect(getLabelWidthOfInput('ofField', 40)).toBe(28);
    expect(checkIfInputWidgetTypeIsDeprecated('ofField')).toBe(true);
    expect(checkIfInputWidgetTypeIsDeprecated('ofComponent')).toBe(false);
  });

  // Break this catches: dropping the label?.length tests from the layout branches,
  // which makes a top-aligned field with an empty label reserve label space.
  test('[PhoneInput-STYLE-004] alignment and direction reposition the label around the field', async () => {
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

  // Break this catches: dropping a legacy sentinel comparison from PhoneInput's OWN
  // copy of these expressions (D-01) — a pre-theme app whose background is still
  // literally `#fff` would render that flat white. BaseInput's copy is a separate one
  // and its tests would not notice.
  test('[PhoneInput-STYLE-005] radius, background, border and shadow reach the field, with legacy fallbacks', async () => {
    harness.render({
      styles: {
        borderRadius: binding('{{14}}'),
        backgroundColor: binding('#123456'),
        borderColor: binding('#654321'),
        boxShadow: binding('2px 4px 6px 0px #00000040'),
      },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('border-radius: 14px');
    expect(inlineStyle(fieldBox())).toContain('box-shadow: 2px 4px 6px 0px');
    const configured = inlineStyle(input());
    expect(configured).toContain('rgb(18, 52, 86)'); // #123456
    expect(configured).toContain('#654321');

    harness.render({ styles: { backgroundColor: binding('#fff'), borderColor: binding('#CCD1D5') } });
    await waitFor(() => expect(input()).toBeTruthy());
    const legacy = inlineStyle(input());
    expect(legacy).not.toContain('#fff');
    expect(legacy).not.toContain('rgb(255, 255, 255)');
    expect(legacy).not.toContain('#ccd1d5');
  });

  // Break this catches: giving the input a uniform radius, which would round the edge
  // that sits against the country select and split one control into two boxes.
  test('[PhoneInput-STYLE-006] the field is square on the left, where the country select joins it', async () => {
    harness.render({ styles: { borderRadius: binding('{{6}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(inlineStyle(input())).toContain('border-radius: 0px 6px 6px 0px');
    // The select takes the mirror image, so the pair reads as one rounded control.
    const css = selectControlCss();
    expect(css).toContain('border-top-left-radius: 6px');
    expect(css).toContain('border-bottom-left-radius: 6px');
    expect(css).toContain('border-top-right-radius: 0px');
    expect(css).toContain('border-bottom-right-radius: 0px');
  });

  // Break this catches: dropping the isFocused branch from the border resolution.
  // Scoped to a VALID field on purpose: once a message is showing, theme.scss's
  // `.is-invalid { border: ... !important }` overrides this inline value, and that
  // precedence is browser-owned ([PhoneInput-BRW-005]).
  test('[PhoneInput-STYLE-007] focusing a valid field swaps its border to the accent colour', async () => {
    harness.render({ styles: { accentColor: binding('#ff00ff'), borderColor: binding('#123456') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);
    expect(inlineStyle(input())).toContain('#123456');

    fireEvent.focus(input());

    await waitFor(() => expect(inlineStyle(input())).toContain('#ff00ff'));
  });

  // Break this catches: dropping errTextColor from the message's inline style.
  test('[PhoneInput-STYLE-008] a revealed invalid field colours its message with errTextColor', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, styles: { errTextColor: binding('#abcdef') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
    expect(inlineStyle(errorText())).toContain('rgb(171, 205, 239)');
  });

  // Break this catches: dropping the legacy text-colour blocklist from PhoneInput's own
  // copy — a pre-theme app would render hard #1B1F24 text on a disabled field.
  test('[PhoneInput-STYLE-009] a legacy text colour resolves to the theme token, per state', async () => {
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

  // Break this catches: letting the country select fall back to react-select's own
  // defaults instead of the widget's resolved colours — the two halves of one control
  // would not match.
  test('[PhoneInput-STYLE-010] the country select mirrors the field’s resolved colours', async () => {
    harness.render({ styles: { backgroundColor: binding('#abcdef'), borderColor: binding('#123456') } });
    await waitFor(() => expect(input()).toBeTruthy());

    const css = selectControlCss();
    expect(css).toContain('background-color: #abcdef');
    expect(css).toContain('border-color: #123456');
  });
});

describe('accessibility, async and identity', () => {
  // Break this catches: dropping any of the aria attributes — a screen-reader user
  // would not be told the field is required, busy, disabled or hidden.
  test('[PhoneInput-A11Y-001] aria state attributes reflect the widget’s real state', async () => {
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
  // the canvas would steal focus and break copy/paste), or dropping it entirely.
  test('[PhoneInput-A11Y-002] the label targets the input in the Viewer, and deliberately not in the editor', async () => {
    harness.render({ properties: { label: binding('Contact Number') }, currentMode: 'view' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).toHaveAttribute('for', 'component-ph1');
    expect(screen.getByLabelText('Contact Number')).toBe(input());

    harness.render({ properties: { label: binding('Contact Number') }, currentMode: 'edit' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).not.toHaveAttribute('for');
  });

  // Break this catches: dropping the aria-label fallback — a fixed-width label that has
  // not been laid out would leave the input with no accessible name.
  test('[PhoneInput-A11Y-003] an unmeasured fixed-width label falls back to an aria-label', async () => {
    harness.render({ properties: { label: binding('Contact Number') }, styles: { auto: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-label', 'Contact Number');

    harness.render({ properties: { label: binding('Contact Number') }, styles: { auto: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).not.toHaveAttribute('aria-label');
  });

  // Break this catches: removing the unmount guard around the deferred onFocus
  // dispatch, or making handleBlur async — a focus/blur pair would lose an event.
  test('[PhoneInput-ASYNC-001] a fast focus-then-blur delivers both handlers', async () => {
    harness.render({
      events: [
        ...countInvocationsOn('ph1', 'onFocus', { key: 'focusCalls' }),
        ...countInvocationsOn('ph1', 'onBlur', { key: 'blurCalls' }),
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
  // mounted guard (useInput.js:326-332), so a field focused in the same tick the page
  // navigates away still runs the builder's On focus handler after the widget is gone.
  // Pinned as a known gap awaiting a product decision; fixing it is a shared-hook
  // change across seven widgets.
  //
  // Break this catches: the day someone adds the clearTimeout or the mounted guard —
  // which would be a real improvement — this fails and forces the guarantee, the
  // contract row and the gap entry to be revisited together rather than drifting.
  test('[PhoneInput-ASYNC-001] the deferred onFocus still fires after unmount', async () => {
    const root = harness.render({ events: countInvocationsOn('ph1', 'onFocus', { key: 'focusCalls' }) });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    root.unmount(); // the React tree only; the store is left intact
    await drain();

    expect(callCount('focusCalls')).toBe(1);
  });

  // Break this catches: dropping the effect's cleanup in CountrySelect.jsx:42-44, or
  // attaching the listener unconditionally instead of only while the menu is open.
  // This listener IS cleaned up correctly today, so the scenario protects working
  // behaviour rather than pinning a leak. CountrySelect is shared with CurrencyInput;
  // re-derived here rather than cited, because the two widgets pass it different props
  // (isCurrencyInput, country-change gating) and a divergence should surface on both.
  test('[PhoneInput-ASYNC-002] the click-outside listener closes the menu and is detached on unmount', async () => {
    const root = harness.render();
    await waitFor(() => expect(input()).toBeTruthy());

    fireEvent.mouseDown(document.querySelector('.country-ph1__control'), { button: 0 });
    await drain();
    expect(document.querySelector('.country-ph1__menu')).toBeTruthy();

    fireEvent.mouseDown(document.body);
    await drain();
    expect(document.querySelector('.country-ph1__menu')).toBeNull();

    // Detach: every mousedown listener this component attaches must be removed again
    // by the time it unmounts. Counting add/remove on document is the oracle because
    // React 18 no longer warns about a state update on an unmounted component, so a
    // leaked listener has no other observable consequence at this layer.
    const added = [];
    const removed = [];
    const realAdd = document.addEventListener.bind(document);
    const realRemove = document.removeEventListener.bind(document);
    jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'mousedown') added.push(fn);
      return realAdd(type, fn, opts);
    });
    jest.spyOn(document, 'removeEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'mousedown') removed.push(fn);
      return realRemove(type, fn, opts);
    });
    try {
      fireEvent.mouseDown(document.querySelector('.country-ph1__control'), { button: 0 });
      await drain();
      expect(document.querySelector('.country-ph1__menu')).toBeTruthy();
      expect(added.length).toBeGreaterThan(0);

      root.unmount();
      await drain();

      expect(added.filter((fn) => !removed.includes(fn))).toEqual([]);
    } finally {
      document.addEventListener.mockRestore();
      document.removeEventListener.mockRestore();
    }
  });

  // Break this catches: reverting 12031273ec's `international={true}`, which would make
  // the library render the raw stored value instead of the country's grouping.
  test('[PhoneInput-TYPE-001] the control is the library input, rendering international formatting', async () => {
    harness.render({ properties: { value: binding('9876543210') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('type', 'tel');
    expect(harness.exposed().value).toBe('+19876543210');
    expect(input().value).toBe('987 654 3210'); // grouped, and without the dial code
  });

  // Break this catches: hoisting the country or value state out of the component, or
  // dropping the per-component classNamePrefix — one field's number or country would
  // leak into the other.
  //
  // The sibling is BOTH seeded (extraComponents) and rendered (also): `also` alone
  // mounts a RenderWidget for an id the store has never heard of, which renders
  // nothing and makes a two-instance assertion silently vacuous.
  test('[PhoneInput-TYPE-002] two Phone Inputs stay independent', async () => {
    harness.render({
      properties: { value: binding('9876543210') },
      extraComponents: {
        ph2: componentDefinition('ph2', 'phoneinput2', 'PhoneInput', { value: binding('5551234567') }),
      },
      also: [{ id: 'ph2', componentType: 'PhoneInput' }],
    });
    await waitFor(() => expect(document.querySelectorAll('input')).toHaveLength(2));

    expect(harness.exposed('ph1').value).toBe('+19876543210');
    expect(harness.exposed('ph2').value).toBe('+15551234567');

    await harness.act('setCountryCode', 'IN');
    await drain();

    // Both the published variables and the rendered fields stay separate.
    expect(harness.exposed('ph1').country).toBe('IN');
    expect(harness.exposed('ph2').country).toBe('US');
    expect(harness.exposed('ph2').value).toBe('+15551234567');
    expect([...document.querySelectorAll('input')].map((i) => i.value)).toEqual(['98765 43210', '555 123 4567']);
  });
});
