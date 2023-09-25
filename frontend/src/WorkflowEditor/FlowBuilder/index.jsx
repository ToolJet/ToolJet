import React, { useCallback, useRef, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Modal } from 'react-bootstrap';
import {
  ReactFlow,
  useReactFlow,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as addReactFlowEdge,
  Controls,
  // eslint-disable-next-line import/no-unresolved
} from 'reactflow';
import 'reactflow/dist/style.css';
import ifConditionNode from './Nodes/ifCondition';
import WorkflowEditorContext from '../context';
import { query } from '../reducer/defaults';
import './styles.scss';
import BlockOptions from './BlockOptions';
import CommonCustomNode from './Nodes/CommonCustomNode';
import ModalContent from './ModalContent';
import StartNode from './Nodes/StartNode';
import ResultNode from './Nodes/ResultNode';

const nodeTypes = { 'if-condition': ifConditionNode, query: CommonCustomNode, input: StartNode, output: ResultNode };

function FlowBuilder(_props) {
  const { project } = useReactFlow();
  const { editorSession, editorSessionActions, addQuery } = useContext(WorkflowEditorContext);
  const [showBlockOptions, setShowBlockOptions] = useState(false);
  const [selectedNode, setSelectedNode] = useState(false);

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

      if (event.target.className === 'react-flow__pane') {
        setShowBlockOptions({
          x,
          y,
          startingNodeId,
          startingNodeHandleId,
        });
        setEditingActivity({ type: 'IDLE' });
      } else if (
        startingNodeHandleId &&
        event.target.className.split(' ').includes('node-handle') &&
        event.target.className.split(' ').includes('target')
      ) {
        const newEdge = {
          id: uuidv4(),
          source: startingNodeId,
          target: event.target.dataset.nodeid,
          sourceHandle: startingNodeHandleId,
        };

        addEdge(newEdge);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingActivity.nodeId, setEditingActivity, project, addNode, addEdge]
  );

  const addNewNode = useCallback(
    (kind, dataSourceId, pluginId) => {
      const { x, y, startingNodeId, startingNodeHandleId } = showBlockOptions;
      setShowBlockOptions(null);
      if (kind === 'if') {
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
      } else {
        const _dataSourceId = dataSourceId === 'null' ? null : dataSourceId;
        const queryId = addQuery(kind, {}, _dataSourceId, pluginId);

        const newNode = {
          id: uuidv4(),
          position: project({ x, y }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // const onEdgesDelete = useCallback(
  //   (edge) => {
  //     removeEdge({ edge });
  //   },
  //   [removeEdge]
  // );

  const onNodeClick = useCallback((event, node) => {
    // only show modal if node is not input or output node
    if (node.type !== 'input' && node.type !== 'output') setSelectedNode(node);
  }, []);

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
        zoomActivationKeyCode={null}
        onMove={() => setShowBlockOptions(null)}
        onNodeClick={onNodeClick}
        onMouseDownCapture={editorSessionActions.hideLeftDrawer}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
      {showBlockOptions && (
        <BlockOptions
          onNewNode={addNewNode}
          editorSession={editorSession}
          onClose={() => setShowBlockOptions(null)}
          // give style so it renders on given clientx & client y
          style={{ left: showBlockOptions?.x, top: showBlockOptions?.y, position: 'absolute' }}
        />
      )}
      {
        <Modal className="show-node-modal" show={selectedNode} onHide={() => setSelectedNode(null)}>
          <ModalContent node={selectedNode} onClose={() => setSelectedNode(null)} />
        </Modal>
      }
    </div>
  );
}

export default FlowBuilder;
