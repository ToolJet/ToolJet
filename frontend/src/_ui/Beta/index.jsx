import React from 'react';
import './styles.scss';
function Beta({ className, style = {} }) {
  return (
    <div className={`beta-tag-container ${className}`} style={style}>
      Beta
    </div>
  );
}

export default Beta;
