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
        const { setColumnDetails } = get();
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
        state.components[id].properties.enablePrevButton = properties?.enablePrevButton ?? true; // Only for server side pagination
        state.components[id].properties.enableNextButton = properties?.enableNextButton ?? true; // Only for server side pagination
        state.components[id].properties.showAddNewRowButton = properties?.showAddNewRowButton ?? true;
        state.components[id].properties.showDownloadButton = properties?.showDownloadButton ?? true;
        state.components[id].properties.hideColumnSelectorButton = properties?.hideColumnSelectorButton ?? false;

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
        // setColumnDetails(id, properties);
      },
      false,
      { type: 'setProperties', payload: { id, properties } }
    ),

  setTableStyles: (id, styles) =>
    set(
      (state) => {
        const { borderRadius = 0, boxShadow, borderColor } = styles;
        state.components[id].styles.borderRadius = Number.parseFloat(borderRadius);
        state.components[id].styles.boxShadow = boxShadow;
        state.components[id].styles.borderColor = borderColor;
      },
      false,
      { type: 'setStyles', payload: { id, styles } }
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
});
