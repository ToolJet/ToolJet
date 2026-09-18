export const createTableRowEventOptions = (rowId, options = {}) => {
  if (rowId === undefined || rowId === null) return options;

  return {
    ...options,
    eventExecutionId: `table-row:${rowId}`,
  };
};
