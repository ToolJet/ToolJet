import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { forwardRef } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';

// TODO: remove refs and related dependancies
export const SidebarItem = forwardRef(
  (
    {
      tip = '',
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
      trigger = ['click', 'hover', 'focus'],
      show = undefined,
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();
    let displayIcon = icon;
    if (icon == 'page') displayIcon = 'file01';
    const content = (
      <Button
        {...rest}
        className={`${className} ${
          selectedSidebarItem === icon && selectedSidebarItem !== 'comments' && 'sidebar-item--active'
        } ${icon}-icon`}
        onClick={onClick && onClick}
        ref={ref}
        type="button"
        aria-label={tip}
        variant="ghost"
        size="default"
        iconOnly
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
        show={show}
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
          {count > 999 ? `999+` : count}
        </span>
      )}
    </>
  );
}

SidebarItem.CommentBadge = CommentBadge;
SidebarItem.Badge = NotificationBadge;
