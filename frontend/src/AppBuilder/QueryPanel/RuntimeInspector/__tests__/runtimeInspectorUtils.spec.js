import {
  ALL_CATEGORIES,
  filterInspectorCategories,
  getCategoryLabel,
  isEntityPath,
  isPathWithin,
} from '../runtimeInspectorUtils';

const entry = (category, name, children = []) => ({
  id: `${category}.${name}`,
  name,
  children,
  metadata: { type: category, path: `${category}.${name}` },
});

const placeholder = (category) => ({
  id: `empty-${category}`,
  name: `No ${category} found`,
  children: [],
  metadata: { noData: true },
});

const categories = [
  { id: 'queries', name: 'Queries', children: [entry('queries', 'getUsers'), entry('queries', 'createOrder')] },
  {
    id: 'components',
    name: 'Components (current page)',
    children: [entry('components', 'form1', [entry('components', 'emailInput')]), entry('components', 'table1')],
  },
  { id: 'constants', name: 'Constants', children: [placeholder('constants')] },
];

describe('filterInspectorCategories', () => {
  it('should keep every category and drop "no data" placeholders when nothing is filtered', () => {
    const result = filterInspectorCategories(categories);

    expect(result.map((category) => category.id)).toEqual(['queries', 'components', 'constants']);
    expect(result.find((category) => category.id === 'constants').children).toEqual([]);
  });

  it('should keep only the chosen category', () => {
    const result = filterInspectorCategories(categories, { category: 'queries' });

    expect(result).toHaveLength(1);
    expect(result[0].children.map((item) => item.name)).toEqual(['getUsers', 'createOrder']);
  });

  it('should match names case-insensitively and hide categories without matches', () => {
    const result = filterInspectorCategories(categories, { query: '  GETUSERS ' });

    expect(result).toEqual([
      expect.objectContaining({ id: 'queries', children: [expect.objectContaining({ name: 'getUsers' })] }),
    ]);
  });

  it('should keep a parent component when only a nested child matches, pruned to that child', () => {
    const [components] = filterInspectorCategories(categories, { query: 'email' });

    expect(components.children).toHaveLength(1);
    expect(components.children[0]).toMatchObject({ name: 'form1', children: [{ name: 'emailInput' }] });
  });

  it('should keep all children of an entry whose own name matches', () => {
    const [components] = filterInspectorCategories(categories, { query: 'form' });

    expect(components.children[0].children.map((item) => item.name)).toEqual(['emailInput']);
  });

  it('should combine the category filter with the search query', () => {
    expect(filterInspectorCategories(categories, { query: 'table', category: 'queries' })).toEqual([]);
    expect(filterInspectorCategories(categories, { query: 'table', category: ALL_CATEGORIES })).toHaveLength(1);
  });
});

describe('getCategoryLabel', () => {
  it('should use the short label instead of the tree name', () => {
    expect(getCategoryLabel(categories[1])).toBe('Components');
  });

  it('should fall back to the tree name for unknown categories', () => {
    expect(getCategoryLabel({ id: 'custom', name: 'Custom' })).toBe('Custom');
  });
});

describe('isPathWithin', () => {
  it('should treat the entry itself and its nested values as within', () => {
    expect(isPathWithin('components.table1', 'components.table1')).toBe(true);
    expect(isPathWithin('components.table1.data.0', 'components.table1')).toBe(true);
  });

  it('should not match sibling names that share a prefix', () => {
    expect(isPathWithin('components.table10', 'components.table1')).toBe(false);
  });

  it('should be false without a selection', () => {
    expect(isPathWithin(null, 'components.table1')).toBe(false);
  });
});

describe('isEntityPath', () => {
  it('should only accept category.entity paths', () => {
    expect(isEntityPath('queries.getUsers')).toBe(true);
    expect(isEntityPath('queries.getUsers.data')).toBe(false);
    expect(isEntityPath('queries')).toBe(false);
    expect(isEntityPath(undefined)).toBe(false);
  });
});
