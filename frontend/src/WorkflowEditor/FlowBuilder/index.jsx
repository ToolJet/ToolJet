import React from 'react';
import ReactFlow, { Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

function FlowBuilder(props) {
  const { nodes, connections: edges } = props.flow;
  return (
    <div style={{ height: '100%' }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default FlowBuilder;
