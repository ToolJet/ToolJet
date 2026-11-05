// The tables a promote was blocked on because the target environment does not have them yet, or null.
export const missingTablesFrom = (error) => {
  const raw = error?.error || error?.message;
  if (raw && typeof raw === 'object' && raw.code === 'TABLES_NOT_IN_TARGET_ENVIRONMENT' && Array.isArray(raw.tables)) {
    return raw.tables.filter((table) => table?.id);
  }
  return null;
};

// Promotes each table's structure (no rows) one environment up from the source, in order. Resolves with the name of
// the first table that failed and its error, or null when all went through.
export const promoteTablesOneUp = async (promoteTable, organizationId, tables, sourceEnvironmentId) => {
  for (const table of tables) {
    const result = await promoteTable(organizationId, table.id, sourceEnvironmentId).catch((error) => ({ error }));
    if (result?.error) {
      const reason = result.error?.message || result.error?.error || 'it could not be promoted';
      return { name: table.name, reason: typeof reason === 'string' ? reason : 'it could not be promoted' };
    }
  }
  return null;
};

// The promote error's text and details, from either shape the API gives: a string, or { error, details }.
export const promoteErrorMessage = (error, fallback) => {
  const raw = error?.error || error?.message;
  const message = typeof raw === 'object' ? raw?.error || fallback : raw || fallback;
  const details = typeof raw === 'object' ? raw?.details : message;
  return { message, details: details || message };
};
