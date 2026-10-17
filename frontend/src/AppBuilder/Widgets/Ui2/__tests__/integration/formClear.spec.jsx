/**
 * UI 2.0 controls in a native Form: clearForm clears every value control, including what is being typed.
 *
 * Release audit (17 Oct):
 *  - 71: Switch, Slider, Color picker and Toggle group did not take part in clearForm (they have no validation, and
 *    only validating controls listened), so the Form submitted their old values after Clear. The native Toggle
 *    switch clears to off, the Range slider to its minimum, the Color picker and Button group to nothing.
 *  - 71, focused numbers: clearing a Number or Currency input while the user was typing in it left the typed text in
 *    the box, so the next digit appended to it (42, clear, 1 submitted 421).
 *  - 62: clearing a Tags input left unfinished typed text, which leaving the box then added as a tag.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const OPTIONS = "{{[{ label: 'Open', value: 'open' }, { label: 'Closed', value: 'closed' }]}}";
const box = () => document.querySelector('input:not([type=hidden]), textarea');
const type = (text) => act(async () => fireEvent.change(box(), { target: { value: text } }));

// [componentType, properties, the user's change before Clear, exposed after Clear, then the user goes on, exposed]
const CASES = [
  ['ShadSwitch', { defaultChecked: '{{true}}' }, null, { value: false }],
  ['ShadSlider', { min: '{{5}}', max: '{{100}}', defaultValue: '{{75}}' }, null, { value: 5 }],
  ['ShadColorPicker', { defaultValue: '#123456' }, null, { value: '' }],
  ['ShadToggleGroup', { options: OPTIONS, defaultValue: 'open' }, null, { value: '' }],
  [
    'ShadNumberInput',
    { defaultValue: '' },
    async () => {
      await act(async () => box().focus());
      await type('42');
    },
    { value: null },
    () => type(`${box().value}1`),
    { value: 1 },
  ],
  [
    'ShadCurrencyInput',
    { defaultValue: '' },
    async () => {
      await act(async () => box().focus());
      await type('42');
    },
    { value: null },
    () => type(`${box().value}1`),
    { value: 1 },
  ],
  [
    'ShadTagsInput',
    { defaultValue: '{{[]}}', addOnBlur: '{{true}}' },
    async () => {
      await act(async () => box().focus());
      await type('unfinished');
    },
    { values: [] },
    () => act(async () => box().blur()),
    { values: [] },
  ],
];

const harnesses = Object.fromEntries(
  CASES.map(([type]) => [
    type,
    createWidgetHarness({
      componentType: 'Form',
      id: 'form1',
      handle: 'form1',
      widgetHeight: 400,
      widgetWidth: 600,
      capabilities: { dnd: true },
      preload: [type],
    }),
  ])
);

describe('[UI2-FORM-071] clearForm clears every UI 2.0 value control', () => {
  // Rows without a follow-up are padded, so jest passes every row the same six arguments.
  it.each(CASES.map((c) => [...c, null, null].slice(0, 6)))(
    '%s',
    async (componentType, properties, before, cleared, after, afterExposed) => {
      const widget = harnesses[componentType];
      await widget.setup();
      try {
        const child = componentDefinition('field1', 'field1', componentType, {
          ...Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)])),
        });
        child.component.parent = 'form1';
        child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
        child.layouts = { desktop: { top: 10, left: 0, width: 20, height: 80 } };
        widget.render({ currentMode: 'view', extraComponents: { field1: child } });
        const field = () => widget.exposed('field1') ?? {};
        await waitFor(() => expect(field().setVisibility).toBeInstanceOf(Function));
        if (before) await before();
        await waitFor(() => expect(widget.exposed()?.clearForm).toBeInstanceOf(Function));
        await act(async () => widget.exposed().clearForm());
        await waitFor(() => expect(field()).toMatchObject(cleared));
        if (after) {
          await after();
          await waitFor(() => expect(field()).toMatchObject(afterExposed));
          await new Promise((resolve) => setTimeout(resolve, 20));
          expect(field()).toMatchObject(afterExposed);
        }
      } finally {
        widget.teardown();
      }
    }
  );
});
