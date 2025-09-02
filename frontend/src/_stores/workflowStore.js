import create from 'zustand';
import { zustandDevTools } from './utils'; // Import zustandDevTools

const STORE_NAME = 'Workflow'; // Define a store name for devtools

const useWorkflowStore = create(
  zustandDevTools( // Wrap with zustandDevTools
    (set, get) => ({
      workflowId: null,
      // Existing action
      setWorkflowId: (id) => set({ workflowId: id }),

      // DEPRECATED: These actions have been moved to the proper workflow stores
      actions: {
        copyNodeToClipboard: (nodeId) => {
          console.log(`Action: copyNodeToClipboard for node ${nodeId}`);
          console.warn('DEPRECATED: Use useWorkflowCanvasStore.actions.copyNodeToClipboard instead');
        },
        handleNodeDuplicate: (nodeId) => {
          console.log(`Action: handleNodeDuplicate for node ${nodeId}`);
          console.warn('DEPRECATED: Use useWorkflowCanvasStore.actions.handleNodeDuplicate instead');
        },
        pasteNodeFromClipboard: () => {
          console.log('Action: pasteNodeFromClipboard');
          console.warn('DEPRECATED: Use useWorkflowCanvasStore.actions.pasteNodeFromClipboard instead');
        },
        applyReactFlowNodeChanges: (changes) => {
          console.log('Action: applyReactFlowNodeChanges', changes);
          console.warn('DEPRECATED: Use useWorkflowCanvasStore.actions.applyReactFlowNodeChanges instead');
        },
        deleteNodePreviewState: () => {
          console.log('Action: deleteNodePreviewState');
          console.warn('DEPRECATED: Use useWorkflowCanvasStore.actions.deleteNodePreviewState instead');
        },
        setLastMousePosition: (position) => {
          console.log('Action: setLastMousePosition', position);
          console.warn('DEPRECATED: Use useWorkflowCanvasStore.canvasUI.setLastMousePosition instead');
        },
        deleteNode: (nodeId) => {
          console.log(`Action: deleteNode for node ${nodeId}`);
          console.warn('DEPRECATED: Use useWorkflowCanvasStore.actions.deleteNode instead');
        },
      },
    }),
    { name: STORE_NAME } // Pass store name to devtools
  )
);

export default useWorkflowStore;

// Optional: Export hooks for easier access to actions and state
export const useWorkflowActions = () => useWorkflowStore((state) => state.actions);
export const useWorkflowState = () => useWorkflowStore((state) => state);
