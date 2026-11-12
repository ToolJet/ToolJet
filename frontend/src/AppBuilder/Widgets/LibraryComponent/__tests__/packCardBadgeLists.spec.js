// QA AD-40: a Card Grid badge field holding a list (tags: ['Easy', 'Quick']) drew one badge of its JSON text, brackets
// and quotes, and an empty list drew '[]'. cardItems is the Card Grid's model in each pack (lib/ui2/display/lists), the
// same code in all three.
const PACKS = ['antd', 'mui', 'shadcn'];
const model = (pack) => require(`../../../../../../packs/${pack}/src/lib/ui2/display/lists/model.ts`);

const ROWS = [
  { id: 1, title: 'Pie', category: 'Dinner', tags: ['Easy', 'Quick'] },
  { id: 2, title: 'Cake', category: 'Dessert', tags: 'Sweet' },
  { id: 3, title: 'Soup', category: 'Lunch', tags: [] },
];
const badges = (pack, rows, fields) =>
  model(pack)
    .cardItems(rows, { titleField: 'title', idField: 'id', ...fields })
    .map((card) => card.badges);

describe.each(PACKS)('%s Card Grid badges', (pack) => {
  test('[PackComponent-BADGELIST-001] a list in a badge field gives a badge per entry, and an empty list none', () => {
    expect(badges(pack, ROWS, { badgeField: 'category', badgeFields: ['category', 'tags'] })).toEqual([
      ['Dinner', 'Easy', 'Quick'],
      ['Dessert', 'Sweet'],
      ['Lunch'],
    ]);
  });

  test('[PackComponent-BADGELIST-002] a list in the Badge field itself: numbers as text, blank entries left out', () => {
    const rows = [{ id: 1, title: 'Plan', tags: [2026, '', '  ', 'Q1'] }];

    expect(badges(pack, rows, { badgeField: 'tags', badgeFields: [] })).toEqual([['2026', 'Q1']]);
  });
});
