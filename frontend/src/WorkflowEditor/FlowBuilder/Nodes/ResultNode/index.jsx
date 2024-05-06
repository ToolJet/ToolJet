import React, { useContext, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { Handle } from 'reactflow';
import AddThunder from '@assets/images/icons/add-thunder.svg';
import WorkflowEditorContext from '../../../context';
import { find } from 'lodash';
import './styles.scss';

function ResultNode(props) {
  const { editorSession, editorSessionActions } = useContext(WorkflowEditorContext);
  const { updateNodeData } = editorSessionActions;

  const fxActive = props.data?.fxActive ?? false;

  useEffect(() => {
    if (!fxActive) {
      const incomingEdges = editorSession.app.flow.edges.filter((edge) => edge.target === props.id);
      const incomingQueryNodes = incomingEdges
        .map((edge) => find(editorSession.app.flow.nodes, { id: edge.source }))
        .filter((node) => node.type === 'query');
      const incomingQueryNames = incomingQueryNodes.map(
        (node) => find(editorSession.queries, { idOnDefinition: node.data.idOnDefinition })?.name
      );
      updateNodeData(props.id, { code: `return ({\n ${incomingQueryNames.join(',\n ')}\n})` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(editorSession.app.flow.edges.filter((edge) => edge.target === props.id).map((edge) => edge.id))]);

  return (
    <div className="result-node-container">
      <AddThunder />
      <span>Result</span>
      <Handle
        type="target"
        position="left"
        isValidConnection={(_connection) => true}
        className="node-handle"
        isConnectable={true}
      />
    </div>
  );
}

export default ResultNode;
