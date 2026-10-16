import {
  seriesLabel,
  seriesLabelMap,
  wholeTicks,
  compactFigure,
  centreValueFit,
  wholeNumbers,
  arcAngles,
  arcBox,
  axisLabel,
  bandRange,
  clamp,
  curveOf,
  fieldList,
  formatter,
  hasValues,
  lastPoint,
  num,
  radialRows,
  seriesRows,
  sparkPoints,
  trendOf,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';

describe('num and clamp', () => {
  it('reads numbers and numeric text, and nothing else', () => {
    expect([num(4), num('1,200'), num(' 42 '), num('-3.5')]).toEqual([4, 1200, 42, -3.5]);
    expect([
      num(''),
      num('abc'),
      num(null),
      num(undefined),
      num(true),
      num({}),
      num([1]),
      num(NaN),
      num(Infinity),
    ]).toEqual([null, null, null, null, null, null, null, null, null]);
    expect([clamp('20', 0, 12, 2), clamp(-1, 0.5, 12, 2), clamp('x', 0, 12, 2)]).toEqual([12, 0.5, 2]);
  });
});

describe('rows', () => {
  it('lists fields from text or arrays, unique and capped', () => {
    expect(fieldList('a, b ,a,,')).toEqual(['a', 'b']);
    expect(fieldList(['x', null, {}, 3])).toEqual(['x', '3']);
    expect(fieldList(null)).toEqual([]);
    expect(fieldList(Array.from({ length: 30 }, (_, i) => `s${i}`))).toHaveLength(12);
  });

  it('keeps plain rows, numbers the series and labels the category', () => {
    const rows = seriesRows([null, 5, 'x', [1], { m: 'Jan', v: '10' }, { m: { a: 1 }, v: 'n/a' }, { v: 3 }], 'm', [
      'v',
    ]);
    expect(rows).toEqual([
      { m: 'Jan', v: 10 },
      { m: '{"a":1}', v: null },
      { m: '', v: 3 },
    ]);
    expect(hasValues(rows, ['v'])).toBe(true);
    expect(hasValues(seriesRows([{ v: 'x' }], 'm', ['v']), ['v'])).toBe(false);
    expect(seriesRows('junk', 'm', ['v'])).toEqual([]);
    expect(axisLabel(undefined)).toBe('');
  });

  it('maps curves, defaulting to monotone', () => {
    expect([curveOf('step'), curveOf('linear'), curveOf('bogus'), curveOf()]).toEqual([
      'step',
      'linear',
      'monotone',
      'monotone',
    ]);
  });
});

describe('formatter', () => {
  it('formats numbers, currency, percent and compact, with prefix and suffix', () => {
    expect(formatter({})(1234.567)).toBe('1,234.57');
    expect(formatter({}, true)(182000)).toBe('182K');
    expect(formatter({ format: 'currency' })(1250)).toBe('$1,250');
    expect(formatter({ format: 'currency', currency: 'eur' }, true)(2500000)).toMatch(/€2\.5M/);
    expect(formatter({ format: 'percent' }, true)(42.25)).toBe('42.3%');
    expect(formatter({ format: 'compact' })(1500)).toBe('1.5K');
    expect(formatter({ prefix: '~', suffix: ' kg' })(3)).toBe('~3 kg');
  });

  it('never throws on a bad currency code or junk values', () => {
    expect(formatter({ format: 'currency', currency: 'nope!' })(5)).toBe('$5');
    expect(formatter({ format: 'currency', currency: 'ZZZ' })(5)).toMatch(/5/);
    expect(formatter({})(null)).toBe('');
    expect(formatter({})('n/a')).toBe('n/a');
    expect(formatter({})({ a: 1 })).toBe('{"a":1}');
  });
});

describe('sparkline', () => {
  it('reads numbers, text and { x, y } points', () => {
    expect(sparkPoints([3, '5', null])).toEqual([
      { i: 0, x: 1, y: 3 },
      { i: 1, x: 2, y: 5 },
      { i: 2, x: 3, y: null },
    ]);
    expect(sparkPoints('1, 2')).toEqual([
      { i: 0, x: 1, y: 1 },
      { i: 1, x: 2, y: 2 },
    ]);
    expect(sparkPoints([{ x: 'Mon', y: 4 }, { label: 'Tue', value: '6' }, { y: 'x' }])).toEqual([
      { i: 0, x: 'Mon', y: 4 },
      { i: 1, x: 'Tue', y: 6 },
      { i: 2, x: 3, y: null },
    ]);
    expect(sparkPoints({})).toEqual([]);
  });

  it('works out the trend from the first and last values', () => {
    expect(trendOf(sparkPoints([1, 3, 2]))).toBe('up');
    expect(trendOf(sparkPoints([5, null, 2, 'x']))).toBe('down');
    expect(trendOf(sparkPoints([5, null, 2]), true)).toBe('up');
    expect(trendOf(sparkPoints([2, 2]))).toBe('flat');
    expect(trendOf(sparkPoints([2]))).toBe('flat');
    expect(lastPoint(sparkPoints([1, 4, null]))).toEqual({ i: 1, x: 2, y: 4 });
    expect(lastPoint([])).toBeNull();
  });

  it('bands the data range unless bounds are set', () => {
    const pts = sparkPoints([4, 9, 1]);
    expect(bandRange(pts)).toEqual({ y1: 1, y2: 9 });
    expect(bandRange(pts, '3', 6)).toEqual({ y1: 3, y2: 6 });
    expect(bandRange(pts, 8, 2)).toEqual({ y1: 2, y2: 8 });
    expect(bandRange([], '', '')).toBeNull();
  });
});

describe('radial', () => {
  it('reads rings with own colours, non-negative values and capped count', () => {
    const rows = radialRows(
      [{ c: 'A', v: 5, fill: '#f00' }, { c: 'B', v: -3 }, null, { v: 'x', color: '#0f0' }],
      'c',
      'v'
    );
    expect(rows.map(({ name, value, color }) => [name, value, color])).toEqual([
      ['A', 5, '#f00'],
      ['B', 0, null],
      ['Item 3', 0, '#0f0'],
    ]);
    expect(
      radialRows(
        Array.from({ length: 40 }, () => ({ c: 'x', v: 1 })),
        'c',
        'v'
      )
    ).toHaveLength(12);
    expect(radialRows(7, 'c', 'v')).toEqual([]);
  });

  it('normalises the angles to at most one turn', () => {
    expect(arcAngles()).toEqual({ startAngle: 90, endAngle: -270 });
    expect(arcAngles(180, 0)).toEqual({ startAngle: 180, endAngle: 0 });
    expect(arcAngles(10, 10)).toEqual({ startAngle: 10, endAngle: -350 });
    expect(arcAngles(0, 1000)).toEqual({ startAngle: 0, endAngle: 360 });
  });

  it('centres a full ring and drops a semicircle gauge to the bottom of a wide box', () => {
    const ring = arcBox(90, -270, 200, 200, 1);
    expect(ring).toMatchObject({ cx: 100, cy: 100, outerRadius: 100, textAbove: false });
    const gauge = arcBox(180, 0, 300, 160, 1);
    expect(gauge.outerRadius).toBe(150);
    expect(gauge.cx).toBe(150);
    expect(gauge.cy).toBe(155);
    expect(gauge.textAbove).toBe(true);
    expect(arcBox(90, -270, 'x', null).outerRadius).toBe(0);
  });
});

describe('wholeNumbers', () => {
  // Counts (doses, jobs, seats) drew ticks of 0.5 or 0.8, 1.5, 2.3: an axis over whole numbers ticks in whole numbers.
  it('is true when every plotted value is a whole number', () => {
    expect(
      wholeNumbers(
        [
          { a: 1, b: 3 },
          { a: 0, b: 2 },
        ],
        ['a', 'b']
      )
    ).toBe(true);
  });

  it('is false when any value has a fraction, and ignores missing values', () => {
    expect(wholeNumbers([{ a: 1 }, { a: 2.5 }], ['a'])).toBe(false);
    expect(wholeNumbers([{ a: 1 }, { a: null }, { a: 3 }], ['a'])).toBe(true);
  });

  it('is false with nothing to plot, so an empty axis keeps the default ticks', () => {
    expect(wholeNumbers([], ['a'])).toBe(false);
    expect(wholeNumbers([{ a: null }], ['a'])).toBe(false);
    expect(wholeNumbers([{ a: 1 }], [])).toBe(false);
  });

  it('reads numbers given as text, and junk as not whole', () => {
    expect(wholeNumbers([{ a: '4' }, { a: '7' }], ['a'])).toBe(true);
    expect(wholeNumbers([{ a: 'n/a' }], ['a'])).toBe(false);
  });
});

describe('statusColors', () => {
  // A stacked chart of visits by status drew Completed orange and Missed yellow from a warm theme's series colours
  // (field visits, 2026-10-14): series that are all states take the status tones, as their chips do.
  const { statusColors } = require('@/AppBuilder/Widgets/Ui2/_charts/chartsModel');
  it('gives states their tones, a second of one tone a lighter shade', () => {
    const colors = statusColors(['Completed', 'In progress', 'Planned', 'Missed']);
    expect(colors[0]).toBe('var(--sc-success)');
    expect(colors[1]).toBe('var(--sc-chart-info)');
    expect(colors[2]).toMatch(/^color-mix\(in srgb, var\(--sc-chart-info\) \d+%/);
    expect(colors[3]).toBe('var(--sc-destructive)');
  });
  it('leaves series that are not all states, or all one tone, to the theme', () => {
    expect(statusColors(['Annual budget', 'Spent'])).toBeNull();
    expect(statusColors(['Completed', 'Revenue'])).toBeNull();
    expect(statusColors(['Paid', 'Delivered'])).toBeNull();
    expect(statusColors(['Completed'])).toBeNull();
    expect(statusColors(null)).toBeNull();
  });
});

describe('compactFigure', () => {
  // "+$190,800.00" in a stat's change badge broke as "+$190,800.0 / 0" (museum loans, 2026-10-14).
  it('shortens a long money or number figure, keeping its sign and currency', () => {
    expect(compactFigure('+$190,800.00')).toBe('+$190.8K');
    expect(compactFigure('$8,196,250.00')).toBe('$8.2M');
    expect(compactFigure('-€12,500')).toBe('-€12.5K');
    expect(compactFigure('1,250,000')).toBe('1.25M');
  });
  it('leaves short figures, percentages and words alone', () => {
    expect(compactFigure('+$1,200')).toBe('+$1,200');
    expect(compactFigure('+12.5%')).toBe('+12.5%');
    expect(compactFigure('3 overdue')).toBe('3 overdue');
  });
});

describe('centreValueFit', () => {
  // "$8,196,250.00" at 24px ran over the ring of a donut with a 70px hole (museum loans, 2026-10-14).
  it('keeps a value that fits the hole at full size', () => {
    expect(centreValueFit('42', 70)).toEqual({ text: '42', fontSize: 24 });
  });
  it('shrinks, then shortens, a value too wide for the hole', () => {
    const fit = centreValueFit('$8,196,250.00', 70);
    expect(fit.text).toBe('$8.2M');
    expect(fit.text.length * fit.fontSize * 0.62).toBeLessThanOrEqual(2 * 70 - 16);
    expect(centreValueFit('$196,250', 70).text).toBe('$196,250');
  });
});

describe('wholeTicks', () => {
  // A count axis ran to 4 for a maximum of 1 and to 8 for a maximum of 5: three quarters of a school chart was empty
  // (2026-10-14). Small counts take whole steps that end at or just past the maximum.
  const rows = (...ys) => ys.map((y, i) => ({ x: i, y }));
  it('ends a small count axis just past the maximum', () => {
    expect(wholeTicks(rows(1, 0, 1), ['y'])).toEqual({ domain: [0, 1], tickCount: 2 });
    expect(wholeTicks(rows(5, 3, 2), ['y'])).toEqual({ domain: [0, 5], tickCount: 6 });
    expect(wholeTicks(rows(7, 3), ['y'])).toEqual({ domain: [0, 8], tickCount: 5 });
  });
  it('sums stacked series', () => {
    expect(wholeTicks([{ a: 2, b: 3 }], ['a', 'b'], true)).toEqual({ domain: [0, 5], tickCount: 6 });
  });
  it('leaves fractions, negatives, large counts and empty data to the chart', () => {
    expect(wholeTicks(rows(1.5, 2), ['y'])).toEqual({});
    expect(wholeTicks(rows(-1, 2), ['y'])).toEqual({});
    expect(wholeTicks(rows(40, 2), ['y'])).toEqual({});
    expect(wholeTicks([], ['y'])).toEqual({});
  });
});

describe('seriesLabelMap', () => {
  // Models write seriesLabels as a list (["Flight hours"]); the object-only property dropped it and the tooltip said
  // "Flight hours" as the raw field (35 charts, 2026-10-14). A list names the series in order.
  it('names the series in order from a list', () => {
    expect(seriesLabelMap(['Flight hours', 'Target'], ['hours', 'target'])).toEqual({
      hours: 'Flight hours',
      target: 'Target',
    });
    expect(seriesLabel('hours', seriesLabelMap(['Flight hours'], ['hours']))).toBe('Flight hours');
    // As ToolJet resolves a written list.
    expect(seriesLabelMap({ 0: 'Flight hours' }, ['hours'])).toEqual({ hours: 'Flight hours' });
  });
  it('names a series by its field when its label is not text or a number', () => {
    expect(seriesLabel('revenue', seriesLabelMap([{ month: 'Jan' }], ['revenue']))).toBe('Revenue');
    expect(seriesLabel('revenue', { revenue: { a: 1 } })).toBe('Revenue');
    expect(seriesLabel('revenue', { revenue: 7 })).toBe('7');
  });
  it('keeps an object and ignores anything else', () => {
    expect(seriesLabelMap({ hours: 'Hours flown' }, ['hours'])).toEqual({ hours: 'Hours flown' });
    expect(seriesLabelMap('Hours', ['hours'])).toEqual({});
  });
});
