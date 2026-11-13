import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA round four, Ant Design pack. The pack components, the inline SDK and the host renderer are the real ones; only
// module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const OPTIONS = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
];

describe('a choice keeps its mode shape and only values its options offer', () => {
  test('Select: multiple to single takes the first value, single to multiple a list of one', async () => {
    const v = await mountPack('antd', 'Select', { options: OPTIONS, mode: 'multiple', value: ['b', 'a'] });
    expect(v.exposed.value).toEqual(['b', 'a']);
    await v.update({ props: { options: OPTIONS, mode: '', value: ['b', 'a'] } });
    expect(v.exposed.value).toBe('b');
    await v.update({ props: { options: OPTIONS, mode: 'multiple', value: 'a' } });
    expect(v.exposed.value).toEqual(['a']);
  });

  test('Select: a value no option offers is dropped, but waits while there are no options', async () => {
    const v = await mountPack('antd', 'Select', { options: [], value: 'b' });
    expect(v.exposed.value).toBe('b');
    await v.update({ props: { options: OPTIONS, value: 'b' } });
    expect(v.exposed.value).toBe('b');
    await v.update({ props: { options: OPTIONS, value: 'zzz' } });
    expect(v.exposed.value).toBe('');
    await v.update({ props: { options: OPTIONS, mode: 'multiple', value: ['a', 'zzz'] } });
    expect(v.exposed.value).toEqual(['a']);
  });

  test('TreeSelect: toggling Multiple changes the value shape', async () => {
    const v = await mountPack('antd', 'TreeSelect', { multiple: true, value: ['frontend', 'backend'] });
    expect(v.exposed.value).toEqual(['frontend', 'backend']);
    await v.update({ props: { multiple: false, value: ['frontend', 'backend'] } });
    expect(v.exposed.value).toBe('frontend');
    await v.update({ props: { multiple: true, value: 'backend' } });
    expect(v.exposed.value).toEqual(['backend']);
  });

  test('ButtonGroup: shape follows the mode, actions and none hold no selection, unknown values are refused', async () => {
    const v = await mountPack('antd', 'ButtonGroup', { mode: 'single', value: 'week' });
    expect(v.exposed.value).toBe('week');
    await v.update({ props: { mode: 'multiple', value: 'week' } });
    expect(v.exposed.value).toEqual(['week']);
    await v.update({ props: { mode: 'actions', value: 'week' } });
    expect(v.exposed.value).toBe('');
    await v.update({ props: { mode: 'single', value: 'day' } });
    const events = v.events.length;
    await v.run('setSelected', 'year');
    expect(v.exposed.value).toBe('day');
    expect(v.events).toHaveLength(events);
    await v.update({ props: { mode: 'single', value: 'year' } });
    expect(v.exposed.value).toBe('');
  });

  test('RadioGroup: a value no option offers is dropped', async () => {
    const v = await mountPack('antd', 'RadioGroup', { options: OPTIONS, value: 'zzz' });
    await settle();
    expect(v.exposed.value).toBe('');
  });
});

describe('screen readers', () => {
  test('ButtonGroup is a labelled group whose selecting buttons are pressed or not', async () => {
    const v = await mountPack('antd', 'ButtonGroup', { mode: 'single', value: 'week', label: 'Range' });
    const group = v.root().querySelector('[role="group"]');
    expect(group.getAttribute('aria-label')).toBe('Range');
    const pressed = [...group.querySelectorAll('button')].map((b) => b.getAttribute('aria-pressed'));
    expect(pressed).toEqual(['false', 'true', 'false']);
  });

  test.each([
    ['RadioGroup', '[role="radiogroup"]'],
    ['Segmented', '[role="radiogroup"]'],
    ['Rate', 'ul'],
  ])('%s is named by its label', async (name, selector) => {
    const v = await mountPack('antd', name, { label: 'Pick one' });
    expect(v.root().querySelector(selector).getAttribute('aria-label')).toBe('Pick one');
  });
});

describe('dates and times', () => {
  test('DatePicker setFieldValue refuses a date that does not exist instead of rolling it over', async () => {
    const v = await mountPack('antd', 'DatePicker', { value: '2026-10-05' });
    await v.run('setFieldValue', '2026-13-45');
    expect(v.exposed.value).toBe('2026-10-05');
    await v.run('setFieldValue', '2026-02-30');
    expect(v.exposed.value).toBe('2026-10-05');
    await v.run('setFieldValue', '2026-11-30');
    expect(v.exposed.value).toBe('2026-11-30');
    await v.run('setFieldValue', '');
    expect(v.exposed.value).toBe('');
  });

  test('TimePicker setFieldValue refuses a time that does not exist', async () => {
    const v = await mountPack('antd', 'TimePicker', { value: '09:30' });
    await v.run('setFieldValue', '25:99');
    expect(v.exposed.value).toBe('09:30');
    await v.run('setFieldValue', '7:05');
    expect(v.exposed.value).toBe('07:05');
  });

  test('a month picker shows the month and keeps its first day', async () => {
    const v = await mountPack('antd', 'DatePicker', { picker: 'month', value: '2026-10-25' });
    expect(v.root().querySelector('input').value).toBe('2026-10');
    await v.run('setFieldValue', '2026-12-19');
    expect(v.exposed.value).toBe('2026-12-01');
  });
});

describe('numbers and figures', () => {
  test('CurrencyInput holds Precision decimals for defaults and setFieldValue too', async () => {
    const v = await mountPack('antd', 'CurrencyInput', { value: 12.345, precision: 2 });
    await settle();
    expect(v.exposed.value).toBe(12.35);
    await v.run('setFieldValue', 7.129);
    expect(v.exposed.value).toBe(7.13);
  });

  test('percent reads a fraction: 0.8 is 80% and 1.2 is 120%', async () => {
    const { formatNumber } = require('../../../../../../packs/antd/src/lib/format.ts');
    expect(formatNumber(0.8, 'percent')).toBe('80%');
    expect(formatNumber(1.2, 'percent')).toBe('120%');
    const mui = require('../../../../../../packs/mui/src/lib/format.ts');
    expect(mui.formatNumber(1.2, 'percent')).toBe('120%');
  });

  // Its own items are fractions now (QA AD-43): Refund rate 0.021 and the Revenue delta 0.12 still read 2.1% and +12.0%.
  test('SummaryStrip: its own items show their percents, and a missing value shows a dash', async () => {
    const v = await mountPack('antd', 'SummaryStrip', {});
    const text = v.root().textContent;
    expect(text).toContain('2.1%');
    expect(text).toContain('+12.0%');
    const empty = await mountPack('antd', 'SummaryStrip', { items: [{ label: 'Open', value: null }] });
    const figure = empty.root().querySelector('.ant-statistic-content').textContent;
    expect(figure).toBe('–');
  });
});

describe('collections', () => {
  test('Kanban exposes every card from load and follows new data', async () => {
    const data = [
      { id: 1, title: 'One', status: 'todo' },
      { id: 2, title: 'Two', status: 'done' },
    ];
    const v = await mountPack('antd', 'Kanban', { dataSource: data });
    await settle();
    expect(v.exposed.updatedCardData.map((c) => c.id)).toEqual([1, 2]);
    await v.update({ props: { dataSource: [data[0]] } });
    await settle();
    expect(v.exposed.updatedCardData.map((c) => c.id)).toEqual([1]);
  });

  test('Table: current page drops to the last page when the data shrinks to one page', async () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    const v = await mountPack('antd', 'Table', { dataSource: rows, pageSize: 10, current: 3 });
    expect(v.exposed.current).toBe(3);
    await v.update({ props: { dataSource: rows.slice(0, 5), pageSize: 10, current: 3 } });
    await settle();
    expect(v.exposed.current).toBe(1);
  });

  test('Table date cells show the local day of a timestamp, and read epoch numbers', () => {
    const { formatCell } = require('../../../../../../packs/antd/src/lib/format.ts');
    const dayjs = require('dayjs');
    const stamp = '2026-10-25T23:30:00Z';
    const local = dayjs(stamp).format('YYYY-MM-DD');
    expect(formatCell(stamp, 'date', 'USD', 'en-US', 'YYYY-MM-DD')).toBe(local);
    const ms = Date.parse(stamp);
    expect(formatCell(ms, 'date', 'USD', 'en-US', 'YYYY-MM-DD')).toBe(local);
    expect(formatCell(ms / 1000, 'date', 'USD', 'en-US', 'YYYY-MM-DD')).toBe(local);
  });

  test('Tags are buttons a keyboard can press', async () => {
    const v = await mountPack('antd', 'Tags', { tags: ['Alpha', 'Beta'] });
    const tag = v.root().querySelector('[role="button"]');
    expect(tag.tabIndex).toBe(0);
    const { fireEvent } = require('@testing-library/react');
    fireEvent.keyDown(tag, { key: 'Enter' });
    expect(v.exposed.lastClickedTag).toBe('Alpha');
  });
});

describe('Questionnaire', () => {
  test('goTo after submit opens it again at that question', async () => {
    const { fireEvent } = require('@testing-library/react');
    const items = [{ name: 'notes', prompt: 'Anything else?', type: 'text' }];
    const v = await mountPack('antd', 'Questionnaire', { items });
    const submit = [...v.root().querySelectorAll('button')].find((b) => b.textContent.includes('Submit'));
    fireEvent.click(submit);
    await settle();
    expect(v.exposed.isComplete).toBe(true);
    await v.run('goTo', 0);
    expect(v.exposed.isComplete).toBe(false);
    expect(v.root().textContent).toContain('Anything else?');
  });
});

describe('low-priority Ant items', () => {
  const ruleHost = () => {
    const seen = { rule: undefined };
    return {
      seen,
      host: {
        useValidation: (value, present, rule) => {
          seen.rule = rule;
          return { isValid: !rule, error: rule ?? '', required: false, touch: () => {} };
        },
      },
    };
  };

  test.each([
    ['InputNumber', { value: 50, max: 10 }, 'Maximum value is 10'],
    ['InputNumber', { value: 1, min: 5 }, 'Minimum value is 5'],
    ['CurrencyInput', { value: 500, max: 100 }, 'Maximum value is 100'],
    ['Input', { value: 'abcdef', maxLength: 3 }, 'Maximum 3 characters is allowed'],
    ['TextArea', { value: 'abcdef', maxLength: 3 }, 'Maximum 3 characters is allowed'],
    ['RangePicker', { value: ['2026-10-20', '2026-10-01'] }, 'The start date is after the end date'],
  ])('%s: a value past its limits is not valid', async (name, props, message) => {
    const { seen, host } = ruleHost();
    await mountPack('antd', name, props, { host });
    expect(seen.rule).toBe(message);
  });

  test('InputNumber with no number exposes null from load', async () => {
    const v = await mountPack('antd', 'InputNumber', { value: '' });
    await settle();
    expect(v.exposed.value).toBeNull();
  });

  test('ColorPicker drops a colour it cannot read and refuses one from setFieldValue', async () => {
    const v = await mountPack('antd', 'ColorPicker', { value: 'not-a-colour' });
    await settle();
    expect(v.exposed.value).toBe('');
    await v.run('setFieldValue', '#1677ff');
    expect(v.exposed.value).toBe('#1677ff');
    await v.run('setFieldValue', 'bogus');
    expect(v.exposed.value).toBe('#1677ff');
  });

  test('Tabs: a clicked tab is exposed and activeKey is on it when onTabClick runs', async () => {
    const { fireEvent } = require('@testing-library/react');
    const items = [
      { key: 'a', label: 'Alpha' },
      { key: 'b', label: 'Beta' },
    ];
    const v = await mountPack('antd', 'Tabs', { items, activeKey: 'a' });
    const seenAtClick = [];
    v.events.push = function (event) {
      if (event === 'onTabClick') seenAtClick.push(v.exposed.activeKey);
      return Array.prototype.push.call(this, event);
    };
    const tab = [...v.root().querySelectorAll('[role="tab"]')].find((t) => t.textContent === 'Beta');
    fireEvent.click(tab);
    await settle();
    expect(v.exposed.clickedTab).toBe('b');
    expect(seenAtClick).toEqual(['b']);
  });

  test('Table: Select row adds to a checkbox selection, and rows that leave the data fire a selection change', async () => {
    const rows = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ];
    const v = await mountPack('antd', 'Table', { dataSource: rows, rowSelection: 'checkbox' });
    await v.run('selectRow', 1);
    await v.run('selectRow', 3);
    expect(v.exposed.selectedRowKeys).toEqual([1, 3]);
    const before = v.events.filter((e) => e === 'onSelectionChange').length;
    await v.update({ props: { dataSource: rows.slice(0, 2), rowSelection: 'checkbox' } });
    await settle();
    expect(v.exposed.selectedRowKeys).toEqual([1]);
    expect(v.events.filter((e) => e === 'onSelectionChange')).toHaveLength(before + 1);
  });

  test('RecordList amounts share their decimals', () => {
    const { recordItems } = require('../../../../../../packs/antd/src/lib/ui2/display/lists/model.ts');
    const items = recordItems(
      [
        { id: 1, name: 'A', amount: 1200 },
        { id: 2, name: 'B', amount: 12.5 },
      ],
      { titleField: 'name', valueField: 'amount', valueFormat: 'currency', currency: 'USD', locale: 'en-US' }
    );
    expect(items.map((i) => i.value)).toEqual(['$1,200.00', '$12.50']);
  });
});
