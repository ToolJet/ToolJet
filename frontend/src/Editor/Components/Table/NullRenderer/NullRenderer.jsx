import React from 'react';
import './nullRenderer.scss';

const NullRenderer = () => {
  return (
    <div className="d-flex align-items-center h-100">
      <span className="null-renderer-text">NULL</span>
    </div>
  );
};

export default NullRenderer;
