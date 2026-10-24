// ToolJet.Slot names allow letters, digits and underscores; derive a stable one from an item id.
// Components dropped into a slot stay attached to its name, so builders should keep item ids stable.
export const toSlotName = (prefix: string, id: string) => `${prefix}_${id.replace(/\W/g, '_')}`;

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
