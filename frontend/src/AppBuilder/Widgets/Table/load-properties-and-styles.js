import { has } from 'lodash';

export default function loadPropertiesAndStyles(properties, styles, darkMode) {
  const color = styles.textColor !== '#000' ? styles.textColor : darkMode && '#fff';

  const serverSideSearch = properties.serverSideSearch ?? false;
  const enableNextButton = properties.enableNextButton ?? true;
  const enablePrevButton = properties.enablePrevButton ?? true;

  const totalRecords = properties.totalRecords ?? 10;
  const enabledSort = properties?.enabledSort ?? true;
  const hideColumnSelectorButton = properties?.hideColumnSelectorButton ?? false;

  const serverSideSort = properties.serverSideSort ?? false;

  const serverSideFilter = properties.serverSideFilter ?? false;

  const displaySearchBox = properties.displaySearchBox ?? true;

  const showDownloadButton = properties.showDownloadButton ?? true;

  const showFilterButton = properties.showFilterButton ?? true;

  const showBulkUpdateActions = properties.showBulkUpdateActions ?? true;

  const showBulkSelector = properties.showBulkSelector ?? false;

  const highlightSelectedRow = properties.highlightSelectedRow ?? false;
  const rowsPerPage = properties.rowsPerPage ?? 10;

  let serverSidePagination = properties.serverSidePagination ?? false;
  if (typeof serverSidePagination !== 'boolean') serverSidePagination = false;

  let clientSidePagination = false;
  if (
    properties.clientSidePagination ||
    typeof clientSidePagination !== 'boolean' ||
    (properties.enablePagination && !serverSidePagination)
  ) {
    clientSidePagination = true;
  }

  let enablePagination;
  if (!has(properties, 'enablePagination') && (properties.clientSidePagination || properties.serverSidePagination)) {
    enablePagination = true;
  } else {
    enablePagination = properties.enablePagination;
  }

  const loadingState = properties.loadingState ?? false;

  const columnSizes = properties.columnSizes ?? {};

  const tableType = styles.tableType ?? 'table-bordered';

  const cellSize = styles?.cellSize;

  const borderRadius = styles.borderRadius ?? 0;

  const widgetVisibility = properties?.visibility ?? true;
  const parsedWidgetVisibility = widgetVisibility;

  const disabledState = properties?.disabledState ?? false;
  const parsedDisabledState = disabledState;

  const actionButtonRadius = styles.actionButtonRadius ? parseFloat(styles.actionButtonRadius) : 0;

  const actions = (properties.actions ?? []).map((action) => {
    return {
      ...action,
      position: action?.position ?? 'right',
      actionButtonRadius,
    };
  });

  const showAddNewRowButton = properties?.showAddNewRowButton ?? true;
  const allowSelection = properties?.allowSelection ?? (showBulkSelector || highlightSelectedRow) ? true : false;
  const defaultSelectedRow = properties?.defaultSelectedRow ?? { id: 1 };
  const maxRowHeight = styles?.maxRowHeight ?? 'auto';
  const maxRowHeightValue = styles?.maxRowHeightValue ?? 80;
  const boxShadow = styles?.boxShadow;
  const selectRowOnCellEdit = properties?.selectRowOnCellEdit ?? true;
  const contentWrapProperty = styles?.contentWrap ?? true;
  const borderColor = styles?.borderColor ?? 'var(--borders-weak-disabled)';
  const columnHeaderWrap = styles?.columnHeaderWrap ?? 'fixed';
  const headerCasing = styles?.headerCasing ?? 'uppercase';

  return {
    color,
    serverSidePagination,
    enablePagination,
    serverSideSearch,
    serverSideSort,
    serverSideFilter,
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
    enableNextButton,
    enablePrevButton,
    totalRecords,
    rowsPerPage,
    enabledSort,
    hideColumnSelectorButton,
    defaultSelectedRow,
    showAddNewRowButton,
    allowSelection,
    maxRowHeight,
    maxRowHeightValue,
    selectRowOnCellEdit,
    contentWrapProperty,
    boxShadow,
    borderColor,
    columnHeaderWrap,
    headerCasing,
  };
}
