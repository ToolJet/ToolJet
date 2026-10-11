/**
 * Decides which editor the query panel body should mount for the selected query.
 *
 * Returns a decision, not a component, so the choice can be unit-tested without
 * pulling in the query editor bundle. `QueryManagerBody` maps it:
 *   'none'    -> render nothing
 *   'plugin'  -> the generic operations.json-driven DynamicForm
 *   'builtin' -> allSources[componentName]
 */
export const resolveQueryEditor = ({ selectedDataSource, selectedQuery }) => {
  // Dummy DS = stub options + maybe no plugin relation. Mounting editor crashes:
  // built-ins read undefined options.X.value, unbundled kinds → allSources[Kind] = undefined.
  // is_dummy warning in the panel already tells user to pull.
  if (selectedDataSource?.is_dummy === true) return { type: 'none' };

  if (selectedDataSource?.plugin_id) return { type: 'plugin' };

  const kind = selectedQuery?.kind;
  return {
    type: 'builtin',
    componentName: kind?.charAt(0).toUpperCase() + kind?.slice(1),
  };
};

export const resolveNamedQueryParameters = (parameters, resolveValue) =>
  (Array.isArray(parameters) ? parameters : []).reduce(
    (values, parameter) => ({ ...values, [parameter.name]: resolveValue(parameter.defaultValue, undefined) }),
    {}
  );

export const normalizeQueryDefaults = (schema, options = schema?.defaults || {}) => {
  const normalized = { ...options };
  Object.entries(schema?.properties || {}).forEach(([key, field]) => {
    const value = normalized[key];
    if (
      ['dropdown', 'dropdown-component-flip'].includes(field?.type) &&
      value &&
      typeof value === 'object' &&
      'value' in value
    ) {
      normalized[key] = value.value;
    }
  });
  return normalized;
};

export const changeQueryOperation = (schema, options, operation) => {
  if ((options.operation?.value ?? options.operation) === operation) return options;
  const updated = { ...options, operation };
  for (const { value } of schema?.properties?.operation?.list || []) {
    for (const key of Object.keys(schema.properties[value] || {})) {
      // The query editor merges updates, so explicit empty values also clear hidden fields.
      if (key in updated) updated[key] = '';
    }
  }
  return updated;
};

export const getQueryInputValue = (value, initialValue) =>
  value === undefined || value === null ? initialValue : typeof value === 'string' ? value : JSON.stringify(value);
