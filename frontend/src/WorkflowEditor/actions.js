export default function generateActions(dispatch) {
  return {
    setAppName: (name) => dispatch({ type: 'SET_APP_NAME', payload: { name } }),
    setMode: (mode) => dispatch({ type: 'SET_MODE', payload: { mode } }),
    setAppVersionId: (versionId) => dispatch({ type: 'SET_APP_VERSION_ID', payload: { versionId } }),
    setDataSources: (dataSources) => dispatch({ type: 'SET_DATA_SOURCES', payload: { dataSources } }),
    updateFlow: (flow) => dispatch({ type: 'UPDATE_FLOW', payload: { flow } }),
    updateNodes: (nodes) => dispatch({ type: 'UPDATE_NODES', payload: { nodes } }),
    updateEdges: (edges) => dispatch({ type: 'UPDATE_EDGES', payload: { edges } }),
    addNode: (node) => dispatch({ type: 'ADD_NEW_NODE', payload: { node, type: 'query' } }),
    addIfConditionNode: (node) => dispatch({ type: 'ADD_NEW_NODE', payload: { node, type: 'if' } }),
    updateNodeData: (id, data, rest = {}) => dispatch({ type: 'UPDATE_NODE', payload: { id, data, rest } }),
    addEdge: (edge) => dispatch({ type: 'ADD_NEW_EDGE', payload: { edge } }),
    removeEdge: (edge) => dispatch({ type: 'REMOVE_EDGE', payload: { edge } }),
    setMaintenanceStatus: (status) => dispatch({ type: 'SET_MAINTENANCE_STATUS', payload: { status } }),
    setEditingActivity: (editingActivity) =>
      dispatch({ type: 'SET_FLOW_BUILDER_EDITING_ACTIVITY', payload: { editingActivity } }),
    setAppSavingStatus: (status) => dispatch({ type: 'SET_APP_SAVING_STATUS', payload: { status } }),
    addQuery: (query) => dispatch({ type: 'ADD_NEW_QUERY', payload: { query } }),
    updateQuery: (id, query) => dispatch({ type: 'UPDATE_QUERY', payload: { id, query } }),
    setQueries: (queries) => dispatch({ type: 'SET_QUERIES', payload: { queries } }),
    setBootupComplete: (status) => dispatch({ type: 'SET_BOOTUP_COMPLETE', payload: { status } }),
    setExecutionId: (id) => dispatch({ type: 'SET_EXECUTION_ID', payload: { id } }),
    updateExecutionStatus: (nodes) => dispatch({ type: 'UPDATE_EXECUTION_STATUS', payload: { nodes } }),
    storeExecutionStatusCheckerIntervalHandle: (handle) =>
      dispatch({ type: 'STORE_EXECUTION_STATUS_CHECKER_INTERVAL_HANDLE', payload: { handle } }),
    setExecutionHistoryLoadingStatus: (status) =>
      dispatch({ type: 'SET_EXECUTION_HISTORY_LOADING_STATUS', payload: { status } }),
    setExecutionHistory: (history) => dispatch({ type: 'SET_EXECUTION_HISTORY', payload: { history } }),
    setExecutionLogs: (logs) => dispatch({ type: 'SET_EXECUTION_LOGS', payload: { logs } }),
    toggleLeftDrawer: () => dispatch({ type: 'TOGGLE_LEFT_DRAWER' }),
    hideLeftDrawer: () => dispatch({ type: 'HIDE_LEFT_DRAWER' }),
    toggleLogsConsole: () => dispatch({ type: 'TOGGLE_LOGS_CONSOLE' }),
    displayLogsConsole: (display) => dispatch({ type: 'DISPLAY_LOGS_CONSOLE', payload: { display } }),
    showHistoricalLogs: (executionId) => dispatch({ type: 'SHOW_HISTORICAL_LOGS', payload: { executionId } }),
    clearLogsConsole: () => dispatch({ type: 'CLEAR_LOGS_CONSOLE' }),
  };
}
