import React from 'react';

const ArrayNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: '#1F99ED' }}>
      {`[${value.length}]`}
    </div>
  );
};

export default ArrayNode;
