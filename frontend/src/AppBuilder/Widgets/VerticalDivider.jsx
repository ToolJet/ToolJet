import React, { useEffect, useState } from 'react';
const DASH_WIDTH = 4;
const DASH_GAP = 4;

export const VerticalDivider = function Divider({
  styles,
  height,
  width,
  dataCy,
  darkMode,
  properties,
  setExposedVariable,
  setExposedVariables,
}) {
  const { dividerColor, boxShadow, dividerStyle } = styles;
  const visibility = properties?.visibility;
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
  const color =
    dividerColor === '' || ['#000', '#000000'].includes(dividerColor) ? (darkMode ? '#fff' : '#000') : dividerColor;

  return (
    <div
      className="justify-content-center"
      style={{ display: isVisible ? 'flex' : 'none', width: '100%', height: '100%' }}
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
