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

export const getQueryDocumentationLabel = ({ dataSourceMeta, selectedDataSource }) => {
  const sourceType = dataSourceMeta?.name || selectedDataSource?.plugin?.name || selectedDataSource?.kind || 'Query';
  return `${sourceType} documentation`;
};

export const getQueryDocumentation = ({ dataSourceMeta, selectedDataSource }) => {
  if (!selectedDataSource?.kind) return null;

  const { kind } = selectedDataSource;
  const sourceSpecificLinks = {
    restapi: 'https://docs.tooljet.com/docs/data-sources/restapi/querying-rest-api',
    runjs: 'https://docs.tooljet.com/docs/data-sources/run-js',
    runpy: 'https://docs.tooljet.com/docs/data-sources/run-py',
    tooljetdb: 'https://docs.tooljet.com/docs/tooljet-db/querying-tooljet-db',
    workflows: 'https://docs.tooljet.com/docs/workflows/how-to/trigger-workflow-from-app',
  };
  const href =
    sourceSpecificLinks[kind] ||
    (selectedDataSource.type === 'sample'
      ? 'https://docs.tooljet.com/docs/data-sources/sample-data-sources'
      : selectedDataSource.plugin_id
        ? `https://docs.tooljet.com/docs/marketplace/plugins/marketplace-plugin-${kind}/`
        : `https://docs.tooljet.com/docs/data-sources/${kind}`);

  const label = getQueryDocumentationLabel({ dataSourceMeta, selectedDataSource });
  return {
    href,
    label,
    tooltipClassName: 'query-documentation-tooltip',
    tooltipPlacement: 'bottom',
  };
};

export const getRestApiRequestPresentation = (surface, isWorkflowNode) => {
  const useStackedRequestFields = surface === 'right' && !isWorkflowNode;
  return {
    fieldsClassName: useStackedRequestFields
      ? 'rest-api-request-fields rest-api-request-fields--stacked'
      : 'rest-api-request-fields d-flex flex-row',
    methodLabel: useStackedRequestFields ? 'Request method' : 'Method',
    showSectionLabel: !useStackedRequestFields,
    urlLabel: useStackedRequestFields ? 'Request URL' : 'URL',
  };
};

export const getQueryPluginSchemaForSurface = (schema, surface) => {
  const mode = schema?.properties?.mode;
  const modeValues = mode?.list?.map(({ value }) => value);
  const hasGuiAndSqlModes = modeValues?.includes('gui') && modeValues?.includes('sql');

  if (surface !== 'right' || schema?.type !== 'database' || !hasGuiAndSqlModes) return schema;

  return {
    ...schema,
    properties: {
      ...schema.properties,
      mode: { ...mode, label: 'Mode' },
    },
  };
};
