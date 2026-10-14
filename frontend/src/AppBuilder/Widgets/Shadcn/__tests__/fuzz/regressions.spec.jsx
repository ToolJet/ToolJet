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
  it('draws a collapsed column as a lane with its title across, not a sliver of vertical text (read as broken)', async () => {
    const { problems, unmount } = await mount('ShadKanban', {
      data: [{ id: 1, title: 'One', status: 'won' }],
      columns: [
        { id: 'new', title: 'New' },
        { id: 'won', title: 'Won' },
      ],
      collapsedColumns: ['won'],
    });
    const lane = document.querySelector('[data-collapsed="true"]');
    expect(lane.innerHTML).not.toContain('vertical-rl');
    expect(lane.textContent).toContain('Won');
    expect(lane.textContent).toContain('Show cards');
    expect(parseInt(lane.style.width, 10)).toBeGreaterThanOrEqual(140);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('shows stored ISO dates on a card as short dates', async () => {
    const year = new Date().getFullYear();
    const { problems, unmount } = await mount('ShadKanban', {
      data: [{ id: 1, title: 'Northstar', status: 'todo', next: `${year}-10-14T00:00:00`, note: `${year}-03-02` }],
      columns: ['todo'],
      metaField: 'next',
      descriptionField: 'note',
    });
    expect(document.body.textContent).toContain('Oct 14');
    expect(document.body.textContent).toContain('Mar 2');
    expect(document.body.textContent).not.toContain(`${year}-10-14T`);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('keeps the meta line on one line with an ellipsis (dates wrapped across lines in narrow columns)', async () => {
    const { problems, unmount } = await mount('ShadKanban', {
      data: [{ id: 1, title: 'Northstar', status: 'todo', badge: 'Website', when: 'Follow-up Oct 14, 2026' }],
      columns: ['todo'],
      badgeField: 'badge',
      metaField: 'when',
    });
    const meta = [...document.querySelectorAll('span')].find((s) => s.textContent === 'Follow-up Oct 14, 2026');
    expect(meta.className).toContain('truncate');
    expect(meta.getAttribute('title')).toBe('Follow-up Oct 14, 2026');
    // Beside a wide badge the line wraps, the meta moving whole under it, before the meta is cut ("28 Oct 2...", a
    // grants board, 2026-10-14).
    expect(meta.parentElement.className).toMatch(/\bflex-wrap\b/);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('lets columns narrow to 140px when that fits every stage on a narrow board', async () => {
    const { columnMinimum } = await import('../../ShadKanban');
    expect(columnMinimum(3, 620)).toBe(Math.floor((620 - 32) / 3));
    expect(columnMinimum(3, 1200)).toBe(200);
    expect(columnMinimum(3, 300)).toBe(140);
    expect(columnMinimum(7, 0)).toBe(160);
  });

  it('lets columns with a set width grow to fill a wider board (a 165px empty strip at the right)', async () => {
    const { problems, unmount } = await mount('ShadKanban', {
      data: [{ id: 1, title: 'One', status: 'a' }],
      columns: ['a', 'b', 'c', 'd'],
      columnWidth: 250,
    });
    const column = document.querySelector('[data-collapsed="false"]');
    expect(column.style.flex.startsWith('1 1')).toBe(true);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('lets six or more columns narrow to 160px so a seven-stage board fits instead of clipping its last stage', async () => {
    const stages = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const { problems, unmount } = await mount('ShadKanban', {
      data: [{ id: 1, title: 'One', status: 'a' }],
      columns: stages,
    });
    const cols = [...document.querySelectorAll('[data-collapsed="false"]')];
    expect(cols).toHaveLength(7);
    expect(cols[0].style.minWidth).toBe('160px');
    unmount();
    const few = await mount('ShadKanban', { data: [{ id: 1, title: 'One', status: 'a' }], columns: ['a', 'b', 'c'] });
    expect(document.querySelector('[data-collapsed="false"]').style.minWidth).toBe('200px');
    few.unmount();
    expect(problems()).toEqual([]);
  });

  it("shows a card's details when it is clicked, and hides them on a second click", async () => {
    const { problems, unmount } = await mount('ShadKanban', {
      data: [
        {
          id: 1,
          title: 'Northstar',
          status: 'todo',
          details: { 'Deal size': '$24,000', 'Last note': 'Wants one report' },
        },
        { id: 2, title: 'Cedar', status: 'todo', details: { 'Deal size': '$9,500' } },
      ],
      columns: ['todo'],
      detailsField: 'details',
    });
    expect(document.body.textContent).not.toContain('$24,000');
    await act(async () => fireEvent.click(screen.getByText('Northstar')));
    expect(document.body.textContent).toContain('Deal size');
    expect(document.body.textContent).toContain('$24,000');
    expect(document.body.textContent).toContain('Wants one report');
    expect(document.body.textContent).not.toContain('$9,500');
    await act(async () => fireEvent.click(screen.getByText('Cedar')));
    expect(document.body.textContent).not.toContain('$24,000');
    expect(document.body.textContent).toContain('$9,500');
    await act(async () => fireEvent.click(screen.getByText('Cedar')));
    expect(document.body.textContent).not.toContain('$9,500');
    unmount();
    expect(problems()).toEqual([]);
  });

  // dnd-kit's keyboard sensor took Enter as well as Space to pick a card up, so the keyboard could never activate a
  // card (select it, fire onCardClicked, open its details), and on a board without dragging it did nothing at all.
  it.each([
    ['a board with dragging', {}],
    ['a board without dragging', { allowDrag: false }],
  ])('Enter on a focused card opens its details on %s', async (_, extra) => {
    const { problems, unmount } = await mount('ShadKanban', {
      data: [{ id: 1, title: 'Northstar', status: 'todo', details: { 'Deal size': '$24,000' } }],
      columns: ['todo'],
      detailsField: 'details',
      ...extra,
    });
    const card = screen.getByText('Northstar').closest('[aria-roledescription], [role=button]');
    await act(async () => {
      card.focus();
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    });
    expect(document.body.textContent).toContain('$24,000');
    await act(async () => fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' }));
    expect(document.body.textContent).not.toContain('$24,000');
    unmount();
    expect(problems()).toEqual([]);
  });

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

describe('Button focus ring', () => {
  it('stays within the 2px the widget box leaves around a button (a 2px ring 2px out was cut off at the sides)', async () => {
    const { problems, unmount } = await mount('ShadButton', { text: 'Novo Agendamento' });
    const cls = document.querySelector('button').className;
    expect(cls).toContain('focus-visible:ring-1');
    expect(cls).toContain('focus-visible:ring-offset-1');
    expect(cls).not.toContain('focus-visible:ring-offset-2');
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('Hero', () => {
  it('draws its main action on a dark panel in a fixed dark ink (theme foreground is white in a dark app: a blank box)', async () => {
    const { problems, unmount } = await mount('ShadHero', {
      title: 'Riviera',
      actionLabel: 'New booking',
      background: 'dark',
    });
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'New booking');
    expect(btn.className).toContain('bg-white');
    expect(btn.className).not.toContain('var(--sc-foreground)');
    expect(btn.className).toContain('text-[#0f172a]');
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('long text in buttons, badges, pickers, fields and sections', () => {
  // A long-text sweep in a browser (every pack widget, its text properties set long, at a third of the page) found
  // labels running past the widget's box: Button, Badge, Dropdown menu, Empty's action, Date and Time pickers (all one
  // flex box with its text straight inside, which never ellipsizes), the Hero's actions (which squeezed the title to a
  // word a line), and a Number input's prefix pushing its stepper out. jsdom has no layout: these pin the structure.
  const LONG = 'A deliberately long piece of text that keeps going well past what this space was designed to hold';
  const truncated = (text) => {
    const el = [...document.querySelectorAll('span')].find((n) => n.textContent === text && !n.children.length);
    // The text ellipsizes, and the button or badge around it is capped at its box.
    return !!el && /\btruncate\b/.test(el.className) && !!el.parentElement.closest('.max-w-full');
  };
  it.each([
    ['ShadButton', { text: LONG }],
    ['ShadBadge', { text: LONG }],
    ['ShadDropdownMenu', { label: LONG }],
    ['ShadEmpty', { actionLabel: LONG }],
  ])('%s ends a long label in an ellipsis inside its box', async (name, properties) => {
    const { problems, unmount } = await mount(name, properties);
    expect(truncated(LONG)).toBe(true);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('the Hero wraps its actions under the text, and they end in an ellipsis', async () => {
    const { problems, unmount } = await mount('ShadHero', { title: 'Good morning', actionLabel: LONG });
    const section = document.querySelector('section[data-background]');
    expect(section.className).toMatch(/\bflex-wrap\b/);
    expect(truncated(LONG)).toBe(true);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('a Number input prefix takes at most 40% of the box and ends in an ellipsis', async () => {
    const { problems, unmount } = await mount('ShadNumberInput', { prefix: LONG });
    const text = [...document.querySelectorAll('span')].find((n) => n.textContent === LONG && !n.children.length);
    expect(text.className).toMatch(/\btruncate\b/);
    expect(text.parentElement.className).toMatch(/max-w-\[40%\]/);
    expect(text.parentElement.className).not.toMatch(/\bshrink-0\b/);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('a Pagination that fits keeps its Previous and Next words', async () => {
    const { problems, unmount } = await mount('ShadPagination', { numberOfPages: '{{10}}' });
    expect(document.body.textContent).toMatch(/Previous/);
    expect(document.body.textContent).toMatch(/Next/);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('a Pagination too narrow for the whole pager drops the Previous and Next words before it wraps', async () => {
    // A ten-page pager at 445px put Next on a second line, below the box. Here every list measures as wrapped.
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return this.tagName === 'UL' ? 80 : 36;
      },
    });
    const observers = global.ResizeObserver;
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    try {
      const { problems, unmount } = await mount('ShadPagination', { numberOfPages: '{{10}}' });
      expect(document.body.textContent).not.toMatch(/Previous|Next/);
      unmount();
      expect(problems()).toEqual([]);
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height);
      global.ResizeObserver = observers;
    }
  });
});

describe('Stat change', () => {
  // A long change beside the label ("+12.4% after a long weekend of record sales") was cut off hard at the card's
  // edge, and later ended in an ellipsis ("+8 vs semana pa...", a clinic app, 2026-10-13). Now the leading figure stays
  // in the badge and the words join the context line, which wraps; a change without a figure wraps in the badge.
  // jsdom has no layout: this pins the structure.
  it('never clips a long change: the figure stays in the badge, the words wrap beside it', async () => {
    const change = '+12.4% after a long weekend of record sales across every store';
    const { problems, unmount } = await mount('ShadStat', { label: 'Revenue', value: 48210, change, trend: 'up' });
    const chip = [...document.querySelectorAll('span')].find((el) => el.textContent === '+12.4%');
    expect(chip).toBeTruthy();
    expect(chip.className).not.toMatch(/\btruncate\b/);
    const badge = chip.parentElement;
    expect(badge.getAttribute('title')).toBe(change);
    // The figure keeps one line and its whole width ("+$190,800.0 / 0" broke over two lines, 2026-10-14).
    expect(chip.className).toMatch(/\bwhitespace-nowrap\b/);
    expect(badge.className).toMatch(/\bshrink-0\b/);
    const words = [...document.querySelectorAll('span')].find(
      (el) => el.textContent === 'after a long weekend of record sales across every store'
    );
    expect(words).toBeTruthy();
    unmount();
    expect(problems()).toEqual([]);
  });

  it('shortens a long money change to fit the badge, its whole text the tooltip', async () => {
    const { problems, unmount } = await mount('ShadStat', {
      label: 'Total insured while out',
      value: 8196250,
      change: '+$190,800.00',
      trend: 'up',
    });
    const chip = [...document.querySelectorAll('span')].find((el) => el.textContent === '+$190.8K');
    expect(chip).toBeTruthy();
    expect(chip.parentElement.getAttribute('title')).toBe('+$190,800.00');
    unmount();
    expect(problems()).toEqual([]);
  });

  it('lets a change of words wrap in the badge', async () => {
    const { problems, unmount } = await mount('ShadStat', {
      label: 'Revenue',
      value: 48210,
      change: 'Best week of the quarter',
      trend: 'up',
    });
    const chip = [...document.querySelectorAll('span')].find((el) => el.textContent === 'Best week of the quarter');
    expect(chip.className).toMatch(/\bwhitespace-normal\b/);
    expect(chip.parentElement.className).not.toMatch(/\bshrink-0\b/);
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('Card grid', () => {
  it('draws no initials panel when no image field is mapped, and keeps the badge in the card body', async () => {
    const { problems, unmount } = await mount('ShadCardGrid', {
      data: [{ id: 1, name: 'Charred Salmon', state: 'Ready' }],
      titleField: 'name',
      badgeField: 'state',
    });
    expect(document.querySelector('[data-fallback="initials"]')).toBeNull();
    expect(document.body.textContent).toContain('Ready');
    unmount();
    expect(problems()).toEqual([]);
  });

  // A long badge beside the title ("-$19,305.50 vs last week" on a 185px card) was cut off hard: the chip was a flex
  // box, which clips its text but never draws an ellipsis, and the title row could not wrap. The row wraps (a badge
  // wider than the room beside the title goes under it) and the chip ellipsizes with its full text as a tooltip.
  // jsdom has no layout, so this pins the structure that makes it work; the browser check is in the pass 5 notes.
  it('never clips a long badge: the title row wraps and the chip ellipsizes with a tooltip', async () => {
    const badge = '-$19,305.50 vs last week';
    const { problems, unmount } = await mount('ShadCardGrid', {
      data: [{ id: 1, label: 'Revenue', comparison: badge }],
      titleField: 'label',
      badgeField: 'comparison',
    });
    const chip = [...document.querySelectorAll('[data-tone]')].find((el) => el.textContent === badge);
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('title')).toBe(badge);
    // An ellipsis needs a block box: a flex container clips its text without one.
    expect(chip.className).not.toMatch(/\binline-flex\b/);
    expect(chip.className).toMatch(/\btruncate\b/);
    const row = chip.closest('.flex-wrap');
    expect(row).toBeTruthy();
    expect(row.textContent).toContain('Revenue');
    unmount();
    expect(problems()).toEqual([]);
  });

  it('falls back to initials for a card whose mapped image is missing', async () => {
    const { problems, unmount } = await mount('ShadCardGrid', {
      data: [{ id: 1, name: 'Charred Salmon', photo: '' }],
      titleField: 'name',
      imageField: 'photo',
    });
    expect(document.querySelector('[data-fallback="initials"]')).not.toBeNull();
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('Record list and summary strip', () => {
  // The stat strip cut long labels and captions to one line ("Technicians on the...", DeepSeek's field service app,
  // 2026-10-13). They wrap now; the label takes the cell's spare height, so figures in one row stay level.
  it('wraps a long stat strip label and caption instead of cutting them', async () => {
    const strip = await mount('ShadSummaryStrip', {
      items: [
        { label: 'Jobs this week', value: 14 },
        {
          label: 'Technicians on the road today across both regions',
          value: 8,
          caption: 'two more than last week, with one on leave',
        },
      ],
    });
    const labels = [...document.querySelectorAll('dt')];
    expect(labels).toHaveLength(2);
    for (const dt of labels) {
      expect(dt.className).not.toMatch(/\btruncate\b/);
      expect(dt.className).toMatch(/\bflex-1\b/);
    }
    const caption = [...document.querySelectorAll('dd')].find((dd) => dd.textContent.includes('two more'));
    expect(caption.className).not.toMatch(/\btruncate\b/);
    strip.unmount();
  });

  // A Kanban with dynamic height (the pack default) grew to fit every card: a board of 40 loans stood 2,274px tall
  // (a DeepSeek IT assets app, 2026-10-13). It now shrinks to its cards up to its drawn height; past that, each column
  // scrolls inside it.
  it('a dynamic-height Kanban grows only up to its drawn height, then its columns scroll', async () => {
    const data = Array.from({ length: 40 }, (_, i) => ({ id: i, title: `Laptop ${i}`, status: 'out' }));
    const board = await mountCase({
      name: 'ShadKanban',
      properties: {
        ...defaultsOf('ShadKanban'),
        data,
        columns: [{ id: 'out', title: 'Checked out' }],
        statusField: 'status',
      },
      styles: styleDefaultsOf('ShadKanban'),
      height: 420,
    });
    const list = [...document.querySelectorAll('div')].find((el) => el.className.includes('overflow-y-auto'));
    expect(list).toBeTruthy();
    const column = list.parentElement;
    expect(column.style.maxHeight).toBe('420px');
    board.unmount();
  });

  // A plain list's selected row drew its 3px accent bar against the title: rows had 4px of side padding (a field
  // service app, 2026-10-13). A plain list whose rows can be selected pads them 12px, so the bar and tint have room.
  it('gives a selectable plain list room between the selection bar and the text', async () => {
    const data = [
      { id: 1, name: 'Union Square Hotel' },
      { id: 2, name: 'Oakland Ice Rink' },
    ];
    const plain = await mount('ShadRecordList', { data, titleField: 'name', listStyle: 'plain' });
    const row = document.querySelector('li[role=button]');
    expect(row.className).toMatch(/\bpx-3\b/);
    plain.unmount();
    const fixed = await mount('ShadRecordList', {
      data,
      titleField: 'name',
      listStyle: 'plain',
      highlightSelected: false,
    });
    expect(document.querySelector('li[role=button]').className).toMatch(/\bpx-1\b/);
    fixed.unmount();
  });

  // The pack's preflight sets every border width to 0 with !important: an inline border drew nothing in a browser, so
  // the list's frame and dividers and the strip's separators were missing. They are border classes.
  it('draw their frame, row dividers and figure separators as border classes', async () => {
    const list = await mount('ShadRecordList', {
      data: [
        { id: 1, name: 'Harbor Bistro', status: 'Paid' },
        { id: 2, name: 'Juniper Dental', status: 'Overdue' },
      ],
      titleField: 'name',
      statusField: 'status',
    });
    const rows = document.querySelectorAll('li[role=button]');
    expect(rows[0].className).not.toMatch(/border-t/);
    expect(rows[1].className).toMatch(/\bborder-t\b/);
    expect(rows[1].closest('ul').parentElement.className).toMatch(/\bborder\b/);
    expect(document.querySelector('[style*="border-top"]')).toBeNull();
    list.unmount();
    expect(list.problems()).toEqual([]);

    const strip = await mount('ShadSummaryStrip', {
      items: [
        { label: 'Revenue', value: 48210 },
        { label: 'Orders', value: 1284 },
      ],
    });
    const cells = document.querySelectorAll('dl > div');
    expect(cells[0].className).not.toMatch(/border-l/);
    expect(cells[1].className).toMatch(/\bborder-l\b/);
    expect(document.querySelector('dl').className).toMatch(/\bborder\b/);
    strip.unmount();
    expect(strip.problems()).toEqual([]);
  });
});

describe('List view', () => {
  it('exposes data as its records, so (components.list.data || []).length counts them (it read "undefined")', async () => {
    const { stats, problems, unmount } = await mount('ShadListView', { data: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    expect(Array.isArray(stats.exposed.data)).toBe(true);
    expect(stats.exposed.data).toHaveLength(3);
    unmount();
    const empty = await mount('ShadListView', { data: [] });
    expect(empty.stats.exposed.data).toEqual([]);
    empty.unmount();
    expect(problems()).toEqual([]);
  });

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

describe('Schedule now-line', () => {
  // Drawn after the bookings loaded, the line sat at the left edge until the next 30-second tick: a week view showed
  // now on Monday (2026-10-14). It is placed when it mounts.
  it('is placed at today the moment it is drawn', async () => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const date = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(
      monday.getDate()
    ).padStart(2, '0')}`;
    const { problems, unmount } = await mount('ShadSchedule', {
      scale: 'days',
      days: 7,
      date,
      resources: ['A'],
      bookings: [],
    });
    const line = document.querySelector('[data-now-line]');
    expect(line).toBeTruthy();
    const at = Number(line.style.getPropertyValue('--now'));
    expect(at).toBeGreaterThan(((now.getDay() + 6) % 7) / 7 - 0.01);
    unmount();
    expect(problems()).toEqual([]);
  });
});
