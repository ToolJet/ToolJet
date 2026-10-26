import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

export const SvgImage = function Timeline({
  properties,
  styles,
  height,
  dataCy,
  id,
  setExposedVariable,
  setExposedVariables,
}) {
  const { boxShadow, alignment } = styles;
  const { data } = properties;
  const [isVisible, setVisibility] = useState(properties?.visibility ?? true);

  useEffect(() => {
    if (isVisible !== properties?.visibility) setVisibility(properties?.visibility ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties?.visibility]);

  useEffect(() => {
    setExposedVariable('isVisible', isVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    setExposedVariables({
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        setVisibility(!!value);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: isVisible ? '' : 'none', overflow: 'hidden', height: height, boxShadow }} data-cy={dataCy}>
      <div
        role="img"
        id={`component-${id}`}
        style={{ display: 'flex', justifyContent: alignment }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }}
      ></div>
    </div>
  );
};
