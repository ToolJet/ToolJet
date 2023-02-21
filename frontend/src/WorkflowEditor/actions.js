export default function generateActions(dispatch) {
  return {
    setAppVersionId: (versionId) => dispatch({ type: 'SET_APP_VERSION_ID', payload: { versionId } }),
    setDataSources: (dataSources) => dispatch({ type: 'SET_DATA_SOURCES', payload: { dataSources } }),
    updateFlow: (flow) => dispatch({ type: 'UPDATE_FLOW', payload: { flow } }),
    addNode: (node) => dispatch({ type: 'ADD_NEW_NODE', payload: { node } }),
    updateNodeData: (id, data) => dispatch({ type: 'UPDATE_NODE', payload: { id, data } }),
    addEdge: (edge) => dispatch({ type: 'ADD_NEW_EDGE', payload: { edge } }),
    setEditingActivity: (editingActivity) =>
      dispatch({ type: 'SET_FLOW_BUILDER_EDITING_ACTIVITY', payload: { editingActivity } }),
    setAppSavingStatus: (status) => dispatch({ type: 'SET_APP_SAVING_STATUS', payload: { status } }),
  };
}
