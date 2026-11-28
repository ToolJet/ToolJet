import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { ToolTip } from '@/_components/ToolTip';
import { SIDEBAR_ITEMS } from '@/AppBuilder/panelLayout';

// A left rail item. `panel` keys its entry in SIDEBAR_ITEMS: the accessible name is the panel's name,
// the short label sits under the icon, and when the label is shorter than the name a tooltip shows
// the name. `tip` replaces that tooltip, e.g. to say why the item is disabled or what it needs.
export const SidebarItem = forwardRef(
  (
    {
      panel,
      tip,
      disabled,
      selectedSidebarItem,
      className,
      commentBadge,
      onClick,
      badge = false,
      count,
      children,
      ...rest
    },
    ref
  ) => {
    const { name, label, cy } = SIDEBAR_ITEMS[panel];
    const button = (
      <Button
        {...rest}
        className={`${className} ${selectedSidebarItem === panel && 'sidebar-item--active'} ${panel}-icon`}
        // aria-disabled, not native disabled: a disabled button fires no hover or focus events, and its tooltip
        // says why it is disabled (as page menu rows do, PG-31).
        aria-disabled={disabled ? true : rest['aria-disabled']}
        onClick={disabled ? undefined : onClick}
        ref={ref}
        type="button"
        aria-label={name}
        variant="ghost"
        size="default"
        iconOnly
        data-cy={`left-sidebar-${cy}-button`}
      >
        {children && (
          <div className={'sidebar-svg-icon  position-relative'}>
            {children}
            {commentBadge && <SidebarItem.CommentBadge />}
          </div>
        )}
        {badge && <SidebarItem.Badge count={count} />}
        <span className="left-sidebar-item-label">{label}</span>
      </Button>
    );

    if (!tip && label === name) return button;
    return (
      <ToolTip message={tip ?? name} placement="right">
        {button}
      </ToolTip>
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
