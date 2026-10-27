/** At most this many entries of an array or object are listed at once in the Inspector's value view. */
export const CHILD_LIMIT = 100;

/**
 * How to list entries `from`…`to` (inclusive) of an array or object: `null` when they fit (list them), otherwise
 * groups of consecutive entries, each opened on demand. Groups are 100, 10,000, 1,000,000… entries — whatever keeps one
 * level within the limit — so 5 million rows open as 5 groups, then 100, then 100, then the rows.
 */
export const childGroups = (from, to, limit = CHILD_LIMIT) => {
  const count = to - from + 1;
  if (count <= limit) return null;
  let size = limit;
  while (count > size * limit) size *= limit;
  const groups = [];
  for (let start = from; start <= to; start += size) groups.push({ from: start, to: Math.min(to, start + size - 1) });
  return groups;
};
