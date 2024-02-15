import React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const ToggleGroupItem = ({ children, value, isIcon, ...restProps }) => {
  return (
    <ToggleGroup.Item className="ToggleGroupItem" value={value} {...restProps}>
      <div className="toggle-item" data-cy={`togglr-button-${value}`}>
        {!isIcon ? (
          children
        ) : (
          <SolidIcon
            data-tooltip-id="tooltip-for-copy-invitation-link"
            data-tooltip-content="Copy invitation link"
            width="12"
            fill="#889096"
            name={children}
          />
        )}
      </div>
    </ToggleGroup.Item>
  );
};

export default ToggleGroupItem;
