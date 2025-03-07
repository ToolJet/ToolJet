import React from 'react';

export const Divider = function Divider({ dataCy, height, width, darkMode, styles, properties }) {
  const { labelAlignment, labelColor, dividerColor, boxShadow, dividerStyle } = styles;
  const { label, visibility } = properties;
  const color =
    dividerColor === '' || ['#000', '#000000'].includes(dividerColor) ? (darkMode ? '#fff' : '#000') : dividerColor;

  const dividerLineStyle = {
    width,
    padding: '0rem',
    boxShadow,
    ...(dividerStyle === 'dashed'
      ? {
          height: 0, // No height for dashed, use border instead
          borderTop: `1px dashed ${color}`,
          backgroundColor: 'transparent',
        }
      : {
          height: '1px',
          backgroundColor: color,
          borderTop: 'none',
        }),
  };
  // If no label, render the original divider
  if (!label) {
    return (
      <div
        className="row"
        style={{ display: visibility ? 'flex' : 'none', padding: '0 8px', width, height, alignItems: 'center' }}
        data-cy={dataCy}
      >
        <div className="col-12" style={{ ...dividerLineStyle, marginLeft: '0.5rem' }}></div>
      </div>
    );
  }

  // With label - handle different positions
  return (
    <div
      style={{
        display: visibility ? 'flex' : 'none',
        padding: '0 8px',
        width,
        height,
        alignItems: 'center',
        justifyContent: labelAlignment === 'start' ? 'flex-start' : labelAlignment === 'end' ? 'flex-end' : 'center',
      }}
      data-cy={dataCy}
    >
      {labelAlignment === 'start' && (
        <>
          <span style={{ paddingLeft: '0px', paddingRight: '8px', color: labelColor }}>{label}</span>
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
          <span style={{ padding: '0px 8px', color: labelColor }}>{label}</span>
          <div style={{ ...dividerLineStyle }}></div>
        </div>
      )}

      {labelAlignment === 'end' && (
        <>
          <div style={dividerLineStyle}></div>
          <span style={{ paddingRight: '0px', paddingLeft: '8px', color: labelColor }}>{label}</span>
        </>
      )}
    </div>
  );
};
