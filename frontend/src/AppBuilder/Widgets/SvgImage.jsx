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
  const { data, visibility } = properties;
  const [isVisible, setIsVisible] = useState(visibility);

  // A Visibility property change wins over an earlier setVisibility call.
  useEffect(() => {
    setIsVisible(visibility);
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setExposedVariables({
      isVisible: visibility,
      setVisibility: async function (value) {
        setIsVisible(!!value);
        setExposedVariable('isVisible', !!value);
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
