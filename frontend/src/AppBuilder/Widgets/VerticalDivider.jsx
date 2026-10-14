import React from 'react';
const DASH_WIDTH = 4;
const DASH_GAP = 4;

export const VerticalDivider = function Divider({ styles, height, width, dataCy, darkMode, properties }) {
  const { dividerColor, boxShadow, dividerStyle } = styles;
  const color =
    dividerColor === '' || ['#000', '#000000'].includes(dividerColor) ? (darkMode ? '#fff' : '#000') : dividerColor;

  return (
    <div
      className="justify-content-center"
      style={{ display: properties?.visibility ? 'flex' : 'none', width: '100%', height: '100%' }}
      data-cy={dataCy}
    >
      <div
        style={{
          height: '100%',
          width: '1px',
          ...(dividerStyle === 'dashed'
            ? {
                backgroundColor: 'transparent',
                backgroundImage: `linear-gradient(to bottom, ${color} ${DASH_WIDTH}px, transparent ${DASH_GAP}px)`,
                backgroundSize: `1px ${DASH_WIDTH + DASH_GAP}px`,
                backgroundRepeat: 'repeat-y',
                border: 'none',
              }
            : {
                backgroundColor: dividerStyle === 'solid' ? color : 'transparent',
                border: 'none',
              }),
          padding: '0rem',
          boxShadow,
        }}
      ></div>
    </div>
  );
};
