import React from 'react';

export const IFrame = function IFrame({ width, height, properties, styles, dataCy }) {
  const source = properties.source;
  const { visibility, disabledState, boxShadow, backgroundColor, borderColor, borderRadius } = styles;

  return (
    <div
      data-disabled={disabledState}
      style={{
        display: visibility ? '' : 'none',
        boxShadow,
        backgroundColor,
        borderColor,
        borderRadius: Number(borderRadius),
        borderWidth: borderColor ? '1px' : '0px',
        borderStyle: borderColor ? 'solid' : 'none',
      }}
      data-cy={dataCy}
    >
      <iframe
        width={width - 4}
        height={height}
        src={source}
        title="IFrame Widget"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};
