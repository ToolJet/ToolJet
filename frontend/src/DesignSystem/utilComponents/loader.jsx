import React from 'react';

const Loader = ({ color }) => {
  const loaderStyle = {
    width: '18px',
    height: '18px',
    aspectRatio: '1',
    borderRadius: '50%',
    background: `radial-gradient(farthest-side, ${
      color || '#FFFFFF'
    } 90%, transparent 94%) top/4px 4px no-repeat, conic-gradient(#0000 30%, ${color || '#FFFFFF'})`,
    WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)`,
    animation: 'l13 1s infinite linear',
  };

  return <div className="component-spinner" style={loaderStyle}></div>;
};

export default Loader;
