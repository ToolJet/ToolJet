import React from 'react';
import _ from 'lodash';

export const JSONNode = ({ data, ...restProps }) => {
  const {
    path,
    shouldExpandNode,
    currentNode,
    getCurrentPath,
    getCurrentNodeType,
    getLength,
    toUseNodeIcons,
    renderNodeIcons,
    useIndentedBlock,
  } = restProps;

  const [expandable, set] = React.useState(() =>
    typeof shouldExpandNode === 'function' ? shouldExpandNode(path, data) : shouldExpandNode
  );

  const toggleExpandNode = () => set((prev) => !prev);

  const currentNodePath = getCurrentPath(path, currentNode);
  // if data is an array or an object and is not empty and is expandable then show the node
  const toExpandNode = (data instanceof Array || data instanceof Object) && !_.isEmpty(data);

  let $VALUE = null;
  let $NODEType = null;
  let $NODEIcon = null;
  const typeofCurrentNode = getCurrentNodeType(data);
  const numberOfEntries = getLength(typeofCurrentNode, data);
  const toRenderSelector = (typeofCurrentNode === 'Object' || typeofCurrentNode === 'Array') && numberOfEntries > 0;

  if (toUseNodeIcons && currentNode) {
    $NODEIcon = renderNodeIcons(currentNode);
  }

  switch (typeofCurrentNode) {
    case 'String':
    case 'Boolean':
    case 'Number':
    case 'Null':
    case 'Undefined':
    case 'Function':
      $VALUE = <JSONNode.ValueNode data={data} type={typeofCurrentNode} />;
      $NODEType = <JSONNode.DisplayNodeLabel type={typeofCurrentNode} />;
      break;

    case 'Object':
      $VALUE = <JSONNode.ObjectNode data={data} path={currentNodePath} {...restProps} />;
      $NODEType = (
        <JSONNode.DisplayNodeLabel type={'Object'}>
          <span className="mx-1 fs-9 node-length-color">
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'entries' : 'entry'}`}{' '}
          </span>
        </JSONNode.DisplayNodeLabel>
      );
      break;

    case 'Array':
      $VALUE = <JSONNode.ArrayNode data={data} path={currentNodePath} {...restProps} />;
      $NODEType = (
        <JSONNode.DisplayNodeLabel type={'Array'}>
          <span className="mx-1 fs-9 node-length-color">
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'items' : 'item'}`}{' '}
          </span>
        </JSONNode.DisplayNodeLabel>
      );

      break;

    default:
      $VALUE = <span>{String(data)}</span>;
      $NODEType = typeofCurrentNode;
  }

  let $key = <span className="fs-12 fw-bold">{String(currentNode)}</span>;

  if (!currentNode) {
    return $VALUE;
  }

  const shouldDisplayIntendedBlock =
    useIndentedBlock && expandable && (typeofCurrentNode === 'Object' || typeofCurrentNode === 'Array');

  return (
    <div className="row mt-1 font-monospace">
      {toRenderSelector ? (
        <React.Fragment>
          <div className="col-md-1 json-tree-icon-container">
            <JSONNode.NodeIndicator
              toExpand={expandable}
              toShowJSONNOde={toExpandNode}
              handleToggle={toggleExpandNode}
              typeofCurrentNode={typeofCurrentNode}
            />
          </div>
        </React.Fragment>
      ) : null}
      <div className={`col ${shouldDisplayIntendedBlock && 'group-border'}`}>
        <div className={`row ${shouldDisplayIntendedBlock && 'group-object-container'}`}>
          {$NODEIcon && <div className="col-md-1 json-tree-icon-container">{$NODEIcon}</div>}
          <div className="col">
            {$key} {$NODEType} {toExpandNode && !expandable ? null : $VALUE}
          </div>
        </div>
      </div>
    </div>
  );
};

const JSONTreeNodeIndicator = ({ toExpand, toShowJSONNOde, handleToggle, ...restProps }) => {
  const { renderCustomIndicator, typeofCurrentNode } = restProps;

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

  if (!toShowJSONNOde && (typeofCurrentNode !== 'Object' || typeofCurrentNode !== 'Array')) return null;
  if (!toShowJSONNOde) return renderDefaultIndicator();

  return (
    <React.Fragment>
      <span className="json-tree-node-icon" onClick={handleToggle} style={defaultStyles}>
        {renderCustomIndicator ? renderCustomIndicator() : renderDefaultIndicator()}
      </span>
    </React.Fragment>
  );
};

const JSONTreeValueNode = ({ data, type }) => {
  if (type === 'Function') {
    const functionString = `${data.toString().split('{')[0].trim()}{...}`;
    return (
      <React.Fragment>
        <span
          className="badge bg-light text-dark"
          style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'none' }}
        >
          {functionString}
        </span>
      </React.Fragment>
    );
  }

  const value = type === 'String' ? `"${data}"` : String(data);
  const clsForUndefinedOrNull = (type === 'Undefined' || type === 'Null') && 'badge badge-secondary';
  return (
    <span
      className={`json-tree-value json-tree-node-${String(type).toLowerCase()} text-break ${clsForUndefinedOrNull}`}
    >
      {value}
    </span>
  );
};

const JSONTreeObjectNode = ({ data, path, ...restProps }) => {
  const nodeKeys = Object.keys(data);

  return nodeKeys.map((key, index) => {
    const currentPath = [...path, key];
    const _currentNode = key;
    const props = { ...restProps };
    props.currentNode = _currentNode;

    return <JSONNode key={`obj-${key}/${index}`} data={data[key]} path={currentPath} {...props} />;
  });
};

const JSONTreeArrayNode = ({ data, path, ...restProps }) => {
  const keys = [];

  for (let i = 0; i < data.length; i++) {
    keys.push(String(i));
  }

  return keys.map((key, index) => {
    const currentPath = [...path, key];
    const _currentNode = key;
    const props = { ...restProps };
    props.currentNode = _currentNode;

    return <JSONNode key={`arr-${key}/${index}`} data={data[Number(key)]} path={currentPath} {...props} />;
  });
};

const DisplayNodeLabel = ({ type = '', children }) => {
  if (type === 'Null' || type === 'Undefined') {
    return null;
  }
  return (
    <React.Fragment>
      <span className="mx-1 fs-9 node-type ">{type}</span>
      {children}
    </React.Fragment>
  );
};

JSONNode.NodeIndicator = JSONTreeNodeIndicator;
JSONNode.ValueNode = JSONTreeValueNode;
JSONNode.ObjectNode = JSONTreeObjectNode;
JSONNode.ArrayNode = JSONTreeArrayNode;
JSONNode.DisplayNodeLabel = DisplayNodeLabel;
