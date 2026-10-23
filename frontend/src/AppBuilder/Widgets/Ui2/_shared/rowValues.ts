import useStore from '@/AppBuilder/_stores/store';

// The components in a row-scoped widget's rows keep their values per row, by row index (components[child][row]). The
// List view draws a row per record key (and a top-level Kanban a custom card per card key), so when records move (a
// sort, an insert, a removal, a card move) each drawn row moves with its record and keeps what the user typed. Its
// values must move with it: they stayed at the old index, so the row now drawn there read them (another record's
// edit), and its actions changed the record that left. A nested row-scoped widget's items ({{listItem}}, {{cardData}})
// are kept per row of this one too, and move the same way.

type Row = Record<string, unknown>;

type RowValuesStore = {
  resolvedStore: {
    modules: Record<
      string,
      | { exposedValues?: { components?: Record<string, unknown> }; customResolvables?: Record<string, unknown> }
      | undefined
    >;
  };
  getCurrentPageComponents: (
    moduleId: string
  ) => Record<string, { component?: { parent?: string | null; component?: string } }>;
  updateCustomResolvables: (
    componentId: string,
    data: unknown[],
    key: string,
    moduleId: string,
    parentIndices: number[]
  ) => void;
  findNearestSubcontainerAncestor: (parentId: string, moduleId: string) => string | null;
  setExposedValuesPerRow: (componentId: string, values: Row, indices: number[], moduleId: string) => void;
  resetComponentExposedValuesPerRow: (componentId: string, indices: number[], moduleId: string) => void;
  startExposedValueBatch: () => void;
  flushExposedValueBatch: () => void;
};

const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);

/** The rows in one row's value, with their paths below it: the row itself, or a nested widget's rows (lists of rows). */
const rowsAt = (value: unknown, path: number[] = []): Array<[number[], Row]> => {
  if (isRow(value)) return [[path, value]];
  if (!Array.isArray(value)) return [];
  return value.flatMap((inner, index) => rowsAt(inner, [...path, index]));
};

// What a nested row-scoped widget's rows read their item as.
const ITEM_KEYS: Record<string, string> = {
  ShadListView: 'listItem',
  Listview: 'listItem',
  ShadKanban: 'cardData',
  Kanban: 'cardData',
};

/** The item lists in one row's items of a nested widget, with their paths below it: the list itself, or, a level
 *  deeper, the lists kept per row of the widgets between (objects keyed by row). */
const itemListsAt = (value: unknown, path: number[] = []): Array<[number[], unknown[]]> => {
  if (Array.isArray(value)) return [[path, value]];
  if (!isRow(value)) return [];
  return Object.entries(value).flatMap(([index, inner]) => itemListsAt(inner, [...path, Number(index)]));
};

/**
 * Takes the rows' values before a row-scoped widget publishes rows keyed `after` in place of rows keyed `before`, and
 * returns what writes them back at their new rows, to run once the per-row arrays are sized for `after`. A record
 * that is new at a row taken by another record starts with no values (its components publish theirs as they mount).
 * A component inside a nested row-scoped widget (a List view on a card, or in a row) keeps a list per row of this
 * widget, and that list moves with the record: each of its rows is written at the record's new row. The rows left
 * over there are not reset (the store derived each reset row into the nested widget's children, as an empty row): the
 * nested widget sizes its per-row lists again for the record it now draws, which drops them, and a new record's
 * components publish over the rest as they mount.
 * A nested row-scoped widget's items move with the record too, written right after the values: the nested widget
 * writes them again only once its row has drawn at the new index, so that row's components first resolved the items
 * of the record that left, and a field whose default reads its item ({{listItem.name}}) took that record's default
 * as a new one and dropped what the user typed.
 * Returns null when no record moved (an append or a removal at the end needs no writes).
 */
export const takeRowValues = (
  id: string,
  moduleId: string,
  parentIndices: number[],
  before: string[],
  after: string[]
): (() => void) | null => {
  const was = new Map(before.map((key, index) => [key, index]));
  const moves: Array<[number, number | undefined]> = [];
  after.forEach((key, index) => {
    const from = was.get(key);
    if (from !== index && (from !== undefined || index < before.length)) moves.push([index, from]);
  });
  if (!moves.length) return null;

  const state = useStore.getState() as unknown as RowValuesStore;
  const pageComponents = state.getCurrentPageComponents(moduleId) ?? {};
  // Its row members at any depth: the row-scoped widgets around a component, nearest first, reach this one.
  const isMember = (componentId: string) => {
    const seen = new Set<string>();
    let parent = pageComponents[componentId]?.component?.parent;
    while (parent) {
      const owner = state.findNearestSubcontainerAncestor(parent, moduleId);
      if (!owner || seen.has(owner)) return false;
      if (owner === id) return true;
      seen.add(owner);
      parent = pageComponents[owner]?.component?.parent;
    }
    return false;
  };
  const members = Object.keys(pageComponents).filter(isMember);
  const components = state.resolvedStore.modules[moduleId]?.exposedValues?.components ?? {};
  const rowsOf = (componentId: string): unknown[] => {
    let rows: unknown = components[componentId];
    for (const outer of parentIndices) rows = Array.isArray(rows) ? rows[outer] : undefined;
    return Array.isArray(rows) ? [...rows] : [];
  };
  const taken = new Map(members.map((componentId) => [componentId, rowsOf(componentId)]));
  const resolvables = state.resolvedStore.modules[moduleId]?.customResolvables ?? {};
  // A nested widget's items are kept in objects keyed by the rows around it, outermost first.
  const itemsOf = (componentId: string): unknown => {
    let items: unknown = resolvables[componentId];
    for (const outer of parentIndices) items = isRow(items) ? items[outer] : undefined;
    return items;
  };
  const nested = members.flatMap((componentId) => {
    const key = ITEM_KEYS[pageComponents[componentId]?.component?.component ?? ''];
    const items = key ? itemsOf(componentId) : undefined;
    return key && isRow(items) ? [{ componentId, key, items }] : [];
  });

  // Written in one batch, flushed at once: outside a batch the store queues a row write to a later microtask, where it
  // could land after a later reset of that row and bring the moved values back.
  return () => {
    state.startExposedValueBatch();
    try {
      for (const [componentId, rows] of taken) {
        for (const [to, from] of moves) {
          const moved = rowsAt(from === undefined ? undefined : rows[from]);
          for (const [path, row] of moved) {
            state.setExposedValuesPerRow(componentId, row, [...parentIndices, to, ...path], moduleId);
          }
          if (!moved.length && isRow(rows[to])) {
            state.resetComponentExposedValuesPerRow(componentId, [...parentIndices, to], moduleId);
          }
        }
      }
    } finally {
      state.flushExposedValueBatch();
    }
    // After the values: resolving the moved items reads the components' values at their new rows.
    for (const { componentId, key, items } of nested) {
      for (const [to, from] of moves) {
        if (from === undefined) continue;
        for (const [path, list] of itemListsAt(items[from])) {
          state.updateCustomResolvables(componentId, list, key, moduleId, [...parentIndices, to, ...path]);
        }
      }
    }
  };
};
