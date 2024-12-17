import { create, zustandDevTools } from '@/_stores/utils';
import { immer } from 'zustand/middleware/immer';

import { createInitSlice } from './slices/initSlice';

const initialState = {
  components: {},
};

const useTableStore = create(
  zustandDevTools(
    immer((set, get) => ({
      ...initialState,
      ...createInitSlice(set, get),
    })),
    { name: 'Table Store' }
  )
);

export default useTableStore;

//   // filterSlice.js
//   export const createFilterSlice = (set) => ({
//     components: {},
//     setFilter: (id, key, value) =>
//       set((state) => {
//         state.components[id] = state.components[id] || { filters: {} };
//         state.components[id].filters[key] = value;
//       }, false, 'filters/setFilter'),

//     clearFilters: (id) =>
//       set((state) => {
//         state.components[id] = state.components[id] || { filters: {} };
//         state.components[id].filters = {};
//       }, false, 'filters/clearFilters'),
//   });

//   // addRowSlice.js
//   export const createAddRowSlice = (set) => ({
//     components: {},
//     addNewRow: (id, key, value) =>
//       set((state) => {
//         state.components[id] = state.components[id] || { addRow: {} };
//         state.components[id].addRow[key] = value;
//       }, false, 'addRow/addNewRow'),

//     removeRow: (id, key) =>
//       set((state) => {
//         if (state.components[id]?.addRow) {
//           delete state.components[id].addRow[key];
//         }
//       }, false, 'addRow/removeRow'),
//   });

//   // store.js
//   import { create } from 'zustand';
//   import { devtools } from 'zustand/middleware';
//   import { immer } from 'zustand/middleware/immer';
//   import { createCommonSlice } from './commonSlice';
//   import { createFilterSlice } from './filterSlice';
//   import { createAddRowSlice } from './addRowSlice';

//   export const useStore = create(
//     devtools(
//       immer((set) => ({
//         ...createCommonSlice(set),
//         ...createFilterSlice(set),
//         ...createAddRowSlice(set),

//         initializeComponent: (id) =>
//           set((state) => {
//             state.components[id] = {
//               filters: {},
//               addRow: {},
//             };
//           }, false, 'components/initialize'),

//         removeComponent: (id) =>
//           set((state) => {
//             delete state.components[id];
//           }, false, 'components/remove'),
//       }))
//     )
//   );

//   // Selectors
//   export const useCommon = () => useStore((state) => ({
//     darkMode: state.darkMode,
//     toggleDarkMode: state.toggleDarkMode,
//   }));

//   export const useFilters = (id) => useStore((state) => ({
//     filters: state.components[id]?.filters || {},
//     setFilter: state.setFilter.bind(null, id),
//     clearFilters: state.clearFilters.bind(null, id),
//   }));

//   export const useAddRow = (id) => useStore((state) => ({
//     addRow: state.components[id]?.addRow || {},
//     addNewRow: state.addNewRow.bind(null, id),
//     removeRow: state.removeRow.bind(null, id),
//   }));

//   export const useInitializeComponent = () => useStore((state) => ({
//     initializeComponent: state.initializeComponent,
//     removeComponent: state.removeComponent,
//   }));

//   export default useStore;
