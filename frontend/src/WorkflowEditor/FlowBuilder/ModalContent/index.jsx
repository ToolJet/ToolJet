import React from 'react';
import './styles.scss';
import QueryNode from '../Nodes/Query';
import IfConditionNode from '../Nodes/ifCondition';

function ModalContent({ node }) {
  if (!node) return null;

  const renderNode =
    node.type === 'query' ? (
      <QueryNode data={node.data} id={node.id} />
    ) : (
      <IfConditionNode data={node.data} id={node.id} showHandles={false} />
    );
  return <div className="node-modal-content">{renderNode}</div>;
}

export default ModalContent;
