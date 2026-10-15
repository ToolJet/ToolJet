import {
  autoProgressTone,
  barWidth,
  cardItems,
  fieldList,
  formatValue,
  gridColumns,
  heroAside,
  heroMeta,
  percentLabel,
  percentOf,
  progressItems,
  progressTone,
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
      subtitle: '', // the same value as the badge, shown once (see 'a subtitle that repeats the badge')
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

describe('repeated ids', () => {
  // Two rows with one id (or a row without an id at the position another row's id names) gave two rows the same
  // React key: React warned, and a click on one record selected both (selection compares keys).
  const rows = [
    { id: 1, customer: 'First', title: 'First' },
    { id: 1, customer: 'Same id', title: 'Same id' },
    { customer: 'No id', title: 'No id' },
    { id: 2, customer: 'Two', title: 'Two' },
  ];
  it('gives every record a key of its own, keeping the first row of an id on the id', () => {
    const keys = recordItems(rows, { titleField: 'customer' }).map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[0]).toBe('1');
    expect(keys[3]).toBe('2');
  });
  it('gives every card a key of its own', () => {
    const keys = cardItems(rows, { titleField: 'title' }).map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[0]).toBe('1');
  });
});

describe('formatValue with numbers that are not finite', () => {
  it('shows nothing for Infinity and NaN in any format', () => {
    for (const format of ['auto', 'number', 'currency', 'percent', 'compact', 'date']) {
      expect(formatValue(Infinity, format)).toBe('');
      expect(formatValue(-Infinity, format)).toBe('');
      expect(formatValue(NaN, format)).toBe('');
    }
  });
  it('keeps a summary figure without a value readable', () => {
    const [f] = summaryFigures([{ label: 'Infinite', value: Infinity, delta: NaN }]);
    expect(f.value).toBe('');
    expect(f.delta).toBeNull();
  });
});

describe('summaryFigures with valueFormat auto', () => {
  it('shows money labels as currency and counts as numbers (a rooms strip showed $8 rooms)', () => {
    const figs = summaryFigures(
      [
        { label: 'Meeting rooms', value: 8 },
        { label: 'Bookings today', value: 12 },
        { label: 'Revenue this month', value: 48210.5 },
        { label: 'Average order', value: 37.5 },
        { label: 'Refund rate', value: 2.5, format: 'percent' },
      ],
      { valueFormat: 'auto', currency: 'USD' }
    );
    expect(figs.map((f) => f.value)).toEqual(['8', '12', '$48,210.50', '$37.50', '2.5%']);
  });
});

describe('meta labels that repeat the field name', () => {
  it('show the value alone ("status:status" read "status To do", like debug output)', () => {
    const cards = cardItems([{ id: 1, title: 'Ship it', status: 'To do', category: 'Product' }], {
      titleField: 'title',
      metaFields: 'status:status,category:Category',
    });
    expect(cards[0].meta).toBe('To do · Category Product');
  });
});

describe('card grid options', () => {
  const rows = [
    { id: 1, name: 'Loft on Main', city: 'Austin', kind: 'Apartment', diet: 'Pets ok', host: 'Ada Lovelace', done: 45 },
    { id: 2, name: 'Garden studio', city: 'Austin', kind: '', diet: 'No pets', host: 'https://x/p.png', done: '80%' },
  ];

  it('reads several badges from badgeField and badgeFields, skipping empty ones and repeats', () => {
    const [a, b] = cardItems(rows, { badgeField: 'kind', badgeFields: 'diet, kind, missing' });
    expect(a.badges).toEqual(['Apartment', 'Pets ok']);
    expect(a.badge).toBe('Apartment');
    expect(b.badges).toEqual(['No pets']);
    expect(cardItems(rows, { badgeFields: ['diet', 'city'] })[0].badges).toEqual(['Pets ok', 'Austin']);
  });

  it('reads an eyebrow, an avatar (image URL or initials) and a progress', () => {
    const [a, b] = cardItems(rows, { eyebrowField: 'city', avatarField: 'host', progressField: 'done' });
    expect(a.eyebrow).toBe('Austin');
    expect(a.avatar).toEqual({ image: '', name: 'Ada Lovelace' });
    expect(b.avatar).toEqual({ image: 'https://x/p.png', name: 'Garden studio' });
    expect([a.progress, b.progress]).toEqual([45, 80]);
    const none = cardItems(rows, {})[0];
    expect([none.eyebrow, none.avatar, none.progress]).toEqual(['', null, null]);
  });

  it('gives a record row its progress', () => {
    expect(recordItems(rows, { progressField: 'done' }).map((r) => r.progress)).toEqual([45, 80]);
    expect(recordItems(rows, { progressField: 'city' })[0].progress).toBeNull();
  });

  it('reads field lists and percentages', () => {
    expect(fieldList(' a, ,b ')).toEqual(['a', 'b']);
    expect(fieldList(['a', 3, ' c'])).toEqual(['a', 'c']);
    expect(fieldList({})).toEqual([]);
    expect([percentOf(12.5), percentOf('40%'), percentOf(' 7 '), percentOf('n/a'), percentOf(NaN)]).toEqual([
      12.5,
      40,
      7,
      null,
      null,
    ]);
    expect([barWidth(-5), barWidth(50), barWidth(130), barWidth(null)]).toEqual([0, 50, 100, 0]);
    expect([percentLabel(64), percentLabel(33.333), percentLabel(120)]).toEqual(['64%', '33.3%', '120%']);
  });
});

describe('heroAside', () => {
  it('shows a figure from a number or text, with its label', () => {
    expect(heroAside(12480, 'Revenue today')).toEqual({ kind: 'figure', value: '12,480', label: 'Revenue today' });
    expect(heroAside('$12,480', '')).toEqual({ kind: 'figure', value: '$12,480', label: '' });
  });
  it('shows up to four facts from a list', () => {
    const aside = heroAside([{ label: 'Open', value: 14 }, 'Due 3', { label: 'x' }, 'a', 'b', 'c'], 'Today');
    expect(aside.kind).toBe('facts');
    expect(aside.facts).toEqual([{ label: 'Open', value: '14' }, { value: 'Due 3' }, { value: 'a' }, { value: 'b' }]);
    expect(aside.label).toBe('Today');
  });
  it('shows nothing for empty or junk values', () => {
    for (const v of ['', '  ', null, undefined, {}, [], [null, {}]]) expect(heroAside(v, 'Label')).toBeNull();
  });
});

describe('progressItems', () => {
  const data = [
    { id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: 'On track', note: '12 days left' },
    { id: 2, label: 'Travel', spent: 7600, budget: 6000, status: 'Over budget' },
    { id: 3, label: 'Onboarding', pct: '40%', status: 'warning' },
    { id: 4, label: 'Steps', spent: 3 },
    'junk',
  ];
  const fields = {
    labelField: 'label',
    valueField: 'spent',
    targetField: 'budget',
    captionField: 'note',
    statusField: 'status',
    valueFormat: 'currency',
  };

  it('reads label, value of target, percentage, caption and status', () => {
    const [a, b, c, d] = progressItems(data, fields);
    expect(a).toMatchObject({ label: 'Marketing', value: '$18,400', target: '$25,000', caption: '12 days left' });
    expect(a.pct).toBeCloseTo(73.6);
    expect([a.status, a.tone]).toEqual(['On track', 'success']);
    expect([b.status, b.tone]).toEqual(['Over budget', 'danger']);
    expect(b.pct).toBeCloseTo(126.67, 1);
    // A status that only names a tone colours the bar without a chip.
    expect([c.status, c.tone, c.pct]).toEqual(['', 'warning', null]);
    // A value with no target is the percentage.
    expect(d.pct).toBe(3);
    expect(progressItems(data, fields)).toHaveLength(4);
  });

  it('takes percentField over value / target', () => {
    expect(progressItems(data, { ...fields, percentField: 'pct' })[2].pct).toBe(40);
    expect(progressItems([{ v: 5, t: 0 }], { valueField: 'v', targetField: 't' })[0].pct).toBeNull();
  });

  it('tones rows without a status from autoTone', () => {
    const rows = [
      { label: 'a', v: 100 },
      { label: 'b', v: 85 },
      { label: 'c', v: 101 },
      { label: 'd', v: 20 },
    ];
    const tones = (autoTone) => progressItems(rows, { valueField: 'v', autoTone }).map((r) => r.tone);
    expect(tones('goal')).toEqual(['success', '', 'success', '']);
    expect(tones('limit')).toEqual(['warning', 'warning', 'danger', '']);
    expect(tones('none')).toEqual(['', '', '', '']);
    expect(autoProgressTone(NaN, 'limit')).toBe('');
  });

  it('reads tones from status words', () => {
    expect(
      ['On track', 'At risk', 'Behind', 'ahead', 'Not met', 'success', 'Good', 'whatever', 3].map(progressTone)
    ).toEqual(['success', 'warning', 'danger', 'success', '', 'success', 'success', '', '']);
  });

  it('keys rows by the id field, falling back to the position', () => {
    const rows = [
      { code: 'Q1', label: 'One' },
      { code: 'Q2', label: 'Two' },
    ];
    expect(progressItems(rows, { idField: 'code' }).map((r) => r.key)).toEqual(['Q1', 'Q2']);
    expect(progressItems(rows, { idField: 'missing' }).map((r) => r.key)).toEqual(['0', '1']);
  });

  it('never throws on junk', () => {
    for (const v of [null, undefined, 'x', 3, {}, [null, 3, [], { a: {} }]])
      expect(() => progressItems(v, {})).not.toThrow();
    expect(progressItems([{ a: 1 }], null)).toHaveLength(1);
  });
});

describe('summaryFigures auto: a money word beside a count or a change is not money', () => {
  // The money words matched alone: "Sales calls 42" showed $42, "Paid users 120" $120, "Revenue growth 12.4" $12.40.
  const shown = (label, value) => summaryFigures([{ label, value }], { valueFormat: 'auto', currency: 'USD' })[0].value;
  it.each([
    ['Sales calls', 42, '42'],
    ['Paid users', 120, '120'],
    ['Invoices sent', 18, '18'],
    ['Open invoices', 7, '7'],
    ['Revenue growth', 12.4, '12.4'],
    ['Profit margin', 18, '18'],
    ['Cost per hire change', 3, '3'],
    ['Budget days left', 9, '9'],
    ['Paid orders', 31, '31'],
  ])('%s %s reads %s', (label, value, expected) => {
    expect(shown(label, value)).toBe(expected);
  });
  it.each([
    ['Revenue', 48210, '$48,210'],
    ['Total spend', 1250, '$1,250'],
    ['Cost per hire', 4200, '$4,200'],
    ['Invoice total', 980.5, '$980.50'],
    ['Amount paid', 300, '$300'],
    ['Outstanding balance', 75, '$75'],
    ['Average order', 37.5, '$37.50'],
    ['MRR', 9100, '$9,100'],
  ])('%s %s reads %s', (label, value, expected) => {
    expect(shown(label, value)).toBe(expected);
  });
});

// A card's description bound to the same percentage its progress bar labels showed "25%" twice on every card of an
// onboarding grid (2026-10-14). The bar keeps it; the description is left out when it says only that.
describe('cardItems, a description that repeats the progress', () => {
  const fields = { titleField: 'name', descriptionField: 'label', progressField: 'pct' };

  it('is left out when it is just the progress percentage', () => {
    const [card] = cardItems([{ name: 'Avery', label: '25%', pct: 25 }], fields);
    expect(card.progress).toBe(25);
    expect(card.description).toBe('');
  });

  it('is kept when it says more', () => {
    const [card] = cardItems([{ name: 'Avery', label: '3 of 12 tasks done', pct: 25 }], fields);
    expect(card.description).toBe('3 of 12 tasks done');
  });
});

// A vendor directory showed each card's category twice, as its badge and its subtitle (2026-10-14).
describe('cardItems, a subtitle that repeats the badge', () => {
  const fields = { titleField: 'name', subtitleField: 'category', badgeField: 'category' };

  it('is left out', () => {
    const [card] = cardItems([{ name: 'Cedarline Freight', category: 'Logistics' }], fields);
    expect(card.badge).toBe('Logistics');
    expect(card.subtitle).toBe('');
  });

  it('is kept when it differs', () => {
    const [card] = cardItems([{ name: 'Cedarline Freight', category: 'Logistics', city: 'Portland' }], {
      ...fields,
      subtitleField: 'city',
    });
    expect(card.subtitle).toBe('Portland');
  });
});

describe('meta fields given as a list', () => {
  // A course catalog wrote metaFields={["duration_label", "seats_label"]} and its cards showed no duration or seats
  // (2026-10-14): a list of names reads as the comma list does.
  const row = { id: 1, title: 'Practical SQL', duration_label: '6 hours', seats_label: '4 seats left' };
  it('reads a list of field names on cards and records', () => {
    const asList = cardItems([row], { titleField: 'title', metaFields: ['duration_label', 'seats_label'] })[0];
    const asText = cardItems([row], { titleField: 'title', metaFields: 'duration_label, seats_label' })[0];
    expect(asList.meta).toEqual(asText.meta);
    expect(JSON.stringify(asList.meta)).toContain('6 hours');
    const record = recordItems([row], { titleField: 'title', metaFields: ['duration_label', 'seats_label'] })[0];
    expect(JSON.stringify(record.meta)).toContain('4 seats left');
  });
});
