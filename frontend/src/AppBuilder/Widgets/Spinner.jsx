import React, { useEffect, useState } from 'react';

export const Spinner = ({ properties, styles, height, dataCy, setExposedVariable, setExposedVariables }) => {
  const { colour, size, boxShadow } = styles;
  const { visibility } = properties;
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
