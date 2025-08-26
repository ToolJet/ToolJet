import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { createWorkflowModalSlice } from './slices/modal/workflowModalSlice';
import { createWorkflowQuerySlice } from './slices/modal/workflowQuerySlice';
import { createWorkflowNodePreviewSlice } from './slices/modal/workflowNodePreviewSlice';
import { createWorkflowPanelSlice } from './slices/modal/workflowPanelSlice';

export const useWorkflowModalStore = create(
  devtools(
    immer((...args) => {
      const modalSlice = createWorkflowModalSlice(...args);
      const querySlice = createWorkflowQuerySlice(...args);
      const nodePreviewSlice = createWorkflowNodePreviewSlice(...args);
      const panelSlice = createWorkflowPanelSlice(...args);

      return {
        // State from all slices
        modal: modalSlice.modal,
        queries: querySlice.queries,
        nodePreview: nodePreviewSlice.nodePreview,
        panels: panelSlice.panels,

        // Merge all actions into a single actions object
        actions: {
          ...modalSlice.actions,
          ...querySlice.actions,
          ...nodePreviewSlice.actions,
          ...panelSlice.actions,
        },
      };
    }),
    { name: 'WorkflowModalStore' }
  )
);

export default useWorkflowModalStore;
