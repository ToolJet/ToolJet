/**
 * UI 2.0 inputs and pickers: a handler of a user's change reads the state the change produced.
 *
 * Release audit 23 and 49 (17 Oct): typing a required Input empty fired onChange while isValid still read true, and a
 * Radio group's onSelectionChange read the previously selected option. The value was published with the event, but
 * the rest (isValid, selectedOption, formatted values) was published in effects after the event had fired. Actions
 * already publish everything first (actionContract.spec); a user's change must too.
 *
 * Each case mounts the widget, records in its change event's handler every exposed value listed, makes the change as a
 * user does (typing, clicking, a key), and compares what the handler saw with what the app reads once it settles.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'w1';
const OPTIONS = "{{[{ label: 'Alpha', value: 'a' }, { label: 'Beta', value: 'b' }]}}";
const REQUIRED = { mandatory: '{{true}}' };
const field = () => document.querySelector('input:not([type=hidden]), textarea');
const type = (text) => act(async () => fireEvent.change(field(), { target: { value: text } }));
const click = (role, name) => act(async () => fireEvent.click(screen.getByRole(role, { name })));
const openPopup = async (trigger) =>
  act(async () => {
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse', ctrlKey: false });
    fireEvent.click(trigger);
  });

// [componentType, event, properties, validation, the user's change, exposed values the handler must agree on]
const CASES = [
  ['ShadInput', 'onChange', { defaultValue: 'valid' }, REQUIRED, () => type(''), ['value', 'isValid']],
  ['ShadTextarea', 'onChange', { defaultValue: 'valid' }, REQUIRED, () => type(''), ['value', 'isValid']],
  ['ShadPasswordInput', 'onChange', { defaultValue: 'valid' }, REQUIRED, () => type(''), ['value', 'isValid']],
  ['ShadNumberInput', 'onChange', { defaultValue: '{{5}}' }, REQUIRED, () => type(''), ['value', 'isValid']],
  [
    'ShadCurrencyInput',
    'onChange',
    { defaultValue: '{{5}}' },
    REQUIRED,
    () => type(''),
    ['value', 'isValid', 'formattedValue'],
  ],
  ['ShadPhoneInput', 'onChange', {}, REQUIRED, () => type('2025550143'), ['value', 'isValid', 'formattedValue']],
  [
    'ShadOtpInput',
    'onChange',
    { defaultValue: '' },
    REQUIRED,
    () => type('123456'),
    ['value', 'isValid', 'isComplete'],
  ],
  [
    'ShadRadioGroup',
    'onSelectionChange',
    { options: OPTIONS, defaultValue: 'a' },
    REQUIRED,
    () => click('radio', 'Beta'),
    ['value', 'selectedOption', 'isValid'],
  ],
  [
    'ShadSelect',
    'onSelect',
    { options: OPTIONS, defaultValue: '' },
    REQUIRED,
    async () => {
      await openPopup(screen.getByRole('combobox'));
      const option = await screen.findByRole('option', { name: 'Beta' });
      await act(async () => fireEvent.keyDown(option, { key: 'Enter' }));
    },
    ['value', 'selectedOption', 'isValid'],
  ],
  [
    'ShadCombobox',
    'onSelect',
    { options: OPTIONS, defaultValue: '' },
    REQUIRED,
    async () => {
      await openPopup(screen.getByRole('combobox'));
      const option = await screen.findByRole('option', { name: 'Beta' });
      await act(async () => fireEvent.click(option));
    },
    ['value', 'selectedOption', 'isValid'],
  ],
  [
    'ShadMultiselect',
    'onSelect',
    { options: OPTIONS, defaultValue: '{{[]}}' },
    REQUIRED,
    async () => {
      await act(async () => fireEvent.click(screen.getByRole('combobox')));
      const option = await screen.findByRole('option', { name: 'Beta' });
      await act(async () => fireEvent.click(option));
    },
    ['values', 'selectedOptions', 'isValid'],
  ],
  [
    'ShadCheckbox',
    'onChange',
    { defaultChecked: '{{true}}' },
    REQUIRED,
    () => act(async () => fireEvent.click(screen.getByRole('checkbox'))),
    ['value', 'isValid'],
  ],
  ['ShadSwitch', 'onChange', {}, {}, () => act(async () => fireEvent.click(screen.getByRole('switch'))), ['value']],
  ['ShadToggleGroup', 'onChange', { options: OPTIONS, defaultValue: 'a' }, {}, () => click('radio', 'Beta'), ['value']],
  [
    'ShadButtonGroup',
    'onChange',
    { buttons: OPTIONS, defaultValue: '' },
    REQUIRED,
    () => click('button', 'Beta'),
    ['value', 'selected', 'isValid'],
  ],
  [
    'ShadRating',
    'onChange',
    { defaultValue: '{{0}}' },
    REQUIRED,
    () => act(async () => fireEvent.click(screen.getAllByRole('radio')[1])),
    ['value', 'isValid'],
  ],
  [
    'ShadSlider',
    'onChange',
    { min: '{{0}}', max: '{{100}}', defaultValue: '{{40}}' },
    {},
    () => act(async () => fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' })),
    ['value'],
  ],
  [
    'ShadTagsInput',
    'onTagAdded',
    { defaultValue: '{{[]}}' },
    REQUIRED,
    async () => {
      await type('alpha');
      await act(async () => fireEvent.keyDown(field(), { key: 'Enter' }));
    },
    ['values', 'isValid', 'lastAddedTag'],
  ],
];

const harnesses = Object.fromEntries(
  CASES.map(([componentType]) => [
    componentType,
    createWidgetHarness({
      componentType,
      handle: 'widget1',
      id: ID,
      widgetHeight: 200,
      widgetWidth: 420,
      preload: [componentType],
    }),
  ])
);
const bind = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, binding(v)]));
const pick = (exposed, keys) => Object.fromEntries(keys.map((key) => [key, exposed[key] ?? null]));

describe('UI 2.0 inputs: a handler of a user change reads the state the change produced', () => {
  it.each(CASES)('%s %s', async (componentType, event, properties, validation, change, keys) => {
    const widget = harnesses[componentType];
    await widget.setup();
    try {
      widget.render({ currentMode: 'view', properties: bind(properties), validation: bind(validation) });
      await waitFor(() => expect(widget.exposed()?.[keys[0]]).toBeDefined());
      const snapshot = `{{({ ${keys.map((key) => `${key}: components.widget1.${key} ?? null`).join(', ')} })}}`;
      widget.setEvents(setVariableOn(ID, event, { value: snapshot }));
      const before = pick(widget.exposed(), keys);
      await change();
      await waitFor(() => expect(widget.variables().seen).toBeDefined());
      const settled = pick(widget.exposed(), keys);
      expect(settled).not.toEqual(before);
      expect(widget.variables().seen).toEqual(settled);
    } finally {
      widget.teardown();
    }
  });
});
