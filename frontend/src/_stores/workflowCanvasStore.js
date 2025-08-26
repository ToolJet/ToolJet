import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { createWorkflowCanvasSlice } from './slices/canvas/workflowCanvasSlice';
import { createWorkflowCanvasUISlice } from './slices/canvas/workflowCanvasUISlice';
import { createWorkflowExecutionSlice } from './slices/canvas/workflowExecutionSlice';

export const useWorkflowCanvasStore = create(
  devtools(
    immer((...args) => {
      const canvasSlice = createWorkflowCanvasSlice(...args);
      const canvasUISlice = createWorkflowCanvasUISlice(...args);
      const executionSlice = createWorkflowExecutionSlice(...args);

      return {
        // State from all slices
        canvas: canvasSlice.canvas,
        canvasUI: canvasUISlice.canvasUI,
        execution: executionSlice.execution,

        // Merge all actions into a single actions object
        actions: {
          ...canvasSlice.actions,
          ...canvasUISlice.actions,
          ...executionSlice.actions,
        },
      };
    }),
    { name: 'WorkflowCanvasStore' }
  )
);

export default useWorkflowCanvasStore;
