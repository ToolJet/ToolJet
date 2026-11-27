import React from 'react';
import { themedShadow } from '@/AppBuilder/_helpers/themeStyles';

export const Spinner = ({ styles, height, dataCy }) => {
  const { colour, size, visibility, boxShadow: savedBoxShadow, boxShadowStyle } = styles;
  // The theme shadow (or this widget's own) as CSS.
  const boxShadow = themedShadow(boxShadowStyle, savedBoxShadow);

  const baseStyle = {
    height,
    display: visibility ? '' : 'none',
    boxShadow,
  };

  return (
    <div className="spinner-container" style={baseStyle} data-cy={dataCy}>
      <div className={`spinner-border spinner-border-${size}`} role="status" style={{ color: colour }}></div>
    </div>
  );
};
