export const createWorkflowExecutionSlice = (set, get) => ({
  execution: {
    nodes: [],
    logs: [],
    status: 'idle',
    currentExecutionId: null,
    mode: 'Editing',
    logsConsoleVisible: false,
    paginatedWorkflowExecutions: [],
    paginatedWorkflowExecutionsMeta: {},
    paginatedWorkflowExecutionNodes: [],
    selectedWorkflowExecutionIndex: 0,
  },

  actions: {
    setExecutionNodes: (nodes) =>
      set((state) => {
        state.execution.nodes = nodes;
      }),

    setExecutionLogs: (logs) =>
      set((state) => {
        state.execution.logs = logs;
      }),

    updateExecutionStatus: (status) =>
      set((state) => {
        state.execution.status = status;
      }),

    setCurrentExecutionId: (id) =>
      set((state) => {
        state.execution.currentExecutionId = id;
      }),

    addExecutionLog: (log) =>
      set((state) => {
        state.execution.logs.push(log);
      }),

    // Actions needed by useExecuteWorkflow
    clearLogsConsole: () =>
      set((state) => {
        state.execution.logs = [];
      }),

    setMode: (mode) =>
      set((state) => {
        state.execution.mode = mode;
      }),

    displayLogsConsole: (visible) =>
      set((state) => {
        state.execution.logsConsoleVisible = visible;
      }),

    setPaginatedWorkflowExecutions: (executions, meta, action = 'replace') =>
      set((state) => {
        if (action === 'prepend') {
          state.execution.paginatedWorkflowExecutions = [...executions, ...state.execution.paginatedWorkflowExecutions];
        } else if (action === 'append') {
          state.execution.paginatedWorkflowExecutions = [...state.execution.paginatedWorkflowExecutions, ...executions];
        } else {
          state.execution.paginatedWorkflowExecutions = executions;
        }
        state.execution.paginatedWorkflowExecutionsMeta = meta;
      }),

    setPaginatedWorkflowExecutionNodes: (nodes, meta, action = 'replace') =>
      set((state) => {
        if (action === 'prepend') {
          state.execution.paginatedWorkflowExecutionNodes = [...nodes, ...state.execution.paginatedWorkflowExecutionNodes];
        } else if (action === 'append') {
          state.execution.paginatedWorkflowExecutionNodes = [...state.execution.paginatedWorkflowExecutionNodes, ...nodes];
        } else {
          state.execution.paginatedWorkflowExecutionNodes = nodes;
        }
      }),

    setSelectedWorkflowExecutionIndex: (index) =>
      set((state) => {
        state.execution.selectedWorkflowExecutionIndex = index;
      }),

    setExecutionId: (id) =>
      set((state) => {
        state.execution.currentExecutionId = id;
      }),
  },
});
