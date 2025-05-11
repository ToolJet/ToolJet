import React from 'react';

const ObjectNode = ({ value }) => {
  return (
    <div className="json-viewer-node-value" style={{ color: '#FF7F0E' }}>
      {`{${Object.keys(value).length}}`}
    </div>
  );
};

export default ObjectNode;
