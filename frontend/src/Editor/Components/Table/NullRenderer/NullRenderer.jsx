import React from 'react';
import './nullRenderer.scss';
import classNames from 'classnames';

const NullRenderer = ({ darkMode }) => {
  return (
    <div className="d-flex align-items-center h-100">
      <span className={classNames('null-renderer-text', { 'dark-theme': darkMode })}>NULL</span>
    </div>
  );
};

export default NullRenderer;
