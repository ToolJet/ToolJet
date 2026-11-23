import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { forwardRef, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';
import { generateCypressDataCy } from '../../../modules/common/helpers/cypressHelpers';

// TODO: remove refs and related dependancies
export const SidebarItem = forwardRef(
  (
    {
      tip = '',
      // The button's accessible name when the tip is not plain text (a heading and a line): otherwise its name read
      // "[object Object]".
      label,
      selectedSidebarItem,
      className,
      icon,
      IconComponent,
      iconFill = 'var(--icon-strong)',
      commentBadge,
      text,
      onClick,
      badge = false,
      count,
      children,
      keepTooltipOpen,
      classes,
      trigger = ['hover', 'focus'],
      show = undefined,
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();
    // Shown on hover and focus, and put away on click: the panel the click opens sits under it, and the tip stayed
    // over the AI chat's header until the pointer moved (QA 2026-11-05).
    const [tipOpen, setTipOpen] = useState(false);
    const accessibleName = typeof tip === 'string' && tip ? tip : label;
    let displayIcon = icon;
    if (icon == 'page') displayIcon = 'file01';
    const content = (
      <Button
        {...rest}
        className={`${className} ${
          selectedSidebarItem === icon && selectedSidebarItem !== 'comments' && 'sidebar-item--active'
        } ${icon}-icon`}
        onClick={(event) => {
          setTipOpen(false);
          onClick?.(event);
        }}
        ref={ref}
        type="button"
        aria-label={accessibleName || undefined}
        variant="ghost"
        size="default"
        iconOnly
        data-cy={`left-sidebar-${generateCypressDataCy(typeof tip === 'object' ? icon : tip) || 'unknown'}-button`}
      >
        {children && (
          <div className={'sidebar-svg-icon  position-relative'}>
            {children}
            {commentBadge && <SidebarItem.CommentBadge />}
          </div>
        )}
        {badge && <SidebarItem.Badge count={count} />}
        <p>{text && t(`leftSidebar.${text}.text`, text)}</p>
      </Button>
    );

    if (!tip) return content;
    return (
      <OverlayTrigger
        trigger={trigger}
        placement="right"
        delay={{ show: 250, hide: 200 }}
        overlay={
          <Tooltip id="button-tooltip" className={classes?.tooltip}>
            {typeof tip === 'string' ? t(`leftSidebar.${tip}.tip`, tip) : tip}
          </Tooltip>
        }
        show={show ?? tipOpen}
        onToggle={(next) => setTipOpen(next)}
      >
        {content}
      </OverlayTrigger>
    );
  }
);

function CommentBadge() {
  return (
    <svg
      className="comment-badge"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5" cy="5" r="5" fill="#FF6666" />
    </svg>
  );
}

function NotificationBadge({ count }) {
  const fontSize = count > 999 ? '7.5px' : '8.5px';
  return (
    <>
      {count > 0 && (
        <span className="badge bg-red rounded-circle debugger-badge p-0" style={{ fontSize: fontSize }}>
          {count > 999 ? `999 + ` : count}
        </span>
      )}
    </>
  );
}

SidebarItem.CommentBadge = CommentBadge;
SidebarItem.Badge = NotificationBadge;
