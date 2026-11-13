// The tables a promote was blocked on because the target environment does not have them yet, or null.
export const missingTablesFrom = (error) => {
  const raw = error?.error || error?.message;
  if (raw && typeof raw === 'object' && raw.code === 'TABLES_NOT_IN_TARGET_ENVIRONMENT' && Array.isArray(raw.tables)) {
    return raw.tables.filter((table) => table?.id);
  }
  return null;
};

// What promoting one listed table takes: the listed tables it references (and theirs), then the table itself. The
// server lists tables parents first and says which listed tables each one references (`depends_on`), so list order
// is the promote order.
export const tablesToPromoteFor = (table, tables) => {
  const byId = new Map(tables.map((listed) => [listed.id, listed]));
  const needed = new Set();
  const collect = (current) => {
    if (needed.has(current.id)) return;
    needed.add(current.id);
    (current.depends_on || []).forEach((parentId) => byId.has(parentId) && collect(byId.get(parentId)));
  };
  collect(table);
  return tables.filter((listed) => needed.has(listed.id));
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
