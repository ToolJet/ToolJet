import React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import TablerIcon from '@/_ui/Icon/TablerIcon';

const ToggleGroupItem = ({ children, value, isIcon, className, ...restProps }) => {
  const isTablerIcon = isIcon && typeof children === 'string' && children.startsWith('Icon');

  return (
    <ToggleGroup.Item className={`ToggleGroupItem ${className}`} value={value} {...restProps}>
      {' '}
      <div className="toggle-item" data-cy={`togglr-button-${value}`}>
        {!isIcon ? (
          children
        ) : isTablerIcon ? (
          <TablerIcon iconName={children} size={12} />
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
