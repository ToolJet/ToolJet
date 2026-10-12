import {
  cardItems,
  formatValue,
  gridColumns,
  heroMeta,
  recordItems,
  stripColumns,
  summaryFigures,
} from '../sectionsModel';

describe('cardItems', () => {
  const rows = [
    {
      id: 7,
      name: 'Lemon roast chicken',
      cuisine: 'Dinner',
      prep: 20,
      serves: 4,
      photo: 'https://x/a.jpg',
      note: 'Crisp skin',
    },
    { id: 8, name: 'Miso salmon', cuisine: 'Dinner', prep: 15, serves: 2, photo: '' },
  ];

  it('reads each card from the named fields, joining meta fields with a dot', () => {
    const [first, second] = cardItems(rows, {
      titleField: 'name',
      subtitleField: 'cuisine',
      imageField: 'photo',
      descriptionField: 'note',
      badgeField: 'cuisine',
      metaFields: 'prep, serves',
    });
    expect(first).toMatchObject({
      key: '7',
      title: 'Lemon roast chicken',
      subtitle: 'Dinner',
      image: 'https://x/a.jpg',
      description: 'Crisp skin',
      badge: 'Dinner',
      meta: '20 · 4',
    });
    expect(first.row).toBe(rows[0]);
    expect(second.image).toBe('');
    expect(second.description).toBe('');
  });

  it('labels a meta field written as field:Label, before or after the value', () => {
    const [card] = cardItems(rows, { titleField: 'name', metaFields: 'prep:{} min, serves:Serves {}' });
    expect(card.meta).toBe('20 min · Serves 4');
  });

  it('keys each card by the id field, so a selection survives new data', () => {
    const data = [
      { sku: 'A-1', name: 'One' },
      { sku: 'B-2', name: 'Two' },
    ];
    expect(cardItems(data, { idField: 'sku' }).map((c) => c.key)).toEqual(['A-1', 'B-2']);
    expect(cardItems(data, { idField: 'missing' }).map((c) => c.key)).toEqual(['0', '1']);
  });

  it('falls back to the first text field for the title and the index for the key', () => {
    const [card] = cardItems([{ label: 'Plain', n: 3 }], {});
    expect(card.title).toBe('Plain');
    expect(card.key).toBe('0');
  });

  it('never throws on junk', () => {
    expect(cardItems(null, {})).toEqual([]);
    expect(cardItems('x', {})).toEqual([]);
    expect(cardItems([null, 4, 'a'], { titleField: 'name' })).toEqual([]);
  });
});

describe('heroMeta', () => {
  it('reads a list of facts as text, or label and value pairs', () => {
    expect(heroMeta(['Sun, 11 Oct', '14 bookings'])).toEqual([{ value: 'Sun, 11 Oct' }, { value: '14 bookings' }]);
    expect(heroMeta([{ label: 'Open', value: 12 }])).toEqual([{ label: 'Open', value: '12' }]);
    expect(heroMeta('Sun, 11 Oct · 14 bookings')).toEqual([{ value: 'Sun, 11 Oct' }, { value: '14 bookings' }]);
  });
  it('drops empties and never throws', () => {
    expect(heroMeta([null, '', { label: 'x' }])).toEqual([]);
    expect(heroMeta(undefined)).toEqual([]);
  });
});

describe('gridColumns', () => {
  it('uses the set count, capped by what fits at the minimum card width', () => {
    expect(gridColumns(3, 1200, 220)).toBe(3);
    expect(gridColumns(4, 600, 220)).toBe(2);
  });
  it('fits as many as the width allows when the count is auto', () => {
    expect(gridColumns('auto', 1200, 260)).toBe(4);
    expect(gridColumns(0, 300, 260)).toBe(1);
  });
});

describe('formatValue', () => {
  it('formats numbers and numeric text, and shows other text as written', () => {
    expect(formatValue(1240, 'currency')).toBe('$1,240');
    expect(formatValue('386.5', 'currency', 'EUR')).toBe('€386.50');
    expect(formatValue(2.1, 'percent')).toBe('2.1%');
    expect(formatValue(48210)).toBe('48,210');
    expect(formatValue('12 open', 'number')).toBe('12 open');
    expect(formatValue({ a: 1 }, 'number')).toBe('');
    expect(formatValue(null)).toBe('');
  });

  it('reads a bare date as that day where the viewer is, and leaves a non-date as written', () => {
    const year = new Date().getFullYear();
    expect(formatValue(`${year}-10-14`, 'date')).toBe('Oct 14');
    expect(formatValue('2019-01-02', 'date')).toBe('Jan 2, 2019');
    expect(formatValue('soon', 'date')).toBe('soon');
  });
});

describe('recordItems', () => {
  const rows = [
    { id: 7, customer: 'Harbor Bistro', contact: 'Maya Chen', status: 'Paid', total: 1240, seats: 4 },
    { id: 8, customer: 'Juniper Dental', contact: 'https://x/p.jpg', status: 'Overdue', total: 'n/a' },
    'not a row',
  ];

  it('reads title, meta, status and a formatted trailing value from the named fields', () => {
    const [first, second] = recordItems(rows, {
      titleField: 'customer',
      metaFields: 'contact, total|currency, seats:Seats, missing',
      statusField: 'status',
      valueField: 'total',
      valueFormat: 'currency',
    });
    expect(first).toMatchObject({
      key: '7',
      title: 'Harbor Bistro',
      meta: 'Maya Chen · $1,240 · Seats 4',
      status: 'Paid',
      value: '$1,240',
      avatarName: 'Harbor Bistro',
      image: '',
    });
    expect(second.value).toBe('n/a');
    expect(recordItems(rows)).toHaveLength(2);
  });

  it('takes an avatar image from a URL, else the initials source from the field text, else the title', () => {
    const [first, second] = recordItems(rows, { titleField: 'customer', avatarField: 'contact' });
    expect(first).toMatchObject({ image: '', avatarName: 'Maya Chen' });
    expect(second).toMatchObject({ image: 'https://x/p.jpg', avatarName: 'Juniper Dental' });
  });

  it('keys rows by the id field, falling back to the index', () => {
    expect(recordItems(rows, { idField: 'customer' }).map((r) => r.key)).toEqual(['Harbor Bistro', 'Juniper Dental']);
    expect(recordItems([{ name: 'A' }, { name: 'B' }]).map((r) => r.key)).toEqual(['0', '1']);
    expect(recordItems('junk')).toEqual([]);
  });
});

describe('summaryFigures', () => {
  it('formats values and signs numeric changes, toned by their direction', () => {
    const [revenue, refunds, orders] = summaryFigures(
      [
        { label: 'Revenue', value: 48210, delta: 12.4, caption: 'vs last month' },
        {
          label: 'Refund rate',
          value: 2.1,
          format: 'percent',
          delta: -0.4,
          deltaFormat: 'number',
          lowerIsBetter: true,
        },
        { label: 'Orders', value: 1284, format: 'number', delta: '+3 this week' },
      ],
      { valueFormat: 'currency' }
    );
    expect(revenue).toMatchObject({
      value: '$48,210',
      delta: { text: '+12.4%', tone: 'positive' },
      caption: 'vs last month',
    });
    expect(refunds).toMatchObject({ value: '2.1%', delta: { text: '−0.4', tone: 'positive' } });
    expect(orders).toMatchObject({ value: '1,284', delta: { text: '+3 this week', tone: 'positive' } });
  });

  it('takes an explicit tone, keeps at most six figures and drops entries that are not figures', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ label: `F${i}`, value: i, delta: 1, tone: 'negative' }));
    const figures = summaryFigures([null, [1], ...items]);
    expect(figures).toHaveLength(6);
    expect(figures[0].delta.tone).toBe('negative');
    expect(summaryFigures(['Plain'])[0]).toMatchObject({ label: '', value: 'Plain', delta: null });
    expect(summaryFigures({})).toEqual([]);
  });
});

describe('stripColumns', () => {
  it('puts every figure in one row when they fit, else as many as fit', () => {
    expect(stripColumns(4, 960, 140)).toBe(4);
    expect(stripColumns(6, 480, 140)).toBe(3);
    expect(stripColumns(3, 0, 140)).toBe(1);
  });
});
