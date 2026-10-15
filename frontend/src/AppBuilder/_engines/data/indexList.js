/**
 * Lists of row positions (which rows pass a filter, in what order) as Int32Arrays: 4 bytes a row held outside the
 * JavaScript heap, which the garbage collector doesn't scan, and no garbage from growing them. Their `map`/`filter`
 * return Int32Arrays too, so rows and other values are read through the helpers here.
 */

/** 0, 1, … n - 1. */
export const allIndexes = (n) => {
  const list = new Int32Array(n);
  for (let i = 0; i < n; i++) list[i] = i;
  return list;
};

/** A list built one position at a time: `push(i)`, then `done()` gives the Int32Array. */
export const createIndexBuilder = (capacity = 1024) => {
  let list = new Int32Array(Math.max(16, capacity));
  let size = 0;
  return {
    push(index) {
      if (size === list.length) {
        const grown = new Int32Array(list.length * 2);
        grown.set(list);
        list = grown;
      }
      list[size++] = index;
    },
    get size() {
      return size;
    },
    done: () => list.slice(0, size),
  };
};

/** The rows at the listed positions, as a plain array. */
export const rowsAt = (data, list) => {
  const rows = new Array(list.length);
  for (let i = 0; i < list.length; i++) rows[i] = data[list[i]];
  return rows;
};

/** `fn(position, i)` for each listed position, as a plain array. */
export const mapIndexes = (list, fn) => {
  const out = new Array(list.length);
  for (let i = 0; i < list.length; i++) out[i] = fn(list[i], i);
  return out;
};
