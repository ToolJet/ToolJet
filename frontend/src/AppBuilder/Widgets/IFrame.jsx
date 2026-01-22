import React, { useEffect, useState } from 'react';

export const IFrame = function IFrame({ width, height, properties, styles, dataCy, setExposedVariables }) {
  const source = properties.source;
  const [iframeSrc, setIframeSrc] = useState(source);
  const { visibility, disabledState, boxShadow } = styles;

  useEffect(() => {
    setIframeSrc(source);
  }, [source]);


  useEffect(() => {
    setExposedVariables({
      setUrl: (url) => {
        if (typeof url === 'string') {
          setIframeSrc(url);
        }
      },
    });
  }, []);

  return (
    <div
      className="tw-h-full"
      data-disabled={disabledState}
      style={{ display: visibility ? '' : 'none', boxShadow }}
      data-cy={dataCy}
    >
      <iframe
        width={width - 4}
        height={height}
        src={iframeSrc}
        title="IFrame Widget"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};
