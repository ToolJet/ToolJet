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

  return <div>JSONNode</div>;
};

const NodeIndicator = ({ toExpand, toShowJSONNOde, handleToggle, ...restProps }) => {
  const { renderCustomIndicator } = restProps;

  const defaultStyles = {
    transform: toExpand ? 'rotate(90deg)' : 'rotate(0deg)',
  };

  const DefaultIndicator = () => (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.02063 1L5.01032 5.01028L1.00003 8.99997"
        stroke="#61656F"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!toShowJSONNOde) return <DefaultIndicator />;

  return (
    <React.Fragment>
      <div className="json-tree-node-icon" onClick={handleToggle} style={defaultStyles}>
        {renderCustomIndicator ? renderCustomIndicator() : <DefaultIndicator />}
      </div>
    </React.Fragment>
  );
};
