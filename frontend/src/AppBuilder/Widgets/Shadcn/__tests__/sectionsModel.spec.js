import { cardItems, gridColumns, heroMeta } from '../sectionsModel';

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
