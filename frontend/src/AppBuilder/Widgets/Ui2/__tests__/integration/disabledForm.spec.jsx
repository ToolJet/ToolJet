/**
 * UI 2.0 controls inside a disabled native Form take no input.
 *
 * Release audit 39 (17 Oct): a disabled Form wraps its children in `<fieldset disabled>`, which disables native form
 * controls but not the pack's own (a Slider thumb, Rating stars, Multiselect chips). With the Form disabled, Tab and
 * ArrowRight still moved a Slider 40 to 41 and a Rating 2 to 3, and Backspace removed a Multiselect chip.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const OPTIONS = "{{[{ label: 'Alpha', value: 'a' }, { label: 'Beta', value: 'b' }]}}";
// [componentType, properties, the user's input, exposed value it changes]
const CASES = [
  [
    'ShadSlider',
    { min: '{{0}}', max: '{{100}}', defaultValue: '{{40}}' },
    () => fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' }),
    'value',
  ],
  [
    'ShadRating',
    { defaultValue: '{{2}}' },
    () => fireEvent.keyDown(screen.getAllByRole('radio')[1], { key: 'ArrowRight' }),
    'value',
  ],
  [
    'ShadMultiselect',
    { options: OPTIONS, defaultValue: "{{['a']}}" },
    () => fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Backspace' }),
    'values',
  ],
  ['ShadSwitch', {}, () => fireEvent.click(screen.getByRole('switch')), 'value'],
  [
    'ShadToggleGroup',
    { options: OPTIONS, defaultValue: 'a' },
    () => fireEvent.click(screen.getByRole('radio', { name: 'Beta' })),
    'value',
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

describe('[UI2-FORM-039] a disabled Form’s UI 2.0 controls take no input', () => {
  it.each(
    CASES.flatMap((c) => [true, false].map((disabled) => [c[0], disabled ? 'disabled' : 'enabled', ...c.slice(1)]))
  )('%s, Form %s', async (type, state, properties, input, key) => {
    const widget = harnesses[type];
    await widget.setup();
    try {
      const child = componentDefinition('field1', 'field1', type, {
        ...Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)])),
      });
      child.component.parent = 'form1';
      child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
      child.layouts = { desktop: { top: 10, left: 0, width: 20, height: 80 } };
      widget.render({
        currentMode: 'view',
        extraComponents: { field1: child },
        properties: { disabledState: binding(state === 'disabled' ? '{{true}}' : '{{false}}') },
      });
      const field = () => widget.exposed('field1') ?? {};
      await waitFor(() => expect(field()[key]).toBeDefined());
      const before = JSON.stringify(field()[key]);
      await act(async () => input());
      await new Promise((resolve) => setTimeout(resolve, 20));
      if (state === 'disabled') expect(JSON.stringify(field()[key])).toBe(before);
      else await waitFor(() => expect(JSON.stringify(field()[key])).not.toBe(before));
    } finally {
      widget.teardown();
    }
  });
});
