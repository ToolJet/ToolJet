import React from 'react';

export const IFrame = function IFrame({ width, height, properties, styles, dataCy, boxShadow }) {
  const source = properties.source;
  const { visibility, disabledState } = styles;

  return (
    <div data-disabled={disabledState} style={{ display: visibility ? '' : 'none', boxShadow }} data-cy={dataCy}>
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
