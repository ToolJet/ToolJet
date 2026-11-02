import React from 'react';
import Row from './Components/Row';
import './styles.scss';

// showPathCopy: off for payloads (e.g. debugger logs) whose paths aren't app-referenceable.
const CustomJSONViewer = ({ data, absolutePath, iconsList = [], showPathCopy = true }) => {
  let modifiedData = data;
  if (typeof data !== 'object') modifiedData = { '': data };
  return (
    <div className="custom-json-viewer">
      {Object.entries(modifiedData).map(([key, value], index) => {
        return (
          <Row
            key={index}
            label={key}
            value={value}
            absolutePath={`${absolutePath}.${key}`}
            iconsList={iconsList}
            showPathCopy={showPathCopy}
          />
        );
      })}
    </div>
  );
};

export default CustomJSONViewer;
