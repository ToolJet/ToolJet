import React, { useContext } from 'react';
import './styles.scss';
import QueryNode from '../Nodes/Query';
import { CodeHinter } from '../../../Editor/CodeBuilder/CodeHinter';
import WorkflowEditorContext from '../../context';
import DeleteIcon from '@assets/images/icons/delete.svg';

function ModalContent({ node, darkMode, onClose }) {
  const { editorSession, editorSessionActions } = useContext(WorkflowEditorContext);
  const { updateFlow } = editorSessionActions;
  if (!node) return null;
  const { id } = node;

  const onNodeDelete = () => {
    const node = find(editorSession.app.flow.nodes, { id: id });
    const edges = editorSession.app.flow.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
    updateFlow({
      nodes: editorSession.app.flow.nodes.filter((node) => node.id !== id),
      edges,
    });
    onClose && onClose();
  };

  const renderNode =
    node.type === 'query' ? (
      <QueryNode data={node.data} id={node.id} />
    ) : (
      <div className="if-condition-modal-content d-flex justify-content-center">
        <span className="title">If condition</span>
        <CodeHinter
          currentState={{}}
          initialValue={node.data.code}
          mode="javascript"
          theme={darkMode ? 'monokai' : 'base16-light'}
          lineNumbers={false}
          height={120}
          width="275px"
          ignoreBraces={true}
          onChange={(code) => editorSessionActions.updateNodeData(node.id, { code })}
          isMultiLineJs={false}
          enablePreview={false}
        />
      </div>
    );
  return (
    <div className="node-modal-content">
      {renderNode}
      <DeleteIcon
        style={{ cursor: 'pointer', position: 'absolute', top: '12px', right: '12px' }}
        onClick={onNodeDelete}
      />
    </div>
  );
}
export default ModalContent;
