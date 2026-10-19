export const createTableRowEventOptions = (rowId, options = {}) => {
  if (rowId === undefined || rowId === null) return options;

  return {
    ...options,
    eventExecutionId: `table-row:${rowId}`,
  };
};

export const createTableCellEventOptions = (rowId, columnId, options = {}) => ({
  ...options,
  eventExecutionId: `table-cell:${rowId}:${columnId}`,
});

export const getColumnCellClickEvents = (tableColumnEvents = [], columnId) =>
  tableColumnEvents.filter((event) => event?.event?.ref === columnId && event?.event?.eventId === 'onCellClicked');

const COLUMN_TYPES_WITHOUT_CELL_CLICK_EVENT = ['button', 'link', 'datepicker'];

export const supportsCellClickEvent = (column) =>
  !!column?.id && !COLUMN_TYPES_WITHOUT_CELL_CLICK_EVENT.includes(column.columnType);
