import React, { useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { useReactFlow } from 'reactflow';
import WorkflowEditorContext from '../../../context';
import BlockOptions from '../../BlockOptions';
import { query } from '../../../reducer/defaults';

import './styles.scss';

const PortalModalOptions = ({ addNewNode, editorSession, showBlockOptions, setShowBlockOptions }) => {
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <BlockOptions
        onNewNode={addNewNode}
        editorSession={editorSession}
        onClose={() => setShowBlockOptions(null)}
        // give style so it renders on given clientx & client y
        style={{ left: showBlockOptions.x, top: showBlockOptions.y, position: 'absolute' }}
      />
    </div>,
    document.body
  );
};

function AddBlock({ nodeData }) {
  const { xPos: x, yPos: y, id: startingNodeId, handleId: startingNodeHandleId } = nodeData;
  const { project } = useReactFlow();
  //   console.log('position', position);
  const { editorSession, editorSessionActions, addQuery } = useContext(WorkflowEditorContext);
  const [showBlockOptions, setShowBlockOptions] = useState(false);

  const { editingActivity } = editorSession;
  const { nodes, edges } = editorSession.app.flow;

  const { updateFlow, updateNodes, updateEdges, addNode, addIfConditionNode, addEdge, setEditingActivity, removeEdge } =
    editorSessionActions;
  const addNewNode = useCallback(
    (kind) => {
      setShowBlockOptions(null);
      if (kind === 'if') {
        const newNode = {
          id: uuidv4(),
          position: project({ x: x + 400, y }),
        };

        const newEdge = {
          id: uuidv4(),
          source: startingNodeId,
          target: newNode.id,
          sourceHandle: startingNodeHandleId,
        };

        addIfConditionNode(newNode);
        addEdge(newEdge);
      } else {
        const queryId = addQuery(kind);

        const newNode = {
          id: uuidv4(),
          position: project({ x: x + 400, y }),
          data: {
            ...query(queryId, kind),
          },
        };
        const newEdge = {
          id: uuidv4(),
          source: startingNodeId,
          target: newNode.id,
          sourceHandle: startingNodeHandleId,
        };
        addNode(newNode);
        addEdge(newEdge);
      }
    },
    [editingActivity.nodeId, setEditingActivity, project, addNode, addEdge]
  );
  return (
    <div className="add-block">
      <div
        onClick={() => setShowBlockOptions({ x: x + 400, y: y })}
        className="handle-plus"
        // style={{ width: 12, height: 12 }}
      >
        +
      </div>
      {showBlockOptions && (
        <PortalModalOptions
          addNewNode={addNewNode}
          editorSession={editorSession}
          showBlockOptions={showBlockOptions}
          setShowBlockOptions={setShowBlockOptions}
        />
      )}
    </div>
  );
}

export default AddBlock;
