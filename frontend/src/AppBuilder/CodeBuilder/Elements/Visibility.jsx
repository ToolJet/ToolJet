import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { resolveReferences } from '@/_helpers/utils';

export const Visibility = ({ onVisibilityChange, styleDefinition }) => {
  const iconVisibility = resolveReferences(styleDefinition?.iconVisibility?.value) || false;

  return (
    <div
      data-cy={`icon-visibility-button`}
      className="cursor-pointer visibility-eye"
      style={{ top: iconVisibility && '42%' }}
      onClick={(e) => {
        e.stopPropagation();
        onVisibilityChange(`{{${!iconVisibility}}}`);
      }}
    >
      <SolidIcon name={iconVisibility ? 'eye1' : 'eyedisable'} width="20" fill={'var(--slate8)'} />
    </div>
  );
};
