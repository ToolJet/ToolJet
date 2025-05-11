import React from 'react';
import Row from './Components/Row';
import './styles.scss';

const CustomJSONViewer = ({ data, absolutePath }) => {
  let modifiedData = data;
  if (typeof data !== 'object') modifiedData = { '': data };
  return (
    <div className="custom-json-viewer">
      {Object.entries(modifiedData).map(([key, value], index) => {
        return <Row key={index} label={key} value={value} absolutePath={`${absolutePath}.${key}`} />;
      })}
    </div>
  );
};

export default CustomJSONViewer;
