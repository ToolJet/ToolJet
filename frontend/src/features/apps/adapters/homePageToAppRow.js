/**
 * Transforms HomePage's app objects to AppRow format while preserving original reference.
 * 
 * @param {Array} apps - HomePage apps array from state
 * @returns {Array<AppRow & {_originalApp: Object}>} - Transformed app rows with original app reference
 * 
 * @example
 * const appRows = transformAppsToAppRow([
 *   { id: 1, name: 'My App', updated_at: '2024-01-01', user: { name: 'John' } }
 * ]);
 */
export function transformAppsToAppRow(apps) {
  // Handle null/undefined/empty arrays
  if (!apps || !Array.isArray(apps)) {
    return [];
  }

  return apps.map((app) => {
    // Handle missing/invalid data gracefully
    const updatedAt = app.updated_at || app.updatedAt || app.created_at || app.createdAt || new Date().toISOString();
    const editedBy = app.user?.name || app.user?.email || app.updated_by?.name || app.updated_by?.email || 'Unknown';
    
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
      id: app.id || String(Math.random()), // Fallback for missing ID (should never happen, but defensive)
      name: app.name || 'Untitled App',
      lastEdited: formattedDate,
      editedBy: editedBy,
      // Preserve original for permission checks and actions
      _originalApp: app,
      // Additional fields that might be needed
      slug: app.slug,
      icon: app.icon,
      isPublic: app.is_public || false,
      folderId: app.folder_id || null,
      userId: app.user_id || app.user?.id,
    };
  });
}

export default transformAppsToAppRow;

