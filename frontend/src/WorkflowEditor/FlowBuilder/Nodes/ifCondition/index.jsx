import React, { useContext } from 'react';
import { Handle, Position } from 'reactflow';
import { CodeHinter } from '../../../../Editor/CodeBuilder/CodeHinter';
import WorkflowEditorContext from '../../../context';

import './styles.scss';

export default function IfConditionNode(props) {
  const { width, height, id, data: nodeData } = props;

  const { editorSessionActions } = useContext(WorkflowEditorContext);

  return (
    <div className="if-condition-node" style={{ width, height }}>
      <Handle
        type="target"
        position={Position.Left}
        isValidConnection={(connection) => connection.source === 'some-id'}
        onConnect={(params) => console.log('handle onConnect', params)}
        style={{ background: '#000' }}
      />
      <Handle
        id="true"
        type="source"
        position={Position.Top}
        isValidConnection={(connection) => connection.source === 'some-id'}
        onConnect={(params) => console.log('handle onConnect', params)}
        style={{ background: '#000' }}
      />
      <div className="grid main-grid">
        <div className="row">
          <div className="col-12 d-flex flex-column" style={{ justifyContent: 'space-between' }}>
            <div className="d-flex justify-content-center">True</div>
            <div className="d-flex justify-content-center">
              <CodeHinter
                currentState={{}}
                initialValue={nodeData.code}
                mode="javascript"
                theme={props.darkMode ? 'monokai' : 'base16-light'}
                lineNumbers={false}
                height={35}
                width="275px"
                ignoreBraces={true}
                onChange={(code) => editorSessionActions.updateNodeData(id, { code })}
                isMultiLineJs={false}
                enablePreview={false}
              />
            </div>
            <div className="d-flex justify-content-center">False</div>
          </div>
        </div>
      </div>
      <Handle
        id="false"
        type="source"
        position={Position.Bottom}
        isValidConnection={(connection) => connection.source === 'some-id'}
        onConnect={(params) => console.log('handle onConnect', params)}
        style={{ background: '#000' }}
      />
    </div>
  );
}
