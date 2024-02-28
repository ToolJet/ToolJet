import React from 'react';
import './nullRenderer.scss';
import classNames from 'classnames';

const NullRenderer = ({ darkMode }) => {
  return (
    <div className="d-flex align-items-center h-100">
      <span
        className={classNames('null-renderer-text', { 'dark-theme': darkMode })}
        style={{
          color: darkMode ? '#CFD3D8' : '#1B1F24',
          backgroundColor: darkMode ? '#3C434B' : '#E4E7EB',
        }}
      >
        NULL
      </span>
    </div>
  );
};

export default NullRenderer;
