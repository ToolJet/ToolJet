import React, { useContext } from 'react';
import './styles.scss';
import QueryNode from '../Nodes/Query';
import { CodeHinter } from '../../../Editor/CodeBuilder/CodeHinter';
import WorkflowEditorContext from '../../context';

function ModalContent({ node, darkMode }) {
  const { editorSessionActions } = useContext(WorkflowEditorContext);
  if (!node) return null;

  const renderNode =
    node.type === 'query' ? (
      <QueryNode data={node.data} id={node.id} />
    ) : (
      <div className="d-flex justify-content-center">
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
  return <div className="node-modal-content">{renderNode}</div>;
}
export default ModalContent;
