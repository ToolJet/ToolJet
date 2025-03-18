import * as React from 'react';
var tinycolor = require('tinycolor2');

/**
 * Cursor component: Thanks to https://codesandbox.io/s/u85tu?file=/src/components/Cursor.tsx
 */
export const Cursor = React.memo(({ x, y, color, name }) => {
  const rCursor = React.useRef(null);

  // Update the point whenever the component updates
  if (rCursor.current) {
    rCursor.current.style.setProperty('transform', `translate(${x}px, ${y}px)`);
  }

  const getColor = () => {
    if (tinycolor(color).getBrightness() > 128) return '#000';
    return '#fff';
  };

  return (
    <div style={{ zIndex: 2, position: 'fixed', left: 0 }} ref={rCursor}>
      <svg
        height="35"
        width="35"
        viewBox="0 0 35 35"
        shapeRendering="geometricPrecision"
        xmlns="http://www.w3.org/2000/svg"
        fill={color}
      >
        <path
          height="35"
          width="35"
          viewBox="0 0 35 35"
          fill="#666"
          d="M9.63 6.9a1 1 0 011.27-1.27l11.25 3.75a1 1 0 010 1.9l-4.68 1.56a1 1 0 00-.63.63l-1.56 4.68a1 1 0 01-1.9 0L9.63 6.9z"
        />
        <path
          stroke="#fff"
          strokeWidth="1.5"
          d="M11.13 4.92a1.75 1.75 0 00-2.2 2.21l3.74 11.26a1.75 1.75 0 003.32 0l1.56-4.68a.25.25 0 01.16-.16L22.4 12a1.75 1.75 0 000-3.32L11.13 4.92z"
        />
      </svg>
      <span
        style={{
          padding: 5,
          borderRadius: 4,
          fontSize: 12,
          backgroundColor: color,
          color: getColor(),
        }}
      >
        {name}
      </span>
    </div>
  );
});
