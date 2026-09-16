/**
 * TextArea widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/TextArea/TESTING.md
 * Every test title starts with its approved scenario ID; the `// Break this catches:`
 * comment names the production edit its oracle is meant to catch.
 *
 * TextArea DOES render through the shared BaseInput, unlike PhoneInput and
 * CurrencyInput. D-01 still chose to re-derive rather than cite the verified
 * TextInput/EmailInput/PasswordInput specs, because BaseInput accumulates
 * `inputType === 'textarea'` branches from commits that are not about textarea
 * (2c2fd36101 is titled for email/number/text input and added one). A sibling spec
 * renders with `inputType` of 'text' and would never take such a branch.
 *
 * Three measured constraints shape the tests here:
 *   1. `TablerIcon` lazy-loads @tabler/icons-react through a dynamic import and renders
 *      a placeholder <span> first, so every icon assertion must waitFor the icon.
 *   2. `harness.render()` re-renders rather than remounts, so a scenario needing a
 *      second differently-seeded MOUNT gets a second test() under the same ID.
 *   3. jsdom measures every element as zero, so dynamic-height tests assert the GATE
 *      and never a resulting pixel height — that belongs to TextArea-BRW-001/002.
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
  getLabelHeight,
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
  checkIfInputWidgetTypeIsDeprecated,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';

const harness = createWidgetHarness({ componentType: 'TextArea', handle: 'textarea1', id: 'ta1' });

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

const field = () => document.getElementById('component-ta1');
const label = () => document.querySelector('[data-cy="textarea1-label"]');
const fieldBox = () => document.querySelector('[data-cy="textarea1-actionable-section"]');
const errorText = () => document.querySelector('[data-cy="textarea1-invalid-feedback"]');
const leftIcon = () => document.querySelector('[data-cy="textarea1-icon"]');
const callCount = (key = 'calls') => harness.variables()?.[key] ?? 0;
const inlineStyle = (node) => (node.getAttribute('style') ?? '').toLowerCase();

describe('the multi-line control', () => {
  // Break this catches: reverting BaseInput's `inputType !== 'textarea'` branch so the
  // widget renders an <input>. Every newline a user types would be silently dropped,
  // which is the entire point of this widget.
  test('[TextArea-TYPE-001] the control is a multi-line textarea, not an input', async () => {
    harness.render({ properties: { value: binding('first line\nsecond line') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(field().tagName).toBe('TEXTAREA');
    expect(field()).toHaveAttribute('rows', '1');
    expect(field().value).toBe('first line\nsecond line');

    // A typed newline survives too, not just a seeded one.
    await userEvent.clear(field());
    await userEvent.type(field(), 'a{enter}b');
    await waitFor(() => expect(field().value).toBe('a\nb'));
  });

  // Break this catches: hoisting the value state out of the component, which would leak
  // one textarea's text into another.
  //
  // The sibling is BOTH seeded (extraComponents) and rendered (also): `also` alone
  // mounts a RenderWidget for an id the store has never heard of, which renders nothing
  // and makes a two-instance assertion silently vacuous.
  test('[TextArea-TYPE-002] two Text Areas stay independent', async () => {
    harness.render({
      properties: { value: binding('first') },
      extraComponents: {
        ta2: componentDefinition('ta2', 'textarea2', 'TextArea', { value: binding('second') }),
      },
      also: [{ id: 'ta2', componentType: 'TextArea' }],
    });
    await waitFor(() => expect(document.querySelectorAll('textarea')).toHaveLength(2));

    await harness.act('setText', 'changed');

    expect(harness.exposed('ta1').value).toBe('changed');
    expect(harness.exposed('ta2').value).toBe('second');
    expect([...document.querySelectorAll('textarea')].map((t) => t.value)).toEqual(['changed', 'second']);
  });
});

describe('dynamic height', () => {
  // Break this catches: dropping the `currentMode === 'view'` half of the gate, which
  // would let components resize under a builder while they are laying out a page —
  // 89d705a454 added that gate deliberately.
  //
  // Only the GATE is asserted. jsdom measures scrollHeight and getComputedStyle as
  // zero, so the resulting height is meaningless here and belongs to TextArea-BRW-001.
  // The observable signal is the early return: a closed gate pins the authored 100%.
  test('[TextArea-DYN-001] dynamic height applies in the Viewer and is inert on the canvas', async () => {
    harness.render({
      properties: { value: binding('some text'), dynamicHeight: binding('{{true}}') },
      currentMode: 'edit',
    });
    await waitFor(() => expect(field()).toBeTruthy());
    await drain();
    expect(field().style.height).toBe('100%'); // gate closed: authored height kept

    harness.render({
      properties: { value: binding('some text'), dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
    });
    await waitFor(() => expect(field()).toBeTruthy());
    await drain();
    expect(field().style.height).not.toBe('100%'); // gate open: height is computed
  });

  // Second mount for the same scenario: the gate is live, not just mount-time, so
  // turning the property off in a running app returns the field to its authored height.
  test('[TextArea-DYN-001] turning dynamic height off at runtime restores the authored height', async () => {
    harness.render({
      properties: { value: binding('some text'), dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
    });
    await waitFor(() => expect(field()).toBeTruthy());
    await drain();
    expect(field().style.height).not.toBe('100%');

    harness.setComponentProperty('ta1', 'dynamicHeight', '{{false}}', 'properties');

    await waitFor(() => expect(field().style.height).toBe('100%'));
  });
});

describe('default value', () => {
  // Break this catches: removing the [properties.value] effect or the `value` entry from
  // the mount effect — a configured Default value would render empty, or render but
  // publish nothing. A multi-line default is the case this widget actually ships with.
  test('[TextArea-PROP-003] the Default value seeds the field and the exposed value at mount', async () => {
    harness.render({ properties: { value: binding('Nexus Building\nStreet XYZ\nAB, 010101') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(field().value).toBe('Nexus Building\nStreet XYZ\nAB, 010101');
    expect(harness.exposed().value).toBe('Nexus Building\nStreet XYZ\nAB, 010101');
  });
});

describe('events', () => {
  // Break this catches: moving fireEvent('onChange') out of handleChange, or firing it
  // twice per keystroke.
  test('[TextArea-EVT-001] typing fires onChange once per keystroke and republishes the value', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ta1', 'onChange') });
    await waitFor(() => expect(field()).toBeTruthy());

    await userEvent.type(field(), 'abc');

    await waitFor(() => expect(callCount()).toBe(3));
    expect(harness.exposed().value).toBe('abc');
  });
});

describe('component-specific actions', () => {
  // Break this catches: dropping fireEvent('onChange') from the setText handle, or
  // stripping newlines on the way in.
  test('[TextArea-CSA-001] setText writes the value, publishes it, and fires onChange once', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ta1', 'onChange') });
    await waitFor(() => expect(field()).toBeTruthy());

    await harness.act('setText', 'line one\nline two');

    expect(field().value).toBe('line one\nline two');
    expect(harness.exposed().value).toBe('line one\nline two');
    await waitFor(() => expect(callCount()).toBe(1));
  });
});

describe('disabled, loading and visibility', () => {
  // Break this catches: removing the `disabled` attribute (BaseInput.jsx:283).
  test('[TextArea-STATE-001] disabledState renders a disabled textarea that rejects typing', async () => {
    harness.render({ properties: { value: binding('locked'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(field().disabled).toBe(true);
    await userEvent.type(field(), 'more');

    expect(field().value).toBe('locked');
  });
});

describe('validation', () => {
  // Break this catches: normalising or stripping newlines before the length rules run.
  // A user filling a multi-line address types line breaks that must count toward the
  // limit; this is the case no single-line sibling can exercise.
  test('[TextArea-VAL-002] length rules count every character, including newlines', async () => {
    // "a\nb\nc" is five characters, not three.
    harness.render({ properties: { value: binding('a\nb\nc') }, validation: { minLength: binding('5') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(harness.exposed().value).toHaveLength(5);
    expect(harness.exposed().isValid).toBe(true);

    harness.render({ properties: { value: binding('a\nb\nc') }, validation: { minLength: binding('6') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    // And the same string is over a maximum that the visible characters alone would pass.
    harness.render({ properties: { value: binding('a\nb\nc') }, validation: { maxLength: binding('3') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);
  });
});

describe('label, placeholder and property changes', () => {
  // Break this catches: dropping the [label] republish — a builder renaming a field
  // would leave {{...label}} on the old text.
  test('[TextArea-PROP-001] the configured label labels the field and is published as `label`', async () => {
    harness.render({ properties: { label: binding('Enter Your Address') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(label()).toHaveTextContent('Enter Your Address');
    expect(harness.exposed().label).toBe('Enter Your Address');

    harness.setComponentProperty('ta1', 'label', 'Billing address', 'properties');
    await waitFor(() => expect(harness.exposed().label).toBe('Billing address'));
    expect(label()).toHaveTextContent('Billing address');
  });

  // Break this catches: passing `placeholder` as the value instead of the placeholder.
  test('[TextArea-PROP-002] the placeholder renders as a placeholder, never as the value', async () => {
    harness.render({ properties: { placeholder: binding('Enter Your Address Here'), value: binding('') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(field()).toHaveAttribute('placeholder', 'Enter Your Address Here');
    expect(field().value).toBe('');
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: gating the [properties.value] effect on a "field is untouched"
  // flag, or adding fireEvent('onChange') to setInputValue.
  test('[TextArea-PROP-004] a re-resolved Default value replaces typed text and fires no onChange', async () => {
    harness.render({
      properties: { value: binding('seeded') },
      events: countInvocationsOn('ta1', 'onChange'),
    });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(callCount()).toBe(0);

    harness.setComponentProperty('ta1', 'value', 'from a query', 'properties');

    await waitFor(() => expect(field().value).toBe('from a query'));
    expect(harness.exposed().value).toBe('from a query');
    expect(callCount()).toBe(0); // the overwrite is silent
  });

  // Break this catches: moving `defaultValue` inside the `value` schema, which would
  // make a broken binding render the literal words instead of leaving it empty.
  test('[TextArea-PROP-005] a number Default value renders as a string; an unconvertible one renders empty', async () => {
    harness.render({ properties: { value: binding('{{42}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field().value).toBe('42');

    harness.render({ properties: { value: binding('{{ ({ id: 1 }) }}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    await drain();
    expect(field().value).toBe('');
    const [log] = useStore.getState().debugger.logs.filter((entry) => entry.componentId === 'ta1');
    expect(log).toBeDefined();
    expect(log.logLevel).toBe('error');
  });
});

describe('more events', () => {
  // Break this catches: dropping the `e.key === 'Enter'` guard in handleKeyUp, or
  // preventing the default so Enter stops inserting a newline. Both halves matter here
  // and neither single-line sibling can assert the newline.
  test('[TextArea-EVT-002] Enter fires onEnterPressed once AND inserts a newline', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ta1', 'onEnterPressed') });
    await waitFor(() => expect(field()).toBeTruthy());

    await userEvent.type(field(), 'ab');
    expect(callCount()).toBe(0); // plain characters must not trigger it

    await userEvent.type(field(), '{enter}cd');

    await waitFor(() => expect(callCount()).toBe(1));
    expect(field().value).toBe('ab\ncd'); // the newline is kept, unlike a single-line input
  });

  // Break this catches: dropping fireEvent('onFocus') from handleFocus. The
  // setTimeout(0) deferral is deliberate and covered by [TextArea-ASYNC-001].
  test('[TextArea-EVT-003] focusing the field fires onFocus once', async () => {
    harness.render({ events: countInvocationsOn('ta1', 'onFocus') });
    await waitFor(() => expect(field()).toBeTruthy());

    field().focus();
    await drain();

    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: removing setShowValidationError(true) from handleBlur.
  test('[TextArea-EVT-004] blurring fires onBlur once and reveals a pending validation message', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, events: countInvocationsOn('ta1', 'onBlur') });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(field());

    await waitFor(() => expect(callCount()).toBe(1));
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });
});

describe('remaining actions', () => {
  // Break this catches: removing setShowValidationError(true) from setText. A
  // programmatic write validates loudly even on an untouched field.
  test('[TextArea-CSA-002] setText reveals a validation message on a field the user never touched', async () => {
    harness.render({ properties: { value: binding('something') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(errorText()).toBeNull();

    await harness.act('setText', '');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: adding setShowValidationError(true) to clearValue, which would
  // make Form clearForm paint an untouched form red.
  test('[TextArea-CSA-003] clear empties the field and fires onChange without changing message visibility', async () => {
    harness.render({
      properties: { value: binding('line one\nline two') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('ta1', 'onChange'),
    });
    await waitFor(() => expect(field()).toBeTruthy());

    await harness.act('clear');

    expect(field().value).toBe('');
    await waitFor(() => expect(callCount()).toBe(1));
    expect(errorText()).toBeNull();
  });

  // Break this catches: pointing setFocus at the wrong ref.
  test('[TextArea-CSA-004] setFocus puts DOM focus in the field', async () => {
    harness.render();
    await waitFor(() => expect(field()).toBeTruthy());
    expect(document.activeElement).not.toBe(field());

    await harness.act('setFocus');

    expect(document.activeElement).toBe(field());
  });

  // Break this catches: setBlur calling something other than the textarea's blur.
  test('[TextArea-CSA-005] setBlur removes DOM focus and runs the blur path', async () => {
    harness.render({ events: countInvocationsOn('ta1', 'onBlur') });
    await waitFor(() => expect(field()).toBeTruthy());
    field().focus();
    expect(document.activeElement).toBe(field());

    await harness.act('setBlur');

    expect(document.activeElement).not.toBe(field());
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: dropping the paired setExposedVariable('isVisible', ...).
  test('[TextArea-CSA-006] setVisibility hides the field and republishes isVisible', async () => {
    harness.render();
    await waitFor(() => expect(field()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);

    await harness.act('setVisibility', false);

    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));
    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);

    await harness.act('setVisibility', 'yes'); // truthy non-boolean is coerced
    await waitFor(() => expect(harness.exposed().isVisible).toBe(true));
  });

  // Break this catches: dropping the paired setExposedVariable('isDisabled', ...).
  test('[TextArea-CSA-007] setDisable disables the field and republishes isDisabled', async () => {
    harness.render();
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field().disabled).toBe(false);

    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    expect(field().disabled).toBe(true);

    await harness.act('setDisable', 0); // falsy non-boolean is coerced
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(field().disabled).toBe(false);
  });

  // Break this catches: dropping the paired setExposedVariable('isLoading', ...), or
  // rendering the loader without disabling the field.
  test('[TextArea-CSA-008] setLoading shows the loader, blocks input, and republishes isLoading', async () => {
    harness.render();
    await waitFor(() => expect(field()).toBeTruthy());
    expect(document.querySelector('.tj-widget-loader')).toBeNull();

    await harness.act('setLoading', true);

    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(field().disabled).toBe(true);
  });

  // Break this catches: widening useInput's `inputType === 'TextInput'` branch so a
  // textarea starts receiving the deprecated handles, or narrowing the generic branch so
  // it loses setText.
  //
  // Characterization of a known gap (D-02): textarea.js declares NINE actions, including
  // the deprecated disable and visibility, which useInput registers only for TextInput.
  // The inspector therefore offers two Component Specific Actions that never run.
  test('[TextArea-CSA-009] TextArea publishes seven actions, and the two extra registered ones are dead', async () => {
    harness.render();
    await waitFor(() => expect(field()).toBeTruthy());

    const handles = Object.entries(harness.exposed())
      .filter(([, v]) => typeof v === 'function')
      .map(([k]) => k)
      .sort();

    expect(handles).toEqual(
      ['clear', 'setBlur', 'setDisable', 'setFocus', 'setLoading', 'setText', 'setVisibility'].sort()
    );
    // Registered in textarea.js, never published here.
    expect(handles).not.toContain('disable');
    expect(handles).not.toContain('visibility');
  });

  // Break this catches: removing the setDisable(disabledState) write from the
  // [disabledState] effect — a property change could no longer correct a CSA-set state.
  test('[TextArea-CSA-010] a CSA state is sticky until the matching property actually changes', async () => {
    harness.render({ properties: { value: binding('seed'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(field()).toBeTruthy());

    await harness.act('setText', 'set-by-csa');
    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    // A no-op rewrite must not revert the CSA.
    harness.setComponentProperty('ta1', 'disabledState', '{{false}}', 'properties');
    await drain();
    expect(harness.exposed().isDisabled).toBe(true);
    expect(field().value).toBe('set-by-csa');

    // A genuine change wins and republishes.
    harness.setComponentProperty('ta1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    harness.setComponentProperty('ta1', 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(field().disabled).toBe(false);
  });
});

describe('remaining state', () => {
  // Break this catches: rendering the loader without folding loading into the disabled
  // state — a user could type into a field whose value is about to be replaced.
  test('[TextArea-STATE-002] loadingState renders the loader and blocks input', async () => {
    harness.render({ properties: { value: binding('text'), loadingState: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(field().disabled).toBe(true);
    expect(field()).toHaveAttribute('aria-busy', 'true');
  });

  // Break this catches: dropping `visibility` from the error block's guard.
  test('[TextArea-STATE-003] visibility false hides the field and suppresses its validation message', async () => {
    harness.render({
      properties: { visibility: binding('{{false}}') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);
    expect(field()).toHaveAttribute('aria-hidden', 'true');

    fireEvent.blur(field());
    await drain();
    expect(errorText()).toBeNull();
  });

  // Break this catches: removing any of the property effects.
  test('[TextArea-STATE-004] isVisible, isDisabled and isLoading track their properties on change', async () => {
    harness.render();
    await waitFor(() => expect(field()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);
    expect(harness.exposed().isDisabled).toBe(false);
    expect(harness.exposed().isLoading).toBe(false);

    harness.setComponentProperty('ta1', 'visibility', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));

    harness.setComponentProperty('ta1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    harness.setComponentProperty('ta1', 'loadingState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(field().disabled).toBe(true);
  });

  // Break this catches: widening useInput's `disable` seed back to
  // `disabledState || loadingState` — the fix the TextInput sibling shipped.
  test('[TextArea-STATE-005] a field that mounts loading is interactive again once loading clears', async () => {
    harness.render({ properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field().disabled).toBe(true);

    await harness.act('setLoading', false);
    await waitFor(() => expect(harness.exposed().isLoading).toBe(false));

    expect(harness.exposed().isDisabled).toBe(false);
    expect(field().disabled).toBe(false);
  });
});

describe('remaining validation', () => {
  // Break this catches: dropping aria-required or the isMandatory republish.
  test('[TextArea-VAL-001] mandatory marks the field required and publishes isMandatory', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(field()).toHaveAttribute('aria-required', 'true');
    expect(harness.exposed().isMandatory).toBe(true);
    expect(label()).toHaveTextContent('*');
  });

  // Break this catches: reverting 6713df59a2 — reading the `validate` prop directly
  // instead of validateRef.current means a value written after a rule edit is judged by
  // the OLD rule.
  test('[TextArea-VAL-004] editing a rule re-validates the current value with no keystroke', async () => {
    harness.render({ properties: { value: binding('short') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);

    harness.setComponentProperty('ta1', 'minLength', '50', 'validation');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    // A value written AFTER the rule change is judged by the new rule.
    await harness.act('setText', 'still short');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
  });

  // Break this catches: dropping any setExposedVariable('isValid', ...) from the
  // value-writing paths — an app gating submit would act on a stale verdict.
  test('[TextArea-VAL-005] isValid is published and tracks every value write', async () => {
    harness.render({ properties: { value: binding('') }, validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    await userEvent.type(field(), 'filled in');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await harness.act('clear');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
  });

  // Break this catches: making useShowValidationOnFormSubmit reveal unconditionally —
  // every mandatory field would load pre-accused.
  test('[TextArea-VAL-006] the message is hidden until the user leaves the field', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(errorText()).toBeNull();
    expect(harness.exposed().isValid).toBe(false);

    fireEvent.blur(field());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: dropping aria-invalid or the is-invalid class.
  test('[TextArea-VAL-007] a revealed invalid field is marked invalid on the control', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field()).toHaveAttribute('aria-invalid', 'false');

    fireEvent.blur(field());

    await waitFor(() => expect(field()).toHaveAttribute('aria-invalid', 'true'));
    expect(field().className).toMatch(/\bis-invalid\b/);
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
  test('[TextArea-FORM-001] submitting the Form reveals the child’s message without a blur', async () => {
    harness.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(errorText()).toBeNull();

    await formAct('submitForm');

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: dropping useFormClear(clearValue).
  test('[TextArea-FORM-002] the Form clearForm action empties the child field', async () => {
    harness.renderInsideForm({ properties: { value: binding('line one\nline two') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field().value).toBe('line one\nline two');

    await formAct('clearForm');

    await waitFor(() => expect(field().value).toBe(''));
    expect(harness.exposed().value).toBe('');
  });

  // Break this catches: dropping the `children` map from the Form's exposed variables.
  test('[TextArea-FORM-003] the child’s actions are reachable through the Form’s children map', async () => {
    harness.renderInsideForm({ properties: { value: binding('') } });
    await waitFor(() => expect(field()).toBeTruthy());

    await waitFor(() => expect(formExposed()?.children?.textarea1?.setText).toBeInstanceOf(Function));
    await harness.session.store.act(async () => {
      await formExposed().children.textarea1.setText('via the form');
    });

    await waitFor(() => expect(field().value).toBe('via the form'));
  });
});

describe('styles', () => {
  // Break this catches: dropping either guard in the label-size helpers.
  test('[TextArea-STYLE-001] labelFontSize drives the label size and falls back to 12px', async () => {
    expect(getLabelFontSize(18)).toBe('18px');
    expect(getLabelFontSize(0)).toBe('12px');
    expect(getLabelFontSize('abc')).toBe('12px');
    expect(getLabelHeight(18)).toBe(26);

    harness.render({ styles: { labelFontSize: binding('{{20}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(inlineStyle(label())).toContain('font-size: 20px');
  });

  // Break this catches: widening the width branch so a top-aligned or auto-width label
  // starts stealing width from the field.
  test('[TextArea-STYLE-002] the field width is derived from widthType, auto and alignment together', () => {
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

  // Break this catches: dropping the ofField scaling.
  test('[TextArea-STYLE-003] a deprecated ofField width scales the configured label width', () => {
    expect(getLabelWidthOfInput('ofComponent', 40)).toBe(40);
    expect(getLabelWidthOfInput('ofField', 40)).toBe(28);
    expect(checkIfInputWidgetTypeIsDeprecated('ofField')).toBe(true);
    expect(checkIfInputWidgetTypeIsDeprecated('ofComponent')).toBe(false);
  });

  // Break this catches: dropping the label?.length tests from the layout branches.
  test('[TextArea-STYLE-004] alignment and direction reposition the label around the field', async () => {
    const wrapper = () => fieldBox().closest('.text-input');

    harness.render({ styles: { alignment: binding('top') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(wrapper().className).toMatch(/\bflex-column\b/);

    harness.render({ styles: { alignment: binding('side'), direction: binding('right') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(wrapper().className).toMatch(/\bflex-row-reverse\b/);

    harness.render({ properties: { label: binding('') }, styles: { alignment: binding('top') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(wrapper().className).not.toMatch(/\bflex-column\b/);
  });

  // Break this catches: dropping a legacy sentinel comparison — a pre-theme app whose
  // background is still literally `#fff` would render that flat white.
  test('[TextArea-STYLE-005] radius, background, border and shadow reach the field, with legacy fallbacks', async () => {
    harness.render({
      styles: {
        borderRadius: binding('{{14}}'),
        backgroundColor: binding('#123456'),
        borderColor: binding('#654321'),
        boxShadow: binding('2px 4px 6px 0px #00000040'),
      },
    });
    await waitFor(() => expect(field()).toBeTruthy());
    const configured = inlineStyle(fieldBox());
    expect(configured).toContain('border-radius: 14px');
    expect(configured).toContain('rgb(18, 52, 86)');
    expect(configured).toContain('#654321');
    expect(configured).toContain('box-shadow: 2px 4px 6px 0px');

    harness.render({ styles: { backgroundColor: binding('#fff'), borderColor: binding('#CCD1D5') } });
    await waitFor(() => expect(field()).toBeTruthy());
    const legacy = inlineStyle(fieldBox());
    expect(legacy).not.toContain('#fff');
    expect(legacy).not.toContain('rgb(255, 255, 255)');
    expect(legacy).not.toContain('#ccd1d5');
  });

  // Break this catches: rendering the icon unconditionally, or dropping the textarea
  // `alignSelf: 'start'` branch so the icon floats to the vertical centre of a tall
  // field instead of sitting beside the first line.
  //
  // The icon is lazy-loaded (TablerIcon dynamic import), so it must be waited for.
  test('[TextArea-STYLE-006] the left icon renders only when its gate is on, aligned to the first line', async () => {
    harness.render({ styles: { iconVisibility: { value: true }, icon: binding('IconSearch') } });
    await waitFor(() => expect(leftIcon()).toBeTruthy());

    expect(leftIcon().style.alignSelf).toBe('start'); // textarea-only branch
    expect(leftIcon().getAttribute('class')).toContain('tw-mt-0.5'); // TextArea's own class

    harness.render({ styles: { iconVisibility: { value: false }, icon: binding('IconSearch') } });
    await waitFor(() => expect(field()).toBeTruthy());
    await drain();
    expect(leftIcon()).toBeNull();
  });

  // Break this catches: dropping the isFocused branch from the border resolution.
  test('[TextArea-STYLE-007] focusing the field swaps its border to the accent colour', async () => {
    harness.render({ styles: { accentColor: binding('#ff00ff'), borderColor: binding('#123456') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('#123456');

    fireEvent.focus(field());

    await waitFor(() => expect(inlineStyle(fieldBox())).toContain('#ff00ff'));
  });

  // Break this catches: dropping errTextColor from the message's inline style.
  test('[TextArea-STYLE-008] a revealed invalid field colours its message with errTextColor', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') }, styles: { errTextColor: binding('#abcdef') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(field());

    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
    expect(inlineStyle(errorText())).toContain('rgb(171, 205, 239)');
  });

  // Break this catches: dropping the legacy text-colour blocklist.
  test('[TextArea-STYLE-009] a legacy text colour resolves to the theme token, per state', async () => {
    for (const disabled of ['{{false}}', '{{true}}']) {
      harness.render({ styles: { textColor: binding('#1B1F24') }, properties: { disabledState: binding(disabled) } });
      await waitFor(() => expect(field()).toBeTruthy());
      expect(inlineStyle(field())).not.toContain('#1b1f24');
      expect(inlineStyle(field())).not.toContain('rgb(27, 31, 36)');
    }
    for (const disabled of ['{{false}}', '{{true}}']) {
      harness.render({ styles: { textColor: binding('#ff0000') }, properties: { disabledState: binding(disabled) } });
      await waitFor(() => expect(field()).toBeTruthy());
      expect(inlineStyle(field())).toContain('rgb(255, 0, 0)');
    }
  });

  // Break this catches: wiring the icon to the text colour instead of its own setting.
  test('[TextArea-STYLE-010] the icon colour comes from its own style', async () => {
    harness.render({
      styles: { iconVisibility: { value: true }, icon: binding('IconSearch'), iconColor: binding('#ff0000') },
    });
    await waitFor(() => expect(leftIcon()).toBeTruthy());

    expect(inlineStyle(leftIcon())).toContain('rgb(255, 0, 0)');
  });

  // Break this catches: applying `tw-self-center` to a textarea's label. Every other
  // input centres its label against a single-line field; a textarea must not, or the
  // label floats to the middle of a tall field instead of sitting by its first line.
  //
  // The class lands on the LABEL (BaseInput passes it as `classes.labelContainer`), not
  // on the field box. A first version of this test asserted the field box and was
  // vacuous — sensitivity caught it.
  test('[TextArea-STYLE-011] a textarea’s label is not vertically centred', async () => {
    harness.render({ properties: { label: binding('Address') }, styles: { alignment: binding('side') } });
    await waitFor(() => expect(field()).toBeTruthy());

    expect(label().getAttribute('class') ?? '').not.toContain('tw-self-center');
  });

  // Break this catches: reverting the textarea branch in the loader position, so the
  // spinner would sit against the vertical centre of a tall field instead of beside its
  // first line.
  //
  // Scoped to the LOADER only. BaseInput also has textarea branches for the clear
  // button's `top` and `transform`, but TextArea does not register `showClearBtn`, so no
  // clear button can ever render for this widget and those two branches are unreachable
  // here — see the research findings.
  test('[TextArea-STYLE-012] the loader is aligned to the top of a textarea, not its middle', async () => {
    harness.render({ properties: { value: binding('x'), loadingState: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());

    const loader = document.querySelector('.tj-widget-loader');
    expect(loader).toBeTruthy();
    expect(inlineStyle(loader)).toContain('align-self: start'); // the textarea-only branch
  });

  // Break this catches: dropping the BOX_PADDING term from the top-alignment height.
  test('[TextArea-STYLE-013] padding none removes the box padding from the top-aligned height', async () => {
    harness.render({
      styles: { alignment: binding('top'), padding: binding('default'), labelFontSize: binding('{{12}}') },
    });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('calc(100% - 20px - 4px)');

    harness.render({
      styles: { alignment: binding('top'), padding: binding('none'), labelFontSize: binding('{{12}}') },
    });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('calc(100% - 20px - 0px)');
  });
});

describe('accessibility and async', () => {
  // Break this catches: dropping any of the aria attributes.
  test('[TextArea-A11Y-001] aria state attributes reflect the widget’s real state', async () => {
    harness.render();
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field()).toHaveAttribute('aria-disabled', 'false');
    expect(field()).toHaveAttribute('aria-busy', 'false');
    expect(field()).toHaveAttribute('aria-required', 'false');
    expect(field()).toHaveAttribute('aria-hidden', 'false');

    harness.render({
      properties: {
        disabledState: binding('{{true}}'),
        loadingState: binding('{{true}}'),
        visibility: binding('{{false}}'),
      },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field()).toHaveAttribute('aria-disabled', 'true');
    expect(field()).toHaveAttribute('aria-busy', 'true');
    expect(field()).toHaveAttribute('aria-required', 'true');
    expect(field()).toHaveAttribute('aria-hidden', 'true');
  });

  // Break this catches: making htmlFor unconditional in Label.jsx, or dropping it.
  test('[TextArea-A11Y-002] the label targets the field in the Viewer, and deliberately not in the editor', async () => {
    harness.render({ properties: { label: binding('Enter Your Address') }, currentMode: 'view' });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(label()).toHaveAttribute('for', 'component-ta1');
    expect(screen.getByLabelText('Enter Your Address')).toBe(field());

    harness.render({ properties: { label: binding('Enter Your Address') }, currentMode: 'edit' });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(label()).not.toHaveAttribute('for');
  });

  // Break this catches: dropping the aria-label fallback.
  test('[TextArea-A11Y-003] an unmeasured fixed-width label falls back to an aria-label', async () => {
    harness.render({ properties: { label: binding('Address') }, styles: { auto: binding('{{false}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field()).toHaveAttribute('aria-label', 'Address');

    harness.render({ properties: { label: binding('Address') }, styles: { auto: binding('{{true}}') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field()).not.toHaveAttribute('aria-label');
  });

  // Break this catches: dropping the textarea branch from the Label's `top`, so the
  // label would align to the top edge of a tall field instead of its first line of text.
  // Another textarea-only branch no sibling spec reaches.
  test('[TextArea-A11Y-004] a side-aligned textarea offsets its label to the first line', async () => {
    // The offset lands on the label's inner <p>, not the label element itself
    // (_ui/Label.jsx:65).
    const labelText = () => label().querySelector('p');

    harness.render({ properties: { label: binding('Address') }, styles: { alignment: binding('side') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(inlineStyle(labelText())).toContain('top: 9px');

    // Top alignment gets no offset: the label already sits above the field.
    harness.render({ properties: { label: binding('Address') }, styles: { alignment: binding('top') } });
    await waitFor(() => expect(field()).toBeTruthy());
    expect(inlineStyle(labelText())).not.toContain('top: 9px');
  });

  // Break this catches: removing the unmount guard around the deferred onFocus dispatch,
  // or making handleBlur async — a focus/blur pair would lose an event.
  test('[TextArea-ASYNC-001] a fast focus-then-blur delivers both handlers', async () => {
    harness.render({
      events: [
        ...countInvocationsOn('ta1', 'onFocus', { key: 'focusCalls' }),
        ...countInvocationsOn('ta1', 'onBlur', { key: 'blurCalls' }),
      ],
    });
    await waitFor(() => expect(field()).toBeTruthy());

    field().focus();
    fireEvent.blur(field());
    await drain();

    // Both are delivered; their relative order is deliberately not asserted.
    await waitFor(() => expect(callCount('focusCalls')).toBe(1));
    expect(callCount('blurCalls')).toBe(1);
  });
});
