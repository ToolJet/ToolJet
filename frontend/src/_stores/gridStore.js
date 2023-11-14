import { create, zustandDevTools } from './utils';

const initialState = {
  draggedElement: null,
  activeGrid: null,
};

export const useAppVersionStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setActiveGrid: (gridId) => set({ activeGrid: gridId }),
      },
    }),
    { name: 'App Version Manager Store' }
  )
);

export const useActiveGrid = () => useAppVersionStore((state) => [state.activeGrid, state.actions.setActiveGrid]);
