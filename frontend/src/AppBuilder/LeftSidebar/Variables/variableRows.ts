import { getVariableUsage } from '@/AppBuilder/_utils/entityUsage/variableUsage';

export type VariableScope = 'app' | 'page';

/** A saved definition map: `{ [name]: { value, fxActive } }`. */
export type StoredVariableMap = Record<string, { value: string; fxActive: boolean }>;

/** A declared variable as the panel shows it; saved maps are keyed by `name`. */
export type VariableDefinitionRecord = {
  name: string;
  value: string;
  fxActive: boolean;
};

/** One row in the Variables panel: a declared variable, or one only a script or event creates. */
export type VariableRow = {
  key: string;
  scope: VariableScope;
  name: string;
  /** Declared in the panel. Absent for runtime-only variables. */
  definition?: VariableDefinitionRecord;
  /** Runtime-only: the query, component or page whose script or event sets it. */
  setBy?: string;
};

export const rowKey = (scope: VariableScope, name: string) => `${scope}:${name}`;

export const referenceOf = (scope: VariableScope, name: string) =>
  scope === 'app' ? `{{variables.${name}}}` : `{{page.variables.${name}}}`;

export const previewOf = (value: unknown, max = 120): string => {
  if (value === undefined) return 'undefined';
  // A blank initial value stores ''; a label reads better than "" and other strings stay quoted.
  if (value === '') return 'Empty string';
  let text: string;
  try {
    text = typeof value === 'string' ? `"${value}"` : (JSON.stringify(value) ?? String(value));
  } catch {
    text = String(value);
  }
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const BULK_ROW_NAMES = new Set(['all app variables', 'all page variables']);

/**
 * Declared variables in saved order, then runtime-only ones (set by a script or event, or present
 * in the live store) sorted by name. Runtime-only variables are never saved.
 */
export function buildVariableRows(
  state: any,
  moduleId: string,
  appDefinitions: StoredVariableMap = {},
  pageDefinitions: StoredVariableMap = {}
): Record<VariableScope, VariableRow[]> {
  const rows: Record<VariableScope, VariableRow[]> = { app: [], page: [] };
  const declared = new Set<string>();
  (
    [
      ['app', appDefinitions],
      ['page', pageDefinitions],
    ] as const
  ).forEach(([scope, map]) => {
    Object.entries(map).forEach(([name, stored]) => {
      const definition = { name, value: stored.value, fxActive: stored.fxActive };
      declared.add(rowKey(scope, name));
      rows[scope].push({ key: rowKey(scope, name), scope, name, definition });
    });
  });

  // Runtime-only means something creates it: a script or event sets it, or it holds a value now.
  // A name that bindings only read is a dangling reference, not a variable.
  const exposed = state.resolvedStore?.modules?.[moduleId]?.exposedValues;
  const isLive = (scope: VariableScope, name: string) =>
    name in ((scope === 'app' ? exposed?.variables : exposed?.page?.variables) ?? {});
  const runtimeOnly = getVariableUsage(state, moduleId)
    .variables.filter(
      (v) =>
        !BULK_ROW_NAMES.has(v.name) &&
        !declared.has(rowKey(v.scope, v.name)) &&
        (v.setBy.length > 0 || isLive(v.scope, v.name))
    )
    .map<VariableRow>((v) => ({
      key: `runtime:${rowKey(v.scope, v.name)}`,
      scope: v.scope,
      name: v.name,
      setBy: v.setBy[0]?.name,
    }));
  runtimeOnly.forEach((row) => rows[row.scope].push(row));
  return rows;
}

/** Type label for a live value, named as the Inspector colours it: [n] items for arrays, {n} keys for objects. */
export const typeLabelOf = (value: unknown): { label: string; kind: string } => {
  if (value === null) return { label: 'Null', kind: 'null' };
  if (value === undefined) return { label: 'Undefined', kind: 'null' };
  if (Array.isArray(value)) return { label: `Array [${value.length}]`, kind: 'array' };
  const t = typeof value;
  if (t === 'object') return { label: `Object {${Object.keys(value as object).length}}`, kind: 'object' };
  return { label: t.charAt(0).toUpperCase() + t.slice(1), kind: t };
};
