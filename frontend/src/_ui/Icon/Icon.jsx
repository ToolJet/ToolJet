import React from 'react';
import allIcons from '../Icon/allIcons/index.jsx';
function Icon({ icon, ...restProps }) {
  const IconElement = allIcons[icon];
  return <IconElement {...restProps} />;
}

export default Icon;
