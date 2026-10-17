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

const ID = 'w1';
const harnesses = {};
const harnessFor = (componentType) => harnesses[componentType];
const eventsOf = (componentType) => Object.keys(shadcnConfigs.find((c) => c.name === componentType)?.events || {});

const PEOPLE = "{{[{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]}}";

// [componentType, action, args, properties, exposed after, events fired { name: count }]
const CASES = [
  ['ShadInput', 'setText', ['a'], {}, { value: 'a' }, { onChange: 1 }],
  ['ShadInput', 'clear', [], { defaultValue: 'x' }, { value: '' }, { onChange: 1 }],
  ['ShadTextarea', 'setText', ['a'], {}, { value: 'a' }, { onChange: 1 }],
  ['ShadTextarea', 'clear', [], { defaultValue: 'x' }, { value: '' }, { onChange: 1 }],
  ['ShadPasswordInput', 'setText', ['s3cret'], {}, { value: 's3cret' }, { onChange: 1 }],
  ['ShadPasswordInput', 'clear', [], { defaultValue: 'x' }, { value: '' }, { onChange: 1 }],
  ['ShadNumberInput', 'setText', ['5'], {}, { value: 5 }, { onChange: 1 }],
  ['ShadNumberInput', 'clear', [], {}, { value: null }, { onChange: 1 }],
  ['ShadCurrencyInput', 'setValue', [12.5], {}, { value: 12.5 }, { onChange: 1 }],
  ['ShadCurrencyInput', 'clear', [], { defaultValue: '{{3}}' }, { value: null }, { onChange: 1 }],
  ['ShadCurrencyInput', 'setCurrency', ['EUR'], {}, { currency: 'EUR' }, {}],
  ['ShadPhoneInput', 'setValue', ['4155550123', 'US'], {}, { value: '+14155550123' }, { onChange: 1 }],
  ['ShadPhoneInput', 'clear', [], {}, { value: '' }, { onChange: 1 }],
  ['ShadPhoneInput', 'setCountryCode', ['GB'], {}, { country: 'GB' }, {}],
  ['ShadOtpInput', 'setText', ['123456'], {}, { value: '123456' }, { onChange: 1 }],
  ['ShadOtpInput', 'clear', [], {}, { value: '' }, { onChange: 1 }],
  ['ShadSelect', 'selectOption', [2], {}, { value: 2 }, { onSelect: 1 }],
  ['ShadSelect', 'clear', [], { defaultValue: '{{1}}' }, { value: '' }, {}],
  ['ShadCombobox', 'selectOption', ['ca'], {}, { value: 'ca' }, { onSelect: 1 }],
  ['ShadCombobox', 'clear', [], {}, { value: '' }, {}],
  ['ShadMultiselect', 'selectOptions', [['design']], { defaultValue: '{{[]}}' }, { values: ['design'] }, {}],
  ['ShadMultiselect', 'deselectOptions', [['design']], {}, { values: ['engineering'] }, {}],
  ['ShadMultiselect', 'clear', [], {}, { values: [] }, {}],
  ['ShadRadioGroup', 'selectOption', ['Premium'], {}, { value: 'Premium' }, { onSelectionChange: 1 }],
  ['ShadRadioGroup', 'deselectOption', [], {}, { value: '' }, { onSelectionChange: 1 }],
  ['ShadCheckbox', 'setValue', [true], {}, { value: true }, { onCheck: 1 }],
  ['ShadCheckbox', 'setValue', [false], { defaultChecked: '{{true}}' }, { value: false }, { onUnCheck: 1 }],
  ['ShadCheckbox', 'toggle', [], {}, { value: true }, { onChange: 1 }],
  ['ShadSwitch', 'setValue', [true], {}, { value: true }, {}],
  ['ShadSwitch', 'toggle', [], {}, { value: true }, { onChange: 1 }],
  ['ShadSlider', 'setValue', [30], {}, { value: 30 }, { onChange: 1 }],
  ['ShadSlider', 'reset', [], {}, { value: 50 }, {}],
  ['ShadRating', 'setValue', [2], {}, { value: 2 }, {}],
  ['ShadRating', 'resetValue', [], {}, { value: 4 }, {}],
  ['ShadRating', 'clear', [], {}, { value: 0 }, {}],
  ['ShadColorPicker', 'setColor', ['#ff0000'], {}, { value: '#ff0000' }, {}],
  ['ShadDatePicker', 'setValue', ['2026-10-17'], { format: 'YYYY-MM-DD' }, { value: '2026-10-17' }, {}],
  ['ShadDatePicker', 'clearValue', [], { defaultValue: '2026-10-17' }, { value: '' }, {}],
  ['ShadDateTimePicker', 'setValue', ['2026-10-17 09:30'], {}, { selectedDate: '2026-10-17' }, {}],
  ['ShadTimePicker', 'setValue', ['09:30'], {}, { value: '09:30' }, {}],
  ['ShadTimePicker', 'clearValue', [], { defaultValue: '09:30' }, { value: '' }, {}],
  ['ShadButtonGroup', 'setSelected', ['month'], {}, { value: 'month' }, {}],
  ['ShadButtonGroup', 'clear', [], {}, { value: '' }, {}],
  ['ShadToggleGroup', 'setSelected', ['Open'], {}, { value: 'Open' }, {}],
  ['ShadToggleGroup', 'clear', [], {}, { value: '' }, {}],
  ['ShadTagsInput', 'selectTags', [['react']], {}, { values: ['react'] }, {}],
  ['ShadTagsInput', 'setTags', [['a', 'b']], {}, { values: ['a', 'b'] }, {}],
  ['ShadTagsInput', 'clear', [], { defaultValue: "{{['a']}}" }, { values: [] }, {}],
  ['ShadTabs', 'setTab', ['t1'], {}, { currentTab: 't1' }, { onTabSwitch: 1 }],
  ['ShadTabs', 'setTab', ['t0'], {}, { currentTab: 't0' }, {}],
  ['ShadPagination', 'setPage', [3], { totalPages: '{{5}}' }, { currentPageIndex: 3 }, { onPageChange: 1 }],
  ['ShadNavigation', 'selectItem', ['orders'], {}, { selectedItem: expect.objectContaining({ value: 'orders' }) }, {}],
  ['ShadSteps', 'setStep', [2], {}, { currentStepId: 2 }, {}],
  ['ShadAccordion', 'expand', [0], {}, {}, { onExpand: 1 }],
  ['ShadAccordion', 'collapse', [0], { defaultExpanded: '{{[0]}}' }, {}, { onCollapse: 1 }],
  ['ShadKanban', 'addCard', [{ id: 9, title: 'New' }, 'todo'], {}, { lastAddedCard: expect.objectContaining({ id: 9 }) }, { onCardAdded: 1, onUpdate: 1 }],
  ['ShadKanban', 'moveCard', [1, 'done'], {}, { lastCardMovement: expect.objectContaining({ cardId: 1, to: 'done' }) }, { onCardMoved: 1, onUpdate: 1 }],
  ['ShadKanban', 'deleteCard', [1], {}, { lastRemovedCard: expect.objectContaining({ id: 1 }) }, { onCardRemoved: 1, onUpdate: 1 }],
  ['ShadKanban', 'updateCardData', [1, { title: 'Renamed' }], {}, { lastUpdatedCard: expect.objectContaining({ title: 'Renamed' }) }, { onCardUpdated: 1, onUpdate: 1 }],
  ['ShadTable', 'selectRow', ['id', 2], {}, { selectedRow: expect.objectContaining({ id: 2 }) }, {}],
  ['ShadTable', 'setPage', [1], {}, { pageIndex: 1 }, {}],
  ['ShadTable', 'setSearchText', ['Ada'], {}, { searchText: 'Ada' }, { onSearch: 1 }],
  ['ShadListView', 'selectItem', [2], { data: PEOPLE }, { selectedItem: { id: 2, name: 'Grace' } }, {}],
  ['ShadListView', 'clearSelection', [], { data: PEOPLE }, { selectedItemId: null }, {}],
  ['ShadFileUpload', 'clearFiles', [], {}, { file: [] }, {}],
  ['ShadCalendar', 'selectDate', ['2026-10-17'], {}, { selectedDate: expect.anything() }, {}],
  ['ShadCarousel', 'goTo', [1], {}, { currentIndex: 1 }, { onSlideChanged: 1 }],
];

// One harness per widget, made at load time: each preloads its widget's lazy chunk before the tests run.
for (const [componentType] of CASES) {
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
