import { createSizeIndex } from '../sizeIndex';

const naiveOffset = (sizes, i) => sizes.slice(0, i).reduce((a, b) => a + b, 0);
const naiveIndexAt = (sizes, offset) => {
  let sum = 0;
  for (let i = 0; i < sizes.length; i++) {
    sum += sizes[i];
    if (sum > offset) return i;
  }
  return sizes.length - 1;
};
const matchesNaive = (index, sizes) => {
  for (let i = 0; i <= sizes.length; i++) expect(index.offsetOf(i)).toBe(naiveOffset(sizes, i));
  expect(index.total()).toBe(naiveOffset(sizes, sizes.length));
  for (let offset = 0; offset < index.total() + 50; offset += 3) {
    expect(index.indexAt(offset)).toBe(naiveIndexAt(sizes, offset));
  }
};

describe('createSizeIndex', () => {
  const sizes = Array.from({ length: 37 }, (_, i) => 20 + ((i * 7) % 13));

  test('offsets, totals and lookups match summing the heights', () => {
    matchesNaive(
      createSizeIndex(sizes.length, (i) => sizes[i]),
      sizes
    );
  });

  test('items of one height, before and after one of them changes', () => {
    const uniform = Array(41).fill(46);
    const index = createSizeIndex(uniform.length, 46);
    matchesNaive(index, uniform);
    expect(index.isUniform()).toBe(true);
    expect(index.setSize(7, 46)).toBe(0);
    expect(index.isUniform()).toBe(true);
    expect(index.setSize(7, 100)).toBe(54);
    expect(index.isUniform()).toBe(false);
    uniform[7] = 100;
    matchesNaive(index, uniform);
  });

  test('an item boundary belongs to the item that starts there', () => {
    const index = createSizeIndex(sizes.length, (i) => sizes[i]);
    expect(index.indexAt(sizes[0])).toBe(1);
    expect(index.indexAt(sizes[0] - 0.5)).toBe(0);
    expect(createSizeIndex(10, 46).indexAt(46)).toBe(1);
  });

  test('changing a height moves the items after it', () => {
    const changed = createSizeIndex(sizes.length, (i) => sizes[i]);
    const next = [...sizes];
    next[5] = 100;
    expect(changed.setSize(5, 100)).toBe(100 - sizes[5]);
    expect(changed.setSize(5, 100)).toBe(0);
    matchesNaive(changed, next);
  });

  test('millions of items', () => {
    let start = performance.now();
    const uniform = createSizeIndex(5000000, 46);
    expect(performance.now() - start).toBeLessThan(5);
    expect(uniform.indexAt(46 * 4321987 + 1)).toBe(4321987);

    start = performance.now();
    const big = createSizeIndex(1000000, () => 46);
    expect(big.total()).toBe(46000000);
    expect(big.indexAt(46 * 654321 + 1)).toBe(654321);
    expect(big.offsetOf(999999)).toBe(46 * 999999);
    expect(performance.now() - start).toBeLessThan(200);
  });

  test('no items', () => {
    const empty = createSizeIndex(0, 46);
    expect(empty.total()).toBe(0);
    expect(empty.indexAt(100)).toBe(0);
  });
});
