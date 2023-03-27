import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {};

const useQueryPanelStore = create((set) => ({
  queryPanelHeight: queryManagerPreferences?.isExpanded ? queryManagerPreferences?.queryPanelHeight : 95 ?? 70,
  actions: {
    updateQueryPanelHeight: (newHeight) => set(() => ({ queryPanelHeight: newHeight })),
  },
}));

export const usePanelHeight = () => useQueryPanelStore((state) => state.queryPanelHeight);
export const useQueryPanelActions = () => useQueryPanelStore((state) => state.actions);
