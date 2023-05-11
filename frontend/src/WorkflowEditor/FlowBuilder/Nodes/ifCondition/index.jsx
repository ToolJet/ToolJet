import React, { useContext } from 'react';
import { Handle, Position } from 'reactflow';
import IfIcon from '../../../../../assets/images/icons/if.svg';
import { find } from 'lodash';
import './styles.scss';

import WorkflowEditorContext from '../../../context';
import DataSourceIcon from '../../DataSourceIcon';

function IfConditionNode(props) {
  const { editorSession, updateQuery } = useContext(WorkflowEditorContext);
  const { width, height, id, data: nodeData } = props;

  return (
    <div className="common-custom-node">
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
        style={{ background: 'green' }}
      />
      <IfIcon />
      <span>If condition</span>
      <Handle
        id="false"
        type="source"
        position={Position.Bottom}
        isValidConnection={(connection) => connection.source === 'some-id'}
        onConnect={(params) => console.log('handle onConnect', params)}
        style={{ background: 'red' }}
      />
    </div>
  );
}

export default IfConditionNode;
