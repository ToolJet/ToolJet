// ToolJet.Slot names allow letters, digits and underscores; a tab's or a panel's comes from its key. Components dropped
// into a slot stay attached to its name, so builders should keep item keys stable.
export const toSlotName = (prefix: string, key: string) => `${prefix}_${key.replace(/[^A-Za-z0-9_]/g, '_')}`;

// A short, stable tag of a key's exact text (FNV-1a), in slot-name characters.
const keyTag = (key: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
};

// Each distinct key's slot name. toSlotName folds every other character to '_', so 'a-b' and 'a_b' (or 'café' and
// 'cafè') shared one canvas: the second tab drew blank and its components went to the first (shadcn pack audit SP-18,
// 2026-10-23, the same here). Names stay exactly toSlotName's unless keys collide, so saved apps keep their dropped
// components. On a collision a key already in slot characters keeps the plain name, as does the first of the others in
// text order (never list order: reordering items must not swap their canvases); the rest get a tag of their own key.
export const slotNames = (prefix: string, keys: string[]): Map<string, string> => {
  const names = new Map<string, string>();
  const taken = new Set<string>();
  const distinct = [...new Set(keys)];
  const plain = distinct.filter((k) => /^[A-Za-z0-9_]*$/.test(k));
  const folded = distinct.filter((k) => !/^[A-Za-z0-9_]*$/.test(k)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const k of plain) {
    names.set(k, toSlotName(prefix, k));
    taken.add(toSlotName(prefix, k));
  }
  for (const k of folded) {
    const base = toSlotName(prefix, k);
    let name = base;
    for (let n = 1; taken.has(name); n += 1) name = `${base}_${keyTag(k)}${n > 1 ? `_${n}` : ''}`;
    names.set(k, name);
    taken.add(name);
  }
  return names;
};
