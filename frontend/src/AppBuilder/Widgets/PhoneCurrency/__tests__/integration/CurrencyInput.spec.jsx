/**
 * CurrencyInput widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/CurrencyInput/TESTING.md
 * Every test title starts with its approved scenario ID; the `// Break this catches:`
 * comment names the production edit its oracle is meant to catch.
 *
 * Four things are specific to this widget:
 *   1. It does NOT render through BaseInput. It owns its whole DOM, so every styling
 *      and state guarantee here is re-derived rather than cited from a sibling (D-01).
 *   2. The exposed `value` is a NUMBER and is format-agnostic: the same amount whether
 *      the field displays 1,234.56 or 1.234,56.
 *   3. Validation is minValue/maxValue, not minLength/maxLength, and it compares the
 *      parsed number rather than the displayed string.
 *   4. No path validates the currency code, so an unknown one leaks the literal string
 *      "undefined" into formattedValue. D-03 and D-07 pinned that rather than fixing it.
 *
 * MOUNT-GATED STATE: `harness.render()` re-renders the SAME mounted tree, and the store
 * is a module singleton, so a scenario needing a second differently-seeded MOUNT gets a
 * second `test()` under the same scenario ID, the way PhoneInput's CTY-001 does.
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

const harness = createWidgetHarness({ componentType: 'CurrencyInput', handle: 'currencyinput1', id: 'ci1' });

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

const input = () => document.getElementById('component-ci1');
const label = () => document.querySelector('[data-cy="currencyinput1-label"]');
const fieldBox = () => document.querySelector('[data-cy="currencyinput1-actionable-section"]');
const currencySelect = () => document.querySelector('[data-cy="currencyinput1-country-select-dropdown"]');
const errorText = () => document.querySelector('[data-cy="currencyinput1-invalid-feedback"]');
const clearButton = () => screen.queryByRole('button', { name: 'Clear' });
const callCount = (key = 'calls') => harness.variables()?.[key] ?? 0;
const inlineStyle = (node) => (node.getAttribute('style') ?? '').toLowerCase();
/**
 * The currency select is `react-select`, which styles through emotion-generated CLASSES
 * rather than inline styles. Emotion injects the rules into `document.styleSheets`, and
 * the control's generated class changes whenever the resolved style object does.
 */
const selectControlCss = () => {
  const generated = [...document.querySelector('.country-ci1__control').classList].find((c) => c.startsWith('css-'));
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

describe('default value and number format', () => {
  // Break this catches: publishing the display string instead of the parsed number, or
  // making the published value depend on the display format. An app doing arithmetic on
  // {{...value}} would start receiving "1.234,56" and get NaN.
  test('[CurrencyInput-PROP-003] the Default value seeds the field and publishes a format-agnostic number', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('1,234.56');
    expect(harness.exposed().value).toBe(1234.56);
    expect(typeof harness.exposed().value).toBe('number');
  });

  // Second mount for the same scenario: the number format is read at mount.
  test('[CurrencyInput-PROP-003] the published number is the same under a European format', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}'), numberFormat: binding('eu') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('1.234,56'); // displayed differently
    expect(harness.exposed().value).toBe(1234.56); // published identically
  });

  // Break this catches: dropping either half of the format config — the grouping locale
  // or the two separator characters. A European app would render US separators.
  test('[CurrencyInput-FMT-001] the number format drives the separators the field renders', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('1,234.56');

    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}'), numberFormat: binding('eu') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('1.234,56');
  });

  // Break this catches: dropping the previousNumberFormat ref, so the existing string is
  // re-parsed with the NEW separators. "1,234.56" read as European is 1.23456, and the
  // amount silently changes by three orders of magnitude.
  test('[CurrencyInput-FMT-002] switching number format reformats the value without changing its magnitude', async () => {
    harness.render({ properties: { value: binding('{{0}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    // The value must be TYPED, not seeded. A seeded Default value is stored as the
    // canonical "1234.56", which both formats parse identically, so a mis-parse would be
    // invisible. Typing stores the library's formatted string, which carries US
    // separators and only parses correctly under the format it was written in.
    await userEvent.clear(input());
    await userEvent.type(input(), '1234.56');
    await waitFor(() => expect(input().value).toBe('1,234.56'));
    expect(harness.exposed().value).toBe(1234.56);

    harness.setComponentProperty('ci1', 'numberFormat', 'eu', 'properties');

    await waitFor(() => expect(input().value).toBe('1.234,56'));
    expect(harness.exposed().value).toBe(1234.56); // the number is untouched
  });

  // Second mount: a zero must reformat too. The guard is on emptiness, not on `num !== 0`,
  // so a falsy-but-real zero is not skipped.
  test('[CurrencyInput-FMT-002] a zero value reformats like any other', async () => {
    harness.render({ properties: { value: binding('{{0}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    harness.setComponentProperty('ci1', 'numberFormat', 'eu', 'properties');

    await waitFor(() => expect(harness.exposed().value).toBe(0));
    expect(input().value).not.toBe('');
  });
});

describe('formatted value', () => {
  // Break this catches: dropping the [country, value, numberFormat] republish, or building
  // formattedValue from the raw number instead of the formatter — an app showing a receipt
  // line would render "1234.56" with no symbol, or go stale after a currency switch.
  test('[CurrencyInput-FMT-003] formattedValue carries the currency prefix and the format-specific separators', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().formattedValue).toBe('$ 1,234.56');

    // A value change republishes it.
    await harness.act('setValue', '99');
    await drain();
    await waitFor(() => expect(harness.exposed().formattedValue).toBe('$ 99'));

    // A currency change republishes it with the new prefix.
    await harness.act('setCountryCode', 'IN');
    await drain();
    await waitFor(() => expect(harness.exposed().formattedValue).toBe('₹ 99'));
  });

  // Second mount for the same scenario: the number format is read at mount, and
  // formattedValue must follow it rather than always using US separators.
  test('[CurrencyInput-FMT-003] formattedValue follows a European number format', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}'), numberFormat: binding('eu') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().formattedValue).toBe('$ 1.234,56');
  });
});

describe('events', () => {
  // Break this catches: moving fireEvent('onChange') out of onInputValueChange, firing it
  // twice per keystroke, or removing the library's same-value guard so a no-op keystroke
  // re-runs the builder's handler.
  test('[CurrencyInput-EVT-001] typing fires onChange once per accepted keystroke and republishes the value', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ci1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), '123');

    await waitFor(() => expect(harness.exposed().value).toBe(123));
    expect(callCount()).toBe(3);
  });
});

describe('component-specific actions', () => {
  // Break this catches: dropping fireEvent('onChange') from the setValue handle, or
  // publishing the display string instead of the parsed number.
  test('[CurrencyInput-CSA-001] setValue writes the amount, publishes the number, and fires onChange once', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ci1', 'onChange') });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setValue', '2500.75');
    await drain();

    expect(harness.exposed().value).toBe(2500.75);
    await waitFor(() => expect(input().value).toBe('2,500.75'));
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: deriving the display string and the number from separate paths in the
  // currency `setValue` handle — the `!isNaN(Number(value))` gate that used to skip formatting.
  //
  // Any separator makes `Number(value)` NaN, so a string carrying one fell to the raw branch
  // and the UNFORMATTED text became the display string, while `setCurrencyInputValue` was
  // called with no second argument and re-derived the number through `parseValueToNumber`,
  // which does understand separators. The two disagreed: the field rendered `NaN.56` and
  // `formattedValue` read `$ NaN.56`, while `value` held 12.564 and `isValid` stayed true.
  // Normalising once and feeding both from the same number is what keeps them in step.
  test('[CurrencyInput-CSA-011] setValue normalises a separator-carrying string instead of rendering NaN', async () => {
    const setTo = async (v) => {
      harness.render({ properties: { value: binding('') } });
      await waitFor(() => expect(input()).toBeTruthy());
      await harness.act('setValue', v);
      await drain();
      return {
        field: input().value,
        value: harness.exposed().value,
        formatted: harness.exposed().formattedValue,
        isValid: harness.exposed().isValid,
      };
    };

    // US format: ',' groups and '.' is the decimal, so '12.56,4' reads as 12.564 and rounds
    // to the configured 2 places. Previously: field 'NaN.56', value 12.564.
    expect(await setTo('12.56,4')).toEqual({ field: '12.56', value: 12.56, formatted: '$ 12.56', isValid: true });

    // Same string with the separators swapped groups to 1256.4. Previously: field 'NaN.4'.
    expect(await setTo('12,56.4')).toEqual({ field: '1,256.4', value: 1256.4, formatted: '$ 1,256.4', isValid: true });

    // A grouped string the author copied back out of the field survives a round trip.
    expect(await setTo('2,500.75')).toEqual({
      field: '2,500.75',
      value: 2500.75,
      formatted: '$ 2,500.75',
      isValid: true,
    });

    // An empty write still EMPTIES the field. Without its own guard the normalisation would
    // turn it into the number 0 and render '0', so clearing through setValue would silently
    // become setting a zero amount.
    expect((await setTo('')).field).toBe('');
    expect((await setTo(null)).field).toBe('');
    expect((await setTo(undefined)).field).toBe('');
    // A real zero is still a real zero, and is not confused with emptiness.
    expect((await setTo(0)).field).toBe('0');

    // Whatever the input, the field and the exposed number never disagree.
    for (const v of ['12.564', '1256.4', 1256.4, '0', 0]) {
      const r = await setTo(v);
      expect(r.field).not.toContain('NaN');
      expect(Number.isFinite(r.value)).toBe(true);
      expect(r.formatted).not.toContain('NaN');
    }
  });
});

describe('disabled, loading and visibility', () => {
  // Break this catches: gating only the input and leaving the currency select operable —
  // a disabled Currency Input would still let a user change the currency, which rewrites
  // formattedValue.
  test('[CurrencyInput-STATE-001] disabledState disables both the input and the currency dropdown', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute('aria-disabled', 'true');
    await userEvent.type(input(), '9');
    expect(harness.exposed().value).toBe(1234.56); // unchanged

    // The select collapses to its narrow, indicator-less form when it cannot be used.
    expect(currencySelect().querySelectorAll('svg')).toHaveLength(1);
  });
});

describe('validation', () => {
  // Break this catches: validating the displayed STRING instead of the parsed number. A
  // European "1.234,56" compared as text would satisfy or violate a numeric bound
  // arbitrarily, so the same amount would pass in one format and fail in the other.
  test('[CurrencyInput-VAL-002] rules are judged against the numeric value, whatever the display format', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') },
      validation: { minValue: binding('{{2000}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') },
      validation: { maxValue: binding('{{2000}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);
  });

  // Second mount: the same amount under a European display must reach the same verdict.
  test('[CurrencyInput-VAL-002] a European display value reaches the same verdict', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}'), numberFormat: binding('eu') },
      validation: { minValue: binding('{{2000}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('1.234,56');
    expect(harness.exposed().isValid).toBe(false); // judged as 1234.56, not 1.23456
  });
});

describe('label, placeholder and property changes', () => {
  // Break this catches: dropping the [label] republish.
  test('[CurrencyInput-PROP-001] the configured label labels the field and is published as `label`', async () => {
    harness.render({ properties: { label: binding('Reimbursement Amount') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(label()).toHaveTextContent('Reimbursement Amount');
    expect(harness.exposed().label).toBe('Reimbursement Amount');

    harness.setComponentProperty('ci1', 'label', 'Claim total', 'properties');
    await waitFor(() => expect(harness.exposed().label).toBe('Claim total'));
    expect(label()).toHaveTextContent('Claim total');
  });

  // Break this catches: passing `placeholder` as the value instead of the placeholder, or
  // dropping it entirely.
  //
  // A Currency Input starts at 0 rather than empty, because `properties.value` is
  // schema-typed `number` (D-08). The placeholder is therefore not visible on load — it
  // becomes visible once the user empties the field, which is the intended behaviour for
  // a numeric field. Both halves are pinned here.
  test('[CurrencyInput-PROP-002] the placeholder is set, and becomes visible once the field is emptied', async () => {
    harness.render({ properties: { value: binding('{{12}}'), placeholder: binding('Enter the amount in USD') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('placeholder', 'Enter the amount in USD');
    expect(input().value).toBe('12'); // the value wins while there is one

    await userEvent.clear(input());

    await waitFor(() => expect(input().value).toBe('')); // now the placeholder shows
    expect(input()).toHaveAttribute('placeholder', 'Enter the amount in USD');
  });

  // Break this catches: gating the [properties.value] effect on a "field is untouched"
  // flag, or adding fireEvent('onChange') to it.
  test('[CurrencyInput-PROP-004] a re-resolved Default value replaces typed text and fires no onChange', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') },
      events: countInvocationsOn('ci1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(callCount()).toBe(0);

    harness.setComponentProperty('ci1', 'value', '{{9999.99}}', 'properties');

    await waitFor(() => expect(harness.exposed().value).toBe(9999.99));
    await waitFor(() => expect(input().value).toBe('9,999.99'));
    expect(callCount()).toBe(0); // the overwrite is silent
  });

  // Break this catches: dropping the coercion report for a schema-rejected binding, so a
  // broken Default value is silently replaced with nothing telling the builder why.
  //
  // Unlike the string-typed siblings, the schema here is `number` with `defaultValue: 0`,
  // so a rejected binding becomes 0 rather than an empty field (D-08).
  test('[CurrencyInput-PROP-005] a schema-rejected Default value falls back to zero and is reported', async () => {
    harness.render({ properties: { value: binding('{{ ({ id: 1 }) }}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    await drain();

    expect(input().value).toBe('0');
    expect(harness.exposed().value).toBe(0);
    const [log] = useStore.getState().debugger.logs.filter((entry) => entry.componentId === 'ci1');
    expect(log).toBeDefined();
    expect(log.logLevel).toBe('error');
    expect(log.error.effectiveProperty).toEqual({ value: 0 });
  });

  // Break this catches: hardcoding a decimal limit instead of reading Decimal places.
  test('[CurrencyInput-PROP-006] decimalPlaces limits what the field accepts', async () => {
    harness.render({ properties: { value: binding('{{0}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.clear(input());
    await userEvent.type(input(), '12.3456');

    await waitFor(() => expect(input().value).toBe('12.34'));
  });

  // Second mount for the same scenario. Characterization of a defect (D-09): the widget
  // passes `decimalsLimit={Number(decimalPlaces) || 0}`, and the library reads `0` as
  // UNSET rather than as zero decimals, falling back to its own default of two. So an
  // explicit 0, a non-numeric setting and an empty setting all behave identically, and a
  // zero-decimal currency such as JPY cannot be configured.
  //
  // Break this catches: a fix that changes any of these three without updating the
  // contract. D-09 records that `allowDecimals` is the lever such a fix would need —
  // `decimalsLimit` alone cannot express zero decimals.
  // Break this catches: expressing "zero decimals" through `decimalsLimit` alone. `0` is falsy
  // inside the library, which resolves `decimalsLimit || fixedDecimalLength || 2` and so reads an
  // explicit 0 as UNSET and applies its own default of two (react-currency-input-field
  // index.js:406). `decimalsLimit` cannot say "no decimals" at all — `allowDecimals` is the only
  // lever — so a whole-number currency such as JPY or KRW could not be configured.
  //
  // Reverses the answer recorded in D-09, which characterised this as shipped.
  test('[CurrencyInput-PROP-006] a decimalPlaces of zero refuses the decimal separator outright', async () => {
    harness.render({ properties: { value: binding('{{0}}'), decimalPlaces: binding('{{0}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.clear(input());
    await userEvent.type(input(), '12.3456');

    // Previously '12.34': the 0 was read as unset and the library's own two-decimal default won.
    // The separator is REFUSED rather than treated as a terminator, so the digits run together
    // into a whole number — the same result D-09 measured in a real browser.
    await waitFor(() => expect(input().value).toBe('123,456'));
    expect(harness.exposed().value).toBe(123456);

    // One or more decimals is untouched by the fix.
    for (const [setting, expected] of [
      ['{{1}}', '12.3'],
      ['{{3}}', '12.345'],
    ]) {
      harness.render({ properties: { value: binding('{{0}}'), decimalPlaces: binding(setting) } });
      await waitFor(() => expect(input()).toBeTruthy());
      await userEvent.clear(input());
      await userEvent.type(input(), '12.3456');
      await waitFor(() => expect(input().value).toBe(expected));
    }
  });

  // Break this catches: collapsing an UNUSABLE setting to zero decimals along with an explicit 0.
  // `Number('abc')` is NaN and `Number('')` is 0, so a naive `Number(decimalPlaces) > 0` would turn
  // a cleared or fx-broken setting into a whole-number field instead of the documented default.
  test('[CurrencyInput-PROP-006] a non-numeric or empty decimalPlaces still falls back to two decimals', async () => {
    for (const setting of ['abc', '']) {
      harness.render({ properties: { value: binding('{{0}}'), decimalPlaces: binding(setting) } });
      await waitFor(() => expect(input()).toBeTruthy());

      await userEvent.clear(input());
      await userEvent.type(input(), '12.3456');

      await waitFor(() => expect(input().value).toBe('12.34'));
    }
  });
});

describe('currency', () => {
  // Break this catches: dropping the `properties.defaultCountry || 'US'` seed, so a
  // configured Default Currency would be ignored and every field would start as USD.
  test('[CurrencyInput-CTY-001] the default currency seeds the country, the prefix and formattedValue', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}'), defaultCountry: binding('IN') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().country).toBe('IN');
    expect(harness.exposed().formattedValue).toContain('₹');
  });

  // Second mount for the same scenario: the country is seeded once, in useState.
  test('[CurrencyInput-CTY-001] with no default currency configured the widget falls back to US', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().country).toBe('US');
    expect(harness.exposed().formattedValue).toContain('$');
  });

  // Break this catches: dropping the setCountryCode handle from the mount publish. It is
  // documented, so an app following the docs would hit "not a function".
  test('[CurrencyInput-CTY-002] setCountryCode switches the currency and leaves the amount alone', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setCountryCode', 'IN');
    await drain();

    expect(harness.exposed().country).toBe('IN');
    expect(harness.exposed().formattedValue).toContain('₹');
    expect(harness.exposed().value).toBe(1234.56); // the amount is untouched
  });

  // Characterization of a known defect (D-03 and D-07). Break this catches: someone
  // adding a guard to ONE of the two entry points, which would half-fix the leak and
  // leave the contract describing behaviour that no longer exists.
  test('[CurrencyInput-CTY-003] an unknown currency code is accepted and leaks "undefined" into formattedValue', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setCountryCode', 'ZZZ');
    await drain();

    expect(harness.exposed().country).toBe('ZZZ');
    expect(harness.exposed().formattedValue).toBe('undefined 1,234.56');
  });

  // Second mount: the same bad state through the OTHER entry point, the country seed.
  test('[CurrencyInput-CTY-003] an unknown default currency leaks the same way at mount', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}'), defaultCountry: binding('ZZZ') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(harness.exposed().country).toBe('ZZZ');
    expect(harness.exposed().formattedValue).toBe('undefined 1,234.56');
  });

  // Break this catches: dropping fireEvent('onChange') from the dropdown handler, or
  // letting a currency change rewrite the amount.
  test('[CurrencyInput-CTY-005] changing currency through the dropdown keeps the amount and fires onChange', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') },
      events: countInvocationsOn('ci1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());
    const before = harness.exposed().value;

    // The dropdown's onChange is the seam; react-select's menu itself is browser-owned.
    await harness.act('setCountryCode', 'GB');
    await drain();
    expect(callCount()).toBe(0); // the CSA path deliberately does not fire it

    expect(harness.exposed().value).toBe(before);
  });

  // Characterization under D-06. Break this catches: aligning the two paths in either
  // direction without updating the contract — apps today see onChange from the dropdown
  // and not from the action.
  test('[CurrencyInput-CTY-009] setCountryCode does not fire onChange, unlike the dropdown', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}') },
      events: countInvocationsOn('ci1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setCountryCode', 'IN');
    await drain();

    expect(harness.exposed().country).toBe('IN'); // the change happened
    expect(callCount()).toBe(0); // but no handler ran
  });

  // Break this catches: dropping the [defaultCountry] effect, so a bound Default Currency
  // would only ever apply at mount.
  test('[CurrencyInput-CTY-006] a rebound default currency changes the currency after mount', async () => {
    harness.render({ properties: { value: binding('{{1234.56}}'), defaultCountry: binding('US') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().country).toBe('US');

    harness.setComponentProperty('ci1', 'defaultCountry', 'IN', 'properties');

    await waitFor(() => expect(harness.exposed().country).toBe('IN'));
  });

  // Break this catches: rendering the dropdown indicator unconditionally, so a builder
  // who turned currency change off would still get an operable picker.
  test('[CurrencyInput-CTY-007] isCountryChangeEnabled removes the currency-change affordance', async () => {
    harness.render({ properties: { isCountryChangeEnabled: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    const enabledIcons = currencySelect().querySelectorAll('svg').length;

    harness.render({ properties: { isCountryChangeEnabled: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(currencySelect().querySelectorAll('svg').length).toBeLessThan(enabledIcons);
    expect(currencySelect()).toBeTruthy(); // the prefix still shows
  });

  // Break this catches: tying the flag to the change affordance, so turning one off would
  // silently remove the other.
  test('[CurrencyInput-CTY-008] showFlag gates the flag independently of the change affordance', async () => {
    harness.render({ properties: { showFlag: binding('{{true}}'), isCountryChangeEnabled: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    const withFlag = currencySelect().innerHTML;

    harness.render({ properties: { showFlag: binding('{{false}}'), isCountryChangeEnabled: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    const withoutFlag = currencySelect().innerHTML;

    expect(withoutFlag).not.toBe(withFlag);
    // Turning the flag off must not take the dropdown indicator with it.
    expect(currencySelect().querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});

describe('more events', () => {
  // Break this catches: dropping the `e.key === 'Enter'` guard in handleKeyUp.
  test('[CurrencyInput-EVT-002] Enter fires onEnterPressed once, and only for Enter', async () => {
    harness.render({ properties: { value: binding('') }, events: countInvocationsOn('ci1', 'onEnterPressed') });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.type(input(), '12');
    expect(callCount()).toBe(0); // plain digits must not trigger it

    await userEvent.type(input(), '{enter}');

    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: dropping fireEvent('onFocus') from handleFocus.
  test('[CurrencyInput-EVT-003] focusing the field fires onFocus once', async () => {
    harness.render({ events: countInvocationsOn('ci1', 'onFocus') });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    await drain();

    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: removing setShowValidationError(true) from handleBlur.
  test('[CurrencyInput-EVT-004] blurring fires onBlur once and reveals a pending validation message', async () => {
    harness.render({
      properties: { value: binding('{{12}}') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('ci1', 'onBlur'),
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    // An untouched Currency Input holds 0 and is valid (D-08); emptying it is what makes
    // a mandatory field invalid, so the message has something to reveal on blur.
    await userEvent.clear(input());
    fireEvent.blur(input());

    await waitFor(() => expect(callCount()).toBe(1));
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });
});

describe('remaining actions', () => {
  // Break this catches: ignoring setValue's second parameter. The currency half takes the
  // same unvalidated path as setCountryCode, so an unknown code is stored as-is (D-03).
  test('[CurrencyInput-CSA-002] setValue’s second parameter switches the currency', async () => {
    harness.render({ properties: { value: binding('{{0}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setValue', '500', 'IN');
    await drain();

    expect(harness.exposed().country).toBe('IN');
    expect(harness.exposed().value).toBe(500);
    expect(harness.exposed().formattedValue).toContain('₹');
  });

  // Break this catches: adding setShowValidationError(true) to clearValue, which would
  // make Form clearForm paint an untouched form red.
  test('[CurrencyInput-CSA-003] clear empties the field and fires onChange without changing message visibility', async () => {
    harness.render({
      properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') },
      validation: { mandatory: binding('{{true}}') },
      events: countInvocationsOn('ci1', 'onChange'),
    });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('clear');
    await drain();

    await waitFor(() => expect(input().value).toBe(''));
    await waitFor(() => expect(callCount()).toBe(1));
    expect(errorText()).toBeNull(); // emptied, but not yet accused
  });

  // Break this catches: pointing setFocus at the wrong ref.
  test('[CurrencyInput-CSA-004] setFocus puts DOM focus in the field', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.activeElement).not.toBe(input());

    await harness.act('setFocus');

    expect(document.activeElement).toBe(input());
  });

  // Break this catches: setBlur calling something other than the input's blur.
  test('[CurrencyInput-CSA-005] setBlur removes DOM focus and runs the blur path', async () => {
    harness.render({ events: countInvocationsOn('ci1', 'onBlur') });
    await waitFor(() => expect(input()).toBeTruthy());
    input().focus();
    expect(document.activeElement).toBe(input());

    await harness.act('setBlur');

    expect(document.activeElement).not.toBe(input());
    await waitFor(() => expect(callCount()).toBe(1));
  });

  // Break this catches: dropping the paired setExposedVariable('isVisible', ...).
  test('[CurrencyInput-CSA-006] setVisibility hides the field and republishes isVisible', async () => {
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
  test('[CurrencyInput-CSA-007] setDisable disables the field and republishes isDisabled', async () => {
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
  test('[CurrencyInput-CSA-008] setLoading shows the loader, blocks input, and republishes isLoading', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(document.querySelector('.tj-widget-loader')).toBeNull();

    await harness.act('setLoading', true);

    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
  });

  // Break this catches: widening useInput's setText registration to currency inputs, or
  // publishing a countryCode this widget deliberately does not have. Documentation and
  // runtime agree on eight handles and nine variables.
  test('[CurrencyInput-CSA-009] CurrencyInput publishes eight actions and nine variables, and no setText', async () => {
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
    expect(handles).not.toContain('setText');
    expect(handles).not.toContain('disable');

    const variables = entries
      .filter(([, v]) => typeof v !== 'function')
      .map(([k]) => k)
      .filter((k) => k !== 'id')
      .sort();
    expect(variables).toEqual(
      [
        'country',
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
    // PhoneInput publishes countryCode; this widget deliberately does not.
    expect(variables).not.toContain('countryCode');
  });

  // Break this catches: removing the setDisable(disabledState) write from the
  // [disabledState] effect — a property change could no longer correct a CSA-set state.
  test('[CurrencyInput-CSA-010] a CSA state is sticky until the matching property actually changes', async () => {
    harness.render({ properties: { value: binding('{{100}}'), disabledState: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setValue', '250');
    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    // A no-op rewrite must not revert the CSA.
    harness.setComponentProperty('ci1', 'disabledState', '{{false}}', 'properties');
    await drain();
    expect(harness.exposed().isDisabled).toBe(true);
    expect(harness.exposed().value).toBe(250);

    // A genuine change wins and republishes.
    harness.setComponentProperty('ci1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    harness.setComponentProperty('ci1', 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));
    expect(input().disabled).toBe(false);
  });
});

describe('remaining state', () => {
  // Break this catches: rendering the loader without folding loading into the disabled
  // state — a user could type an amount that is about to be replaced.
  test('[CurrencyInput-STATE-002] loadingState renders the loader and blocks input', async () => {
    harness.render({ properties: { value: binding('{{100}}'), loadingState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(document.querySelector('.tj-widget-loader')).toBeTruthy();
    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute('aria-busy', 'true');
  });

  // Break this catches: dropping `visibility` from the error block's guard.
  test('[CurrencyInput-STATE-003] visibility false hides the field and suppresses its validation message', async () => {
    harness.render({
      properties: { value: binding('{{100}}'), visibility: binding('{{false}}') },
      validation: { minValue: binding('{{500}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(fieldBox().closest('.text-input').className).toMatch(/\binvisible\b/);
    expect(input()).toHaveAttribute('aria-hidden', 'true');

    fireEvent.blur(input()); // reveal the error, which must still not render
    await drain();
    expect(errorText()).toBeNull();
  });

  // Break this catches: removing any of the property effects.
  test('[CurrencyInput-STATE-004] isVisible, isDisabled and isLoading track their properties on change', async () => {
    harness.render();
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isVisible).toBe(true);
    expect(harness.exposed().isDisabled).toBe(false);
    expect(harness.exposed().isLoading).toBe(false);

    harness.setComponentProperty('ci1', 'visibility', '{{false}}', 'properties');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));

    harness.setComponentProperty('ci1', 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    harness.setComponentProperty('ci1', 'loadingState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    expect(input().disabled).toBe(true);
  });

  // Break this catches: widening useInput's `disable` seed to
  // `disabledState || loadingState`.
  test('[CurrencyInput-STATE-005] a field that mounts loading is interactive again once loading clears', async () => {
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
  test('[CurrencyInput-VAL-001] mandatory marks the input required and publishes isMandatory', async () => {
    harness.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input()).toHaveAttribute('aria-required', 'true');
    expect(harness.exposed().isMandatory).toBe(true);
    expect(label()).toHaveTextContent('*');
  });

  // Break this catches: reverting 6713df59a2 — reading the `validate` prop directly
  // instead of validateRef.current means a value written after a rule edit is judged by
  // the OLD rule.
  test('[CurrencyInput-VAL-004] editing a rule re-validates the current value with no keystroke', async () => {
    harness.render({ properties: { value: binding('{{100}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);

    harness.setComponentProperty('ci1', 'minValue', '{{500}}', 'validation');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    // A value written AFTER the rule change is judged by the new rule.
    await harness.act('setValue', '200');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    await harness.act('setValue', '900');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));
  });

  // Break this catches: dropping any setExposedVariable('isValid', ...) from the
  // value-writing paths — an app gating submit would act on a stale verdict.
  test('[CurrencyInput-VAL-005] isValid is published and tracks every value write', async () => {
    harness.render({ properties: { value: binding('{{100}}') }, validation: { minValue: binding('{{500}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(false);

    await harness.act('setValue', '900');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await harness.act('setValue', '10');
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
  });

  // Break this catches: making useShowValidationOnFormSubmit reveal unconditionally —
  // every field with a rule would load pre-accused.
  test('[CurrencyInput-VAL-006] the message is hidden until the user leaves the field', async () => {
    harness.render({ properties: { value: binding('{{100}}') }, validation: { minValue: binding('{{500}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(errorText()).toBeNull();
    expect(harness.exposed().isValid).toBe(false);

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toHaveTextContent('Minimum value is 500'));
  });

  // Break this catches: dropping aria-invalid, the is-invalid class, or the currency
  // select's error border — the two halves of one control would disagree about validity.
  test('[CurrencyInput-VAL-007] a revealed invalid field is marked invalid on the control and the currency select', async () => {
    harness.render({
      properties: { value: binding('{{100}}') },
      validation: { minValue: binding('{{500}}') },
      styles: { borderColor: binding('#123456') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-invalid', 'false');

    fireEvent.blur(input());

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'true'));
    expect(input().className).toMatch(/\bis-invalid\b/);
    expect(selectControlCss()).toContain('border-color: var(--status-error-strong)');
  });
});

describe('clear button', () => {
  // Break this catches: rendering the clear button whenever the flag is on. The option is
  // undocumented, so this contract is its only specification.
  test('[CurrencyInput-CLR-001] the clear button appears only when the field holds a value', async () => {
    harness.render({ properties: { value: binding('{{100}}'), showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeTruthy();

    await harness.act('clear');
    await waitFor(() => expect(clearButton()).toBeNull());
  });

  // Break this catches: replacing the `value !== ''` emptiness test with a falsy check. A
  // legitimate zero would then be mistaken for empty and lose its clear button — and zero
  // is the value an untouched Currency Input actually holds (D-08).
  test('[CurrencyInput-CLR-002] a zero amount counts as filled', async () => {
    harness.render({ properties: { value: binding('{{0}}'), showClearBtn: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('0');
    expect(harness.exposed().value).toBe(0);
    expect(clearButton()).toBeTruthy();
  });

  // Break this catches: dropping the onClick, or calling a setter that does not fire
  // On change, so an app would not learn the field was emptied.
  test('[CurrencyInput-CLR-003] clicking clear empties the field and fires onChange', async () => {
    harness.render({
      properties: { value: binding('{{100}}'), showClearBtn: binding('{{true}}') },
      events: countInvocationsOn('ci1', 'onChange'),
    });
    await waitFor(() => expect(clearButton()).toBeTruthy());

    await userEvent.click(clearButton());

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
  test('[CurrencyInput-STYLE-011] the field box height follows a top label and fills the box otherwise', async () => {
    const boxHeightAt = async (alignment, labelFontSize) => {
      harness.render({
        properties: { value: binding('{{100}}'), label: binding('Lbl') },
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

  test('[CurrencyInput-CLR-006] the clear button stays centred on the field as a top label grows', async () => {
    const atLabelSize = async (labelFontSize) => {
      harness.render({
        properties: { value: binding('{{100}}'), showClearBtn: binding('{{true}}'), label: binding('Lbl') },
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
      properties: { value: binding('{{100}}'), showClearBtn: binding('{{true}}'), label: binding('Lbl') },
      styles: { alignment: binding('side'), labelFontSize: binding('{{32}}') },
    });
    await waitFor(() => expect(clearButton()).toBeTruthy());
    expect(clearButton().style.top).toBe('50%');
  });

  test('[CurrencyInput-CLR-005] clearing a mandatory field reveals the error with no prior blur', async () => {
    harness.render({
      properties: { value: binding('{{100}}'), showClearBtn: binding('{{true}}') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(clearButton()).toBeTruthy());
    expect(errorText()).toBeNull();

    await userEvent.click(clearButton());

    await waitFor(() => expect(input().value).toBe(''));
    await waitFor(() => expect(errorText()).toHaveTextContent('Field cannot be empty'));
  });

  // Break this catches: reading only showClearBtn and the value, so a disabled or loading
  // field would still offer a working clear button.
  test('[CurrencyInput-CLR-004] the clear button is hidden while the field is disabled or loading', async () => {
    harness.render({
      properties: { value: binding('{{100}}'), showClearBtn: binding('{{true}}'), disabledState: binding('{{true}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(clearButton()).toBeNull();

    harness.render({
      properties: { value: binding('{{100}}'), showClearBtn: binding('{{true}}'), loadingState: binding('{{true}}') },
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
  test('[CurrencyInput-FORM-001] submitting the Form reveals the child’s message without a blur', async () => {
    harness.renderInsideForm({
      properties: { value: binding('{{100}}') },
      validation: { minValue: binding('{{500}}') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    await formAct('submitForm');

    await waitFor(() => expect(errorText()).toHaveTextContent('Minimum value is 500'));
  });

  // Break this catches: dropping useFormClear(clearValue).
  test('[CurrencyInput-FORM-002] the Form clearForm action empties the child field', async () => {
    harness.renderInsideForm({ properties: { value: binding('{{1234.56}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('1,234.56');

    await formAct('clearForm');

    await waitFor(() => expect(input().value).toBe(''));
  });

  // Break this catches: dropping the `children` map from the Form's exposed variables.
  test('[CurrencyInput-FORM-003] the child’s actions are reachable through the Form’s children map', async () => {
    harness.renderInsideForm({ properties: { value: binding('{{0}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    await waitFor(() => expect(formExposed()?.children?.currencyinput1?.setValue).toBeInstanceOf(Function));
    await harness.session.store.act(async () => {
      await formExposed().children.currencyinput1.setValue('750');
    });

    await waitFor(() => expect(harness.exposed().value).toBe(750));
  });
});

describe('styles', () => {
  // Break this catches: dropping the finite/positive guard in getLabelFontSize.
  test('[CurrencyInput-STYLE-001] labelFontSize drives the label size and falls back to 12px', async () => {
    expect(getLabelFontSize(18)).toBe('18px');
    expect(getLabelFontSize(0)).toBe('12px');
    expect(getLabelFontSize('abc')).toBe('12px');

    harness.render({ styles: { labelFontSize: binding('{{20}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(label())).toContain('font-size: 20px');
  });

  // Break this catches: widening the width branch so a top-aligned or auto-width label
  // starts stealing width from the field.
  test('[CurrencyInput-STYLE-002] the field width is derived from widthType, auto and alignment together', async () => {
    expect(getWidthTypeOfComponentStyles('ofComponent', 33, false, 'side')).toEqual({ width: '67%', minWidth: '20%' });
    expect(getWidthTypeOfComponentStyles('ofComponent', 33, true, 'side')).toEqual({
      width: '100%',
      minWidth: undefined,
    });
    expect(getWidthTypeOfComponentStyles('ofComponent', 33, false, 'top')).toEqual({
      width: '100%',
      minWidth: undefined,
    });

    harness.render({ styles: { alignment: binding('side'), auto: binding('{{false}}'), width: binding('{{33}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(inlineStyle(fieldBox())).toContain('width: 67%');
  });

  // Break this catches: dropping the ofField scaling.
  test('[CurrencyInput-STYLE-003] a deprecated ofField width scales the configured label width', () => {
    expect(getLabelWidthOfInput('ofComponent', 40)).toBe(40);
    expect(getLabelWidthOfInput('ofField', 40)).toBe(28);
    expect(checkIfInputWidgetTypeIsDeprecated('ofField')).toBe(true);
  });

  // Break this catches: dropping the label?.length tests from the layout branches.
  test('[CurrencyInput-STYLE-004] alignment and direction reposition the label around the field', async () => {
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

  // Break this catches: dropping a legacy sentinel comparison from CurrencyInput's OWN
  // copy of these expressions (D-01). PhoneInput's and BaseInput's copies are separate,
  // and their tests would not notice.
  test('[CurrencyInput-STYLE-005] radius, background, border and shadow reach the field, with legacy fallbacks', async () => {
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

  // Break this catches: giving the input a uniform radius, which would round the edge that
  // sits against the currency select and split one control into two boxes.
  test('[CurrencyInput-STYLE-006] the field is square on the left, where the currency select joins it', async () => {
    harness.render({ styles: { borderRadius: binding('{{6}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(inlineStyle(input())).toContain('border-radius: 0px 6px 6px 0px');
    const css = selectControlCss();
    expect(css).toContain('border-top-left-radius: 6px');
    expect(css).toContain('border-top-right-radius: 0px');
  });

  // Break this catches: dropping the isFocused branch from the border resolution. Scoped
  // to a VALID field: once a message is showing, theme.scss's
  // `.is-invalid { border: ... !important }` overrides this inline value, and that
  // precedence is browser-owned ([CurrencyInput-BRW-005]).
  test('[CurrencyInput-STYLE-007] focusing a valid field swaps its border to the accent colour', async () => {
    harness.render({ styles: { accentColor: binding('#ff00ff'), borderColor: binding('#123456') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);
    expect(inlineStyle(input())).toContain('#123456');

    fireEvent.focus(input());

    await waitFor(() => expect(inlineStyle(input())).toContain('#ff00ff'));
  });

  // Break this catches: dropping errTextColor from the message's inline style.
  test('[CurrencyInput-STYLE-008] a revealed invalid field colours its message with errTextColor', async () => {
    harness.render({
      properties: { value: binding('{{100}}') },
      validation: { minValue: binding('{{500}}') },
      styles: { errTextColor: binding('#abcdef') },
    });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(errorText()).toBeNull();

    fireEvent.blur(input());

    await waitFor(() => expect(errorText()).toBeTruthy());
    expect(inlineStyle(errorText())).toContain('rgb(171, 205, 239)');
  });

  // Break this catches: dropping the legacy text-colour blocklist from CurrencyInput's own
  // copy — a pre-theme app would render hard #1B1F24 text on a disabled field.
  test('[CurrencyInput-STYLE-009] a legacy text colour resolves to the theme token, per state', async () => {
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

  // Break this catches: letting the currency select fall back to react-select's own
  // defaults instead of the widget's resolved colours.
  test('[CurrencyInput-STYLE-010] the currency select mirrors the field’s resolved colours', async () => {
    harness.render({ styles: { backgroundColor: binding('#abcdef'), borderColor: binding('#123456') } });
    await waitFor(() => expect(input()).toBeTruthy());

    const css = selectControlCss();
    expect(css).toContain('background-color: #abcdef');
    expect(css).toContain('border-color: #123456');
  });
});

describe('accessibility, async and identity', () => {
  // Break this catches: dropping any of the aria attributes.
  test('[CurrencyInput-A11Y-001] aria state attributes reflect the widget’s real state', async () => {
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

  // Break this catches: making htmlFor unconditional in Label.jsx, or dropping it.
  test('[CurrencyInput-A11Y-002] the label targets the input in the Viewer, and deliberately not in the editor', async () => {
    harness.render({ properties: { label: binding('Reimbursement Amount') }, currentMode: 'view' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).toHaveAttribute('for', 'component-ci1');
    expect(screen.getByLabelText('Reimbursement Amount')).toBe(input());

    harness.render({ properties: { label: binding('Reimbursement Amount') }, currentMode: 'edit' });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(label()).not.toHaveAttribute('for');
  });

  // Break this catches: dropping the aria-label fallback.
  test('[CurrencyInput-A11Y-003] an unmeasured fixed-width label falls back to an aria-label', async () => {
    harness.render({ properties: { label: binding('Amount') }, styles: { auto: binding('{{false}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).toHaveAttribute('aria-label', 'Amount');

    harness.render({ properties: { label: binding('Amount') }, styles: { auto: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input()).not.toHaveAttribute('aria-label');
  });

  // Break this catches: removing the unmount guard around the deferred onFocus dispatch,
  // or making handleBlur async — a focus/blur pair would lose an event.
  test('[CurrencyInput-ASYNC-001] a fast focus-then-blur delivers both handlers', async () => {
    harness.render({
      events: [
        ...countInvocationsOn('ci1', 'onFocus', { key: 'focusCalls' }),
        ...countInvocationsOn('ci1', 'onBlur', { key: 'blurCalls' }),
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
  test('[CurrencyInput-ASYNC-001] the deferred onFocus still fires after unmount', async () => {
    const root = harness.render({ events: countInvocationsOn('ci1', 'onFocus', { key: 'focusCalls' }) });
    await waitFor(() => expect(input()).toBeTruthy());

    input().focus();
    root.unmount(); // the React tree only; the store is left intact
    await drain();

    expect(callCount('focusCalls')).toBe(1);
  });

  // Break this catches: dropping the effect's cleanup in CountrySelect.jsx:42-44, or
  // attaching the listener unconditionally instead of only while the menu is open.
  // Unlike the deferred focus above, this listener IS cleaned up correctly today, so
  // this scenario protects working behaviour rather than pinning a leak.
  //
  // The menu itself is reachable in jsdom — this suite had assumed otherwise and
  // treated the whole dropdown as browser-owned, which left the attach/detach claim
  // in the contract's async row with no oracle at all.
  test('[CurrencyInput-ASYNC-002] the click-outside listener closes the menu and is detached on unmount', async () => {
    const root = harness.render();
    await waitFor(() => expect(input()).toBeTruthy());

    // Attach: opening the menu registers the listener, and a mousedown outside the
    // dropdown closes it.
    fireEvent.mouseDown(document.querySelector('.country-ci1__control'), { button: 0 });
    await drain();
    expect(document.querySelector('.country-ci1__menu')).toBeTruthy();

    fireEvent.mouseDown(document.body);
    await drain();
    expect(document.querySelector('.country-ci1__menu')).toBeNull();

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
      fireEvent.mouseDown(document.querySelector('.country-ci1__control'), { button: 0 });
      await drain();
      expect(document.querySelector('.country-ci1__menu')).toBeTruthy();
      expect(added.length).toBeGreaterThan(0); // the open menu attached one

      root.unmount();
      await drain();

      // Nothing this component attached is still on document.
      expect(added.filter((fn) => !removed.includes(fn))).toEqual([]);
    } finally {
      document.addEventListener.mockRestore();
      document.removeEventListener.mockRestore();
    }
  });

  // Break this catches: rendering a raw number instead of letting the library group it.
  test('[CurrencyInput-TYPE-001] the control is the library input, rendering grouped currency text', async () => {
    harness.render({ properties: { value: binding('{{1234567.89}}'), decimalPlaces: binding('{{2}}') } });
    await waitFor(() => expect(input()).toBeTruthy());

    expect(input().value).toBe('1,234,567.89'); // grouped
    expect(harness.exposed().value).toBe(1234567.89); // stored plain
  });

  // Break this catches: hoisting the currency or value state out of the component, or
  // dropping the per-component classNamePrefix — one field's amount or currency would
  // leak into the other.
  //
  // The sibling is BOTH seeded (extraComponents) and rendered (also): `also` alone mounts
  // a RenderWidget for an id the store has never heard of, which renders nothing and makes
  // a two-instance assertion silently vacuous.
  test('[CurrencyInput-TYPE-002] two Currency Inputs stay independent', async () => {
    harness.render({
      properties: { value: binding('{{100}}') },
      extraComponents: {
        ci2: componentDefinition('ci2', 'currencyinput2', 'CurrencyInput', { value: binding('{{250}}') }),
      },
      also: [{ id: 'ci2', componentType: 'CurrencyInput' }],
    });
    await waitFor(() => expect(document.querySelectorAll('input')).toHaveLength(2));

    expect(harness.exposed('ci1').value).toBe(100);
    expect(harness.exposed('ci2').value).toBe(250);

    await harness.act('setCountryCode', 'IN');
    await drain();

    expect(harness.exposed('ci1').country).toBe('IN');
    expect(harness.exposed('ci2').country).toBe('US');
    expect(harness.exposed('ci2').value).toBe(250);
  });
});
