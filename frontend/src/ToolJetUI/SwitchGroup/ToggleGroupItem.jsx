import React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as ToggleGroup from '@radix-ui/react-toggle-group';
// eslint-disable-next-line import/no-unresolved
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import TablerIcon from '@/_ui/Icon/TablerIcon';

const ToggleGroupItem = ({ children, value, isIcon, lucideIconName, className, ...restProps }) => {
  const isTablerIcon = isIcon && !lucideIconName && typeof children === 'string' && children.startsWith('Icon');

  const renderIcon = () => {
    if (lucideIconName) {
      return <DynamicIcon name={lucideIconName} size={12} strokeWidth={2} color="#889096" />;
    }
    if (isTablerIcon) {
      return <TablerIcon iconName={children} size={12} />;
    }
    return (
      <SolidIcon
        data-tooltip-id="tooltip-for-copy-invitation-link"
        data-tooltip-content="Copy invitation link"
        width="12"
        fill="#889096"
        name={children}
      />
    );
  };

  return (
    <ToggleGroup.Item className={`ToggleGroupItem ${className}`} value={value} {...restProps}>
      {' '}
      <div className="toggle-item" data-cy={`togglr-button-${value}`}>
        {!isIcon ? children : renderIcon()}
      </div>
    </ToggleGroup.Item>
  );
};

export default ToggleGroupItem;
