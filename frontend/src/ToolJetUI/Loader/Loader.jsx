import React from 'react';

const Loader = ({ width, style, absolute = true }) => {
  const viewBoxSize = 240; // Increase the viewBox size as needed

  return (
    <div className="tj-widget-loader d-flex" style={{ ...style, position: absolute ? 'absolute' : 'relative' }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={width}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        fill="none"
        color="#3E63DD"
      >
        <defs>
          <linearGradient id="spinner-secondHalf">
            <stop offset="0%" stopOpacity="0" stopColor="currentColor" />
            <stop offset="100%" stopOpacity="0.5" stopColor="currentColor" />
          </linearGradient>
          <linearGradient id="spinner-firstHalf">
            <stop offset="0%" stopOpacity="1" stopColor="currentColor" />
            <stop offset="100%" stopOpacity="0.5" stopColor="currentColor" />
          </linearGradient>
        </defs>

        <g strokeWidth="24">
          <path
            stroke="url(#spinner-secondHalf)"
            d={`M 10 ${viewBoxSize / 2} A 96 96 0 0 1 ${viewBoxSize - 10} ${viewBoxSize / 2}`}
          />
          <path
            stroke="url(#spinner-firstHalf)"
            d={`M ${viewBoxSize - 10} ${viewBoxSize / 2} A 96 96 0 0 1 10 ${viewBoxSize / 2}`}
          />

          <path
            stroke="currentColor"
            strokeLinecap="round"
            d={`M 10 ${viewBoxSize / 2} A 96 96 0 0 1 10 ${viewBoxSize / 2 - 2}`}
          />
        </g>

        <animateTransform
          from="0 0 0"
          to="360 0 0"
          attributeName="transform"
          type="rotate"
          repeatCount="indefinite"
          dur="1300ms"
        />
      </svg>
    </div>
  );
};

export default Loader;
