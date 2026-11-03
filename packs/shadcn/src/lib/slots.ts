// ToolJet.Slot names allow letters, digits and underscores; derive a stable one from an item id.
// Components dropped into a slot stay attached to its name, so builders should keep item ids stable.
export const toSlotName = (prefix: string, id: string) => `${prefix}_${id.replace(/\W/g, '_')}`;

// A short, stable tag of an id's exact text (FNV-1a), in slot-name characters.
const idTag = (id: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
};

// Each distinct item id's slot name. toSlotName folds every other character to '_', so 'a-b' and 'a_b' (or 'café'
// and 'cafè') shared one canvas: the second tab drew blank and its components went to the first (pack audit SP-18,
// 2026-10-23). Names stay exactly toSlotName's unless ids collide, so saved apps keep their dropped components. On a
// collision an id already in slot characters keeps the plain name, as does the first of the others in text order
// (never list order: reordering items must not swap their canvases); the rest get a tag of their own id. A repeated
// id is the same item and shares its name.
export const slotNames = (prefix: string, ids: string[]): Map<string, string> => {
  const names = new Map<string, string>();
  const taken = new Set<string>();
  const distinct = [...new Set(ids)];
  const plain = distinct.filter((id) => !/\W/.test(id));
  const folded = distinct.filter((id) => /\W/.test(id)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const id of plain) {
    names.set(id, toSlotName(prefix, id));
    taken.add(toSlotName(prefix, id));
  }
  for (const id of folded) {
    const base = toSlotName(prefix, id);
    let name = base;
    for (let n = 1; taken.has(name); n += 1) name = `${base}_${idTag(id)}${n > 1 ? `_${n}` : ''}`;
    names.set(id, name);
    taken.add(name);
  }
  return names;
};

export type Item = { id: string; label: string };

// Items arrive from the Inspector as arbitrary JSON: keep well-formed { id, label } entries.
// Each item is a section with its own canvas (Accordion, Stepper, TabsContainer): a binding to a large list (a table's rows by
// mistake) drew 1500 canvases and froze the page (pack fuzz, 2026-10-23). Layouts never need more than this.
export const MAX_SLOT_ITEMS = 50;

export const toItems = (raw: unknown[], fallbackLabel: string): Item[] =>
  (Array.isArray(raw) ? raw : [])
    .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
    .slice(0, MAX_SLOT_ITEMS)
    .map((t, i) => ({
      id: String(t.id ?? i + 1),
      label: String(t.label ?? t.title ?? `${fallbackLabel} ${i + 1}`),
    }));
