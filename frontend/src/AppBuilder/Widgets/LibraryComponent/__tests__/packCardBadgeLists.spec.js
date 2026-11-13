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

// QA AD-40, reopened: Badge fields typed as text (category, tags), not bound as an array, showed only the Badge field's
// badge on the Ant Design and Material UI Card Grids. The property is an array, and text that is not JSON became [];
// Rocket 2.0's Card Grid already took the text, which the model splits on commas. The props go through the host's
// conversion (typedPackProps) as SdkComponentHost does, then into the Card Grid's model.
const { typedPackProps } = require('@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes');

const CARD_GRID_PROPS = [
  { name: 'badgeField', type: 'string' },
  { name: 'badgeFields', type: 'array' },
  { name: 'metaFields', type: 'array' },
];

describe.each(['antd', 'mui'])('%s Card Grid fields typed as text', (pack) => {
  test('[PackComponent-BADGELIST-003] Badge fields "category, tags" give a badge per field and per tag', () => {
    const { props, errors } = typedPackProps(pack, 'CardGrid', CARD_GRID_PROPS, {
      badgeField: 'category',
      badgeFields: 'category, tags',
    });

    expect(errors).toEqual([]);
    expect(badges(pack, ROWS, props)).toEqual([['Dinner', 'Easy', 'Quick'], ['Dessert', 'Sweet'], ['Lunch']]);
  });

  test('[PackComponent-BADGELIST-004] Meta fields typed as text are kept as text', () => {
    const { props, errors } = typedPackProps(pack, 'CardGrid', CARD_GRID_PROPS, { metaFields: 'category, title' });

    expect(errors).toEqual([]);
    expect(props.metaFields).toBe('category, title');
  });
});

test('[PackComponent-BADGELIST-005] the Ant Design Record list takes Meta fields as text too', () => {
  const { props, errors } = typedPackProps('antd', 'RecordList', [{ name: 'metaFields', type: 'array' }], {
    metaFields: 'status, owner',
  });

  expect(errors).toEqual([]);
  expect(props.metaFields).toBe('status, owner');
});
