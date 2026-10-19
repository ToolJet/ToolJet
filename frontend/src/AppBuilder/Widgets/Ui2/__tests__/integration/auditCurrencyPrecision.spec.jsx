// Release audit round 3 (Codex fixtures reviewNumericActionSequence and reviewCurrencyPrecisionEvents, trimmed):
// setValue(value, currency) into a currency with more decimals kept the old currency's (JPY to USD gave 12, not
// 12.35; USD to KWD gave 12.35, not 12.345). The amount was rounded for the new currency, then rounded again by the
// number box with the rounding of the render before the currency changed.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadCurrencyInput',
  id: 'money1',
  handle: 'money',
  widgetWidth: 300,
  widgetHeight: 80,
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const mount = (currency, places) =>
  w.render({
    currentMode: 'view',
    properties: {
      defaultValue: binding('{{10}}'),
      currency: binding(currency),
      locale: binding('en-US'),
      ...(places === undefined ? {} : { decimalPlaces: binding(`{{${places}}}`) }),
    },
  });

test.each([
  ['JPY', 'USD', 12.35],
  ['USD', 'KWD', 12.345],
  ['KWD', 'JPY', 12],
  ['USD', 'USD', 12.35],
])('setValue from %s into %s rounds to the new currency', async (from, to, expected) => {
  mount(from);
  w.setEvents(
    setVariableOn('money1', 'onChange', {
      value: '{{({value:components.money.value,currency:components.money.currency})}}',
    })
  );
  const r = await w.runQuery([['setValue', 12.345, to]]);
  expect(r.after[0]).toMatchObject({ value: expected, currency: to });
  expect(r.settled).toMatchObject({ value: expected, currency: to });
  await waitFor(() => expect(w.variables().seen).toEqual({ value: expected, currency: to }));
});

test('each setValue uses the currency it names', async () => {
  mount('USD');
  const r = await w.runQuery([
    ['setValue', 12.345, 'JPY'],
    ['setValue', 12.345, 'USD'],
    ['setValue', 12.345, 'KWD'],
  ]);
  expect(r.after.map((v) => v.value)).toEqual([12, 12.35, 12.345]);
});

test('explicit decimal places win over both currencies', async () => {
  mount('JPY', 2);
  const r = await w.runQuery([['setValue', 12.345, 'KWD']]);
  expect(r.settled.value).toBe(12.35);
});
