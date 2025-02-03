import { has } from 'lodash';

export const createInitSlice = (set, get) => ({
  initializeComponent: (id) =>
    set(
      (state) => {
        if (!state.components[id]) {
          state.components[id] = {
            filters: {},
            addRow: {},
            columnDetails: {
              columnProperties: [],
              transformations: [],
            },
            properties: {},
            styles: {},
          };
        }
      },
      false,
      { type: 'initializeComponent', payload: { id } }
    ),

  setTableProperties: (id, properties) =>
    set(
      (state) => {
        const visibility = properties?.visibility ?? true;
        state.components[id].properties.visibility = visibility ? '' : 'none';
        state.components[id].properties.disabledState = properties?.disabledState ?? false;
        state.components[id].loadingState = properties?.loadingState ?? false;
        state.components[id].properties.displaySearchBox = properties?.displaySearchBox ?? true;
        state.components[id].properties.showFilterButton = properties?.showFilterButton ?? true;
        state.components[id].properties.showAddNewRowButton = properties?.showAddNewRowButton ?? true;
        state.components[id].properties.showDownloadButton = properties?.showDownloadButton ?? true;
        state.components[id].properties.showBulkUpdateActions = properties?.showBulkUpdateActions ?? true;
        state.components[id].properties.totalRecords = properties?.totalRecords ?? 10;
        state.components[id].properties.enablePrevButton = properties?.enablePrevButton ?? true;
        state.components[id].properties.enableNextButton = properties?.enableNextButton ?? true;
        state.components[id].properties.hideColumnSelectorButton = properties?.hideColumnSelectorButton ?? false;
        state.components[id].properties.serverSideSearch = properties?.serverSideSearch ?? false;
        state.components[id].properties.serverSideSort = properties?.serverSideSort ?? false;
        state.components[id].properties.serverSideFilter = properties?.serverSideFilter ?? false;
        state.components[id].properties.showBulkSelector = properties?.showBulkSelector ?? false;
        state.components[id].properties.highlightSelectedRow = properties?.highlightSelectedRow ?? false;
        state.components[id].properties.rowsPerPage = properties?.rowsPerPage ?? 10;
        state.components[id].properties.enabledSort = properties?.enabledSort ?? true;
        state.components[id].properties.columnSizes = properties?.columnSizes ?? {};
        state.components[id].properties.allowSelection =
          properties?.allowSelection ?? (properties?.showBulkSelector || properties?.highlightSelectedRow)
            ? true
            : false;
        state.components[id].properties.defaultSelectedRow = properties?.defaultSelectedRow ?? { id: 1 };
        state.components[id].properties.selectRowOnCellEdit = properties?.selectRowOnCellEdit ?? true;

        let serverSidePagination = properties.serverSidePagination ?? false;
        if (typeof serverSidePagination !== 'boolean') state.components[id].properties.serverSidePagination = false;
        else state.components[id].properties.serverSidePagination = serverSidePagination;

        let clientSidePagination = false;
        if (
          properties.clientSidePagination ||
          typeof clientSidePagination !== 'boolean' ||
          (properties.enablePagination && !serverSidePagination)
        ) {
          clientSidePagination = true;
        }
        state.components[id].properties.clientSidePagination = clientSidePagination;
        if (
          !has(properties, 'enablePagination') &&
          (properties.clientSidePagination || properties.serverSidePagination)
        ) {
          state.components[id].properties.enablePagination = true;
        } else {
          state.components[id].properties.enablePagination = properties.enablePagination;
        }
      }
      // false,
      // { type: 'setProperties', payload: { id, properties } }
    ),

  setTableStyles: (id, styles) =>
    set(
      (state) => {
        const {
          borderRadius = 0,
          boxShadow,
          borderColor = 'var(--borders-weak-disabled)',
          contentWrap = true,
          textColor,
          tableType = 'table-bordered',
          cellSize,
          actionButtonRadius = 0,
          maxRowHeight = 'auto',
          maxRowHeightValue = 80,
          columnHeaderWrap = 'fixed',
        } = styles;

        state.components[id].styles.borderRadius = Number.parseFloat(borderRadius);
        state.components[id].styles.boxShadow = boxShadow;
        state.components[id].styles.borderColor = borderColor;
        state.components[id].styles.contentWrap = contentWrap;
        state.components[id].styles.textColor = textColor;
        state.components[id].styles.tableType = tableType;
        state.components[id].styles.cellSize = cellSize;
        state.components[id].styles.actionButtonRadius = parseFloat(actionButtonRadius);
        state.components[id].styles.maxRowHeight = maxRowHeight;
        state.components[id].styles.maxRowHeightValue = maxRowHeightValue;
        state.components[id].styles.columnHeaderWrap = columnHeaderWrap;
      },
      false,
      { type: 'setStyles', payload: { id, styles } }
    ),

  setTableActions: (id, actions) =>
    set(
      (state) => {
        state.components[id].properties.actions = actions.map((action) => {
          return {
            ...action,
            position: action?.position ?? 'right',
            actionButtonRadius: 0,
          };
        });
      },
      false,
      { type: 'setTableActions', payload: { id, actions } }
    ),

  removeComponent: (id) =>
    set(
      (state) => {
        if (state.components[id]) {
          delete state.components[id];
        }
      },
      false,
      { type: 'removeComponent', payload: { id } }
    ),

  getTableStyles: (id) => {
    return get().components[id] ? get().components[id].styles : {};
  },
  getTableProperties: (id) => {
    return get().components[id] ? get().components[id].properties : {};
  },
  getLoadingState: (id) => {
    return get().components[id] ? get().components[id].loadingState : false;
  },
  getHeaderVisibility: (id) => {
    return get().components[id]
      ? get().components[id].properties.showFilterButton || get().components[id].properties.displaySearchBox
      : false;
  },
  getFooterVisibility: (id) => {
    return get().components[id]
      ? get().components[id].properties.enablePagination ||
          get().components[id].properties.showAddNewRowButton ||
          get().components[id].properties.showDownloadButton
      : false;
  },
  getMaxRowHeightValue: (id) => {
    return get().components[id] ? get().components[id].styles.maxRowHeightValue : 80;
  },
  getSelectRowOnCellEdit: (id) => {
    return get().components[id] ? get().components[id].properties.selectRowOnCellEdit : false;
  },
  getActions: (id) => {
    return get().components[id] ? get().components[id].properties.actions : [];
  },
  getEnablePagination: (id) => get().components[id]?.properties.enablePagination ?? true,
  getRowsPerPage: (id) => get().components[id]?.properties.rowsPerPage ?? 10,
});
