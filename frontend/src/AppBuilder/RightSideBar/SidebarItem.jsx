import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/Button/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import { useTranslation } from 'react-i18next';
import { generateCypressDataCy } from '../../modules/common/helpers/cypressHelpers';

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
          data-cy={`right-sidebar-${generateCypressDataCy(typeof tip === 'object' ? icon : tip) || 'unknown'}-button`}
        >
          {children && (
            <div
              className={`sidebar-svg-icon  position-relative ${selectedSidebarItem && 'sidebar-item'}`}
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
