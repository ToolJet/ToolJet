import React,{useContext, useEffect} from 'react'
import './style.scss'
import Play from '@/_ui/Icon/solidIcons/Play'
import Logs from './icons/logs.svg'
import SolidIcon from '@/_ui/Icon/SolidIcons'
import WorkflowEditorContext from '../context'
import { Modes } from '../reducer/reducer'
import { v4 as uuidv4 } from 'uuid';
import { generateQueryName } from '../utils';
import { capitalize, isUndefined, find } from 'lodash';
import {
  dataqueryService,
} from '@/_services';

function ToolBar({controls, executeWorkflow, debouncedSave}) {
    const { editorSession, editorSessionActions, addQuery } = useContext(WorkflowEditorContext);
    const source = editorSession?.queries[editorSession?.queries.length-1]
    //const queryData = find(editorSession.queries, { idOnDefinition: source.idOnDefinition });
    const isRunnable = editorSession.queries && editorSession.queries.length > 0;
    const logs = editorSession.logsConsole.logs;

    const defaultToolboxStyle = {
        width: '400px',
        padding: '14px',
        backgroundColor: 'white',
        position: 'absolute',
        bottom: '50px',
        left: '36%',
        boxShadow: '0px 32px 64px -12px rgba(0, 0, 0, 0.20)',
        zIndex: 5,
        border: '1px solid var(--slate7)',
        borderRadius: '6px',
      };

      const withDisplayToolboxStyle = {
        width: '400px',
        padding: '14px',
        backgroundColor: 'white',
        position: 'absolute',
        bottom: '300px',
        left: '36%',
        boxShadow: '0px 32px 64px -12px rgba(0, 0, 0, 0.20)',
        zIndex: 5,
        border: '1px solid var(--slate7)',
        borderRadius: '6px',
      };

    const toolboxStyle = editorSession.logsConsole.display === true ? withDisplayToolboxStyle : defaultToolboxStyle

        // const source = editorSession?.queries[editorSession?.queries.length-1]
        // const commonObject = editorSession.dataSources.find(obj1 => obj1?.kind === source?.data_source?.kind);

        //console.log('source', queryData)
        //  const addQuery = (kind, options = {}, dataSourceId = undefined, pluginId = undefined, idOnDefinition) => {
        //   //const idOnDefinition = uuidv4();
        //   const name = generateQueryName(kind, editorSession?.queries);
        //   //editorSessionActions.addQuery({ idOnDefinition, kind, options, dataSourceId, pluginId }, editorSession);
      
        //   dataqueryService
        //     .create(editorSession.app.id, editorSession.app.versionId, name, kind, options, dataSourceId, pluginId)
        //     .then((query) => {
        //       console.log('updating query', query);
        //       editorSessionActions.updateQuery(idOnDefinition, query);
        //     });
      
        //   return idOnDefinition;
        // };

    const handleUndo = () => {
      const undoElments = [...editorSession.stateHistory]
      editorSessionActions.setUndo(undoElments[undoElments.length-1])
      //addQuery(source?.kind, source?.id, source?.plugin_id)
    }

    // useEffect(() => {
    //   editorSession.bootupComplete && debouncedSave(editorSession, editorSessionActions);
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    //   JSON.stringify({
    //     nodeData: editorSession.app?.flow.nodes.map((node) => [node.data, node.position]),
    //     edgeData: editorSession.app?.flow.edges.map((edge) => [edge.source, edge.target]),
    //     queries: editorSession.queries,
    //   }),
    // ]);

    const handleRedo = () => {
      const undoElments = [...editorSession.stateFuture]
      editorSessionActions.setRedo(undoElments[0])
    }

    const isDisabledHistory = editorSession.stateHistory.length > 0 ? false : true
    const isDisabledFuture = editorSession.stateFuture.length > 0 ? false : true

  return (
    <div style={{width:'100%'}}>
    <div style={toolboxStyle} className='toolbar-box d-flex align-items-center justify-content-start'>

     <div className='workflow-run-btn'>
     <button 
     disabled={editorSession.mode === Modes.Running || !isRunnable || !editorSession.maintenance} 
     className={`border-0 default-secondary-button`}
     onClick={executeWorkflow}
     >
          <span>
            <Play width={14} fill="var(--indigo9)" viewBox="0 0 14 14" />
          </span>
          <span className="query-manager-btn-name">{editorSession.mode === Modes.Running ? '' : 'Run'}</span>
    </button>
     </div>

     <div className='logs-show-btn'>
     <button
    className={`workflows-log-main-btn`}
    onClick={editorSessionActions.toggleLogsConsole}
    >
          <span>
            <Logs width={14} />
          </span>
          <span className="workflows-logs-btn-name">{'Logs'}</span>
    </button>
     </div>

     <div className='rf-controls-btns'>
     {controls}
     </div>

     <div className='workflow-undo-redo'>
     <div className="undo-redo-container">
        <button
          className={isDisabledHistory ? 'disabled-icon tj-ghost-black-btn' : 'tj-ghost-black-btn'}
          onClick={handleUndo}
          disabled={isDisabledHistory}
        >
          <SolidIcon
            width="17"
            height="17"
            viewBox="0 0 16 16"
            name="arrowforwardup"
          />
        </button>
        <button
           className={isDisabledFuture ? 'disabled-icon tj-ghost-black-btn' : 'tj-ghost-black-btn'}
           onClick={handleRedo}
           disabled={isDisabledFuture}
        >
          <SolidIcon
            width="17"
            height="17"
            viewBox="0 0 16 16"
            name="arrowbackup"
          />
        </button>
      </div>
      </div>

    </div>

    {editorSession.logsConsole.display && (
        <div className="logs-console">
          {Array.isArray(logs) &&
            logs.map((log, index) => (
              <span key={index}>
                {JSON.stringify(log)}
                <br />
              </span>
            ))}
        </div>
      )}

    </div>
    
  )
}

export default ToolBar