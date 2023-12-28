import React, { useContext } from 'react';
// eslint-disable-next-line import/no-unresolved
import { Handle } from 'reactflow';
import AddThunder from '@assets/images/icons/add-thunder.svg';
import './styles.scss';
import WorkflowEditorContext from '@/WorkflowEditor/context';

function StartNode() {
  const { editorSession } = useContext(WorkflowEditorContext);
  return (
    <div className="bg-white rounded">
      <div className="start-node-container">
        <AddThunder />
        <span>Start trigger</span>
        <Handle
          type="source"
          position="right"
          isValidConnection={(_connection) => true}
          className="node-handle"
          style={{ top: '26px' }}
        />
      </div>
      <div>
        {editorSession?.webhookEnable?.value && (
          <div className="bg-white rounded p-2 shadow-sm " style={{ width: '100%' }}>
            <p className="text-start font-weight-medium mb-1">TRIGGERS</p>
            <div className="d-flex align-items-center justify-content-between">
              <p className="mb-0"> Webhook</p>
              <p className="mb-0">(1)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StartNode;
