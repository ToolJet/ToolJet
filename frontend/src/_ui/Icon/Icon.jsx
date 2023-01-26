import React from 'react';
import { _glyphs } from '../Icon/allIcons/index.js';
function Icon({ icon, ...restProps }) {
  const IconElement = _glyphs[icon];
  console.log(IconElement);
  return <IconElement {...restProps} />;
}

export default Icon;
