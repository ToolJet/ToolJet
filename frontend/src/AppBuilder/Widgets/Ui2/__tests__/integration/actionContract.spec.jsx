/**
 * UI 2.0 component actions: what an app reads on the next line, and the events they fire.
 *
 * Review (2026-10-17): `await components.input1.setText('after')` then `.value` read "before" (the value was published
 * in a later effect), and setText fired no onChange. Every value-changing action must publish its value (and
 * validation) before its promise resolves, and fire the events its native counterpart's action fires, nothing more:
 * the native contract was read from the native widgets (text inputs' setText and clear fire onChange; Select's
 * selectOption fires onSelect; Radio's selectOption and deselectOption fire onSelectionChange; Checkbox setValue fires
 * onCheck or onUnCheck, toggle fires onChange; Switch toggle fires onChange; Slider setValue fires onChange; Tabs
 * setTab fires onTabSwitch; Pagination setPage fires onPageChange; Accordion expand and collapse fire onExpand and
 * onCollapse; Kanban card actions fire their card event; Table setFilters, clearFilters and setSort fire
 * onFilterChanged and onSort; the rest fire nothing). Widgets with no native counterpart follow the same rule: a
 * programmatic change fires nothing, except moving through views, which fires its change event as the native Tabs
 * and Pagination do (Carousel goTo fires onSlideChanged).
 *
 * Each case mounts the widget, counts every event its config lists, runs the action with widget.actNow (which reads
 * the exposed values right after the action resolves, as an app's next line does) and checks both.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { shadcnConfigs } from '../../../../WidgetManager/widgets/shadcn';
import { ACTION_CASES as CASES, PEOPLE } from '../actionCases';

const ID = 'w1';
const harnesses = {};
const harnessFor = (componentType) => harnesses[componentType];
const eventsOf = (componentType) => Object.keys(shadcnConfigs.find((c) => c.name === componentType)?.events || {});

// The cases are shared with valueRoundTrip.spec, which checks what the widget shows after each one.

const ITEMS = "{{[{ label: 'One', value: 'v1' }, { label: 'Two', value: 'v2' }]}}";

// Two actions in one query, the second undoing the first: [componentType, properties, [action, ...args], exposed
// after it, [action, ...args], exposed after it]. Compat fixtures (17 Oct): `await setValue(...); await clear()` on
// the Phone input ended with the number set again, because work the first action left for later (the phone library's
// copy of the value, synced in an effect) landed after the second. What the second action set must hold once
// everything has settled.
const SEQUENCES = [
  ['ShadInput', {}, ['setText', 'a'], { value: 'a' }, ['clear'], { value: '' }],
  ['ShadTextarea', {}, ['setText', 'a'], { value: 'a' }, ['clear'], { value: '' }],
  ['ShadPasswordInput', {}, ['setText', 's3cret'], { value: 's3cret' }, ['clear'], { value: '' }],
  ['ShadNumberInput', {}, ['setText', '5'], { value: 5 }, ['clear'], { value: null }],
  ['ShadCurrencyInput', {}, ['setValue', 12.5], { value: 12.5 }, ['clear'], { value: null }],
  ['ShadPhoneInput', {}, ['setValue', '2025550143', 'US'], { value: '+12025550143' }, ['clear'], { value: '' }],
  [
    'ShadPhoneInput',
    {},
    ['setValue', '2025550143', 'US'],
    { value: '+12025550143' },
    ['setCountryCode', 'GB'],
    { value: '+442025550143', country: 'GB' },
  ],
  ['ShadOtpInput', {}, ['setText', '123456'], { value: '123456' }, ['clear'], { value: '' }],
  ['ShadSelect', {}, ['selectOption', 2], { value: 2 }, ['clear'], { value: '' }],
  ['ShadCombobox', {}, ['selectOption', 'ca'], { value: 'ca' }, ['clear'], { value: '' }],
  [
    'ShadMultiselect',
    { defaultValue: '{{[]}}' },
    ['selectOptions', ['design']],
    { values: ['design'] },
    ['clear'],
    { values: [] },
  ],
  ['ShadRadioGroup', {}, ['selectOption', 'Premium'], { value: 'Premium' }, ['deselectOption'], { value: '' }],
  ['ShadCheckbox', {}, ['setValue', true], { value: true }, ['setValue', false], { value: false }],
  ['ShadSwitch', {}, ['setValue', true], { value: true }, ['setValue', false], { value: false }],
  ['ShadSlider', {}, ['setValue', 30], { value: 30 }, ['reset'], { value: 50 }],
  ['ShadRating', {}, ['setValue', 2], { value: 2 }, ['clear'], { value: 0 }],
  ['ShadColorPicker', {}, ['setColor', '#ff0000'], { value: '#ff0000' }, ['setColor', '#00ff00'], { value: '#00ff00' }],
  [
    'ShadDatePicker',
    { format: 'YYYY-MM-DD' },
    ['setValue', '2026-10-17'],
    { value: '2026-10-17' },
    ['clearValue'],
    { value: '' },
  ],
  [
    'ShadDateTimePicker',
    {},
    ['setValue', '2026-10-17 09:30'],
    { selectedDate: '2026-10-17' },
    ['clearValue'],
    { value: '' },
  ],
  ['ShadTimePicker', {}, ['setValue', '09:30'], { value: '09:30' }, ['clearValue'], { value: '' }],
  ['ShadButtonGroup', {}, ['setSelected', 'month'], { value: 'month' }, ['clear'], { value: '' }],
  ['ShadToggleGroup', {}, ['setSelected', 'Open'], { value: 'Open' }, ['clear'], { value: '' }],
  ['ShadTagsInput', {}, ['setTags', ['a', 'b']], { values: ['a', 'b'] }, ['clear'], { values: [] }],
  ['ShadTabs', {}, ['setTab', 't1'], { currentTab: 't1' }, ['setTab', 't0'], { currentTab: 't0' }],
  [
    'ShadPagination',
    { totalPages: '{{5}}' },
    ['setPage', 3],
    { currentPageIndex: 3 },
    ['setPage', 1],
    { currentPageIndex: 1 },
  ],
  [
    'ShadNavigation',
    { items: ITEMS },
    ['selectItem', 'v2'],
    { selectedItem: expect.objectContaining({ value: 'v2' }) },
    ['selectItem', 'v1'],
    { selectedItem: expect.objectContaining({ value: 'v1' }) },
  ],
  ['ShadSteps', {}, ['setStep', 2], { currentStepId: 2 }, ['resetSteps'], { currentStepIndex: 0 }],
  ['ShadAccordion', {}, ['expand', 0], { openIndexes: [0] }, ['collapse', 0], { openIndexes: [] }],
  ['ShadCarousel', {}, ['goTo', 1], { currentIndex: 1 }, ['goTo', 0], { currentIndex: 0 }],
  [
    'ShadCalendar',
    {},
    ['selectDate', '2026-10-17'],
    { selectedDate: expect.anything() },
    ['clear'],
    { selectedDate: '' },
  ],
  ['ShadTable', {}, ['setSearchText', 'Ada'], { searchText: 'Ada' }, ['setSearchText', ''], { searchText: '' }],
  [
    'ShadTable',
    {},
    ['selectRow', 'id', 2],
    { selectedRow: expect.objectContaining({ id: 2 }) },
    ['deselectRow'],
    { selectedRowId: null },
  ],
  ['ShadTable', {}, ['setPage', 2], { pageIndex: 2 }, ['setPage', 1], { pageIndex: 1 }],
  [
    'ShadListView',
    { data: PEOPLE },
    ['selectItem', 2],
    { selectedItemId: 2 },
    ['clearSelection'],
    { selectedItemId: null },
  ],
  [
    'ShadKanban',
    {},
    ['moveCard', 1, 'done'],
    { lastCardMovement: expect.objectContaining({ to: 'done' }) },
    ['moveCard', 1, 'todo'],
    { lastCardMovement: expect.objectContaining({ to: 'todo' }) },
  ],
  ['ShadProgress', {}, ['setValue', 30], { value: 30 }, ['setValue', 60], { value: 60 }],
  ['ShadCircularProgress', {}, ['setValue', 30], { value: 30 }, ['setValue', 60], { value: 60 }],
  [
    'ShadStat',
    {},
    ['setPrimaryValue', '12'],
    { primaryValue: '12' },
    ['setPrimaryValue', '34'],
    { primaryValue: '34' },
  ],
  ['ShadButton', {}, ['setText', 'Go'], { buttonText: 'Go' }, ['setText', 'Stop'], { buttonText: 'Stop' }],
  ['ShadLink', {}, ['setLinkText', 'Docs'], { linkText: 'Docs' }, ['setLinkText', 'Help'], { linkText: 'Help' }],
  [
    'ShadImage',
    {},
    ['setImageURL', 'https://example.com/a.png'],
    { imageURL: 'https://example.com/a.png' },
    ['clearImage'],
    { imageURL: '' },
  ],
  ['ShadDropdownMenu', {}, ['open'], { isOpen: true }, ['close'], { isOpen: false }],
];

// One harness per widget, made at load time: each preloads its widget's lazy chunk before the tests run.
for (const componentType of new Set([...CASES, ...SEQUENCES].map(([type]) => type))) {
  harnesses[componentType] ??= createWidgetHarness({
    componentType,
    handle: 'widget1',
    id: ID,
    widgetHeight: 420,
    widgetWidth: 640,
    preload: [componentType],
    // Container widgets draw SubContainers, which need the app's drag-and-drop provider.
    capabilities: { dnd: true },
  });
}

describe('UI 2.0 actions publish before they resolve and fire what the native action fires', () => {
  it.each(CASES)('%s.%s', async (componentType, action, args, properties, expected, events) => {
    const widget = harnessFor(componentType);
    await widget.setup();
    try {
      widget.render({
        currentMode: 'view',
        properties: Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)])),
      });
      const all = eventsOf(componentType);
      widget.setEvents(all.flatMap((event) => countInvocationsOn(ID, event, { key: `n_${event}` })));
      const seen = await widget.actNow(action, ...args);
      expect(seen).toMatchObject(expected);
      const fired = Object.fromEntries(
        all.map((event) => [event, widget.variables()[`n_${event}`] ?? 0]).filter(([, n]) => n > 0)
      );
      expect(fired).toEqual(events);
    } finally {
      widget.teardown();
    }
  });
});

describe('UI 2.0 actions in one query: what a later action sets holds', () => {
  it.each(
    SEQUENCES.map(([type, props, first, a, second, b]) => [
      `${type}: ${first[0]} then ${second[0]}`,
      type,
      props,
      first,
      a,
      second,
      b,
    ])
  )('%s', async (_title, componentType, properties, first, afterFirst, second, afterSecond) => {
    const widget = harnessFor(componentType);
    await widget.setup();
    try {
      widget.render({
        currentMode: 'view',
        properties: Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)])),
      });
      const { after, settled } = await widget.runQuery([first, second]);
      expect(after[0]).toMatchObject(afterFirst);
      expect(after[1]).toMatchObject(afterSecond);
      expect(settled).toMatchObject(afterSecond);
    } finally {
      widget.teardown();
    }
  });
});
