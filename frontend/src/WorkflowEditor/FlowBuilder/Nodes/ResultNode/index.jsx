import React, { useContext, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { Handle } from 'reactflow';
import AddThunder from '@assets/images/icons/add-thunder.svg';
import WorkflowEditorContext from '../../../context';
import { find } from 'lodash';
import './styles.scss';

function ResultNode(_props) {
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
