import React from 'react';
import Row from './Components/Row';
import { appendPathSegment } from '../utils';
import './styles.scss';

// showPathCopy: off for payloads (e.g. debugger logs) whose paths aren't app-referenceable.
const CustomJSONViewer = ({ data, absolutePath, iconsList = [], showPathCopy = true }) => {
  // typeof null is 'object', so null needs its own check or Object.entries below throws. An empty object or
  // array and a Date have no entries either, so they show as one row too, not a blank pane (DB-11b).
  const isPrimitive =
    data === null || typeof data !== 'object' || data instanceof Date || Object.keys(data).length === 0;
  // A primitive is shown as one unnamed row, whose path is the value's own path.
  const modifiedData = isPrimitive ? { '': data } : data;
  return (
    <div className="custom-json-viewer">
      {Object.entries(modifiedData).map(([key, value], index) => {
        return (
          <Row
            key={index}
            label={key}
            value={value}
            absolutePath={isPrimitive ? absolutePath : appendPathSegment(absolutePath, key)}
            iconsList={iconsList}
            showPathCopy={showPathCopy}
          />
        );
      })}
    </div>
  );
};

export default CustomJSONViewer;
