import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
/**
 * A UI 2.0 widget's value must round-trip: what a default, an action or a clear sets is what the widget exposes (with
 * the right type) and what it shows, and a clear leaves the value empty, isValid right, and its change event fired
 * once. The team kept finding one shape that missed (a Select default given as text, a cleared value still shown).
 *
 * Driven from the configs, so a new widget or action is covered when it is added: every widget exposing a value
 * (value, values or file) needs a default case for each shape its default accepts, and every value action (set*,
 * select*, deselect*, clear*, reset*, toggle) needs a case here or in actionCases.js, or a reason it leaves the value
 * alone.
 */
import { act, fireEvent, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { CONFIGS, TYPES, press } from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';
import { ACTION_CASES } from '@/AppBuilder/Widgets/Ui2/__tests__/actionCases';

const ID = 'w1';
const VALUE_KEYS = ['value', 'values', 'file'];
const VALUE_TYPES = TYPES.filter((type) => VALUE_KEYS.some((k) => k in (CONFIGS[type].exposedVariables || {})));
const GENERIC = new Set(['setVisibility', 'setDisable', 'setLoading', 'setFocus', 'setBlur']);
const valueActions = (type) =>
  (CONFIGS[type].actions || [])
    .map((a) => a.handle)
    .filter((h) => !GENERIC.has(h) && /^(set|select|deselect|clear|reset|toggle)/.test(h));

// Value actions that leave the value alone, and why.
const NEUTRAL = {
  'ShadCalendar.setMonth': 'shows another month',
  'ShadNavigation.setItemVisibility': 'hides an item',
  'ShadNavigation.setItemDisable': 'disables an item',
  'ShadNavigation.setCollapsed': 'collapses the panel',
  'ShadCurrencyInput.setCurrency': 'changes the currency, not the amount',
  'ShadPhoneInput.setCountryCode': 'changes the country (actionCases: the number follows it)',
  'ShadDateTimePicker.setMinDate': 'a bound',
  'ShadDateTimePicker.setMaxDate': 'a bound',
  'ShadDateTimePicker.setDisabledDates': 'a bound',
  'ShadDateTimePicker.clearDisabledDates': 'a bound',
  'ShadDatePicker.setMinDate': 'a bound',
  'ShadDatePicker.setMaxDate': 'a bound',
  'ShadDatePicker.setDisabledDates': 'a bound',
  'ShadDatePicker.clearDisabledDates': 'a bound',
  'ShadTimePicker.setMinTime': 'a bound',
  'ShadTimePicker.setMaxTime': 'a bound',
  'ShadFileUpload.setFileName': 'renames a chosen file',
};

const OPTIONS_12 = "{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }]}}";

// Defaults: [componentType, shape, properties, exposed, shown]. `shown` is text the widget must show (in its text, or
// a field's value); a boolean is a checkbox's or switch's state.
const DEFAULTS = [
  ['ShadInput', 'string', { defaultValue: 'Hello' }, { value: 'Hello', isValid: true }, 'Hello'],
  [
    'ShadInput',
    'string',
    { inputType: 'url', defaultValue: 'https://example.com' },
    { value: 'https://example.com', isValid: true },
    'https://example.com',
  ],
  ['ShadTextarea', 'string', { defaultValue: 'Hello' }, { value: 'Hello', isValid: true }, 'Hello'],
  ['ShadPasswordInput', 'string', { defaultValue: 's3cret' }, { value: 's3cret', isValid: true }, 's3cret'],
  ['ShadNumberInput', 'number', { defaultValue: '{{5}}' }, { value: 5, isValid: true }, '5'],
  ['ShadNumberInput', 'string', { defaultValue: '7' }, { value: 7, isValid: true }, '7'],
  ['ShadCurrencyInput', 'number', { defaultValue: '{{12.5}}' }, { value: 12.5, isValid: true }, '12.50'],
  ['ShadCurrencyInput', 'string', { defaultValue: '8' }, { value: 8, isValid: true }, '8.00'],
  ['ShadPhoneInput', 'string', { defaultValue: '+14155550123' }, { value: '+14155550123', isValid: true }, '555'],
  ['ShadOtpInput', 'string', { defaultValue: '123456' }, { value: '123456' }, '123456'],
  ['ShadTimePicker', 'string', { defaultValue: '09:30' }, { value: '09:30' }, '9:30 AM'],
  ['ShadDateTimePicker', 'string', { defaultValue: '2026-10-17 09:30' }, { selectedDate: '2026-10-17' }, '2026'],
  ['ShadDateTimePicker', 'number', { defaultValue: '{{1792263600000}}' }, { selectedDate: '2026-10-17' }, '2026'],
  // The Date picker exposes an ISO date and shows its display format.
  ['ShadDatePicker', 'string', { defaultValue: '2026-10-17' }, { value: '2026-10-17' }, '17 Oct 2026'],
  ['ShadDatePicker', 'number', { defaultValue: '{{1792263600000}}' }, { value: '2026-10-17' }, '17 Oct 2026'],
  ['ShadCheckbox', 'boolean', { defaultChecked: '{{true}}' }, { value: true }, true],
  ['ShadSwitch', 'boolean', { defaultChecked: '{{true}}' }, { value: true }, true],
  ['ShadSelect', 'number', { options: OPTIONS_12, defaultValue: '{{2}}' }, { value: 2 }, 'Two'],
  ['ShadSelect', 'string', { options: OPTIONS_12, defaultValue: '2' }, { value: 2 }, 'Two'],
  ['ShadCombobox', 'string', { defaultValue: 'ca' }, { value: 'ca' }, 'Canada'],
  ['ShadCombobox', 'number', { options: OPTIONS_12, defaultValue: '{{2}}' }, { value: 2 }, 'Two'],
  ['ShadMultiselect', 'array', { defaultValue: "{{['design']}}" }, { values: ['design'] }, 'Design'],
  ['ShadTagsInput', 'array', { defaultValue: "{{['alpha', 'beta']}}" }, { values: ['alpha', 'beta'] }, 'beta'],
  ['ShadRadioGroup', 'string', { defaultValue: 'Premium' }, { value: 'Premium' }, 'Premium'],
  ['ShadRadioGroup', 'number', { options: OPTIONS_12, defaultValue: '{{2}}' }, { value: 2 }, 'Two'],
  ['ShadToggleGroup', 'string', { defaultValue: 'Open' }, { value: 'Open' }, 'Open'],
  ['ShadToggleGroup', 'number', { options: OPTIONS_12, defaultValue: '{{2}}' }, { value: 2 }, 'Two'],
  ['ShadButtonGroup', 'string', { defaultValue: 'month' }, { value: 'month' }, 'Month'],
  ['ShadButtonGroup', 'number', { buttons: OPTIONS_12, defaultValue: '{{2}}' }, { value: 2 }, 'Two'],
  ['ShadNavigation', 'string', { defaultValue: 'orders' }, { value: 'orders' }, 'Orders'],
  ['ShadNavigation', 'number', { items: OPTIONS_12, defaultValue: '{{2}}' }, { value: 2 }, 'Two'],
  [
    'ShadCalendar',
    'string',
    { defaultValue: '2026-10-17', defaultMonth: '2026-10-01' },
    { selectedDate: '2026-10-17' },
    '17',
  ],
  [
    'ShadCalendar',
    'number',
    { defaultValue: '{{1792263600000}}', defaultMonth: '2026-10-01' },
    { selectedDate: '2026-10-17' },
    '17',
  ],
  ['ShadSlider', 'number', { defaultValue: '{{30}}' }, { value: 30 }, '30'],
  ['ShadSlider', 'array', { defaultValue: '{{[20, 80]}}' }, { value: [20, 80] }, '80'],
  ['ShadRating', 'number', { defaultValue: '{{3}}' }, { value: 3 }, null],
  ['ShadRating', 'string', { defaultValue: '2' }, { value: 2 }, null],
  ['ShadColorPicker', 'string', { defaultValue: '#ff0000' }, { value: '#ff0000' }, 'ff0000'],
  ['ShadProgress', 'number', { value: '{{40}}' }, { value: 40 }, null],
  ['ShadCircularProgress', 'number', { value: '{{40}}' }, { value: 40 }, '40'],
];

// The shapes a widget's default takes: those its schema names, and text and a number where it takes anything.
const shapesOf = (type) => {
  const props = CONFIGS[type].properties || {};
  const key = ['defaultValue', 'defaultChecked', 'value'].find((k) => props[k]);
  if (!key) return [];
  const flat = (s) => (s?.type === 'union' ? s.schemas.flatMap(flat) : s?.type ? [s.type] : []);
  const types = flat(props[key].validation?.schema);
  const any = ['string', 'number', 'boolean', 'array', 'object'].every((t) => types.includes(t));
  return any ? ['string', 'number'] : types.filter((t) => ['string', 'number', 'boolean', 'array'].includes(t));
};

// Clears: [componentType, how, properties, exposed after, events fired]. `how` is an action, or a press on a control
// ('press:<accessible name>'), or a press on the chosen option ('chosen:<text>'). A clear through the UI fires the
// widget's change event once; an action fires what its native counterpart's action fires (actionCases.js). A Toggle
// group keeps one choice when its chosen one is pressed again (a segmented control; its clear action empties it).
const CLEARS = [
  [
    'ShadInput',
    'press:Clear',
    { inputType: 'search', defaultValue: 'x' },
    { value: '', isValid: true },
    { onChange: 1 },
  ],
  // Show clear button's x, on every field that offers it (showClearButton.spec covers its required and disabled cases).
  [
    'ShadCurrencyInput',
    'press:Clear',
    { showClearBtn: '{{true}}', defaultValue: '{{12.5}}' },
    { value: null, isValid: true },
    { onChange: 1 },
  ],
  [
    'ShadInput',
    'press:Clear',
    { inputType: 'url', showClearBtn: '{{true}}', defaultValue: 'https://example.com' },
    { value: '', isValid: true },
    { onChange: 1 },
  ],
  [
    'ShadInput',
    'press:Clear',
    { inputType: 'number', showClearBtn: '{{true}}', defaultValue: '42' },
    { value: null, isValid: true },
    { onChange: 1 },
  ],
  [
    'ShadNumberInput',
    'press:Clear',
    { showClearBtn: '{{true}}', defaultValue: '{{5}}' },
    { value: null, isValid: true },
    { onChange: 1 },
  ],
  [
    'ShadSelect',
    'press:Clear selection',
    { options: OPTIONS_12, defaultValue: '{{1}}' },
    { value: '' },
    { onSelect: 1 },
  ],
  ['ShadSelect', 'chosen:One', { options: OPTIONS_12, defaultValue: '{{1}}' }, { value: '' }, { onSelect: 1 }],
  ['ShadRadioGroup', 'chosen:Standard', { allowDeselect: '{{true}}' }, { value: '' }, { onSelectionChange: 1 }],
  ['ShadMultiselect', 'press:Remove Design', { defaultValue: "{{['design']}}" }, { values: [] }, { onSelect: 1 }],
  [
    'ShadTagsInput',
    'press:Remove alpha',
    { defaultValue: "{{['alpha']}}" },
    { values: [] },
    { onChange: 1, onTagDeleted: 1 },
  ],
  ['ShadFileUpload', 'clearFiles', {}, { file: [] }, {}],
  ['ShadDatePicker', 'clearDateRange', { mode: 'range' }, { startDate: '', endDate: '' }, {}],
  ['ShadDatePicker', 'clearStartDate', { mode: 'range' }, { startDate: '' }, {}],
  ['ShadDatePicker', 'clearEndDate', { mode: 'range' }, { endDate: '' }, {}],
];

const harnesses = {};
for (const type of VALUE_TYPES) {
  harnesses[type] = createWidgetHarness({
    componentType: type,
    handle: 'widget1',
    id: ID,
    widgetHeight: 420,
    widgetWidth: 640,
    preload: [type],
    capabilities: { dnd: true },
  });
}
const bind = (properties) => Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)]));
const rootOf = () => document.querySelector('[data-cy="draggable-widget-widget1"] .tj-shadcn');
const shownText = (root) =>
  [
    root.textContent,
    ...[...root.querySelectorAll('input, textarea')].map((el) => el.value),
    [...root.querySelectorAll('input')].map((el) => el.value).join(''),
  ].join(' | ');
const expectShown = (shown) => {
  const root = rootOf();
  if (typeof shown === 'boolean') {
    const control = root.querySelector('[role=checkbox], [role=switch]');
    expect(control.getAttribute('aria-checked')).toBe(String(shown));
  } else if (shown !== null) {
    expect(shownText(root)).toContain(shown);
  }
};
const exposedType = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

const mount = async (type, properties, validation = {}) => {
  const widget = harnesses[type];
  await widget.setup();
  widget.render({ currentMode: 'view', properties: bind(properties), validation });
  const all = Object.keys(CONFIGS[type].events || {});
  widget.setEvents(all.flatMap((event) => countInvocationsOn(ID, event, { key: `n_${event}` })));
  await waitFor(() => expect(rootOf()).toBeTruthy());
  const fired = () =>
    Object.fromEntries(all.map((e) => [e, widget.variables()[`n_${e}`] ?? 0]).filter(([, n]) => n > 0));
  return { widget, fired };
};

describe('UI 2.0 values round-trip', () => {
  it('has a default case for every shape each widget’s default takes', () => {
    const missing = VALUE_TYPES.flatMap((type) =>
      shapesOf(type)
        .filter((shape) => !DEFAULTS.some(([t, s]) => t === type && s === shape))
        .map((shape) => `${type} ${shape}`)
    );
    expect(missing).toEqual([]);
  });

  it('has a case, or a reason, for every value action of every widget', () => {
    const covered = new Set([
      ...ACTION_CASES.map(([t, a]) => `${t}.${a}`),
      ...CLEARS.filter(([, how]) => !how.includes(':')).map(([t, a]) => `${t}.${a}`),
      ...Object.keys(NEUTRAL),
    ]);
    const missing = VALUE_TYPES.flatMap((t) => valueActions(t).map((a) => `${t}.${a}`)).filter((k) => !covered.has(k));
    expect(missing).toEqual([]);
  });

  it.each(DEFAULTS)('%s default (%s) %j', async (type, _shape, properties, exposed, shown) => {
    const { widget } = await mount(type, properties);
    try {
      await waitFor(() => expect(widget.exposed()).toMatchObject(exposed));
      for (const [k, v] of Object.entries(exposed)) expect(exposedType(widget.exposed()[k])).toBe(exposedType(v));
      expectShown(shown);
    } finally {
      widget.teardown();
    }
  });

  // What an action shows, for the action cases that set a value (actionCases.js has what they expose and fire).
  const SHOWN = {
    'ShadInput.setText': 'a',
    'ShadTextarea.setText': 'a',
    'ShadPasswordInput.setText': 's3cret',
    'ShadNumberInput.setText': '5',
    'ShadCurrencyInput.setValue': '12.50',
    'ShadPhoneInput.setValue': '555',
    'ShadOtpInput.setText': '123456',
    'ShadSelect.selectOption': 'Two',
    'ShadCombobox.selectOption': 'Canada',
    'ShadMultiselect.selectOptions': 'Design',
    'ShadRadioGroup.selectOption': 'Premium',
    'ShadCheckbox.setValue': null,
    'ShadCheckbox.toggle': true,
    'ShadSwitch.setValue': true,
    'ShadSwitch.toggle': true,
    'ShadSlider.setValue': '30',
    'ShadColorPicker.setColor': 'ff0000',
    'ShadDatePicker.setValue': '2026-10-17',
    'ShadTimePicker.setValue': '9:30 AM',
    'ShadButtonGroup.setSelected': 'Month',
    'ShadToggleGroup.setSelected': 'Open',
    'ShadTagsInput.setTags': 'b',
    'ShadTagsInput.selectTags': 'react',
  };
  const SET_CASES = ACTION_CASES.filter(([t, a]) => VALUE_TYPES.includes(t) && `${t}.${a}` in SHOWN);
  it.each(SET_CASES)('%s.%s shows what it sets', async (type, action, args, properties, exposed) => {
    const { widget } = await mount(type, properties);
    try {
      const seen = await widget.actNow(action, ...args);
      expect(seen).toMatchObject(exposed);
      for (const [k, v] of Object.entries(exposed)) expect(exposedType(seen[k])).toBe(exposedType(v));
      if ('isValid' in seen) expect(seen.isValid).toBe(true);
      await waitFor(() => expectShown(SHOWN[`${type}.${action}`]));
    } finally {
      widget.teardown();
    }
  });

  // Every clear action in actionCases.js, plus the UI's clears: the value empties, isValid holds, nothing fires twice.
  const ACTION_CLEARS = ACTION_CASES.filter(
    ([t, a]) => VALUE_TYPES.includes(t) && /^(clear|deselect|reset)/.test(a)
  ).map(([t, a, args, props, exposed, events]) => [t, a, props, exposed, events, args]);
  it.each([...ACTION_CLEARS, ...CLEARS])(
    '%s clears with %s',
    async (type, how, properties, exposed, events, args = []) => {
      const { widget, fired } = await mount(type, properties);
      try {
        if (how.startsWith('press:') || how.startsWith('chosen:')) {
          const [, name] = how.split(':');
          const root = rootOf();
          const control = how.startsWith('press:')
            ? root.querySelector(`[aria-label="${name}"]`)
            : [...root.querySelectorAll('[role=radio], [role=option], [role=combobox], button, label')].find(
                (el) => el.textContent.trim() === name
              );
          expect(control).toBeTruthy();
          if (how.startsWith('chosen:') && type === 'ShadSelect') {
            press(root.querySelector('[role=combobox]'));
            const option = await waitFor(() => {
              const o = [...document.querySelectorAll('[role=option]')].find((el) => el.textContent.trim() === name);
              expect(o).toBeTruthy();
              return o;
            });
            await act(async () => {
              fireEvent.pointerUp(option, { button: 0, pointerType: 'mouse' });
            });
          } else {
            await act(async () => press(control));
          }
          await waitFor(() => expect(widget.exposed()).toMatchObject(exposed));
        } else {
          const seen = await widget.actNow(how, ...args);
          expect(seen).toMatchObject(exposed);
        }
        if ('isValid' in widget.exposed()) expect(widget.exposed().isValid).toBe(true);
        // The change event once (a press also focuses the field: its onFocus fires too, once).
        expect(fired()).toMatchObject(events);
        const changes = Object.keys(fired()).filter((e) => !['onFocus', 'onBlur'].includes(e));
        expect(changes.sort()).toEqual(Object.keys(events).sort());
        for (const n of Object.values(fired())) expect(n).toBe(1);
      } finally {
        widget.teardown();
      }
    }
  );

  // A required widget cleared is invalid: the clear does not leave it reading valid.
  const EMPTY = (v) => v === '' || v === null || (Array.isArray(v) && v.length === 0);
  const REQUIRED = ACTION_CLEARS.filter(
    ([t, , , exposed]) =>
      'isMandatory' in (CONFIGS[t].exposedVariables || {}) && Object.values(exposed).every((v) => EMPTY(v))
  );
  it.each(REQUIRED)(
    '%s cleared with %s while required reads invalid',
    async (type, how, properties, exposed, _e, args) => {
      const { widget } = await mount(type, properties, { mandatory: '{{true}}' });
      try {
        const seen = await widget.actNow(how, ...args);
        expect(seen).toMatchObject(exposed);
        await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      } finally {
        widget.teardown();
      }
    }
  );
});
