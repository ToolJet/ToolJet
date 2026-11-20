import React, { useId } from 'react';
import { cn } from '@/lib/utils';

const Loader = ({ width, style, absolute = true, color = '#3E63DD', reverse = false, classes = null }) => {
  const viewBoxSize = 240; // Increase the viewBox size as needed
  const rotateFrom = reverse ? '360 120 120' : '0 120 120';
  const rotateTo = reverse ? '0 120 120' : '360 120 120';
  // Gradient ids are document-wide; shared ids made every loader on a page paint the first one's colour.
  const idPrefix = `spinner-${useId().replace(/:/g, '')}`;
  const firstHalfId = `${idPrefix}-firstHalf`;
  const secondHalfId = `${idPrefix}-secondHalf`;

  return (
    <div
      className={cn('tj-widget-loader d-flex', classes?.loaderContainer)}
      style={{ ...style, position: absolute ? 'absolute' : 'relative' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={width}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        fill="none"
        color={color}
      >
        <defs>
          <linearGradient id={secondHalfId}>
            <stop offset="0%" stopOpacity="0" stopColor="currentColor" />
            <stop offset="100%" stopOpacity="0.5" stopColor="currentColor" />
          </linearGradient>
          <linearGradient id={firstHalfId}>
            <stop offset="0%" stopOpacity="1" stopColor="currentColor" />
            <stop offset="100%" stopOpacity="0.5" stopColor="currentColor" />
          </linearGradient>
        </defs>
        <g strokeWidth="24">
          <path
            stroke={`url(#${secondHalfId})`}
            d={`M 10 ${viewBoxSize / 2} A 96 96 0 0 1 ${viewBoxSize - 10} ${viewBoxSize / 2}`}
          />
          <path
            stroke={`url(#${firstHalfId})`}
            d={`M ${viewBoxSize - 10} ${viewBoxSize / 2} A 96 96 0 0 1 10 ${viewBoxSize / 2}`}
          />

          <path
            stroke="currentColor"
            strokeLinecap="round"
            d={`M 10 ${viewBoxSize / 2} A 96 96 0 0 1 10 ${viewBoxSize / 2 - 2}`}
          />
          <animateTransform
            from={rotateFrom}
            to={rotateTo}
            attributeName="transform"
            type="rotate"
            repeatCount="indefinite"
            dur="1300ms"
          />
        </g>
      </svg>
    </div>
  );
};

export default Loader;
