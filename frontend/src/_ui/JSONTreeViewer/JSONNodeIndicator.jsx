import React from 'react';

const JSONTreeNodeIndicator = ({ toExpand, toShowNodeIndicator, handleToggle, ...restProps }) => {
  const {
    renderCustomIndicator,
    typeofCurrentNode,
    currentNode,
    isSelected,
    toExpandNode,
    data,
    path,
    toExpandWithLabels,
    toggleWithLabels,
  } = restProps;

  const defaultStyles = {
    transform: toExpandNode && toExpand ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: '0.2s all',
    display: 'inline-block',
    cursor: 'pointer',
  };

  const handleToggleForNode = () => {
    if (toExpandWithLabels) {
      return toggleWithLabels(data, currentNode, path);
    }

    return handleToggle(currentNode);
  };

  const renderDefaultIndicator = () => (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.02063 1L5.01032 5.01028L1.00003 8.99997"
        stroke={`${toExpand && isSelected ? '#4D72FA' : '#61656F'}`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!toShowNodeIndicator && (typeofCurrentNode !== 'Object' || typeofCurrentNode !== 'Array')) return null;

  return (
    <React.Fragment>
      <span className="json-tree-node-icon" onClick={handleToggleForNode} style={defaultStyles}>
        {renderCustomIndicator ? renderCustomIndicator() : renderDefaultIndicator()}
      </span>
    </React.Fragment>
  );
};

export default JSONTreeNodeIndicator;
