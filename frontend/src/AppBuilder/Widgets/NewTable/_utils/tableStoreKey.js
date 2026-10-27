const KEY_SEPARATOR = '::';

// A Table inside a ListView/Kanban row is mounted once per row with the same component id, so its
// store entry is keyed by component id plus the row path. Outside a row context the key is the id.
export const getTableStoreKey = (componentId, contextPath = []) =>
  contextPath.length ? `${componentId}${KEY_SEPARATOR}${contextPath.map(({ index }) => index).join('.')}` : componentId;

export const getTableComponentId = (storeKey) =>
  typeof storeKey === 'string' ? storeKey.split(KEY_SEPARATOR)[0] : storeKey;
