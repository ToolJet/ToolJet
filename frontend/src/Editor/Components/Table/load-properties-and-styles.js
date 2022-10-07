export default function loadPropertiesAndStyles(properties, styles, darkMode, component) {
  const color = styles.textColor !== '#000' ? styles.textColor : darkMode && '#fff';

  let serverSidePagination = properties.serverSidePagination ?? false;
  if (typeof serverSidePagination !== 'boolean') serverSidePagination = false;

  const serverSideSearch = properties.serverSideSearch ?? false;

  const serverSideSort = properties.serverSideSort ?? false;

  const displaySearchBox = properties.displaySearchBox ?? true;

  const showDownloadButton = properties.showDownloadButton ?? true;

  const showFilterButton = properties.showFilterButton ?? true;

  const showBulkUpdateActions = properties.showBulkUpdateActions ?? true;

  const showBulkSelector = properties.showBulkSelector ?? false;

  const highlightSelectedRow = properties.highlightSelectedRow ?? false;

  let clientSidePagination = properties.clientSidePagination ?? !serverSidePagination;
  if (typeof clientSidePagination !== 'boolean') clientSidePagination = true;

  const loadingState = properties.loadingState ?? false;

  const columnSizes = properties.columnSizes ?? {};

  const tableType = styles.tableType ?? 'table-bordered';

  const cellSize = styles?.cellSize;

  const borderRadius = styles.borderRadius ?? 0;

  const widgetVisibility = styles?.visibility ?? true;
  const parsedWidgetVisibility = widgetVisibility;

  const disabledState = styles?.disabledState ?? false;
  const parsedDisabledState = disabledState;

  const actionButtonRadius = styles.actionButtonRadius ? parseFloat(styles.actionButtonRadius) : 0;

  const actions = (component.definition.properties.actions?.value ?? []).map((action) => ({
    ...action,
    actionButtonRadius,
  }));

  return {
    color,
    serverSidePagination,
    clientSidePagination,
    serverSideSearch,
    serverSideSort,
    displaySearchBox,
    showDownloadButton,
    showFilterButton,
    showBulkUpdateActions,
    showBulkSelector,
    highlightSelectedRow,
    columnSizes,
    tableType,
    cellSize,
    borderRadius,
    parsedWidgetVisibility,
    parsedDisabledState,
    actionButtonRadius,
    loadingState,
    actions,
  };
}
