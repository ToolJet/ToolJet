import React from 'react';

const DASH_WIDTH = 4;
const DASH_GAP = 4;

export const Divider = function Divider({ dataCy, height, width, darkMode, styles, properties }) {
  const { labelAlignment, labelColor, dividerColor, boxShadow, dividerStyle, padding } = styles;
  const { label, visibility } = properties;
  const color =
    dividerColor === '' || ['#000', '#000000'].includes(dividerColor) ? (darkMode ? '#fff' : '#000') : dividerColor;

  const dividerLineStyle = {
    width: '100%',
    padding: '0rem',
    boxShadow,
    ...(dividerStyle === 'dashed'
      ? {
          backgroundImage: `linear-gradient(to right, ${color} ${DASH_WIDTH}px, transparent ${DASH_GAP}px)`,
          backgroundSize: `${DASH_WIDTH + DASH_GAP}px 1px`,
          backgroundRepeat: 'repeat-x',
          backgroundColor: 'transparent',
          borderTop: 'none',
          height: '1px',
        }
      : {
          height: '1px',
          backgroundColor: color,
          borderTop: 'none',
        }),
  };

  const labelStyles = {
    color: labelColor,
    boxShadow,
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '16px',
  };

  // If no label, render the original divider
  if (!label) {
    return (
      <div
        style={{
          display: visibility ? 'flex' : 'none',
          width: '100%',
          height: '100%',
          alignItems: 'center',
        }}
        data-cy={dataCy}
      >
        <div style={{ ...dividerLineStyle }}></div>
      </div>
    );
  }

  // With label - handle different positions
  return (
    <div
      style={{
        display: visibility ? 'flex' : 'none',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: labelAlignment === 'left' ? 'flex-start' : labelAlignment === 'right' ? 'flex-end' : 'center',
      }}
      data-cy={dataCy}
    >
      {labelAlignment === 'left' && (
        <>
          <span style={{ ...labelStyles, paddingLeft: '0px', paddingRight: '8px' }}>{label}</span>
          <div style={dividerLineStyle}></div>
        </>
      )}

      {labelAlignment === 'center' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <div style={{ ...dividerLineStyle }}></div>
          <span style={{ ...labelStyles, padding: '0px 8px' }}>{label}</span>
          <div style={{ ...dividerLineStyle }}></div>
        </div>
      )}

      {labelAlignment === 'right' && (
        <>
          <div style={dividerLineStyle}></div>
          <span style={{ ...labelStyles, paddingRight: '0px', paddingLeft: '8px' }}>{label}</span>
        </>
      )}
    </div>
  );
};
