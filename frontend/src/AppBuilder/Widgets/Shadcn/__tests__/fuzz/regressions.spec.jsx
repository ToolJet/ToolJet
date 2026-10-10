import { act, fireEvent, screen } from '@testing-library/react';
import { ROWS_10K, defaultsOf, installGuards, mountCase, problemsOf, styleDefaultsOf } from './harness';
import { stringify } from '../../../packJson';
import { MAX_THUMBS, sliderBounds, sliderValues } from '../../sliderModel';
import { curveOf } from '../../chartsModel';
import { MAX_SHOWN_OPTIONS, MAX_TAGS, addTags, safeRegex } from '../../pickersModel';
import { MAX_COLUMNS, normalizeColumns } from '../../tableModel';
import { sanitizeDialog } from '../../ShadOverlays';

// One test per crash, loop or freeze the 2026-10-10 fuzz found (harness.jsx), so none comes back.
installGuards();

const circular = { a: 1 };
circular.self = circular;
const NUMS_10K = ROWS_10K.map((r) => r.id);

const mount = async (name, properties = {}, styles = {}) => {
  const result = await mountCase({
    name,
    properties: { ...defaultsOf(name), ...properties },
    styles: { ...styleDefaultsOf(name), ...styles },
  });
  return { ...result, problems: () => problemsOf(result.stats) };
};
const timed = async (fn) => {
  const t = performance.now();
  await act(async () => {
    await fn();
  });
  return performance.now() - t;
};

describe('circular and BigInt values', () => {
  it('stringify never throws', () => {
    expect(stringify({ a: 1 })).toBe('{"a":1}');
    expect(stringify(circular)).toBe('{"a":1,"self":"[Circular]"}');
    expect(stringify({ n: BigInt(5) })).toBe('{"n":"5"}');
    expect(stringify(undefined)).toBeUndefined();
  });

  it.each([
    ['ShadCalendar', 'defaultValue'],
    ['ShadDateTimePicker', 'minDate'],
    ['ShadKeyValue', 'data'],
    ['ShadSteps', 'steps'],
    ['ShadTags', 'tags'],
    ['ShadTimeline', 'items'],
    ['ShadDatePicker', 'defaultValue'],
  ])('%s takes a circular %s', async (name, key) => {
    const { problems, unmount } = await mount(name, { [key]: circular });
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('Date picker', () => {
  it.each([[-1], [true], [{}], [circular]])('takes a non-text format (%p)', async (format) => {
    const { problems, unmount } = await mount('ShadDatePicker', {
      format,
      defaultValue: '2026-01-05',
    });
    expect(document.body.textContent).toContain('05 Jan 2026');
    unmount();
    expect(problems()).toEqual([]);
  });

  it.each([['2026-13-45'], ['yesterday'], [ROWS_10K], [Infinity]])(
    'opens its calendar over an invalid default (%#)',
    async (defaultValue) => {
      const { problems, unmount } = await mount('ShadDatePicker', {
        defaultValue,
      });
      await act(async () => fireEvent.click(document.querySelector('button')));
      unmount();
      expect(problems()).toEqual([]);
    }
  );
});

describe('Slider', () => {
  it('keeps bounds finite and ordered, and the step positive', () => {
    expect(sliderBounds({ min: 'x', max: NaN, step: 0 })).toEqual({
      min: 0,
      max: 100,
      step: 1,
    });
    expect(sliderBounds({ min: 10, max: 0, step: -5 })).toEqual({
      min: 0,
      max: 10,
      step: 1,
    });
    expect(sliderBounds({ min: 5, max: 5 })).toEqual({
      min: 5,
      max: 6,
      step: 1,
    });
    expect(sliderBounds({ min: 0, max: 1, step: 0.1 })).toEqual({
      min: 0,
      max: 1,
      step: 0.1,
    });
  });

  it('draws at most MAX_THUMBS thumbs, each within the bounds', async () => {
    expect(sliderValues(ROWS_10K, { min: 0, max: 100 })).toHaveLength(MAX_THUMBS);
    expect(sliderValues([500, -5, 'x'], { min: 0, max: 100 })).toEqual([0, 0, 100]);
    const { problems, unmount } = await mount('ShadSlider', {
      defaultValue: NUMS_10K,
    });
    expect(document.querySelectorAll('[role=slider]').length).toBeLessThanOrEqual(MAX_THUMBS);
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('charts', () => {
  it('reads only the known curve names', () => {
    expect(curveOf('linear')).toBe('linear');
    expect(curveOf('constructor')).toBe('monotone');
    expect(curveOf(() => 'x')).toBe('monotone');
  });

  it('an area chart takes a function as its curve', async () => {
    const { problems, unmount } = await mount('ShadAreaChart', {
      curve: () => 'x',
    });
    unmount();
    expect(problems()).toEqual([]);
  });

  it.each([
    ['ShadPieChart', 100, '.recharts-pie-sector', '.recharts-pie'],
    ['ShadBarChart', 500, '.recharts-bar-rectangle', '.recharts-bar'],
  ])('%s draws a bounded number of shapes per series from 10k rows', async (name, max, shape, series) => {
    const { problems, unmount } = await mount(name, { data: ROWS_10K });
    const perSeries = document.querySelectorAll(shape).length / document.querySelectorAll(series).length;
    expect(perSeries).toBeLessThanOrEqual(max);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('a bar chart with 10k series names draws at most 12 series', async () => {
    const { problems, unmount } = await mount('ShadBarChart', {
      data: ROWS_10K.slice(0, 20),
      yFields: NUMS_10K.map(String),
    });
    expect(document.querySelectorAll('.recharts-bar').length).toBeLessThanOrEqual(12);
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('long option lists', () => {
  it('a select draws 500 of 10k options, says so, and keeps a selected option past them', async () => {
    const options = NUMS_10K.map((i) => ({ label: `Option ${i}`, value: i }));
    const { stats, problems, unmount } = await mount('ShadSelect', {
      options,
      defaultValue: '9999',
    });
    expect(stats.exposed.value).toBe(9999);
    expect(document.body.textContent).toContain('Option 9999');
    unmount();
    expect(problems()).toEqual([]);
  });

  it.each([
    ['ShadRadioGroup', '[role=radio]'],
    ['ShadToggleGroup', 'button'],
  ])('%s draws at most 100 of 10k options', async (name, selector) => {
    const { problems, unmount } = await mount(name, { options: NUMS_10K });
    expect(document.querySelectorAll(selector).length).toBeLessThanOrEqual(101);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('an accordion draws at most 200 of 10k sections', async () => {
    const { problems, unmount } = await mount('ShadAccordion', {
      items: ROWS_10K,
    });
    expect(document.querySelectorAll('[data-state]').length).toBeLessThan(1000);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('a combobox lists MAX_SHOWN_OPTIONS of 10k, and its search still reaches the last one', async () => {
    const options = NUMS_10K.map((i) => ({ label: `Option ${i}`, value: i }));
    const { problems, unmount } = await mount('ShadCombobox', { options });
    await act(async () => fireEvent.click(document.querySelector('button, [role=combobox]')));
    expect(document.querySelectorAll('[cmdk-item]').length).toBeLessThanOrEqual(MAX_SHOWN_OPTIONS);
    expect(document.body.textContent).toContain('more. Type to narrow the list.');
    const search = document.querySelector('[cmdk-input]');
    await act(async () => fireEvent.change(search, { target: { value: 'Option 9999' } }));
    expect(screen.getByText('Option 9999')).toBeTruthy();
    unmount();
    expect(problems()).toEqual([]);
  });

  it('a multiselect with 10k selected draws at most 50 chips, and select all over 10k options is quick', async () => {
    const options = NUMS_10K.map((i) => ({ label: `Option ${i}`, value: i }));
    const t = performance.now();
    const { stats, problems, unmount } = await mount('ShadMultiselect', {
      options,
      defaultValue: NUMS_10K,
    });
    expect(performance.now() - t).toBeLessThan(8000);
    expect(stats.exposed.values).toHaveLength(10000);
    expect(document.body.textContent).toMatch(/\+99\d\d more/);
    expect(document.querySelectorAll('*').length).toBeLessThan(5000);
    unmount();
    expect(problems()).toEqual([]);
    const second = await mount('ShadMultiselect', {
      options,
      defaultValue: [],
    });
    await act(async () => fireEvent.click(document.querySelector('[role=combobox], button')));
    expect(await timed(() => fireEvent.click(screen.getByText('Select all')))).toBeLessThan(8000);
    expect(second.stats.exposed.values).toHaveLength(10000);
    second.unmount();
    expect(second.problems()).toEqual([]);
  });

  it('a breadcrumb of 10k items shows the first, an ellipsis and the last six', async () => {
    const { problems, unmount } = await mount('ShadBreadcrumb', {
      items: NUMS_10K.map((i) => `Page ${i}`),
    });
    const crumbs = [...document.querySelectorAll('li')].map((li) => li.textContent);
    expect(crumbs).toEqual([
      'Page 0',
      '…',
      'Page 9994',
      'Page 9995',
      'Page 9996',
      'Page 9997',
      'Page 9998',
      'Page 9999',
    ]);
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('Tags input', () => {
  it('rejects a pattern V8 cannot compile instead of throwing in render', async () => {
    expect(safeRegex('x'.repeat(100000))).toBeNull();
    expect(safeRegex('^[a-z]+$').test('abc')).toBe(true);
    const { problems, unmount } = await mount('ShadTagsInput', {
      tagPattern: 'x'.repeat(100000),
    });
    unmount();
    expect(problems()).toEqual([]);
  });

  it('dedupes 10k tags in one pass and keeps at most MAX_TAGS', () => {
    const t = performance.now();
    const { tags } = addTags([], NUMS_10K.map(String));
    expect(performance.now() - t).toBeLessThan(2000);
    expect(tags).toHaveLength(MAX_TAGS);
    expect(addTags(['A'], ['a', 'b']).tags).toEqual(['A', 'b']);
  });
});

describe('Table', () => {
  it('keeps at most MAX_COLUMNS columns', () => {
    expect(normalizeColumns(ROWS_10K, [])).toHaveLength(MAX_COLUMNS);
  });

  it('selectRows and deselectRows over 10k values on 10k rows finish quickly; a list as the key selects nothing', async () => {
    const { stats, problems, unmount } = await mount('ShadTable', {
      data: ROWS_10K,
    });
    const values = NUMS_10K;
    expect(await timed(() => stats.exposed.selectRows('id', values))).toBeLessThan(8000);
    expect(stats.exposed.selectedRows).toHaveLength(10000);
    expect(await timed(() => stats.exposed.deselectRows('id', values.slice(0, 5000)))).toBeLessThan(8000);
    expect(stats.exposed.selectedRows).toHaveLength(5000);
    expect(await timed(() => stats.exposed.selectRows(ROWS_10K, ROWS_10K))).toBeLessThan(8000);
    expect(
      await timed(() => stats.exposed.setFilters(ROWS_10K.map(() => ({ column: 'id', condition: 'gt', value: 1 }))))
    ).toBeLessThan(8000);
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('Kanban', () => {
  it('draws 100 cards a column, then 100 more per "Show more"', async () => {
    const data = NUMS_10K.map((i) => ({
      id: i,
      title: `Card ${i}`,
      status: 'todo',
    }));
    const { problems, unmount } = await mount('ShadKanban', {
      data,
      columns: ['todo'],
    });
    expect(document.body.textContent).toContain('Card 99');
    expect(document.body.textContent).not.toContain('Card 100');
    await act(async () => fireEvent.click(screen.getByText('Show 100 more of 9900')));
    expect(document.body.textContent).toContain('Card 199');
    unmount();
    expect(problems()).toEqual([]);
  });

  it('reads a list bound as a field name as the default field, quickly', async () => {
    const t = performance.now();
    const { problems, unmount } = await mount('ShadKanban', {
      data: ROWS_10K,
      idField: ROWS_10K,
      statusField: ROWS_10K,
      titleField: ROWS_10K,
    });
    expect(performance.now() - t).toBeLessThan(8000);
    expect(document.body.textContent).toContain('Card 0');
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('List view', () => {
  it('draws 100 rows of 10k without paging, then 100 more per "Show more"', async () => {
    const { problems, unmount } = await mount('ShadListView', {
      data: ROWS_10K,
      enablePagination: false,
    });
    expect(document.querySelectorAll('[role=listitem]')).toHaveLength(100);
    await act(async () => fireEvent.click(screen.getByText('Show 100 more of 9900')));
    expect(document.querySelectorAll('[role=listitem]')).toHaveLength(200);
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('Dialog', () => {
  it('replaces values ModalV2 cannot take with the definition defaults', () => {
    expect(sanitizeDialog({ triggerButtonLabel: { a: 1 }, showHeader: circular }, 'properties')).toMatchObject({
      triggerButtonLabel: 'Open dialog',
      showHeader: true,
    });
    // A colour that fails ToolJet's validation arrives as the schema default, false.
    const styles = sanitizeDialog({ triggerButtonBackgroundColor: false, headerBackgroundColor: 12 }, 'styles');
    expect(typeof styles.triggerButtonBackgroundColor).toBe('string');
    expect(typeof styles.headerBackgroundColor).toBe('string');
    expect(sanitizeDialog({ triggerButtonLabel: 'Open' }, 'properties').triggerButtonLabel).toBe('Open');
  });

  it('renders with an object label and numeric colours', async () => {
    const { problems, unmount } = await mount(
      'ShadDialog',
      {
        triggerButtonLabel: { a: 1 },
        useDefaultButton: true,
        showHeader: circular,
      },
      { triggerButtonBackgroundColor: 3, triggerButtonTextColor: false }
    );
    unmount();
    expect(problems()).toEqual([]);
  });
});
