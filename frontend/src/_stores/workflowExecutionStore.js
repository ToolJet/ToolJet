import { create, zustandDevTools } from './utils';

const STORE_NAME = 'WorkflowExecution';

const initialState = {
  executionHistory: [],
  currentExecutionDetails: null,
  paginatedExecutions: [],
  paginatedExecutionsMeta: {
    currentPage: 1,
    totalCount: 0,
    totalPages: 1,
  },
  paginatedNodes: [],
  paginatedNodesMeta: {
    currentPage: 1,
    totalCount: 0,
    totalPages: 1,
  },
};

export const useWorkflowExecutionStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        fetchWorkflowExecutionHistory: (workflowId, page = 1, limit = 10) => {
          console.log(`Action: fetchWorkflowExecutionHistory for workflow ${workflowId}, page ${page}, limit ${limit}`);
          // DEPRECATED: This function has been moved to the proper workflow execution store
          // Use useWorkflowCanvasStore.actions.fetchWorkflowExecutionHistory instead
          console.warn('DEPRECATED: Use useWorkflowCanvasStore.actions.fetchWorkflowExecutionHistory instead');
        },
        updateCurrentExecutionDetails: (details) => {
          console.log('Action: updateCurrentExecutionDetails', details);
          set({ currentExecutionDetails: details });
        },
        setPaginatedWorkflowExecutions: (executions, meta) => {
          console.log('Action: setPaginatedWorkflowExecutions', executions, meta);
          set({ paginatedExecutions: executions, paginatedExecutionsMeta: meta });
        },
        setPaginatedWorkflowExecutionNodes: (nodes, meta) => {
          console.log('Action: setPaginatedWorkflowExecutionNodes', nodes, meta);
          set({ paginatedNodes: nodes, paginatedNodesMeta: meta });
        },
      },
    }),
    { name: STORE_NAME }
  )
);

export const useWorkflowExecutionActions = () => useWorkflowExecutionStore((state) => state.actions);
export const useWorkflowExecutionState = () => useWorkflowExecutionStore((state) => state);
