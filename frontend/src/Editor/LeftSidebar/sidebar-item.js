import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

export const LeftSidebarItem = ({
  tip = '',
  className,
  icon,
  commentBadge,
  text,
  onClick,
  badge = false,
  count,
  ...rest
}) => {
  return (
    <OverlayTrigger
      trigger={['click', 'hover', 'focus']}
      placement="right"
      delay={{ show: 800, hide: 100 }}
      overlay={<Tooltip id="button-tooltip">{tip}</Tooltip>}
    >
      <div {...rest} className={className} onClick={onClick && onClick}>
        {icon && (
          <img
            className="svg-icon"
            src={`/assets/images/icons/editor/left-sidebar/${icon}.svg`}
            width="20"
            height="20"
          />
        )}
        {badge && <LeftSidebarItem.Badge count={count} />}
        {commentBadge && <LeftSidebarItem.CommentBadge />}
        {text && text}
      </div>
    </OverlayTrigger>
  );
};

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

LeftSidebarItem.CommentBadge = CommentBadge;
LeftSidebarItem.Badge = NotificationBadge;
