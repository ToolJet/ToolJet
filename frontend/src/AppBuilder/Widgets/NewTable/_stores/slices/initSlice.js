import { has } from 'lodash';

export const createInitSlice = (set, get) => ({
  initializeComponent: (id) =>
    set(
      (state) => {
        if (!state.components[id]) {
          state.components[id] = {
            filters: {},
            addRow: {},
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
