import useStore from '@/AppBuilder/_stores/store';

// The components in a row-scoped widget's rows keep their values per row, by row index (components[child][row]). The
// List view draws a row per record key, so when records move (a sort, an insert, a removal) each drawn row moves with
// its record and keeps what the user typed. Its values must move with it: they stayed at the old index, so the row
// now drawn there read them (another record's edit), and its actions changed the record that left.

type Row = Record<string, unknown>;

type RowValuesStore = {
  resolvedStore: { modules: Record<string, { exposedValues?: { components?: Record<string, unknown> } } | undefined> };
  getCurrentPageComponents: (moduleId: string) => Record<string, { component?: { parent?: string | null } }>;
  findNearestSubcontainerAncestor: (parentId: string, moduleId: string) => string | null;
  setExposedValuesPerRow: (componentId: string, values: Row, indices: number[], moduleId: string) => void;
  resetComponentExposedValuesPerRow: (componentId: string, indices: number[], moduleId: string) => void;
};

const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Takes the rows' values before a row-scoped widget publishes rows keyed `after` in place of rows keyed `before`, and
 * returns what writes them back at their new rows, to run once the per-row arrays are sized for `after`. A record
 * that is new at a row taken by another record starts with no values (its components publish theirs as they mount).
 * Only the widget's own row members move: a component inside a nested row-scoped widget keeps a list per outer row.
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
  const members = Object.keys(pageComponents).filter((componentId) => {
    const parent = pageComponents[componentId]?.component?.parent;
    return !!parent && state.findNearestSubcontainerAncestor(parent, moduleId) === id;
  });
  const components = state.resolvedStore.modules[moduleId]?.exposedValues?.components ?? {};
  const rowsOf = (componentId: string): unknown[] => {
    let rows: unknown = components[componentId];
    for (const outer of parentIndices) rows = Array.isArray(rows) ? rows[outer] : undefined;
    return Array.isArray(rows) ? [...rows] : [];
  };
  const taken = new Map(members.map((componentId) => [componentId, rowsOf(componentId)]));

  return () => {
    for (const [componentId, rows] of taken) {
      for (const [to, from] of moves) {
        const indices = [...parentIndices, to];
        const row = from === undefined ? undefined : rows[from];
        if (isRow(row)) state.setExposedValuesPerRow(componentId, row, indices, moduleId);
        else state.resetComponentExposedValuesPerRow(componentId, indices, moduleId);
      }
    }
  };
};
