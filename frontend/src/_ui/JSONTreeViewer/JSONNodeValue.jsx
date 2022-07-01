import React from 'react';

const JSONTreeValueNode = ({ data, type, ...restProps }) => {
  if (type === 'Function') {
    const functionString = `${data.toString().split('{')[0].trim()}{...}`;
    return (
      <React.Fragment>
        <span
          className={`text-secondary node-value-${type}`}
          style={{ fontSize: '12px', fontFamily: 'monospace', textTransform: 'none' }}
        >
          {functionString}
        </span>
      </React.Fragment>
    );
  }

  let value = !restProps.hideArrayKeys && type === 'String' ? `"${data}"` : String(data);
  if (value.length > 65) {
    value = `${value.substring(0, 65)} ... "`;
  }

  const clsForUndefinedOrNull = (type === 'Undefined' || type === 'Null') && 'badge badge-secondary';
  const classes = !restProps.hideArrayKeys
    ? `json-tree-valuetype json-tree-node-${String(type).toLowerCase()}`
    : 'fs-12';
  return <span className={`mx-2 text-break ${clsForUndefinedOrNull + ' ' + classes}`}>{value}</span>;
};

export default JSONTreeValueNode;
