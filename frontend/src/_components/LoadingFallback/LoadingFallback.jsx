import React from 'react';

const LoadingFallback = ({ message = 'Loading...' }) => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-2 text-muted">{message}</div>
      </div>
    </div>
  );
};

export default LoadingFallback;