import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const Visibility = ({ onVisibilityChange, styleDefinition, ...restProps }) => {
  const iconVisibility = styleDefinition?.iconVisibility?.value || false;

  return (
    <div
      data-cy={`icon-visibility-button`}
      className="cursor-pointer visibility-eye"
      style={{ top: iconVisibility && '42%' }}
      onClick={(e) => {
        e.stopPropagation();
        onVisibilityChange(!iconVisibility);
      }}
    >
      <SolidIcon name={iconVisibility ? 'eye1' : 'eyedisable'} width="20" fill={'var(--slate8)'} />
    </div>
  );
};
