import type { UsageDetail, UsageEntry, UsageEntryKind } from './types';

export const PARAM_TYPES = new Set(['properties', 'general', 'generalStyles', 'others', 'styles', 'validation']);

export const getGraph = (state: any, moduleId: string) => state.dependencyGraph?.modules?.[moduleId]?.graph;
export const getQueries = (state: any, moduleId: string) => state.dataQuery?.queries?.modules?.[moduleId] ?? [];
export const getEvents = (state: any, moduleId: string) => state.eventsSlice?.module?.[moduleId]?.events ?? [];
export const getQueryName = (state: any, id: string, moduleId: string) =>
  state.modules?.[moduleId]?.queryIdNameMapping?.[id];
export const getComponentName = (state: any, id: string, moduleId: string) =>
  state.getComponentDefinition?.(id, moduleId)?.component?.name;

export const detailOf = (label?: string, expression?: string): UsageDetail | undefined =>
  label ? { label, ...(expression ? { expression } : {}) } : undefined;

export const sorted = (map: Map<string, UsageEntry>) =>
  Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

/** Stored bindings keep component/query UUIDs. Hover UI must show display names. */
const ENTITY_UUID_IN_PATH = /(components|queries)\.([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export function prettyExpression(state: any, moduleId: string, expression?: string): string | undefined {
  if (!expression) return expression;
  const nameByComponentId = Object.fromEntries(
    Object.entries(state.modules?.[moduleId]?.componentNameIdMapping ?? {}).map(([name, id]) => [id, name])
  );
  const nameByQueryId = state.modules?.[moduleId]?.queryIdNameMapping ?? {};
  return expression.replace(ENTITY_UUID_IN_PATH, (match, root: string, id: string) => {
    const name = root === 'components' ? nameByComponentId[id] : nameByQueryId[id];
    return name ? `${root}.${name}` : match;
  });
}

export function componentBindingExpression(
  state: any,
  moduleId: string,
  componentId: string,
  section: string,
  prop: string
) {
  const value = state.getComponentDefinition?.(componentId, moduleId)?.component?.definition?.[section]?.[prop]?.value;
  if (typeof value !== 'string' || !value.length) return undefined;
  return prettyExpression(state, moduleId, value);
}

export function addEntry(
  map: Map<string, UsageEntry>,
  kind: UsageEntryKind,
  id: string | null,
  name: string,
  detail?: UsageDetail
) {
  const key = `${kind}:${id ?? name}`;
  let entry = map.get(key);
  if (!entry) {
    entry = { kind, id, name, details: [] };
    map.set(key, entry);
  }
  if (!detail?.label) return;
  const existing = entry.details.find((d) => d.label === detail.label);
  if (!existing) entry.details.push(detail);
  else if (!existing.expression && detail.expression) existing.expression = detail.expression;
}

export function addComponentEntry(
  state: any,
  moduleId: string,
  map: Map<string, UsageEntry>,
  componentId: string,
  detail?: UsageDetail
) {
  const name = getComponentName(state, componentId, moduleId);
  if (name) addEntry(map, 'component', componentId, name, detail);
  else addEntry(map, 'unknown', componentId, 'Unknown component', detail);
}

export function addQueryEntry(
  state: any,
  moduleId: string,
  map: Map<string, UsageEntry>,
  queryId: string,
  detail?: UsageDetail,
  fallbackName?: string
) {
  const name = getQueryName(state, queryId, moduleId) ?? fallbackName;
  if (name) addEntry(map, 'query', queryId, name, detail);
  else addEntry(map, 'unknown', queryId, 'Unknown query', detail);
}

export function addSourceNodeEntry(
  state: any,
  moduleId: string,
  map: Map<string, UsageEntry>,
  path: string,
  detail?: UsageDetail
) {
  const parts = path.split('.');
  switch (parts[0]) {
    case 'components':
      addComponentEntry(state, moduleId, map, parts[1], detail);
      break;
    case 'queries':
      addQueryEntry(state, moduleId, map, parts[1], detail);
      break;
    case 'variables':
      addEntry(map, 'variable', null, parts.slice(1).join('.'), detail);
      break;
    case 'page':
      if (parts[1] === 'variables') addEntry(map, 'pageVariable', null, parts.slice(2).join('.'), detail);
      break;
    case 'globals':
      addEntry(map, 'global', null, parts.slice(1).join('.'), detail);
      break;
    case 'constants':
      addEntry(map, 'constant', null, parts.slice(1).join('.'), detail);
      break;
    default:
      break;
  }
}

export function addRefEntry(state: any, moduleId: string, map: Map<string, UsageEntry>, ref: any) {
  const { entityType, entityNameOrId, entityKey, sourceString } = ref;
  const detail = detailOf(entityKey, sourceString);
  switch (entityType) {
    case 'components':
      addComponentEntry(state, moduleId, map, entityNameOrId, detail);
      break;
    case 'queries':
      addQueryEntry(state, moduleId, map, entityNameOrId, detail);
      break;
    case 'variables':
      addEntry(map, 'variable', null, entityKey, detailOf(sourceString && 'value', sourceString));
      break;
    case 'page':
      if (entityNameOrId === 'variables')
        addEntry(map, 'pageVariable', null, entityKey, detailOf(sourceString && 'value', sourceString));
      break;
    case 'globals':
      addEntry(
        map,
        'global',
        null,
        entityNameOrId ? `${entityNameOrId}.${entityKey}` : entityKey,
        detailOf(sourceString && 'value', sourceString)
      );
      break;
    case 'constants':
      addEntry(
        map,
        'constant',
        null,
        entityNameOrId ? `${entityNameOrId}.${entityKey}` : entityKey,
        detailOf(sourceString && 'value', sourceString)
      );
      break;
    default:
      break;
  }
}
