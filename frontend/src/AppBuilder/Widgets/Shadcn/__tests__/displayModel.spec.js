import {
  clamp,
  clampPage,
  colorFor,
  formatTime,
  formatValue,
  iconCandidates,
  keyValueItems,
  linkHref,
  normalizeSteps,
  pageCountOf,
  pageItems,
  resolveIcon,
  ringGeometry,
  statusColor,
  stepIndexOf,
  timelineItems,
  toTags,
} from '../displayModel';

const JUNK = [null, undefined, NaN, Infinity, '', 'x', 0, -1, 1e300, true, {}, [], [null, 1, 'a', {}], () => 1];

describe('clamp', () => {
  it('keeps numbers in range and falls back for junk', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp('42', 0, 100)).toBe(42);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp('abc', 0, 100, 7)).toBe(7);
    expect(clamp(null, 0, 100, 7)).toBe(7);
    expect(clamp(Infinity, 0, 100, 7)).toBe(7);
  });
});

describe('icons', () => {
  const up = { name: 'up' };
  const bar = { name: 'bar' };
  const map = { TrendingUp: up, BarChart3: bar, Icon: { name: 'base' }, Text: 'not a component' };
  it('accepts kebab, snake, camel and PascalCase names', () => {
    expect(resolveIcon('trending-up', map, 'none')).toBe(up);
    expect(resolveIcon('TrendingUp', map, 'none')).toBe(up);
    expect(resolveIcon('trendingUp', map, 'none')).toBe(up);
    expect(resolveIcon('trending_up', map, 'none')).toBe(up);
    expect(resolveIcon('TrendingUpIcon', map, 'none')).toBe(up);
    expect(resolveIcon('bar-chart-3', map, 'none')).toBe(bar);
    expect(resolveIcon('TRENDING-UP', map, 'none')).toBe(up);
  });
  it('falls back for unknown names, junk and the base component', () => {
    expect(resolveIcon('no-such-icon', map, 'none')).toBe('none');
    expect(resolveIcon('icon', map, 'none')).toBe('none');
    expect(resolveIcon('text', map, 'none')).toBe('none');
    JUNK.forEach((j) => expect(resolveIcon(j, map, 'none')).toBe('none'));
    expect(resolveIcon('trending-up', null, 'none')).toBe('none');
    expect(iconCandidates({})).toEqual([]);
  });
});

describe('tags', () => {
  it('reads arrays, comma strings and objects', () => {
    expect(toTags('Paid, Urgent ,,')).toEqual(['Paid', 'Urgent']);
    expect(toTags(['A', 2, null, { label: 'B' }, { value: 'C' }, {}, [1]])).toEqual(['A', '2', 'B', 'C']);
    JUNK.forEach((j) => expect(Array.isArray(toTags(j))).toBe(true));
  });
  it('matches colours exactly or ignoring case', () => {
    expect(colorFor('paid', { Paid: '#16a34a' })).toBe('#16a34a');
    expect(colorFor('Paid', { Paid: '#16a34a', paid: '#000' })).toBe('#16a34a');
    expect(colorFor('Other', { Paid: '#16a34a' })).toBeUndefined();
    expect(colorFor('Paid', { Paid: { bad: 1 } })).toBeUndefined();
    expect(colorFor('Paid', null)).toBeUndefined();
  });
});

describe('ringGeometry', () => {
  it('clamps the value and sizes the ring', () => {
    const g = ringGeometry(150, 100, 10);
    expect(g.percent).toBe(100);
    expect(g.offset).toBeCloseTo(0);
    expect(g.radius).toBe(45);
    expect(ringGeometry(-3, 100, 10).offset).toBeCloseTo(g.circumference);
    JUNK.forEach((j) => {
      const r = ringGeometry(j, j, j);
      expect(Number.isFinite(r.offset)).toBe(true);
      expect(r.size).toBeGreaterThanOrEqual(16);
    });
  });
});

describe('key-value', () => {
  it('reads objects, row arrays and pairs', () => {
    expect(keyValueItems({ Status: 'Active', Owner: 'Ada' }).map((r) => [r.label, r.value, r.type])).toEqual([
      ['Status', 'Active', 'text'],
      ['Owner', 'Ada', 'text'],
    ]);
    const rows = keyValueItems([{ label: 'Amount', value: 5, type: 'money' }, ['Plan', 'Pro'], 3, null, { key: 'K' }]);
    expect(keyValueItems([{ label: 'x', type: 'constructor' }])[0].type).toBe('text');
    expect(rows.map((r) => [r.label, r.type])).toEqual([
      ['Amount', 'currency'],
      ['Plan', 'text'],
      ['K', 'text'],
    ]);
    JUNK.forEach((j) => expect(Array.isArray(keyValueItems(j))).toBe(true));
  });
  it('formats by type, with the widget defaults', () => {
    const d = { currency: 'USD', locale: 'en-US', dateFormat: 'DD MMM YYYY' };
    expect(formatValue({ value: 1250, type: 'currency' }, d)).toBe('$1,250.00');
    expect(formatValue({ value: 1250, type: 'currency', format: { currency: 'EUR' } }, d)).toBe('€1,250.00');
    expect(formatValue({ value: 3.14159, type: 'number', format: { decimalPlaces: 2 } }, d)).toBe('3.14');
    expect(formatValue({ value: '2026-11-14', type: 'date' }, d)).toBe('14 Nov 2026');
    expect(formatValue({ value: '2026-11-14', type: 'date', format: 'YYYY/MM/DD' }, d)).toBe('2026/11/14');
    expect(formatValue({ value: false, type: 'boolean' }, d)).toBe('No');
    expect(formatValue({ value: 'true', type: 'boolean' }, d)).toBe('Yes');
    expect(formatValue({ value: ['a', 'b'] }, d)).toBe('a, b');
    expect(formatValue({ value: { a: 1 } }, d)).toBe('{"a":1}');
    expect(formatValue({ value: '' }, d)).toBe('');
    expect(formatValue({ value: 'x', type: 'number' }, d)).toBe('x');
    JUNK.forEach((j) => expect(typeof formatValue({ value: j, type: 'currency' }, d)).toBe('string'));
    expect(formatValue(null)).toBe('');
  });
  it('finds a link row URL', () => {
    expect(linkHref({ value: 'ada@example.com' })).toBe('mailto:ada@example.com');
    expect(linkHref({ value: 'https://x.dev' })).toBe('https://x.dev');
    expect(linkHref({ value: 'www.x.dev' })).toBe('https://www.x.dev');
    expect(linkHref({ value: 'Open', href: '/orders/1' })).toBe('/orders/1');
    expect(linkHref({ value: 'plain words' })).toBe('');
    expect(linkHref(null)).toBe('');
  });
});

describe('timeline', () => {
  it('normalises items and reverses for newest first', () => {
    const items = timelineItems([{ title: 'A', time: '09:00' }, 'B', null, 5, { label: 'C', status: 'done' }], true);
    expect(items.map((i) => i.title)).toEqual(['C', '5', 'B', 'A']);
    expect(items[0].status).toBe('done');
    JUNK.forEach((j) => expect(Array.isArray(timelineItems(j))).toBe(true));
  });
  it('maps status words to theme colours, the author map first', () => {
    expect(statusColor('Done')).toBe('var(--sc-success)');
    expect(statusColor('failed')).toBe('var(--sc-destructive)');
    expect(statusColor('shipped', { Shipped: '#2563eb' })).toBe('#2563eb');
    expect(statusColor('unknown')).toBeUndefined();
    expect(statusColor({})).toBeUndefined();
    expect(statusColor('constructor')).toBeUndefined();
  });
  it('formats ISO times only when a format is given', () => {
    expect(formatTime('2026-10-09T09:12:00', 'DD MMM, HH:mm')).toBe('09 Oct, 09:12');
    expect(formatTime('2026-10-09', '')).toBe('2026-10-09');
    expect(formatTime('Yesterday', 'DD MMM')).toBe('Yesterday');
    expect(formatTime('', 'DD MMM')).toBe('');
  });
});

describe('steps', () => {
  it('normalises the native shape, unwrapping { value } and filling ids', () => {
    const steps = normalizeSteps([
      { name: 'step 1', id: 1, visible: { value: true }, disabled: { value: false } },
      { title: 'Two', visible: false },
      'Three',
      null,
      { id: 1, name: 'dup' },
    ]);
    expect(steps.map((s) => [s.id, s.name, s.visible, s.disabled])).toEqual([
      [1, 'step 1', true, false],
      [2, 'Two', false, false],
      [3, 'Three', true, false],
      ['1-5', 'dup', true, false],
    ]);
    expect(normalizeSteps('[{"name":"A"}]')[0]).toMatchObject({ id: 1, name: 'A' });
    expect(normalizeSteps('A, B').map((s) => s.name)).toEqual(['A', 'B']);
    JUNK.forEach((j) => expect(Array.isArray(normalizeSteps(j))).toBe(true));
  });
  it('finds a step by id loosely', () => {
    const steps = normalizeSteps(['A', 'B', 'C']);
    expect(stepIndexOf(steps, '2')).toBe(1);
    expect(stepIndexOf(steps, 9)).toBe(-1);
    expect(stepIndexOf(steps, {})).toBe(-1);
    expect(stepIndexOf(null, 1)).toBe(-1);
  });
});

describe('pagination', () => {
  it('counts pages from numberOfPages or totalRecords / pageSize', () => {
    expect(pageCountOf({ numberOfPages: 7 })).toBe(7);
    expect(pageCountOf({ numberOfPages: 7, totalRecords: 95, pageSize: 10 })).toBe(10);
    expect(pageCountOf({ totalRecords: 0, pageSize: 10 })).toBe(1);
    expect(pageCountOf({ numberOfPages: 'x' })).toBe(1);
    expect(pageCountOf({ numberOfPages: 1e12 })).toBe(1e6);
    expect(pageCountOf()).toBe(1);
  });
  it('clamps pages', () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage('x', 5, 3)).toBe(3);
  });
  it('lists pages with ellipses around the current one, at a constant length', () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 10]);
    expect(pageItems(5, 10)).toEqual([1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 10]);
    expect(pageItems(10, 10)).toEqual([1, 'start-ellipsis', 6, 7, 8, 9, 10]);
    expect(pageItems(50, 100, 2)).toHaveLength(9);
    JUNK.forEach((j) => expect(Array.isArray(pageItems(j, j, j))).toBe(true));
  });
});

describe("resolveIcon with ToolJet's own icon names", () => {
  // Opus wrote IconListDetails, IconCircleCheck (ToolJet's Tabler names) on four Stats; each drew the placeholder.
  const maps = [{ CircleCheck: () => null, List: () => null, Microscope: () => null }];
  const fallback = () => null;
  it('strips the Icon prefix', () => {
    expect(resolveIcon('IconCircleCheck', maps, fallback)).toBe(maps[0].CircleCheck);
    expect(resolveIcon('IconMicroscope', maps, fallback)).toBe(maps[0].Microscope);
  });
  it('falls back to the leading words of a name lucide does not have', () => {
    expect(resolveIcon('IconListDetails', maps, fallback)).toBe(maps[0].List);
    expect(resolveIcon('list-details', maps, fallback)).toBe(maps[0].List);
  });
  it('still uses the placeholder for an unknown name', () => {
    expect(resolveIcon('IconZzzQqq', maps, fallback)).toBe(fallback);
  });
});
