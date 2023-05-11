import React from 'react';
import './styles.scss';
import QueryNode from '../Nodes/Query';

function ModalContent({ node }) {
  if (!node) return null;

  return (
    <div className="node-modal-content">
      <QueryNode data={node.data} id={node.id} />
    </div>
  );
}

export default ModalContent;
