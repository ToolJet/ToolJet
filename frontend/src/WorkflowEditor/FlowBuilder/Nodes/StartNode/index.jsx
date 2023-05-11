import React from 'react';
import { Handle } from 'reactflow';
import AddThunder from '@assets/images/icons/add-thunder.svg';
import './styles.scss';
import AddBlock from '../AddBlock';

const handlerStyle = {
  right: -30,
  top: 25,
  background: '#555',
  width: 28,
  height: 28,
  borderRadius: 4,
  placeItems: 'center',
  display: 'grid',
  color: '#fff',
  zIndex: 2,
  backgroundColor: '#3E63DD',
};

function StartNode(props) {
  return (
    <div className="start-node-container">
      <AddThunder />
      <span>Start trigger</span>
      <Handle type="source" position="right" isValidConnection={(_connection) => true} />
      <AddBlock nodeData={props} />
    </div>
  );
}

export default StartNode;
