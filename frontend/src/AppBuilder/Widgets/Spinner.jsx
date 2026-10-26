import React, { useEffect, useState } from 'react';

export const Spinner = ({ properties, styles, height, dataCy, setExposedVariable, setExposedVariables }) => {
  const { colour, size, boxShadow } = styles;
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

  const baseStyle = {
    height,
    display: isVisible ? '' : 'none',
    boxShadow,
  };

  return (
    <div className="spinner-container" style={baseStyle} data-cy={dataCy}>
      <div className={`spinner-border spinner-border-${size}`} role="status" style={{ color: colour }}></div>
    </div>
  );
};
