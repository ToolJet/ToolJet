import React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons';

export const Icon = ({ properties, styles, fireEvent, width, height }) => {
  const { icon } = properties;
  const { iconColor } = styles;
  const IconElement = Icons[icon];

  return (
    <div className={`icon-widget`}>
      <IconElement color={iconColor} style={{ width: width, height: height }} />
    </div>
  );
};
