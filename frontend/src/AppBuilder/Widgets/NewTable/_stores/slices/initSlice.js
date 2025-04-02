import { has } from 'lodash';
import { utilityForNestedNewRow } from '../helper';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

export const createInitSlice = (set, get) => ({
  initializeComponent: (id) => {
    set(
      (state) => {
        if (!state.components[id]) {
          state.components[id] = {
            properties: {},
            styles: {},
            filters: {},
            addNewRow: new Map(),
            shouldPersistAddNewRow: false,
            editedRowDetails: {
              editedRows: new Map(),
              editedFields: new Map(),
            },
            events: {
              hasHoveredEvent: false,
              tableComponentEvents: [],
              tableColumnEvents: [],
              tableActionEvents: [],
            },
            columnDetails: {
              columnProperties: [],
              transformations: [],
            },
          };
        }
      },
      false,
      { type: 'initializeComponent', payload: { id } }
    );
  },

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
      },
      false,
      { type: 'setProperties', payload: { id, properties } }
    ),

  setTableStyles: (id, styles, darkMode) =>
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
          headerCasing = 'uppercase',
        } = styles;

        state.components[id].styles.borderRadius = Number.parseFloat(borderRadius);
        state.components[id].styles.boxShadow = boxShadow;
        state.components[id].styles.borderColor = borderColor;
        state.components[id].styles.contentWrap = contentWrap;
        state.components[id].styles.textColor = textColor !== '#000' ? textColor : darkMode && '#fff';
        state.components[id].styles.rowStyle = tableType;
        state.components[id].styles.cellHeight = cellSize;
        state.components[id].styles.actionButtonRadius = parseFloat(actionButtonRadius);
        state.components[id].styles.isMaxRowHeightAuto = maxRowHeight === 'auto';
        state.components[id].styles.maxRowHeightValue = maxRowHeightValue;
        state.components[id].styles.columnHeaderWrap = columnHeaderWrap;
        state.components[id].styles.headerCasing = headerCasing;
      },
      false,
      { type: 'setStyles', payload: { id, styles } }
    ),

  setTableActions: (id, actions = []) =>
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

  setTableEvents: (id, events = []) =>
    set(
      (state) => {
        const tableEvents = events.filter((event) => event.sourceId === id);
        const tableComponentEvents = tableEvents.filter((event) => event.target === 'component');
        state.components[id].events.tableComponentEvents = tableComponentEvents;
        state.components[id].events.hasHoveredEvent = tableComponentEvents.some(
          (event) => event.event.eventId === 'onRowHovered'
        );
        state.components[id].events.tableColumnEvents = tableEvents.filter((event) => event.target === 'table_column');
        state.components[id].events.tableActionEvents = tableEvents.filter((event) => event.target === 'table_action');
      },
      false,
      { type: 'setTableEvents', payload: { id, events } }
    ),

  updateEditedRowsAndFields: (id, index, rowDetail, editedFields) =>
    set(
      (state) => {
        state.components[id].editedRowDetails.editedRows.set(index, rowDetail);
        state.components[id].editedRowDetails.editedFields.set(index, editedFields);
      },
      false,
      { type: 'updateEditedRowsAndFields', payload: { id, index, rowDetail, editedFields } }
    ),

  removeComponent: (id) =>
    set(
      (state) => {
        // if the component is not present in the DOM, then remove it - this is to handle the case where the component is removed from the DOM and then added back
        // Like when the component is moved from one container to another
        if (state.components[id] && !document.querySelector(`[id="${id}"]`)) {
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
  getAllEditedRows: (id) => get().components[id]?.editedRowDetails.editedRows ?? new Map(),
  getAllEditedFields: (id) => get().components[id]?.editedRowDetails.editedFields ?? new Map(),
  getEditedRowFromIndex: (id, index) => get().components[id]?.editedRowDetails.editedRows.get(index),
  getEditedFieldsOnIndex: (id, index) => get().components[id]?.editedRowDetails.editedFields.get(index),
  clearEditedRows: (id) =>
    set(
      (state) => {
        state.components[id].editedRowDetails.editedRows.clear();
        state.components[id].editedRowDetails.editedFields.clear();
      },
      false,
      { type: 'clearEditedRows', payload: { id } }
    ),
  getAllAddNewRowDetails: (id) => get().components[id]?.addNewRow,
  getAddNewRowDetailFromIndex: (id, index) => get().components[id]?.addNewRow.get(index),
  updateAddNewRowDetails: (id, index, newRow) =>
    set(
      (state) => {
        let transformedNewRow = deepClone(newRow);
        if (Object.keys(newRow).find((key) => key.includes('.'))) {
          transformedNewRow = utilityForNestedNewRow(transformedNewRow);
        }
        state.components[id].addNewRow.set(index, transformedNewRow);
      },
      false,
      { type: 'updateAddNewRowDetails', payload: { id, index, newRow } }
    ),
  clearAddNewRowDetails: (id) =>
    set(
      (state) => {
        if (!state.components[id].shouldPersistAddNewRow) {
          state.components[id].addNewRow.clear();
        }
      },
      false,
      { type: 'clearNewRow', payload: { id } }
    ),
  updateShouldPersistAddNewRow: (id, value) =>
    set(
      (state) => {
        state.components[id].shouldPersistAddNewRow = value;
      },
      false,
      { type: 'updateShouldPersistAddNewRow', payload: { id, value } }
    ),
  getTableComponentEvents: (id) => {
    return get().components[id]?.events?.tableComponentEvents || [];
  },
  getTableActionEvents: (id) => {
    return get().components[id]?.events?.tableActionEvents || [];
  },
  // Remove this when the toggle column is removed as it is used only for the toggle column
  // TODO: Remove the above comment if this function is added for other columns
  getTableColumnEvents: (id) => {
    return get().components[id]?.events?.tableColumnEvents || [];
  },
  getHasHoveredEvent: (id) => {
    return get().components[id]?.events?.hasHoveredEvent || false;
  },
});
