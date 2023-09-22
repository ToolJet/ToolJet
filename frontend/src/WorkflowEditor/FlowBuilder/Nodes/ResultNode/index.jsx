import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { Handle } from 'reactflow';
import AddThunder from '@assets/images/icons/add-thunder.svg';
import './styles.scss';

function ResultNode() {
  return (
    <div className="result-node-container">
      <AddThunder />
      <span>Result</span>
      <Handle type="target" position="left" isValidConnection={(_connection) => true} className="node-handle" />
    </div>
  );
}

export default ResultNode;
