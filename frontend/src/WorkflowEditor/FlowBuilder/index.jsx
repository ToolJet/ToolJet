import React, { useCallback, useRef, useMemo, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Modal, Button } from 'react-bootstrap';
import {
  ReactFlow,
  useReactFlow,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as addReactFlowEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import QueryNode from './node-types/QueryNode';
import ifCondition from './node-types/IfConditionNode';
import WorkflowEditorContext from '../context';
import { query } from '../reducer/defaults';
import './styles.scss';

function FlowBuilder(_props) {
  const { project } = useReactFlow();
  const { editorSession, editorSessionActions, addQuery } = useContext(WorkflowEditorContext);
  const [showBlockOptions, setShowBlockOptions] = useState(false);

  const { editingActivity } = editorSession;
  const { nodes, edges } = editorSession.app.flow;

  const { updateFlow, updateNodes, updateEdges, addNode, addIfConditionNode, addEdge, setEditingActivity, removeEdge } =
    editorSessionActions;

  const flowElement = useRef(null);

  const onNodesChange = useCallback((changes) => updateNodes(applyNodeChanges(changes, nodes)), [nodes, updateNodes]);

  const onEdgesChange = useCallback(
    (changes) => {
      updateEdges(applyEdgeChanges(changes, edges));
    },
    [edges, updateEdges]
  );

  const onConnectStart = useCallback(
    (_, { nodeId, handleId }) => {
      setEditingActivity({
        type: 'DRAWING_LINE_FROM_NODE',
        nodeId,
        handleId,
      });
    },
    [setEditingActivity]
  );

  // Here we add a new node
  const onConnectEnd = useCallback(
    (event) => {
      const { top, left } = flowElement.current.getBoundingClientRect();
      const x = event.clientX - left - 75;
      const y = event.clientY - top;
      const startingNodeId = editingActivity.nodeId;
      const startingNodeHandleId = editingActivity.handleId;
      setShowBlockOptions({ x, y, startingNodeId, startingNodeHandleId });
      setEditingActivity({ type: 'IDLE' });

      if (event.target.className === 'react-flow__pane') {
        // const nodeType = prompt('Node type (Query/If):', 'Query');
        // setShowBlockOptions({ x, y });
      }
    },
    [editingActivity.nodeId, setEditingActivity, project, addNode, addEdge]
  );

  const addNewNode = useCallback(
    (nodeType) => {
      const { x, y, startingNodeId, startingNodeHandleId } = showBlockOptions;
      setShowBlockOptions(null);
      if (nodeType === 'Query') {
        const queryId = addQuery();

        const newNode = {
          id: uuidv4(),
          position: project({ x, y }),
          data: {
            ...query(queryId),
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
      } else if (nodeType === 'If') {
        const newNode = {
          id: uuidv4(),
          position: project({ x, y }),
        };

        const newEdge = {
          id: uuidv4(),
          source: startingNodeId,
          target: newNode.id,
          sourceHandle: startingNodeHandleId,
        };

        addIfConditionNode(newNode);
        addEdge(newEdge);
      }
    },
    [editingActivity.nodeId, setEditingActivity, project, addNode, addEdge]
  );

  const onConnect = useCallback(
    (params) => {
      updateFlow({
        nodes,
        edges: addReactFlowEdge(params, edges),
      });
    },
    [edges, nodes, updateFlow]
  );

  const onNodeDragStart = useCallback(() => {
    setEditingActivity({
      type: 'DRAGGING_NODE',
    });
  }, [setEditingActivity]);

  const onNodeDragStop = useCallback(() => {
    setEditingActivity({
      type: 'IDLE',
    });
  }, [setEditingActivity]);

  const onEdgesDelete = useCallback(
    (edge) => {
      removeEdge({ edge });
    },
    [removeEdge]
  );

  const nodeTypes = useMemo(() => ({ query: QueryNode, 'if-condition': ifCondition }), []);

  return (
    <div style={{ height: '100%' }}>
      <ReactFlow
        className="flow-canvas"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        // onEdgesDelete={onEdgesDelete}
        ref={flowElement}
        nodeTypes={nodeTypes}
        zoomOnPinch={false}
        zoomOnScroll={false}
        panOnScroll={true}
        zoomOnDoubleClick={false}
      >
        <Background />
      </ReactFlow>
      <Modal show={showBlockOptions} onHide={() => setShowBlockOptions(false)} className="transparent-modal">
        <Modal.Body>This is a modal.</Modal.Body>
        <Modal.Footer>
          {/* <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Save Changes
          </Button> */}
          <Button variant="primary" onClick={() => addNewNode('Query')}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default FlowBuilder;
