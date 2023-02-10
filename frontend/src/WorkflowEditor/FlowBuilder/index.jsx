import React, { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactFlow, { useReactFlow, Background, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

function FlowBuilder(props) {
  const { project } = useReactFlow();
  const { editingActivity } = props;
  const { nodes, edges } = props.flow;
  const { updateFlow, addNode, addEdge, setEditingActivity } = props;

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
    (changes) =>
      updateFlow({
        nodes,
        edges: applyEdgeChanges(changes, edges),
      }),
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
          data: {
            label: 'Query',
          },
        };

        const newEdge = {
          source: startingNodeId,
          target: newNode.id,
        };

        console.log({ newEdge });

        addNode(newNode);
        addEdge(newEdge);
      }
    },
    [addNode, project]
  );

  return (
    <div style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        ref={flowElement}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

export default FlowBuilder;
