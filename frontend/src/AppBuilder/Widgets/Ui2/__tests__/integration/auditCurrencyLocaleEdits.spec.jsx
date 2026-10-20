import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixtures currentCurrencyLocaleFormAcceptance016 and auditNumericLocaleRoundtrip): an
// amount typed the way the Currency input's own locale writes it lost its meaning. A Swedish negative amount, written
// with the minus sign U+2212, turned positive; Arabic-Indic digits ('١٢٣٤٫٥٦') became no amount, and an optional
// Form left the key out. numericText kept only ASCII digits and a hyphen, and parseNumber read only those, so the
// locale's digits, minus sign and decimal separator were dropped before the number was read. The currency menu's
// precision is checked alongside, as it must keep working.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { formatNumber, numericText, parseNumber } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';

const LOCALES = ['en-US', 'de-DE', 'fr-FR', 'sv-SE', 'ar-EG', 'fa-IR', 'bn-BD'];

describe.each(LOCALES)('%s text the locale writes', (locale) => {
  test.each([1234.5, -1234.5])('reads back as %s, grouped or not, and survives the typing filter', (value) => {
    for (const grouping of [true, false]) {
      const text = formatNumber(value, { locale, decimals: 2, fixed: true, grouping });
      expect({ text, parsed: parseNumber(numericText(text), locale) }).toEqual({ text, parsed: value });
    }
  });
});

test('plain ASCII entry reads as before', () => {
  expect(parseNumber('1,234.5')).toBe(1234.5);
  expect(parseNumber('1.234,5', 'de-DE')).toBe(1234.5);
  expect(parseNumber('$ -12')).toBe(-12);
  expect(parseNumber('-12', 'sv-SE')).toBe(-12);
  expect(parseNumber('1234.5', 'ar-EG')).toBe(1234.5);
  expect(numericText('12abc$%')).toBe('12');
  ['', '-', '−', 'abc', '؜'].forEach((v) => expect(parseNumber(v, 'ar-EG')).toBeNull());
});

const w = createWidgetHarness({
  componentType: 'ShadCurrencyInput',
  id: 'money1',
  handle: 'money1',
  widgetWidth: 500,
  widgetHeight: 100,
  preload: ['Form'],
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const mount = (locale, required, extras = {}) => {
  w.renderInsideForm({
    properties: {
      label: binding('Amount'),
      locale: binding(locale),
      currency: binding('USD'),
      defaultValue: binding(42),
      ...extras,
    },
    validation: { mandatory: binding(required) },
  });
  w.setComponentProperty('form1', 'resetOnSubmit', '{{false}}', 'properties');
  w.setComponentProperty('form1', 'validateOnSubmit', '{{true}}', 'properties');
  w.setEvents([
    ...setVariableOn('money1', 'onChange', {
      key: 'changes',
      value: '{{[...(variables.changes||[]),({value:components.money1.value,currency:components.money1.currency})]}}',
    }),
    ...setVariableOn('form1', 'onSubmit', { key: 'submitted', value: '{{components.form1.formData}}' }),
    ...setVariableOn('form1', 'onInvalid', { key: 'invalid', value: 'YES' }),
  ]);
};

test.each([
  ['de-DE', 1234.56, false],
  ['sv-SE', -1234.56, false],
  ['ar-EG', 1234.56, false],
  ['ar-EG', 1234.56, true],
  ['fa-IR', -1234.56, true],
])('%s: typing %s (required %s) publishes, fires and submits that amount', async (locale, amount, required) => {
  mount(locale, required);
  await waitFor(() => expect(w.exposed().value).toBe(42));
  const input = screen.getByRole('textbox', { name: /^Amount/ });
  const typed = formatNumber(amount, { locale, grouping: false, decimals: 2, fixed: true });
  await act(async () => fireEvent.focus(input));
  await act(async () => {
    fireEvent.change(input, { target: { value: typed } });
    fireEvent.blur(input);
  });
  await act(async () => {
    await w.exposed('form1').submitForm();
  });
  expect(w.exposed().value).toBe(amount);
  expect(w.exposed().isValid).toBe(true);
  expect(w.variables().changes).toEqual([{ value: amount, currency: 'USD' }]);
  expect(w.variables().submitted).toEqual({ money1: amount });
  expect(w.variables().invalid).toBeUndefined();
});

test('a required field cleared to no amount is still refused', async () => {
  mount('ar-EG', true);
  await waitFor(() => expect(w.exposed().value).toBe(42));
  const input = screen.getByRole('textbox', { name: /^Amount/ });
  await act(async () => fireEvent.focus(input));
  await act(async () => {
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
  });
  await act(async () => {
    await w.exposed('form1').submitForm();
  });
  expect(w.exposed().value).toBeNull();
  expect(w.exposed().isValid).toBe(false);
  expect(w.variables().invalid).toBe('YES');
  expect(w.variables().submitted).toBeUndefined();
});

test.each([
  ['USD', 'JPY', 12.35, 12],
  ['JPY', 'KWD', 12, 12],
])(
  'the currency menu from %s to %s keeps the published, event and Form precision',
  async (from, to, initial, expected) => {
    mount('en-US', false, {
      currency: binding(from),
      currencyOptions: binding(['USD', 'JPY', 'KWD']),
      defaultValue: binding(initial),
    });
    await waitFor(() => expect(w.exposed().value).toBe(initial));
    await act(async () =>
      fireEvent.pointerDown(screen.getByRole('combobox', { name: 'Currency' }), {
        button: 0,
        pointerType: 'mouse',
        ctrlKey: false,
      })
    );
    const option = await screen.findByRole('option', { name: new RegExp('^' + to) });
    await act(async () => fireEvent.keyDown(option, { key: 'Enter' }));
    await act(async () => {
      await w.exposed('form1').submitForm();
    });
    expect(w.exposed().value).toBe(expected);
    expect(w.exposed().currency).toBe(to);
    expect(w.variables().changes).toEqual([{ value: expected, currency: to }]);
    expect(w.variables().submitted).toEqual({ money1: expected });
  }
);
