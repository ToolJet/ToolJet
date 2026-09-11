/**
 * Contract tests for widget-level validation.
 *
 * Two shipped bug classes converge in this file, and both are invisible to
 * type checking and to any test that mocks the store:
 *
 *  1. `||` swallowing a legitimately falsy user value. `validateWidget`'s
 *     emptiness check (componentsSlice.js:850-861) has to treat the literal
 *     `false` as a FILLED selection for option-based widgets — a DropdownV2
 *     option may legitimately carry `value: false` — while still treating
 *     `false` as EMPTY for a TextInput. That distinction was fixed three
 *     separate times (f39ae77294, 7c31f7a2f2, 61a697cd3a) and had no
 *     regression coverage, so it is one careless `||` away from returning.
 *
 *  2. Validation *coercion* legitimately changing a resolved value.
 *     `applyDependencyUpdate` (componentsSlice.js:2765-2768) runs every
 *     cascaded value through `debugger.validateProperty`
 *     (debuggerSlice.js:170-215), which can substitute a schema default. A
 *     component's RESOLVED value can therefore differ from the EXPOSED value
 *     it was derived from, *by design*. This is routinely misdiagnosed as a
 *     staleness bug, so it is pinned here.
 *
 * Nothing is mocked. `validateWidget` resolves `{{}}` bindings through the
 * real `getResolvedValue`, and the coercion tests need the real dependency
 * graph plus the real component metadata registry, so the composed store is
 * used directly. React is never rendered — `AppBuilderTestSession` would only
 * add `act()` flushes that these synchronous assertions do not want.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();

/**
 * `validateWidget` reads the store for `{{}}` resolution, so a page must exist
 * before it is called. This is the smallest page that makes the module's
 * name->id mapping and exposed-value map real.
 */
function seedPage() {
  return seedApp({
    c1: componentDefinition('c1', 'textinput1', 'TextInput'),
    c2: componentDefinition('c2', 'text1', 'Text', {
      text: binding('{{components.textinput1.value}}'),
    }),
  });
}

/** Thin pass-through so every test states only what it is varying. */
function validate({ componentType = 'TextInput', validationObject = {}, widgetValue, ...rest }) {
  return state().validateWidget({
    validationObject,
    widgetValue,
    customResolveObjects: {},
    componentType,
    ...rest,
  });
}

beforeEach(() => {
  seedPage();
});

// The widget types whose options can carry a falsy `value`. Kept as a literal
// list here on purpose: if production adds another option widget and forgets
// it, the corresponding case below is what should fail. RadioButtonV2 was
// exactly that miss — see [RadioButtonV2-VAL-002] below.
const OPTION_VALUE_WIDGETS = ['DropdownV2', 'MultiselectV2', 'Cascader', 'RadioButtonV2'];

describe('mandatory + falsy values', () => {
  test.each(OPTION_VALUE_WIDGETS)('%s: a selected option whose value is `false` counts as FILLED', (componentType) => {
    // The user picked an option. That option's value happens to be `false`.
    // The field IS answered, so a mandatory check must not fire.
    expect(validate({ componentType, widgetValue: false, validationObject: { mandatory: { value: true } } })).toEqual({
      isValid: true,
      validationError: null,
    });
  });

  test.each(OPTION_VALUE_WIDGETS)('%s: a selected option whose value is `0` counts as FILLED', (componentType) => {
    expect(validate({ componentType, widgetValue: 0, validationObject: { mandatory: { value: true } } })).toEqual({
      isValid: true,
      validationError: null,
    });
  });

  test('[RadioButtonV2-VAL-002] a selected radio option whose value is `false` counts as filled', () => {
    // A radio group answers itself by selection, not by the truthiness of the
    // selected option's value: `{ label: 'No', value: false }` is an answer.
    expect(
      validate({ componentType: 'RadioButtonV2', widgetValue: false, validationObject: { mandatory: { value: true } } })
    ).toEqual({
      isValid: true,
      validationError: null,
    });
  });

  test('[DropdownV2-VAL-001] a selected empty-string option counts as filled', () => {
    expect(
      validate({ componentType: 'DropdownV2', widgetValue: '', validationObject: { mandatory: { value: true } } })
    ).toEqual({
      isValid: true,
      validationError: null,
    });
  });

  test('TextInput: `false` counts as EMPTY, because a text field has no option values', () => {
    // The mirror image of the cases above, and the reason the fix could not
    // simply be "treat false as filled everywhere".
    expect(
      validate({ componentType: 'TextInput', widgetValue: false, validationObject: { mandatory: { value: true } } })
    ).toEqual({ isValid: false, validationError: 'Field cannot be empty' });
  });

  test.each([
    ['empty string', ''],
    ['undefined', undefined],
    ['null', null],
  ])('TextInput: %s counts as EMPTY', (_label, widgetValue) => {
    expect(
      validate({ componentType: 'TextInput', widgetValue, validationObject: { mandatory: { value: true } } })
    ).toEqual({ isValid: false, validationError: 'Field cannot be empty' });
  });

  test('`0` counts as FILLED for a non-option widget too', () => {
    // `widgetValue !== 0` is a separate guard from the option-widget guard, so
    // a NumberInput holding zero is answered regardless of component type.
    expect(
      validate({ componentType: 'NumberInput', widgetValue: 0, validationObject: { mandatory: { value: true } } })
    ).toEqual({ isValid: true, validationError: null });
  });

  test('[MultiselectV2-VAL-001] an empty array counts as EMPTY, even for an option widget', () => {
    // Arrays short-circuit the scalar branch entirely: `[]` is "nothing
    // selected" for a MultiselectV2, and `[false]` is "one option selected".
    expect(
      validate({ componentType: 'MultiselectV2', widgetValue: [], validationObject: { mandatory: { value: true } } })
    ).toEqual({ isValid: false, validationError: 'Field cannot be empty' });
  });

  test('[MultiselectV2-VAL-001] an array holding only `false` counts as FILLED', () => {
    expect(
      validate({
        componentType: 'MultiselectV2',
        widgetValue: [false],
        validationObject: { mandatory: { value: true } },
      })
    ).toEqual({ isValid: true, validationError: null });
  });

  test('a non-mandatory field accepts an empty value', () => {
    expect(validate({ componentType: 'TextInput', widgetValue: '', validationObject: {} })).toEqual({
      isValid: true,
      validationError: null,
    });
  });

  test('mandatory is read from either `{ value: x }` or a bare value', () => {
    // Both shapes reach validateWidget in production: the unresolved schema
    // uses `{ value }`, while Form/Table adapters pass already-resolved bare
    // booleans. Dropping the `??` fallback silently disables validation for
    // one whole family of callers.
    expect(validate({ widgetValue: '', validationObject: { mandatory: true } }).isValid).toBe(false);
    expect(validate({ widgetValue: '', validationObject: { mandatory: { value: true } } }).isValid).toBe(false);
  });

  test('mandatory resolves a {{}} binding against live exposed values', () => {
    state().setExposedValue('c1', 'value', true);

    expect(
      validate({ widgetValue: '', validationObject: { mandatory: { value: '{{components.textinput1.value}}' } } })
    ).toEqual({ isValid: false, validationError: 'Field cannot be empty' });

    state().setExposedValue('c1', 'value', false);

    expect(
      validate({ widgetValue: '', validationObject: { mandatory: { value: '{{components.textinput1.value}}' } } })
    ).toEqual({ isValid: true, validationError: null });
  });
});

describe('the other validators that actually exist', () => {
  test('regex: a non-matching value is rejected with the pattern message', () => {
    expect(validate({ widgetValue: 'abc', validationObject: { regex: { value: '^[0-9]+$' } } })).toEqual({
      isValid: false,
      validationError: 'The input should match pattern',
    });
  });

  test('regex: a matching value passes', () => {
    expect(validate({ widgetValue: '123', validationObject: { regex: { value: '^[0-9]+$' } } })).toEqual({
      isValid: true,
      validationError: null,
    });
  });

  test('regex: a syntactically invalid pattern becomes a validation message, not a crash', () => {
    // An unterminated character class used to throw a SyntaxError out of
    // validateWidget and take the widget's render down with it.
    expect(validate({ widgetValue: 'abc', validationObject: { regex: { value: '[123123' } } })).toEqual({
      isValid: false,
      validationError: 'Invalid regex pattern',
    });
  });

  test('minLength: too-short input is rejected, and the bound is echoed in the message', () => {
    expect(validate({ widgetValue: 'ab', validationObject: { minLength: { value: 5 } } })).toEqual({
      isValid: false,
      validationError: 'Minimum 5 characters is needed',
    });
    expect(validate({ widgetValue: 'abcde', validationObject: { minLength: { value: 5 } } }).isValid).toBe(true);
  });

  test('maxLength: too-long input is rejected', () => {
    expect(validate({ widgetValue: 'abcdef', validationObject: { maxLength: { value: 3 } } })).toEqual({
      isValid: false,
      validationError: 'Maximum 3 characters is allowed',
    });
    expect(validate({ widgetValue: 'abc', validationObject: { maxLength: { value: 3 } } }).isValid).toBe(true);
  });

  test('minValue: a smaller number is rejected', () => {
    expect(
      validate({ componentType: 'NumberInput', widgetValue: 3, validationObject: { minValue: { value: 5 } } })
    ).toEqual({ isValid: false, validationError: 'Minimum value is 5' });
    expect(
      validate({ componentType: 'NumberInput', widgetValue: 5, validationObject: { minValue: { value: 5 } } }).isValid
    ).toBe(true);
  });

  test('minValue: `undefined` is rejected whenever a minimum is configured', () => {
    // Deliberate: an unanswered numeric field cannot satisfy a lower bound,
    // so this is rejected by minValue even without `mandatory`.
    expect(
      validate({ componentType: 'NumberInput', widgetValue: undefined, validationObject: { minValue: { value: 5 } } })
    ).toEqual({ isValid: false, validationError: 'Minimum value is 5' });
  });

  test('maxValue: a larger number is rejected', () => {
    expect(
      validate({ componentType: 'NumberInput', widgetValue: 9, validationObject: { maxValue: { value: 5 } } })
    ).toEqual({ isValid: false, validationError: 'Maximum value is 5' });
    expect(
      validate({ componentType: 'NumberInput', widgetValue: 5, validationObject: { maxValue: { value: 5 } } }).isValid
    ).toBe(true);
  });

  test('customRule: a non-empty resolved string IS the error message', () => {
    // The custom-rule contract is inverted relative to the others: the rule
    // evaluates to the message when it fails, and to a falsy value when it
    // passes.
    expect(
      validate({
        widgetValue: 'x',
        validationObject: { customRule: { value: "{{components.textinput1.value !== 'x' && 'must be x'}}" } },
      })
    ).toEqual({ isValid: false, validationError: 'must be x' });
  });

  test('customRule: a falsy resolved rule passes', () => {
    state().setExposedValue('c1', 'value', 'x');

    expect(
      validate({
        widgetValue: 'x',
        validationObject: { customRule: { value: "{{components.textinput1.value !== 'x' && 'must be x'}}" } },
      })
    ).toEqual({ isValid: true, validationError: null });
  });

  test('EmailInput: a malformed address is rejected without any regex configured', () => {
    expect(validate({ componentType: 'EmailInput', widgetValue: 'not-an-email' })).toEqual({
      isValid: false,
      validationError: 'Input should be a valid email',
    });
    expect(validate({ componentType: 'EmailInput', widgetValue: 'kavin@tooljet.com' }).isValid).toBe(true);
  });

  test('EmailInput: an empty value skips the email check and is left to `mandatory`', () => {
    // `componentType === 'EmailInput' && widgetValue` gates the check, so an
    // untouched email field reports "cannot be empty", not "invalid email".
    expect(validate({ componentType: 'EmailInput', widgetValue: '' })).toEqual({
      isValid: true,
      validationError: null,
    });
    expect(
      validate({ componentType: 'EmailInput', widgetValue: '', validationObject: { mandatory: { value: true } } })
    ).toEqual({ isValid: false, validationError: 'Field cannot be empty' });
  });

  test('[MultiselectV2-VAL-003] one selected under minSelection: 2 is invalid', () => {
    // Break this catches: dropping the minSelection branch so one selected value passes a minimum of 2.
    expect(
      validate({
        componentType: 'MultiselectV2',
        widgetValue: ['a'],
        validationObject: { minSelection: { value: 2 } },
      })
    ).toEqual({ isValid: false, validationError: 'Minimum 2 selections required' });
  });

  test('[MultiselectV2-VAL-003] three selected under maxSelection: 2 is invalid', () => {
    // Break this catches: dropping the maxSelection branch so three selected values pass a maximum of 2.
    expect(
      validate({
        componentType: 'MultiselectV2',
        widgetValue: ['a', 'b', 'c'],
        validationObject: { maxSelection: { value: 2 } },
      })
    ).toEqual({ isValid: false, validationError: 'Maximum 2 selections allowed' });
  });

  test('[MultiselectV2-VAL-003] two selected under minSelection and maxSelection of 2 is valid', () => {
    // Break this catches: off-by-one on either bound so exactly two selections is rejected.
    expect(
      validate({
        componentType: 'MultiselectV2',
        widgetValue: ['a', 'b'],
        validationObject: { minSelection: { value: 2 }, maxSelection: { value: 2 } },
      })
    ).toEqual({ isValid: true, validationError: null });
  });

  test('selection-count validators are skipped for a non-array value', () => {
    expect(
      validate({ componentType: 'DropdownV2', widgetValue: 'a', validationObject: { minSelection: { value: 2 } } })
    ).toEqual({ isValid: true, validationError: null });
  });
});

describe('known bugs: `||` still swallows a zero bound', () => {
  // BUG (unfixed): componentsSlice.js:825 `resolveValue(minValue) || undefined`
  // collapses a configured minimum of 0 to `undefined`, which skips the check
  // entirely. A NumberInput configured with "Min value: 0" therefore accepts
  // negative numbers. Same `||`-swallows-falsy class as the mandatory/`false`
  // bugs above, just not fixed yet. The fix is `??` at componentsSlice.js:825 and :835.
  // Wrong: { isValid: true }. Right: rejected with 'Minimum value is 0'.
  test.failing('minValue of 0 must reject a negative number', () => {
    expect(
      validate({ componentType: 'NumberInput', widgetValue: -5, validationObject: { minValue: { value: 0 } } })
    ).toEqual({ isValid: false, validationError: 'Minimum value is 0' });
  });

  // BUG (unfixed): componentsSlice.js:835, the maxValue twin of the above. A
  // NumberInput configured with "Max value: 0" accepts any positive number.
  // Wrong: { isValid: true }. Right: rejected with 'Maximum value is 0'.
  test.failing('maxValue of 0 must reject a positive number', () => {
    expect(
      validate({ componentType: 'NumberInput', widgetValue: 5, validationObject: { maxValue: { value: 0 } } })
    ).toEqual({ isValid: false, validationError: 'Maximum value is 0' });
  });
});

describe('validation coercion: resolved value may differ from exposed value', () => {
  // Everything in this block asserts the SAME fact from different angles:
  // `applyDependencyUpdate` (componentsSlice.js:2765-2768) pipes every
  // cascaded value through `debugger.validateProperty`, so
  // `getResolvedComponent(...)` is the value AFTER schema coercion, not the
  // value the source component exposed. `resolved !== exposed` is CORRECT
  // here. Do not "fix" it as a staleness bug.

  test('a number cascading into a string-schema property is coerced to a string', async () => {
    // Text.properties.text declares `validation.schema = { type: 'string' }`,
    // and the generated superstruct schema coerces number -> JSON.stringify.
    state().setExposedValue('c1', 'value', 42);
    await Promise.resolve();

    const resolved = state().getResolvedComponent('c2').properties.text;
    const exposed = state().getExposedValueOfComponent('c1').value;

    expect(exposed).toBe(42);
    expect(resolved).toBe('42');
    // The point of the whole block, stated as an assertion:
    expect(resolved).not.toBe(exposed);
  });

  test('a value the schema cannot coerce is REPLACED by the schema default', async () => {
    state().setExposedValue('c1', 'value', { a: 1 });
    await Promise.resolve();

    const resolved = state().getResolvedComponent('c2').properties.text;

    // findDefault({ type: 'string' }) -> '' (debuggerSlice.js:216-232). The
    // exposed value is untouched; only the dependent's resolved value is
    // substituted.
    expect(resolved).toBe('');
    expect(state().getExposedValueOfComponent('c1').value).toEqual({ a: 1 });
  });

  test('the substitution is reported to the debugger with both values', async () => {
    state().setExposedValue('c1', 'value', { a: 1 });
    await Promise.resolve();

    const log = state().debugger.logs.find((entry) => entry.componentId === 'c2');

    expect(log).toBeDefined();
    expect(log.logLevel).toBe('error');
    expect(log.message).toBe('Expected a value of type string, but received {"a":1}');
    // `resolvedProperty` is the pre-coercion value and `effectiveProperty` the
    // substituted one: the debugger drawer is the only place a user can see
    // that these two diverged.
    expect(log.error.resolvedProperty).toEqual({ text: { a: 1 } });
    expect(log.error.effectiveProperty).toEqual({ text: '' });
  });

  test('a schema-valid value passes through unchanged', async () => {
    // Control: coercion is not a blanket rewrite. Without this, the two tests
    // above would still pass if validateProperty always returned the default.
    state().setExposedValue('c1', 'value', 'hello');
    await Promise.resolve();

    expect(state().getResolvedComponent('c2').properties.text).toBe('hello');
    expect(state().debugger.logs.filter((entry) => entry.componentId === 'c2')).toHaveLength(0);
  });
});
