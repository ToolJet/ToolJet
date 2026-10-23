/**
 * Item heights of a long list, and where each item is.
 *
 * Heights are kept in a Fenwick tree (a binary indexed tree over a typed array): the offset of an item, the item at an
 * offset and a height change are each O(log n), and building it is one pass over n numbers. Items of one height need no
 * tree at all until one of them turns out different. A general-purpose virtualizer keeps a position object per item and
 * rebuilds them from the changed item on, which for 500k rows is ~1 s on load and again whenever a row is measured.
 */

const buildTree = (sizes) => {
  const count = sizes.length;
  const tree = new Float64Array(count + 1);
  for (let i = 0; i < count; i++) {
    tree[i + 1] += sizes[i];
    const parent = i + 1 + ((i + 1) & -(i + 1));
    if (parent <= count) tree[parent] += tree[i + 1];
  }
  return tree;
};

/** Item heights, with prefix sums. `sizeOf` is every item's initial height, or a function giving item i's. */
export const createSizeIndex = (count, sizeOf) => {
  // Items of one height: positions are arithmetic until a height is set to something else.
  const uniform = typeof sizeOf === 'number' ? sizeOf : null;
  let sizes = null;
  let tree = null;
  let total = uniform !== null ? uniform * count : 0;
  const materialize = () => {
    sizes = new Float64Array(count);
    if (uniform !== null) sizes.fill(uniform);
    else for (let i = 0; i < count; i++) sizes[i] = sizeOf(i);
    tree = buildTree(sizes);
    total = 0;
    for (let i = count; i > 0; i -= i & -i) total += tree[i];
  };
  if (uniform === null) materialize();
  let highBit = 1;
  while (highBit * 2 <= count) highBit *= 2;

  return {
    count,
    /** Whether every item still has the one initial height. */
    isUniform: () => !tree,
    total: () => total,
    sizeAt: (i) => (tree ? sizes[i] : uniform),
    /** Top of item i: the heights of the items before it. */
    offsetOf(i) {
      const end = Math.min(i, count);
      if (!tree) return end * uniform;
      let sum = 0;
      for (let j = end; j > 0; j -= j & -j) sum += tree[j];
      return sum;
    },
    /** The item that covers `offset` (the last item at or past the end). */
    indexAt(offset) {
      if (count === 0) return 0;
      if (!tree) return Math.max(0, Math.min(count - 1, Math.floor(offset / uniform)));
      let position = 0;
      let rest = offset;
      for (let step = highBit; step > 0; step >>= 1) {
        const next = position + step;
        if (next <= count && tree[next] <= rest) {
          position = next;
          rest -= tree[next];
        }
      }
      return Math.min(position, count - 1);
    },
    /** Sets item i's height; returns the change. */
    setSize(i, size) {
      if (!tree) {
        if (size === uniform) return 0;
        materialize();
      }
      const delta = size - sizes[i];
      if (delta === 0) return 0;
      sizes[i] = size;
      total += delta;
      for (let j = i + 1; j <= count; j += j & -j) tree[j] += delta;
      return delta;
    },
  };
};

let detectedMaxHeight = null;
/**
 * The tallest a list element can be. Browsers cap an element's height (Chrome and Safari at ~33.5M px, Firefox at
 * ~17.9M px); measured once, with a margin.
 */
export const maxListHeight = () => {
  if (detectedMaxHeight !== null) return detectedMaxHeight;
  let measured = 0;
  if (typeof document !== 'undefined' && document.body) {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:1px;height:1000000000px;top:0;left:0';
    document.body.appendChild(probe);
    measured = probe.offsetHeight;
    probe.remove();
  }
  detectedMaxHeight = measured > 1000000 && measured < 1000000000 ? Math.floor(measured * 0.95) : 15000000;
  return detectedMaxHeight;
};
