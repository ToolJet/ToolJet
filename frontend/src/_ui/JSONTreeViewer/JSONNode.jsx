import React from 'react';
import _ from 'lodash';

export const JSONNode = ({ data, shouldExpandNode, currentNode, getCurrentPath, ...restProps }) => {
  const { path } = restProps;

  const [expandable, set] = React.useState(() =>
    typeof shouldExpandNode === 'function' ? shouldExpandNode(path, data) : shouldExpandNode
  );

  const toggleExpandNode = () => set((prev) => !prev);

  const currentNodePath = getCurrentPath(path, currentNode);
  const toExpandNode = _.isArray(data) || _.isObject(data);

  let $VALUE = null;
  let $NODEType = null;
  const typeofCurrentNode = typeof data;

  switch (typeofCurrentNode) {
    case 'string':
      $VALUE = <JSONTreeStringNode data={data} />;
      $NODEType = 'string';

      break;
    default:
      $VALUE = 'Default';
      $NODEType = 'Default';
  }

  return (
    <div className="row">
      <div className="col-md-1">
        <JSONNode.NodeIndicator
          toExpand={expandable}
          toShowJSONNOde={toExpandNode}
          handleToggle={toggleExpandNode}
          {...restProps}
        />
      </div>
      <div className="col">
        <div className="row">
          <div className="json-tree-node-label col">{$NODEType}</div>
          <div className="json-tree-node-value col">{$VALUE}</div>
        </div>
      </div>
    </div>
  );
};

const JSONTreeNodeIndicator = ({ toExpand, toShowJSONNOde, handleToggle, ...restProps }) => {
  const { renderCustomIndicator } = restProps;

  const defaultStyles = {
    transform: toExpand ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: '0.2s all',
    display: 'inline-block',
    cursor: 'pointer',
  };

  const renderDefaultIndicator = () => (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.02063 1L5.01032 5.01028L1.00003 8.99997"
        stroke="#61656F"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  //   if (!toShowJSONNOde) return <DefaultIndicator />;

  return (
    <React.Fragment>
      <span className="json-tree-node-icon" onClick={handleToggle} style={defaultStyles}>
        {renderCustomIndicator ? renderCustomIndicator() : renderDefaultIndicator()}
      </span>
    </React.Fragment>
  );
};

const JSONTreeStringNode = ({ data, ...restProps }) => {
  return <span className="json-tree-node-string">{String(data)}</span>;
};

JSONNode.NodeIndicator = JSONTreeNodeIndicator;
JSONNode.StringNode = JSONTreeStringNode;
