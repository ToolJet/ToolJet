import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/Button/Button';

import { useTranslation } from 'react-i18next';

// TODO: remove refs and related dependancies
export const SidebarItem = forwardRef(
  (
    { tip = '', selectedSidebarItem, className, icon, iconFill = 'var(--slate8)', text, onClick, children, ...rest },
    ref
  ) => {
    const { t } = useTranslation();
    // let displayIcon = icon;
    return (
      <Button
        {...rest}
        className={className}
        onClick={onClick && onClick}
        ref={ref}
        variant="ghost"
        size="default"
        iconOnly
      >
        {children && (
          <div
            className={`sidebar-svg-icon  position-relative ${selectedSidebarItem && 'sidebar-item'}`}
            data-cy={`right-sidebar-${icon.toLowerCase()}-button`}
          >
            {children}
          </div>
        )}
        <p>{text && t(`leftSidebar.${text}.text`, text)}</p>
      </Button>
    );
  }
);
