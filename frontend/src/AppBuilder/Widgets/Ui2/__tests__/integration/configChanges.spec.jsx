/**
 * UI 2.0 inputs: a configuration change after the user set a value keeps that value, fitted to the new configuration.
 *
 * Release audit (17 Oct):
 *  - 64: Number and Currency recomputed their start value from the default and the decimal places, and reset to it
 *    whenever it changed: default 1.23, the user types 9.87, decimals 2 to 0, and the value became 1 (the old default).
 *    Multiselect and Tags input did the same with maxSelections and maxTags: an edited single choice was replaced by
 *    the defaults.
 *  - 65: switching an OTP input from letters and digits to digits only left AB1234 complete and valid.
 *  - 51: Rating and Slider kept exposing 5 and 80 after their maximum fell to 3 and 30 (they drew 3 and 30).
 * A change of the default itself still starts the field again (the control in each case).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'w1';
const OPTIONS = "{{[{ label: 'Alice', value: 'a' }, { label: 'Bob', value: 'b' }, { label: 'Casey', value: 'c' }]}}";
const box = () => document.querySelector('input:not([type=hidden]), textarea');
const type = (text) => act(async () => fireEvent.change(box(), { target: { value: text } }));

// [componentType, properties, the user's change, then a configuration change, exposed after, a default change, after]
const CASES = [
  [
    'ShadNumberInput',
    { defaultValue: '{{1.23}}', decimalPlaces: '{{2}}' },
    () => type('9.87'),
    { decimalPlaces: 0 },
    { value: 10 },
    { defaultValue: 4.56 },
    { value: 5 },
  ],
  [
    'ShadCurrencyInput',
    { defaultValue: '{{1.23}}', decimalPlaces: '{{2}}' },
    async () => {
      await act(async () => box().focus());
      await type('9.87');
      await act(async () => box().blur());
    },
    { decimalPlaces: 0 },
    { value: 10 },
    { defaultValue: 4.56 },
    { value: 5 },
  ],
  [
    'ShadMultiselect',
    { options: OPTIONS, defaultValue: "{{['a', 'b']}}", maxSelections: '{{2}}' },
    async (widget) => {
      await widget.act('clear');
      await widget.act('selectOptions', ['c']);
    },
    { maxSelections: 1 },
    { values: ['c'] },
    { defaultValue: ['b'] },
    { values: ['b'] },
  ],
  [
    'ShadTagsInput',
    { defaultValue: "{{['alpha', 'beta']}}", maxTags: '{{2}}' },
    (widget) => widget.act('setTags', ['casey']),
    { maxTags: 1 },
    { values: ['casey'] },
    { defaultValue: ['delta'] },
    { values: ['delta'] },
  ],
  [
    'ShadOtpInput',
    { characters: 'alphanumeric', length: '{{6}}', defaultValue: '' },
    () => type('AB1234'),
    { characters: 'numeric' },
    { value: '1234', isComplete: false },
    { defaultValue: '123456' },
    { value: '123456', isComplete: true },
  ],
  [
    'ShadRating',
    { defaultValue: '{{0}}', max: '{{5}}' },
    (widget) => widget.act('setValue', 5),
    { max: 3 },
    { value: 3 },
    { defaultValue: 2 },
    { value: 2 },
  ],
  [
    'ShadSlider',
    { min: '{{0}}', max: '{{100}}', defaultValue: '{{0}}' },
    (widget) => widget.act('setValue', 80),
    { max: 30 },
    { value: 30 },
    { defaultValue: 10 },
    { value: 10 },
  ],
];

const harnesses = Object.fromEntries(
  CASES.map(([componentType]) => [
    componentType,
    createWidgetHarness({ componentType, handle: 'widget1', id: ID, widgetHeight: 200, preload: [componentType] }),
  ])
);

describe('UI 2.0 inputs keep a value the user set through a configuration change', () => {
  it.each(CASES)(
    '[UI2-CONFIG] %s',
    async (componentType, properties, userChange, config, afterConfig, defaults, afterDefaults) => {
      const widget = harnesses[componentType];
      await widget.setup();
      try {
        widget.render({
          currentMode: 'view',
          properties: Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)])),
        });
        await waitFor(() => expect(widget.exposed()?.setVisibility).toBeInstanceOf(Function));
        await userChange(widget);
        for (const [key, value] of Object.entries(config)) widget.setComponentProperty(ID, key, value, 'properties');
        await waitFor(() => expect(widget.exposed()).toMatchObject(afterConfig));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(widget.exposed()).toMatchObject(afterConfig);
        for (const [key, value] of Object.entries(defaults)) widget.setComponentProperty(ID, key, value, 'properties');
        await waitFor(() => expect(widget.exposed()).toMatchObject(afterDefaults));
      } finally {
        widget.teardown();
      }
    }
  );
});
