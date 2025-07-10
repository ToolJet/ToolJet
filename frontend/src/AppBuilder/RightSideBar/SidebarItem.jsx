import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { forwardRef } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ToolTip } from '@/_components';

// TODO: remove refs and related dependancies
export const SidebarItem = forwardRef(
  (
    {
      tip = '',
      selectedSidebarItem,
      className,
      icon,
      iconFill = 'var(--slate8)',
      text,
      onClick,
      iconWidth = 20,
      ...rest
    },
    ref
  ) => {
    let displayIcon = icon;
    return (
      <ToolTip placement="left" message={tip}>
        <div {...rest} className={className} onClick={onClick && onClick} ref={ref}>
          {icon && (
            <div
              className={`sidebar-svg-icon  position-relative ${selectedSidebarItem && 'sidebar-item'}`}
              data-cy={`right-sidebar-${icon.toLowerCase()}-button`}
            >
              <SolidIcon name={displayIcon} width={iconWidth} fill={selectedSidebarItem ? '#3E63DD' : iconFill} />
            </div>
          )}
          <p></p>
        </div>
      </ToolTip>
    );
  }
);
