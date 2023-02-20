import React, { useReducer, useEffect } from 'react';
import { appService, datasourceService } from '@/_services';
import { LeftSidebar } from './LeftSidebar';
import { reducer, initialState } from './reducer/reducer';
import FlowBuilder from './FlowBuilder';
import { ReactFlowProvider } from 'reactflow';
import { EditorContextWrapper } from '@/Editor/Context/EditorContextWrapper';
import generateActions from './actions';
import WorkflowEditorContext from './context';

import './style.scss';

// Wherever this file uses the term 'app', it means 'workflow'
export default function WorkflowEditor(props) {
  const { id: appId, versionId: appVersionId } = props.match.params;

  const [editorSession, dispatch] = useReducer(reducer, initialState({ appId, appVersionId }));

  const editorSessionActions = generateActions(dispatch);

  // This useEffect fetches the app, and then the corresponding datasources
  useEffect(() => {
    appService
      .getApp(editorSession.app.id)
      .then((appData) => {
        const versionId = appData.editing_version.id;
        editorSessionActions.setAppVersionId(versionId);
        return versionId;
      })
      .then((versionId) => {
        datasourceService.getAll(versionId).then((dataSourceData) => {
          editorSessionActions.setDataSources(dataSourceData.data_sources);
        });
      });
  }, []);

  console.log({ editorSession });

  return (
    <div className="workflow-editor">
      <div className="header"></div>
      <div className="body">
        <div className="left-sidebar-column">
          <LeftSidebar
            appId={editorSession.app.id}
            appVersionsId={editorSession.app.versionId}
            queryPanelHeight={200}
            dataSources={editorSession.dataSources}
          ></LeftSidebar>
        </div>
        <EditorContextWrapper>
          <div className="flow-editor-column">
            <ReactFlowProvider>
              <WorkflowEditorContext.Provider value={{ editorSession, editorSessionActions }}>
                <FlowBuilder
                  flow={editorSession.app.flow}
                  updateFlow={(flow) => dispatch({ type: 'UPDATE_FLOW', payload: { flow } })}
                  addNode={(node) => dispatch({ type: 'ADD_NEW_NODE', payload: { node } })}
                  addEdge={(edge) => dispatch({ type: 'ADD_NEW_EDGE', payload: { edge } })}
                  setEditingActivity={(editingActivity) =>
                    dispatch({ type: 'SET_FLOW_BUILDER_EDITING_ACTIVITY', payload: { editingActivity } })
                  }
                  editingActivity={editorSession.editingActivity}
                />
              </WorkflowEditorContext.Provider>
            </ReactFlowProvider>
          </div>
        </EditorContextWrapper>
      </div>
    </div>
  );
}
