import React, { useContext } from 'react';
import './styles.scss';
import QueryNode from '../Nodes/Query';
import IfConditionNodeConfiguration from './IfConditionNodeConfiguration';
import ResponseNodeConfiguration from './ResponseNodeConfiguration';
import WorkflowEditorContext from '../../context';
import DeleteIcon from '@assets/images/icons/delete.svg';
import { dataqueryService } from '@/_services';

function ModalContent({ node, darkMode, onClose }) {
  const { editorSession, editorSessionActions } = useContext(WorkflowEditorContext);
  const { updateFlow, setQueries } = editorSessionActions;
  if (!node) return null;
  const { id } = node;

  const onNodeDelete = () => {
    const shouldDelete = window.confirm('Are you sure you want to delete this node?');
    if (!shouldDelete) return;
    const edges = editorSession.app.flow.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
    updateFlow({
      nodes: editorSession.app.flow.nodes.filter((node) => node.id !== id),
      edges,
    });
    const queryIdToDelete = editorSession.queries.find(
      (query) => query.idOnDefinition === node.data.idOnDefinition
    )?.id;
    // delete the query on the backend.
    dataqueryService.del(queryIdToDelete);
    // update the new queries in the editor session/redux store
    setQueries(
      editorSession.queries.filter((query) => query.idOnDefinition !== node.data.idOnDefinition),
      editorSession
    );
    onClose && onClose();
  };

  let renderNode;

  switch (node.type) {
    case 'query':
      renderNode = <QueryNode data={node.data} id={node.id} selectedNode={node} />;
      break;
    case 'if-condition':
      renderNode = (
        <IfConditionNodeConfiguration node={node} darkMode={darkMode} editorSessionActions={editorSessionActions} />
      );
      break;
    case 'output':
      renderNode = (
        <ResponseNodeConfiguration node={node} darkMode={darkMode} editorSessionActions={editorSessionActions} />
      );
      break;
  }
  return (
    <div className="node-modal-content">
      {renderNode}
      {node.type != 'output' && (
        <DeleteIcon
          style={{
            cursor: 'pointer',
            position: 'absolute',
            top: '34px',
            right: '28px',
          }}
          onClick={onNodeDelete}
        />
      )}
    </div>
  );
}
export default ModalContent;
