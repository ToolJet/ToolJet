import { max, min } from 'lodash';
import React, { useEffect, useState } from 'react';

const DASH_WIDTH = 4;
const DASH_GAP = 4;

export const Divider = function Divider({
  dataCy,
  height,
  width,
  darkMode,
  styles,
  properties,
  setExposedVariable,
  setExposedVariables,
}) {
  const { labelAlignment, labelColor, dividerColor, boxShadow, dividerStyle, padding, textWrap } = styles;
  const { label, visibility } = properties;
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

  const shouldWrap = textWrap !== 'nowrap';

  const dividerLineStyle = {
    width: '100%',
    padding: '0rem',
    boxShadow,
    flexShrink: 1,
    minWidth: '10%',
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
    ...(shouldWrap
      ? {}
      : {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: labelAlignment === 'center' ? '80%' : '90%',
          flexShrink: 0,
        }),
  };

  // If no label, render the original divider
  if (!label) {
    return (
      <div
        style={{
          display: isVisible ? 'flex' : 'none',
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
        display: isVisible ? 'flex' : 'none',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        overflow: 'hidden',
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
            overflow: 'hidden',
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
