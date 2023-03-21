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
import { query } from '../reducer/defaults';

function FlowBuilder(_props) {
  const { project } = useReactFlow();
  const { editorSession, editorSessionActions, addQuery } = useContext(WorkflowEditorContext);

  const { editingActivity } = editorSession;
  const { nodes, edges } = editorSession.app.flow;
  console.log('yepski', nodes);

  const { updateFlow, updateNodes, updateEdges, addNode, addEdge, setEditingActivity, removeEdge } =
    editorSessionActions;

  const flowElement = useRef(null);

  const onNodesChange = useCallback(
    (changes) => {
      updateNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, updateNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      updateEdges(applyEdgeChanges(changes, edges));
    },
    [edges, updateEdges]
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

  const nodeTypes = useMemo(() => ({ query: QueryNode }), []);

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
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

export default FlowBuilder;
