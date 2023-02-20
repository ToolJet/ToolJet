import React, { useCallback, useRef, useMemo, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import WorkflowEditorContext from '../context';

function FlowBuilder(_props) {
  const { project } = useReactFlow();
  const { editorSession, editorSessionActions } = useContext(WorkflowEditorContext);

  const { editingActivity } = editorSession;
  const { nodes, edges } = editorSession.app.flow;

  const { updateFlow, addNode, addEdge, setEditingActivity } = editorSessionActions;

  const flowElement = useRef(null);

  const onNodesChange = useCallback(
    (changes) =>
      updateFlow({
        nodes: applyNodeChanges(changes, nodes),
        edges,
      }),
    [nodes, edges, updateFlow]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      updateFlow({
        nodes,
        edges: applyEdgeChanges(changes, edges),
      });
    },
    [nodes, edges, updateFlow]
  );

  const onConnectStart = useCallback(
    (_, { nodeId }) => {
      setEditingActivity({
        type: 'DRAWING_LINE_FROM_NODE',
        nodeId,
      });
    },
    [setEditingActivity]
  );

  // Here we add a new node
  const onConnectEnd = useCallback(
    (event) => {
      const startingNodeId = editingActivity.nodeId;
      setEditingActivity({ type: 'IDLE' });

      if (event.target.className === 'react-flow__pane') {
        const { top, left } = flowElement.current.getBoundingClientRect();
        const x = event.clientX - left - 75;
        const y = event.clientY - top;

        const newNode = {
          id: uuidv4(),
          position: project({ x, y }),
        };

        const newEdge = {
          id: uuidv4(),
          source: startingNodeId,
          target: newNode.id,
        };

        addNode(newNode);
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

  const nodeTypes = useMemo(() => ({ query: QueryNode }), []);

  return (
    <div style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onConnect={onConnect}
        ref={flowElement}
        nodeTypes={nodeTypes}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

export default FlowBuilder;
