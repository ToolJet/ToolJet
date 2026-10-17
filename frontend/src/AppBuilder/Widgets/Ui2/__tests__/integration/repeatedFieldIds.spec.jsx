/**
 * UI 2.0 inputs repeated in List view rows: each row's label and help note belong to that row's control.
 *
 * Release audit 9 (17 Oct): DOM ids were made from the component id alone (`shad-field1`), so in a List view every
 * row's control had the same id and the second row's label named the first row's input (clicking it focused row one;
 * a screen reader read row one's name). The exposed values were already per row.
 *
 * Each case renders the widget in two rows with a label and help text, and checks that no id repeats and that every
 * label's control and every described-by note sit in the label's own row.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const OPTIONS = "{{[{ label: 'Alpha', value: 'a' }, { label: 'Beta', value: 'b' }]}}";
// [componentType, extra properties]
const TYPES = [
  ['ShadInput', {}],
  ['ShadTextarea', {}],
  ['ShadPasswordInput', {}],
  ['ShadNumberInput', {}],
  ['ShadCurrencyInput', {}],
  ['ShadPhoneInput', {}],
  ['ShadOtpInput', {}],
  ['ShadSelect', { options: OPTIONS }],
  ['ShadCombobox', { options: OPTIONS }],
  ['ShadMultiselect', { options: OPTIONS }],
  ['ShadRadioGroup', { options: OPTIONS }],
  ['ShadCheckbox', {}],
  ['ShadSwitch', {}],
  ['ShadTagsInput', {}],
  ['ShadRating', {}],
  ['ShadSlider', {}],
  ['ShadColorPicker', {}],
  ['ShadButtonGroup', { buttons: OPTIONS }],
];

let clientWidth;
beforeAll(() => {
  clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
});
afterAll(() => Object.defineProperty(Element.prototype, 'clientWidth', clientWidth));

const harnesses = Object.fromEntries(
  TYPES.map(([type]) => [
    type,
    createWidgetHarness({
      componentType: 'ShadListView',
      id: 'list1',
      handle: 'list1',
      widgetHeight: 600,
      widgetWidth: 600,
      capabilities: { dnd: true },
      preload: ['ShadListView', type],
    }),
  ])
);

describe('[UI2-FIELD-009] a repeated input’s label and note belong to its own row', () => {
  it.each(TYPES)('%s', async (type, extra) => {
    const widget = harnesses[type];
    await widget.setup();
    try {
      const child = componentDefinition('field1', 'field1', type, {
        label: binding('{{listItem.name}}'),
        description: binding('Help for {{listItem.name}}'),
        ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, binding(v)])),
      });
      child.component.parent = 'list1';
      child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
      child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 140 } };
      const { container } = widget.render({
        currentMode: 'view',
        extraComponents: { field1: child },
        properties: {
          data: binding('{{[{ id: 1, name: "First" }, { id: 2, name: "Second" }]}}'),
          idField: binding('id'),
          enablePagination: binding('{{false}}'),
        },
      });
      const rows = () => [...container.querySelectorAll(`._tooljet-${type}`)];
      await waitFor(() => expect(rows()).toHaveLength(2));
      await waitFor(() => expect(rows()[1].textContent).toContain('Second'));

      const ids = [...container.querySelectorAll('[id]')].map((el) => el.id).filter((id) => id.startsWith('shad-'));
      expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);

      rows().forEach((row, i) => {
        const name = i === 0 ? 'First' : 'Second';
        const label = [...row.querySelectorAll('label')].find((l) => l.textContent.includes(name));
        expect(label).toBeDefined();
        if (label.htmlFor) expect(row.contains(document.getElementById(label.htmlFor))).toBe(true);
        row.querySelectorAll('[aria-describedby]').forEach((el) =>
          el
            .getAttribute('aria-describedby')
            .split(' ')
            .forEach((noteId) => expect(row.contains(document.getElementById(noteId))).toBe(true))
        );
      });
    } finally {
      widget.teardown();
    }
  });
});

// Release audit 8 (fixed before this round, kept as a regression check): the visible label names the control.
const NAMED = [
  ['ShadMultiselect', 'combobox'],
  ['ShadRadioGroup', 'radiogroup'],
];
const named = Object.fromEntries(
  NAMED.map(([type]) => [
    type,
    createWidgetHarness({ componentType: type, id: 'field1', handle: 'field1', preload: [type] }),
  ])
);
describe('[UI2-FIELD-008] the visible label is the accessible name', () => {
  it.each(NAMED)('%s', async (type, role) => {
    const widget = named[type];
    await widget.setup();
    try {
      widget.render({
        currentMode: 'view',
        properties: { label: binding('Department'), options: binding('{{[{ label: "Support", value: "support" }]}}') },
      });
      await waitFor(() => expect(document.querySelector(`[role=${role}]`)).not.toBeNull());
      expect(document.querySelector(`[role=${role}]`)).toHaveAccessibleName('Department');
    } finally {
      widget.teardown();
    }
  });
});
