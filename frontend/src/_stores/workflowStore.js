import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { zustandDevTools } from '@/AppBuilder/_stores/utils';

const useWorkflowStore = create(
  zustandDevTools(
    immer((set, get) => ({
      /* Suggestions are accessed from the MultiLine and SingleLine code editor components. */
      suggestions: {
        appHints: [],
        jsHints: [],
      },
      workflowId: null,

      actions: {
        setWorkflowId: (id) => set({ workflowId: id }),
        setSuggestions: (suggestions) =>
          set((state) => {
            state.suggestions = suggestions;
          }),
      },
    }))
  ),
  { name: 'WorkflowStore' }
);

export default useWorkflowStore;
