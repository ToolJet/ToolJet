import React from 'react';
import { Handle } from 'reactflow';
import AddThunder from '@assets/images/icons/add-thunder.svg';
import './styles.scss';

function StartNode() {
  return (
    <div className="start-node-container">
      <AddThunder />
      <span>Start trigger</span>
      <Handle
        type="source"
        position="right"
        isValidConnection={(_connection) => true}
        style={{
          right: -10,
          top: 43,
          background: '#555',
          width: 28,
          height: 28,
          borderRadius: 4,
          placeItems: 'center',
          display: 'grid',
          color: '#fff',
          zIndex: 2,
          backgroundColor: '#3E63DD',
        }}
      >
        <div className="handle" style={{ width: 12, height: 12, pointerEvents: 'none' }}>
          +
        </div>
      </Handle>
    </div>
  );
}

export default StartNode;
