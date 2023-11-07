import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const Visibility = ({ value, onChange, component }) => {
  console.log('ccc', component.component.definition.styles);
  return (
    <div
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onChange(!component.component.definition.styles.iconVisibility.value);
      }}
    >
      <SolidIcon name="eye1" />
    </div>
  );
};

// {name: 'visibility'} value {{false}} styles
// console.log('nnn', param, 'value', value, paramType);
