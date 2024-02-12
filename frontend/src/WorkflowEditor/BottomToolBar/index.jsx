import React,{useContext, useEffect} from 'react'
import './style.scss'
import Play from '@/_ui/Icon/solidIcons/Play'
import Logs from './icons/logs.svg'
import SolidIcon from '@/_ui/Icon/SolidIcons'
import WorkflowEditorContext from '../context'
import { Modes } from '../reducer/reducer'
import CustomButtons from './ReactFlow/CustomButtons'

function ToolBar({controls, executeWorkflow}) {
    const { editorSession, editorSessionActions } = useContext(WorkflowEditorContext);
    //const source = editorSession?.queries[editorSession?.queries.length-1]
    //const queryData = find(editorSession.queries, { idOnDefinition: source.idOnDefinition });
    const isRunnable = editorSession.queries && editorSession.queries.length > 0;
    const logs = editorSession.logsConsole.logs;

    const defaultToolboxStyle = {
        width: '315px',
        padding: '14px',
        backgroundColor: 'white',
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        marginLeft : '-150px',
        transform: 'translateY(-50%)',
        boxShadow: '0px 32px 64px -12px rgba(0, 0, 0, 0.20)',
        zIndex: 5,
        border: '1px solid var(--slate7)',
        borderRadius: '6px',
      };

      const withDisplayToolboxStyle = {
        width: '315px',
        padding: '14px',
        backgroundColor: 'white',
        position: 'absolute',
        bottom: '280px',
        left: '50%',
        marginLeft : '-150px',
        transform: 'translateY(-50%)',
        boxShadow: '0px 32px 64px -12px rgba(0, 0, 0, 0.20)',
        zIndex: 5,
        border: '1px solid var(--slate7)',
        borderRadius: '6px',
      };

    const toolboxStyle = editorSession.logsConsole.display === true ? withDisplayToolboxStyle : defaultToolboxStyle

    // const source = editorSession?.queries[editorSession?.queries.length-1]
    // const commonObject = editorSession.dataSources.find(obj1 => obj1?.kind === source?.data_source?.kind);

    // const handleUndo = () => {
    //   const undoElments = [...editorSession.stateHistory]
    //   editorSessionActions.setUndo(undoElments[undoElments.length-1])
    // }

    // const handleRedo = () => {
    //   const undoElments = [...editorSession.stateFuture]
    //   editorSessionActions.setRedo(undoElments[0])
    // }

    // const isDisabledHistory = editorSession.stateHistory.length > 0 ? false : true
    // const isDisabledFuture = editorSession.stateFuture.length > 0 ? false : true

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
     <CustomButtons/>
     {/* {controls} */}
     </div>

     {/* <div className='workflow-undo-redo'>
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
      </div> */}

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