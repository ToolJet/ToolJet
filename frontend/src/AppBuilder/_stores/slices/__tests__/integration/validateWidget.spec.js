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

  // Break this catches: a truthiness check (`if (widgetValue)`) replacing the
  // option-widget guard — every one of these three values is a real answer the
  // user picked, and all three are falsy.
  test.each([
    ['an empty string', ''],
    ['false', false],
    ['zero', 0],
  ])('[DropdownV2-VAL-001] a selected option valued %s counts as filled', (_case, widgetValue) => {
    expect(
      validate({ componentType: 'DropdownV2', widgetValue, validationObject: { mandatory: { value: true } } })
    ).toEqual({
      isValid: true,
      validationError: null,
    });
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
  ])('[DropdownV2-VAL-001] %s counts as EMPTY, because no option is selected', (_case, widgetValue) => {
    expect(
      validate({ componentType: 'DropdownV2', widgetValue, validationObject: { mandatory: { value: true } } })
    ).toEqual({ isValid: false, validationError: 'Field cannot be empty' });
  });

  test('[TextInput-VAL-003] TextInput: `false` counts as EMPTY, because a text field has no option values', () => {
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

  // Break this catches: removing the EmailInput branch from validateWidget, so a
  // malformed address passes with no regex configured.
  test('[EmailInput-VAL-003] EmailInput: a malformed address is rejected without any regex configured', () => {
    expect(validate({ componentType: 'EmailInput', widgetValue: 'not-an-email' })).toEqual({
      isValid: false,
      validationError: 'Input should be a valid email',
    });
    expect(validate({ componentType: 'EmailInput', widgetValue: 'kavin@tooljet.com' }).isValid).toBe(true);
  });

  // Break this catches: dropping the `&& widgetValue` guard on the EmailInput branch,
  // so an untouched empty field reports "invalid email" instead of "cannot be empty".
  test('[EmailInput-VAL-003] EmailInput: an empty value skips the email check and is left to `mandatory`', () => {
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

  // Break this catches: loosening either side of the `@` back to a single character class.
  //
  // The old pattern was `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` with a `(?!.*\.\.)`
  // lookahead bolted on for consecutive dots. Because `.` and `-` sat inside the classes with
  // no position rule, a dot or hyphen was legal at the very start or end of a part, so six
  // malformed addresses were accepted. Dots and hyphens are now separators BETWEEN parts
  // rather than characters allowed anywhere in them, which also makes the `..` lookahead
  // redundant — no part can be empty, so two dots can never touch.
  test('[EmailInput-VAL-008] a dot or hyphen at the edge of the local part or a domain label is rejected', () => {
    const isValid = (widgetValue) => validate({ componentType: 'EmailInput', widgetValue }).isValid;

    // The three reported addresses.
    expect(isValid('user@.example.com')).toBe(false); // domain label starts with a dot
    expect(isValid('user.@example.com')).toBe(false); // local part ends with a dot
    expect(isValid('.user@example.com')).toBe(false); // local part starts with a dot

    // Found alongside them, same root cause.
    expect(isValid('user@-example.com')).toBe(false); // domain label starts with a hyphen
    expect(isValid('user@example-.com')).toBe(false); // domain label ends with a hyphen
    expect(isValid('.@example.com')).toBe(false); // local part is a bare dot

    // Still rejected, as before.
    expect(isValid('user..name@example.com')).toBe(false);
    expect(isValid('user@example..com')).toBe(false);
    expect(isValid('user@example.com.')).toBe(false);
    expect(isValid('@example.com')).toBe(false);
    expect(isValid('user@')).toBe(false);
    expect(isValid('user@com')).toBe(false);
    expect(isValid('user@example.c')).toBe(false); // TLD must be two or more
    expect(isValid('user@exam ple.com')).toBe(false);
    expect(isValid('plainaddress')).toBe(false);

    // And nothing legitimate is lost. Dots and hyphens stay legal between parts.
    expect(isValid('ada@tooljet.com')).toBe(true);
    expect(isValid('a@b.co')).toBe(true);
    expect(isValid('first.last@sub.domain.co.uk')).toBe(true);
    expect(isValid('user+tag@example.com')).toBe(true);
    expect(isValid('user_name@example.com')).toBe(true);
    expect(isValid('user%x@example.io')).toBe(true);
    expect(isValid('x-y@my-domain.com')).toBe(true);
    expect(isValid('UPPER@EXAMPLE.COM')).toBe(true);
  });

  // Break this catches: moving the EmailInput branch below the regex/length branches,
  // or making it fall through instead of returning. D-01 pinned this order: the
  // built-in check short-circuits, so a builder's own rules are unreachable for a
  // value that is not already a valid email.
  test('[EmailInput-VAL-007] the built-in email check short-circuits the builder’s own rules', () => {
    const forEmail = (validationObject, widgetValue) =>
      validate({ componentType: 'EmailInput', widgetValue, validationObject });

    // A regex the builder wrote to ACCEPT this value never runs.
    expect(forEmail({ regex: { value: '^internal-.*$' } }, 'internal-ada')).toEqual({
      isValid: false,
      validationError: 'Input should be a valid email',
    });
    // A length violation is masked by the email message too.
    expect(forEmail({ minLength: { value: 50 } }, 'not-an-email').validationError).toBe(
      'Input should be a valid email'
    );

    // A valid address falls through to the builder's rules normally.
    expect(forEmail({ minLength: { value: 50 } }, 'ada@tooljet.com').validationError).toBe(
      'Minimum 50 characters is needed'
    );
    expect(forEmail({ regex: { value: '^.*@tooljet\\.com$' } }, 'ada@example.com').validationError).toBe(
      'The input should match pattern'
    );
    expect(forEmail({ regex: { value: '^.*@tooljet\\.com$' } }, 'ada@tooljet.com')).toEqual({
      isValid: true,
      validationError: null,
    });
  });

  // Break this catches: adding a PasswordInput branch to validateWidget. Unlike
  // EmailInput, a password field has NO built-in format rule — every rule a builder
  // sees is one they configured — and an app relying on `regex` to enforce a password
  // policy must not be short-circuited by a hidden check.
  test('[PasswordInput-VAL-003] PasswordInput rules resolve against the shared engine, with no built-in format rule', () => {
    const forPassword = (validationObject, widgetValue) =>
      validate({ componentType: 'PasswordInput', widgetValue, validationObject });

    // No built-in rule: any non-empty string is valid until the builder says otherwise.
    expect(forPassword({}, 'not-an-email')).toEqual({ isValid: true, validationError: null });
    expect(forPassword({}, 'a')).toEqual({ isValid: true, validationError: null });

    // mandatory
    expect(forPassword({ mandatory: { value: true } }, '')).toEqual({
      isValid: false,
      validationError: 'Field cannot be empty',
    });
    expect(forPassword({ mandatory: { value: true } }, 'secret')).toEqual({ isValid: true, validationError: null });

    // regex — reachable, because nothing short-circuits ahead of it.
    const policy = { regex: { value: '^(?=.*[A-Z])(?=.*\\d).{8,}$' } };
    expect(forPassword(policy, 'short1A').validationError).toBe('The input should match pattern');
    expect(forPassword(policy, 'LongEnough1')).toEqual({ isValid: true, validationError: null });

    // minLength / maxLength
    expect(forPassword({ minLength: { value: 8 } }, 'short').validationError).toBe('Minimum 8 characters is needed');
    expect(forPassword({ maxLength: { value: 4 } }, 'toolong').validationError).toBe('Maximum 4 characters is allowed');

    // customRule, resolved through the real store
    state().setExposedValue('c1', 'value', 'secret');
    expect(
      forPassword(
        { customRule: { value: "{{components.textinput1.value !== 'secret' && 'passwords must match'}}" } },
        'secret'
      )
    ).toEqual({ isValid: true, validationError: null });
    expect(
      forPassword(
        { customRule: { value: "{{components.textinput1.value !== 'other' && 'passwords must match'}}" } },
        'secret'
      )
    ).toEqual({ isValid: false, validationError: 'passwords must match' });
  });

  // Break this catches: adding a PhoneInput branch to validateWidget. Unlike EmailInput,
  // a phone field has NO built-in format rule, so a builder's own regex is always
  // reachable. Note the widget strips the dial code BEFORE calling this engine
  // ([PhoneInput-VAL-002]); everything here is about the national number.
  test('[PhoneInput-VAL-003] PhoneInput rules resolve against the shared engine, with no built-in format rule', () => {
    const forPhone = (validationObject, widgetValue) =>
      validate({ componentType: 'PhoneInput', widgetValue, validationObject });

    // No built-in rule: any non-empty string is valid until the builder says otherwise.
    expect(forPhone({}, 'not-a-phone-number')).toEqual({ isValid: true, validationError: null });

    // mandatory
    expect(forPhone({ mandatory: { value: true } }, '')).toEqual({
      isValid: false,
      validationError: 'Field cannot be empty',
    });
    expect(forPhone({ mandatory: { value: true } }, '9876543210')).toEqual({ isValid: true, validationError: null });

    // regex — the pattern the documentation itself suggests, reachable because nothing
    // short-circuits ahead of it.
    const docsPattern = { regex: { value: '^\\d{1,10}$' } };
    expect(forPhone(docsPattern, '9876543210')).toEqual({ isValid: true, validationError: null });
    expect(forPhone(docsPattern, '98765432101').validationError).toBe('The input should match pattern');

    // minLength / maxLength, counted on the national number
    expect(forPhone({ minLength: { value: 10 } }, '987654321').validationError).toBe('Minimum 10 characters is needed');
    expect(forPhone({ minLength: { value: 10 } }, '9876543210')).toEqual({ isValid: true, validationError: null });
    expect(forPhone({ maxLength: { value: 10 } }, '98765432101').validationError).toBe(
      'Maximum 10 characters is allowed'
    );

    // customRule, resolved through the real store
    state().setExposedValue('c1', 'value', '9876543210');
    expect(
      forPhone(
        { customRule: { value: "{{components.textinput1.value.length !== 10 && 'must be 10 digits'}}" } },
        '9876543210'
      )
    ).toEqual({ isValid: true, validationError: null });
    state().setExposedValue('c1', 'value', '98765');
    expect(
      forPhone(
        { customRule: { value: "{{components.textinput1.value.length !== 10 && 'must be 10 digits'}}" } },
        '98765'
      )
    ).toEqual({ isValid: false, validationError: 'must be 10 digits' });
  });

  // Break this catches: adding a CurrencyInput branch to validateWidget, or letting it
  // reach the length rules. CurrencyInput registers minValue/maxValue rather than
  // minLength/maxLength, and the widget hands this engine a canonical numeric STRING
  // ([CurrencyInput-VAL-002]), so everything here is about numeric comparison.
  test('[CurrencyInput-VAL-003] CurrencyInput rules resolve against the shared engine, with no built-in format rule', () => {
    const forCurrency = (validationObject, widgetValue) =>
      validate({ componentType: 'CurrencyInput', widgetValue, validationObject });

    // No built-in rule: any non-empty value is valid until the builder says otherwise.
    expect(forCurrency({}, '1234.56')).toEqual({ isValid: true, validationError: null });

    // mandatory
    expect(forCurrency({ mandatory: { value: true } }, '')).toEqual({
      isValid: false,
      validationError: 'Field cannot be empty',
    });
    expect(forCurrency({ mandatory: { value: true } }, '0')).toEqual({ isValid: true, validationError: null });

    // minValue / maxValue, the pair this widget actually registers
    expect(forCurrency({ minValue: { value: 99 } }, '50').validationError).toBe('Minimum value is 99');
    expect(forCurrency({ minValue: { value: 99 } }, '100')).toEqual({ isValid: true, validationError: null });
    expect(forCurrency({ maxValue: { value: 1000 } }, '1500').validationError).toBe('Maximum value is 1000');
    expect(forCurrency({ maxValue: { value: 1000 } }, '999.99')).toEqual({ isValid: true, validationError: null });

    // regex, from the documentation's own example
    const twoDecimals = { regex: { value: '^\\d+(\\.\\d{1,2})?$' } };
    expect(forCurrency(twoDecimals, '1234.56')).toEqual({ isValid: true, validationError: null });
    expect(forCurrency(twoDecimals, '1234.5678').validationError).toBe('The input should match pattern');

    // customRule, resolved through the real store
    state().setExposedValue('c1', 'value', '50');
    expect(
      forCurrency(
        { customRule: { value: "{{Number(components.textinput1.value) < 99 && 'Value needs to be more than $99'}}" } },
        '50'
      )
    ).toEqual({ isValid: false, validationError: 'Value needs to be more than $99' });
  });

  // Break this catches: adding a TextArea branch to validateWidget. A text area has no
  // built-in format rule, so a builder's own regex is always reachable, and the length
  // rules count newlines like any other character ([TextArea-VAL-002] pins that at the
  // widget layer).
  test('[TextArea-VAL-003] TextArea rules resolve against the shared engine, with no built-in format rule', () => {
    const forTextArea = (validationObject, widgetValue) =>
      validate({ componentType: 'TextArea', widgetValue, validationObject });

    // No built-in rule: any non-empty string is valid until the builder says otherwise.
    expect(forTextArea({}, 'not-an-email\nsecond line')).toEqual({ isValid: true, validationError: null });

    // mandatory
    expect(forTextArea({ mandatory: { value: true } }, '')).toEqual({
      isValid: false,
      validationError: 'Field cannot be empty',
    });
    expect(forTextArea({ mandatory: { value: true } }, 'x')).toEqual({ isValid: true, validationError: null });

    // minLength / maxLength, counting newlines as characters
    expect(forTextArea({ minLength: { value: 5 } }, 'a\nb\nc')).toEqual({ isValid: true, validationError: null });
    expect(forTextArea({ minLength: { value: 6 } }, 'a\nb\nc').validationError).toBe('Minimum 6 characters is needed');
    expect(forTextArea({ maxLength: { value: 3 } }, 'a\nb\nc').validationError).toBe('Maximum 3 characters is allowed');

    // regex, reachable because nothing short-circuits ahead of it
    expect(forTextArea({ regex: { value: '^[a-z ]+$' } }, 'all lower')).toEqual({
      isValid: true,
      validationError: null,
    });
    expect(forTextArea({ regex: { value: '^[a-z ]+$' } }, 'Has Caps').validationError).toBe(
      'The input should match pattern'
    );

    // customRule, resolved through the real store
    state().setExposedValue('c1', 'value', 'short');
    expect(
      forTextArea(
        { customRule: { value: "{{components.textinput1.value.length < 10 && 'Value needs to be longer'}}" } },
        'short'
      )
    ).toEqual({ isValid: false, validationError: 'Value needs to be longer' });
  });
  test('selection-count validators are skipped for a non-array value', () => {
    expect(
      validate({ componentType: 'DropdownV2', widgetValue: 'a', validationObject: { minSelection: { value: 2 } } })
    ).toEqual({ isValid: true, validationError: null });
  });

  // Every rule a text field can register, applied at once — and the ORDER they
  // report in, which is what a user actually sees when more than one is violated.
  // Tagged for the TextInput contract because that widget's registered validation
  // surface is exactly this set (textinput.js:99-109), but the heading stays
  // generic: the engine is shared, and `validate()` above already defaults to
  // TextInput, so most cases in this file are text-field cases too.
  test('[TextInput-VAL-003] a whole registered rule set is applied, regex before mandatory', () => {
    const rules = {
      mandatory: { value: true },
      regex: { value: '^[A-Za-z]+$' },
      minLength: { value: 3 },
      maxLength: { value: 8 },
      customRule: { value: '' },
    };

    // An EMPTY required field reports the REGEX message, not the mandatory one:
    // unlike the email check (see the EmailInput case below), regex does not skip
    // an empty value, and it is evaluated first. A builder who configures both
    // gets "The input should match pattern" on a field the user simply left blank.
    expect(validate({ widgetValue: '', validationObject: rules }).validationError).toBe(
      'The input should match pattern'
    );
    // Mandatory is what reports when it is the only rule configured.
    expect(validate({ widgetValue: '', validationObject: { mandatory: { value: true } } }).validationError).toBe(
      'Field cannot be empty'
    );

    // Each remaining rule bites when it is the one violated.
    expect(validate({ widgetValue: '1Ada', validationObject: rules }).validationError).toBe(
      'The input should match pattern'
    );
    expect(validate({ widgetValue: 'Ad', validationObject: rules }).validationError).toBe(
      'Minimum 3 characters is needed'
    );
    expect(validate({ widgetValue: 'Adalovelace', validationObject: rules }).validationError).toBe(
      'Maximum 8 characters is allowed'
    );
    expect(
      validate({ widgetValue: 'Ada', validationObject: { ...rules, customRule: { value: 'Nope' } } }).validationError
    ).toBe('Nope');

    // ...and a value satisfying all of them passes.
    expect(validate({ widgetValue: 'Ada', validationObject: rules })).toEqual({
      isValid: true,
      validationError: null,
    });
  });
});

describe('minValue/maxValue of exactly 0 (NumberInput-VAL-006/007/008)', () => {
  // BUG (unfixed): componentsSlice.js:825 `resolveValue(minValue) || undefined`
  // collapses a configured minimum of 0 to `undefined`, which skips the check
  // entirely. Fix: `??` instead of `||`, with an explicit undefined/null/''
  // check so the unconfigured default (see NumberInput-VAL-008) isn't broken.
  test.failing('[NumberInput-VAL-006] minValue of 0 must reject a negative number', () => {
    expect(
      validate({ componentType: 'NumberInput', widgetValue: -5, validationObject: { minValue: { value: 0 } } })
    ).toEqual({ isValid: false, validationError: 'Minimum value is 0' });
  });

  // BUG (unfixed): componentsSlice.js:835, the maxValue twin of the above.
  test.failing('[NumberInput-VAL-007] maxValue of 0 must reject a positive number', () => {
    expect(
      validate({ componentType: 'NumberInput', widgetValue: 5, validationObject: { maxValue: { value: 0 } } })
    ).toEqual({ isValid: false, validationError: 'Maximum value is 0' });
  });

  // Break this catches: fixing VAL-006/007 with a naive `resolveValue(minValue) ?? undefined` —
  // `resolveValue('')` returns the literal empty string (componentsSlice.js's resolver only
  // transforms `{{}}` bindings, numberinput.js's own unconfigured default), so `'' ?? undefined`
  // stays `''`, which is not `undefined` and would wrongly enter the bound-check branch.
  test('[NumberInput-VAL-008] an unconfigured minValue/maxValue does not reject an undefined widget value', () => {
    // `{ value: '' }` — not an omitted key — is how an unconfigured minValue/maxValue actually
    // arrives (numberinput.js's `definition.validation.minValue/maxValue` default to `{ value: '' }`).
    expect(
      validate({
        componentType: 'NumberInput',
        widgetValue: undefined,
        validationObject: { minValue: { value: '' }, maxValue: { value: '' } },
      })
    ).toEqual({
      isValid: true,
      validationError: null,
    });
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
