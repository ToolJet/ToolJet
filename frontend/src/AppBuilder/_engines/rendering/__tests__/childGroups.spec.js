import { childGroups } from '../childGroups';

describe('childGroups', () => {
  test('a collection that fits is listed as is', () => {
    expect(childGroups(0, 99)).toBeNull();
    expect(childGroups(0, -1)).toBeNull();
  });

  test('a larger one is split into consecutive groups covering every entry', () => {
    expect(childGroups(0, 249)).toEqual([
      { from: 0, to: 99 },
      { from: 100, to: 199 },
      { from: 200, to: 249 },
    ]);
  });

  test('no level lists more than the limit, down to the entries', () => {
    const open = (from, to, depth = 0) => {
      const groups = childGroups(from, to);
      if (!groups) return { depth, count: to - from + 1 };
      expect(groups.length).toBeLessThanOrEqual(100);
      expect(groups[0].from).toBe(from);
      expect(groups.at(-1).to).toBe(to);
      groups.slice(1).forEach((group, i) => expect(group.from).toBe(groups[i].to + 1));
      return open(groups.at(-1).from, groups.at(-1).to, depth + 1);
    };
    expect(childGroups(0, 4999999)).toHaveLength(5);
    expect(open(0, 4999999)).toEqual({ depth: 3, count: 100 });
    expect(open(0, 504999).depth).toBe(2);
  });
});
