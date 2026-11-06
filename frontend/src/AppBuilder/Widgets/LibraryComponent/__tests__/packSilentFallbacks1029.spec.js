// The rest of the team-testing classes (2026-10-29) outside the lists, in the three packs: an invalid currency code
// showed dollars in stats, charts, progress, summary and map figures; a named field the row lacks showed another field
// in progress labels and map titles; and rows with no id were keyed by position, so removing one moved a selection
// (progress rows, map markers, kanban cards) to whatever row took its place.
const PACKS = ['shadcn', 'antd', 'mui'];
const lib = (pack, file) => require(`../../../../../../packs/${pack}/src/lib/${file}`);

let warn;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());
const warned = (text) => warn.mock.calls.flat().join(' ').includes(text);

describe.each(PACKS)('%s currency codes', (pack) => {
  const { currencyCode } = lib(pack, 'locale.ts');

  it('means USD when none is set, and takes any three-letter code', () => {
    expect(currencyCode('')).toBe('USD');
    expect(currencyCode(undefined)).toBe('USD');
    expect(currencyCode(' eur ')).toBe('EUR');
  });

  it('is null for a code that is not one, and warns once', () => {
    expect(currencyCode(`US Dollar ${pack}`)).toBeNull();
    expect(currencyCode(`US Dollar ${pack}`)).toBeNull();
    expect(warn.mock.calls.filter((c) => String(c[0]).includes(`US Dollar ${pack}`))).toHaveLength(1);
  });

  it('formats progress figures without a symbol for an invalid code', () => {
    const { formatFigure } = lib(pack, 'ui2/charts/progressModel.ts');
    expect(formatFigure(1200, 'currency', 'EUR', 'en-US')).toBe('€1,200');
    expect(formatFigure(1200, 'currency', 'Dollars', 'en-US')).toBe('1,200');
  });
});

describe('figures with an invalid currency code', () => {
  it('Rocket stat, chart, summary and map values show no symbol', () => {
    const { statValue } = lib('shadcn', 'statModel.ts');
    const { formatter } = lib('shadcn', 'ui2/charts/chartModel.ts');
    expect(statValue(1200, { valueFormat: 'currency', currency: 'US Dollar' })).toBe('1,200');
    expect(statValue(1200, { valueFormat: 'currency', currency: 'EUR', locale: 'en-US' })).toBe('€1,200');
    expect(formatter({ format: 'currency', currency: 'US Dollar' })(1200.5)).toBe('1,200.50');
    for (const pack of ['shadcn', 'antd']) {
      const { summaryFigures } = lib(pack, 'ui2/display/summary.ts');
      const { popupLines } = lib(pack, 'ui2/charts/mapModel.ts');
      expect(
        JSON.stringify(
          summaryFigures([{ label: 'Revenue', value: 1200 }], { valueFormat: 'currency', currency: 'US Dollar' })
        )
      ).not.toContain('$');
      expect(JSON.stringify(popupLines({ total: 1200 }, 'total|currency', { currency: 'US Dollar' }))).not.toContain(
        '$'
      );
    }
    expect(warned('US Dollar')).toBe(true);
  });

  it.each(['antd', 'mui'])('%s formatNumber shows no symbol and warns', (pack) => {
    const { formatNumber } = lib(pack, 'format.ts');
    expect(formatNumber(1200, 'currency', 'EUR', null, 'en-US')).toBe('€1,200.00');
    expect(formatNumber(1200, 'currency', `Bucks ${pack}`, null, 'en-US')).toBe('1,200');
    expect(warned(`Bucks ${pack}`)).toBe(true);
  });
});

describe.each(PACKS)('%s named fields the row lacks', (pack) => {
  it('leave a progress label blank', () => {
    const { progressEntries, progressItem } = lib(pack, 'ui2/charts/progressModel.ts');
    const [entry] = progressEntries([{ name: 'North', status: 'Late', done: 40 }], '');
    expect(progressItem(entry, { labelField: 'region', valueField: 'done' }).label).toBe('');
    expect(progressItem(entry, { valueField: 'done' }).label).toBe('North');
  });
});

describe.each(['shadcn', 'antd'])('%s map', (pack) => {
  const { mapPoints } = lib(pack, 'ui2/charts/mapModel.ts');
  const rows = [
    { name: 'Depot A', lat: 52.5, lng: 13.4 },
    { name: 'Depot B', lat: 48.1, lng: 11.6 },
    { name: 'Depot C', lat: 50.1, lng: 8.7 },
  ];

  it('leaves a marker title blank for a title field the row lacks', () => {
    expect(mapPoints(rows, { titleField: 'site' }).points[0].title).toBe('');
    expect(mapPoints(rows).points[0].title).toBe('Depot A');
  });

  it('keys a point with no id by its content, so removing another keeps its key', () => {
    const before = mapPoints(rows).points.find((p) => p.title === 'Depot B').key;
    const after = mapPoints(rows.slice(1)).points.find((p) => p.title === 'Depot B').key;
    expect(after).toBe(before);
    expect(mapPoints([{ lat: 1, lng: 2 }, ...rows]).points.find((p) => p.title === 'Depot B').key).toBe(before);
  });
});

describe.each(PACKS)('%s rows with no id', (pack) => {
  it('keep their progress key when another row is removed', () => {
    const { progressEntries } = lib(pack, 'ui2/charts/progressModel.ts');
    const rows = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const key = (list) => progressEntries(list, '').find((e) => e.row.name === 'B').key;
    expect(key(rows.slice(1))).toBe(key(rows));
  });

  it('keep their kanban key when another card is removed', () => {
    const { boardColumns } = lib(pack, 'ui2/display/kanban/board.ts');
    const cards = [
      { title: 'Alpha', status: 'todo' },
      { title: 'Bravo', status: 'todo' },
    ];
    const key = (list) => boardColumns(list, ['todo'], 'status', 'id')[0].cards.find((c) => c.title === 'Bravo').__key;
    expect(key(cards.slice(1))).toBe(key(cards));
    // Identical cards still get keys of their own.
    const twins = boardColumns([cards[0], cards[0]], ['todo'], 'status', 'id')[0].cards.map((c) => c.__key);
    expect(new Set(twins).size).toBe(2);
  });
});
