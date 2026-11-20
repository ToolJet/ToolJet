import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA round four, Rocket 2.0 (the shadcn pack). The pack components, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CurrencyInput', () => {
  test('a de-DE field reads plain number text from a default or a binding as written', async () => {
    const v = await mountPack('shadcn', 'CurrencyInput', { locale: 'de-DE', defaultValue: '1234.56' });
    expect(v.exposed.value).toBe(1234.56);
    await v.run('setValue', '99.5');
    expect(v.exposed.value).toBe(99.5);
    // Text in the locale's own format is still read in it.
    await v.run('setValue', '1.234,5');
    expect(v.exposed.value).toBe(1234.5);
  });

  test('setCurrency rounds the amount to the new currency, so value matches what the field shows', async () => {
    const v = await mountPack('shadcn', 'CurrencyInput', { defaultValue: '1234.5' });
    expect(v.exposed.value).toBe(1234.5);
    await v.run('setCurrency', 'JPY');
    await settle();
    expect(v.exposed.value).toBe(1235);
  });
});

// Records which exposed values an event's handlers would read: a snapshot of `exposed` as each event fires.
const recordAtEvents = (v) => {
  const seen = [];
  v.events.push = function (event) {
    seen.push({ event, exposed: { ...v.exposed } });
    return Array.prototype.push.call(this, event);
  };
  return seen;
};
const count = (v, name) => v.events.filter((e) => e === name).length;

describe('DataTable', () => {
  const rows = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}`, price: (i + 1) * 100.5 }));

  test('single selection keeps one row whatever the action asks', async () => {
    const v = await mountPack('shadcn', 'DataTable', { data: rows });
    await v.run('selectRows', 'id', [1, 2, 3]);
    expect(v.exposed.selectedRows).toHaveLength(1);
    await v.run('selectAllRows');
    expect(v.exposed.selectedRows).toHaveLength(1);
  });

  test('selection actions and setPage fire their events when they change something', async () => {
    const v = await mountPack('shadcn', 'DataTable', { data: rows, rowsPerPage: 10 });
    await v.run('selectRow', 'id', 2);
    expect(count(v, 'onSelectionChanged')).toBe(1);
    await v.run('selectRow', 'id', 2);
    expect(count(v, 'onSelectionChanged')).toBe(1);
    await v.run('deselectRow');
    expect(count(v, 'onSelectionChanged')).toBe(2);
    await v.run('setPage', 2);
    expect(count(v, 'onPageChanged')).toBe(1);
    await v.run('setPage', 2);
    expect(count(v, 'onPageChanged')).toBe(1);
  });

  test('currentData follows the search, and exposed filters keep the column key', async () => {
    const v = await mountPack('shadcn', 'DataTable', { data: rows });
    await v.run('setSearchText', 'Row 2');
    await settle();
    expect(v.exposed.currentData.every((r) => r.name.includes('Row 2'))).toBe(true);
    await v.run('setFilters', [{ column: 'name', condition: 'contains', value: '1' }]);
    expect(v.exposed.filters[0].columnKey).toBe('name');
  });

  test('a currency column shows the currency own decimals', () => {
    const { formatCell } = require('../../../../../../packs/shadcn/src/lib/ui2/table/model.ts');
    expect(formatCell(1234.5, { type: 'currency', format: { currency: 'JPY', locale: 'en-US' } })).toBe('¥1,235');
    expect(formatCell(1.5, { type: 'currency', format: { currency: 'KWD', locale: 'en-US' } })).toContain('1.500');
  });
});

describe('accordions', () => {
  test('Accordion expand fires onExpand and onChange, and collapse fires onCollapse and onChange', async () => {
    const v = await mountPack('shadcn', 'Accordion', {});
    await v.run('collapseAll');
    v.events.length = 0;
    await v.run('expand', 1);
    expect(v.events).toEqual(expect.arrayContaining(['onExpand', 'onChange']));
    v.events.length = 0;
    await v.run('collapse', 1);
    expect(v.events).toEqual(expect.arrayContaining(['onCollapse', 'onChange']));
  });

  test('AccordionContainer: openIndexes is current when onChange runs', async () => {
    const v = await mountPack('shadcn', 'AccordionContainer', { openSections: ['general'], allowMultiple: false });
    const seen = recordAtEvents(v);
    await v.run('expand', 'billing');
    const change = seen.find((s) => s.event === 'onChange');
    expect(change.exposed.openIndexes).toEqual([1]);
    expect(seen.map((s) => s.event)).toEqual(expect.arrayContaining(['onExpand', 'onCollapse', 'onChange']));
  });
});

describe('tabs and steps', () => {
  test('Tabs: currentTab is the new tab when onTabSwitch runs, and a disabled tab is refused', async () => {
    const tabs = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C', disable: true },
    ];
    const v = await mountPack('shadcn', 'Tabs', { tabs, value: 'a' });
    const seen = recordAtEvents(v);
    await v.run('setTab', 'b');
    expect(seen.find((s) => s.event === 'onTabSwitch').exposed.currentTab).toBe('b');
    await v.run('setTab', 'c');
    expect(v.exposed.currentTab).toBe('b');
    await v.run('nextTab');
    expect(v.exposed.currentTab).toBe('b');
  });

  test('TabsContainer: hiding the tab shown moves on with onTabSwitch', async () => {
    const tabs = [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
    ];
    const v = await mountPack('shadcn', 'TabsContainer', { tabs, currentTab: 'one' });
    v.events.length = 0;
    await v.run('setTabVisibility', 'one', false);
    expect(v.exposed.currentTab).toBe('two');
    expect(v.events).toContain('onTabSwitch');
  });

  test('Steps: next and set step pass over a disabled step', async () => {
    const steps = [
      { id: 's1', name: 'One' },
      { id: 's2', name: 'Two', disabled: true },
      { id: 's3', name: 'Three' },
    ];
    const v = await mountPack('shadcn', 'Steps', { steps, currentStepIndex: 0 });
    await v.run('setStep', 's2');
    expect(v.exposed.currentStepIndex).toBe(0);
    await v.run('nextStep');
    expect(v.exposed.currentStepIndex).toBe(2);
  });
});

describe('choices', () => {
  test('ButtonGroup keeps a numeric value a number, and refuses a value no button has', async () => {
    const buttons = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
    ];
    const v = await mountPack('shadcn', 'ButtonGroup', { buttons, mode: 'single' });
    await v.run('setSelected', 2);
    expect(v.exposed.value).toBe(2);
    await v.run('setSelected', 9);
    expect(v.exposed.value).toBe(2);
  });

  test('RadioGroup refuses a value no option has, and fires nothing', async () => {
    const options = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ];
    const v = await mountPack('shadcn', 'RadioGroup', { options, defaultValue: 'a' });
    v.events.length = 0;
    await v.run('selectOption', 'zzz');
    expect(v.exposed.value).toBe('a');
    expect(v.events).toHaveLength(0);
  });

  test('ToggleGroup carries the selection over when Allow multiple changes', async () => {
    const options = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ];
    const v = await mountPack('shadcn', 'ToggleGroup', { options, defaultValue: 'b', multiple: false });
    await v.update({ props: { options, defaultValue: 'b', multiple: true } });
    expect(v.exposed.values).toEqual(['b']);
    await v.update({ props: { options, defaultValue: 'b', multiple: false } });
    expect(v.exposed.value).toBe('b');
  });
});

describe('dates', () => {
  test('DatePicker range: displayValue is the range the field shows', async () => {
    const v = await mountPack('shadcn', 'DatePicker', { mode: 'range', defaultValue: ['2026-10-01', '2026-10-05'] });
    await settle();
    expect(v.exposed.displayValue).toBe(v.exposed.selectedDateRange);
    expect(v.exposed.displayValue).not.toBe('');
  });

  test('Calendar selectDate refuses a day before Min date', async () => {
    const v = await mountPack('shadcn', 'Calendar', { minDate: '2026-10-10' });
    await v.run('selectDate', '2026-10-20');
    const picked = v.exposed.value;
    await v.run('selectDate', '2026-10-01');
    expect(v.exposed.value).toEqual(picked);
  });
});

describe('charts and stats', () => {
  test('Stat trendData written as JSON text keeps every point', () => {
    const { sparkPaths } = require('../../../../../../packs/shadcn/src/lib/statModel.ts');
    const line = sparkPaths('[3,5,4,8]', 100, 30).line;
    expect(line.split(/[ML]/).filter(Boolean)).toHaveLength(4);
  });

  test('a value axis with negative ticks has room for the minus sign', () => {
    const { valueAxisWidth } = require('../../../../../../packs/shadcn/src/lib/ui2/charts/chartModel.ts');
    const fmt = (v) => `${(v / 1000).toFixed(1)}K USD`;
    const withNegative = valueAxisWidth([{ y: 2000 }, { y: -11500 }], ['y'], fmt);
    expect(withNegative).toBeGreaterThanOrEqual('-15.0K USD'.length * 7 + 18);
  });
});
