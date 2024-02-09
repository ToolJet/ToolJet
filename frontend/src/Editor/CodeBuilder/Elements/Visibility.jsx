import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const Visibility = ({ value, onVisibilityChange, component }) => {
  return (
    <div
      data-cy={`icon-visibility-button`}
      className="cursor-pointer visibility-eye"
      style={{ top: component.component.definition.styles.iconVisibility?.value && '42%' }}
      onClick={(e) => {
        e.stopPropagation();
        onVisibilityChange(!component.component.definition.styles?.iconVisibility?.value);
      }}
    >
      <SolidIcon
        name={component.component.definition.styles?.iconVisibility?.value ? 'eye1' : 'eyedisable'}
        width="20"
        fill={'var(--slate8)'}
      />
    </div>
  );
};
