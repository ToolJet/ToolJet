import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { forwardRef } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';

// TODO: remove refs and related dependancies
export const SidebarItem = forwardRef(
  ({ tip = '', selectedSidebarItem, className, icon, iconFill = 'var(--slate8)', text, onClick, ...rest }, ref) => {
    const { t } = useTranslation();
    let displayIcon = icon;
    return (
      <div {...rest} className={className} onClick={onClick && onClick} ref={ref}>
        {icon && (
          <div className={`sidebar-svg-icon  position-relative ${selectedSidebarItem && 'sidebar-item'}`}>
            <SolidIcon name={displayIcon} width={20} fill={selectedSidebarItem ? '#3E63DD' : iconFill} />
          </div>
        )}
        <p>{text && t(`leftSidebar.${text}.text`, text)}</p>
      </div>
    );
  }
);
