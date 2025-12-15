/**
 * Transforms HomePage's datasource objects to DatasourceRow format while preserving original reference.
 *
 * @param {Array} datasources - HomePage datasources array from state
 * @returns {Array<DatasourceRow & {_originalDatasource: Object}>} - Transformed datasource rows with original datasource reference
 *
 * @example
 * const datasourceRows = transformDatasourcesToDatasourceRow([
 *   { id: 1, name: 'PostgreSQL', type: 'postgres', updated_at: '2024-01-01', user: { name: 'John' } }
 * ]);
 */
export function transformDatasourcesToDatasourceRow(datasources) {
  // Handle null/undefined/empty arrays
  if (!datasources || !Array.isArray(datasources)) {
    return [];
  }

  return datasources.map((datasource) => {
    // Handle missing/invalid data gracefully
    const updatedAt =
      datasource.updated_at ||
      datasource.updatedAt ||
      datasource.created_at ||
      datasource.createdAt ||
      new Date().toISOString();
    const editedBy =
      datasource.user?.name ||
      datasource.user?.email ||
      datasource.updated_by?.name ||
      datasource.updated_by?.email ||
      'Unknown';

    // Validate and format date
    let formattedDate = updatedAt;
    if (typeof updatedAt === 'number') {
      // Handle timestamp
      formattedDate = new Date(updatedAt).toISOString();
    } else if (updatedAt instanceof Date) {
      formattedDate = updatedAt.toISOString();
    } else if (typeof updatedAt === 'string') {
      // Validate ISO string format
      const date = new Date(updatedAt);
      if (isNaN(date.getTime())) {
        formattedDate = new Date().toISOString();
      }
    }

    return {
      id: datasource.id || String(Math.random()),
      name: datasource.name || 'Untitled Datasource',
      type: datasource.type || 'Unknown',
      lastEdited: formattedDate,
      editedBy: editedBy,
      // Preserve original for permission checks and actions
      _originalDatasource: datasource,
      _originalApp: datasource, // For compatibility with existing hooks
      _originalResource: datasource,
      // Additional fields
      createdBy: datasource.created_by?.name || datasource.created_by?.email || 'Unknown',
      isActive: datasource.is_active !== false,
      userId: datasource.user_id || datasource.user?.id,
      createdAt: datasource.created_at || datasource.createdAt,
      icon: datasource.icon,
    };
  });
}
