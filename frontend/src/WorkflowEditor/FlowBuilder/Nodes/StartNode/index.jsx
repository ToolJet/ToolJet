import React from 'react';
import { Handle } from 'reactflow';
import AddThunder from '@assets/images/icons/add-thunder.svg';
import './styles.scss';

function StartNode() {
  return (
    <div className="start-node-container">
      <AddThunder />
      <span>Start trigger</span>
      <Handle type="source" position="right" isValidConnection={(_connection) => true} className="node-handle" />
    </div>
  );
}

export default StartNode;
