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
