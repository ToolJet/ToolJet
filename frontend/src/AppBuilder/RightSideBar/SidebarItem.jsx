import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/Button/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

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
      <OverlayTrigger
        trigger={['click', 'hover', 'focus']}
        placement="left"
        delay={{ show: 250, hide: 200 }}
        overlay={<Tooltip id="button-tooltip">{t(`rightSidebar.${tip}.tip`, tip)}</Tooltip>}
      >
        <Button
          {...rest}
          className={`${className} ${selectedSidebarItem ? 'tw-bg-background-accent-weak tw-text-icon-accent' : ''}`}
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
          {text && <p>{t(`leftSidebar.${text}.text`, text)}</p>}
        </Button>
      </OverlayTrigger>
    );
  }
);
