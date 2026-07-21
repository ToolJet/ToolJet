import React from 'react';
import { TriangleAlert, CircleAlert, CircleCheckBig, SquareArrowOutUpRight, X } from 'lucide-react';
import { detailAction } from './detailAction';

// per Figma: error=triangle-alert, info=circle-alert, success=circle-check-big (14px)
const ICON_BY_TYPE = {
  info: { Icon: CircleAlert, color: '#4368E3' },
  success: { Icon: CircleCheckBig, color: '#1E823B' },
  warning: { Icon: TriangleAlert, color: '#E68A1E' },
  error: { Icon: TriangleAlert, color: '#D72D39' },
};

// design copy uses short relative time: "2m ago"
export function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(s) || s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// branch names render in monospace within the body (design: IBM Plex Mono segments)
function MonoBody({ body, branchName }) {
  if (!branchName || !body?.includes(branchName)) return body ?? null;
  return body.split(branchName).map((segment, i) => (
    <React.Fragment key={i}>
      {i > 0 && <code className="notification-row-mono">{branchName}</code>}
      {segment}
    </React.Fragment>
  ));
}

export default function NotificationRow({ notification, onRemove, onMarkRead, onOpen, darkMode }) {
  const { type, title, body, createdAt, readAt, metadata } = notification;
  const { Icon, color } = ICON_BY_TYPE[type] || ICON_BY_TYPE.info;
  const hasDetail = !!detailAction(notification);

  const handleRowClick = () => {
    if (hasDetail) onOpen(notification);
    else if (!readAt) onMarkRead(notification.recipientId);
  };

  return (
    <div
      className={`notification-row ${readAt ? 'read' : 'unread'} ${darkMode ? 'dark' : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleRowClick();
      }}
    >
      <span className="notification-row-icon">
        <Icon size={14} style={{ color, flexShrink: 0 }} />
      </span>
      <div className="notification-row-content">
        <div className="notification-row-title">{title}</div>
        {body && (
          <div className="notification-row-body">
            <MonoBody body={body} branchName={metadata?.branchName} />
          </div>
        )}
        <div className="notification-row-time">{timeAgo(createdAt)}</div>
      </div>
      <div className="notification-row-side">
        {!readAt && <span className="notification-row-dot" aria-label="Unread" />}
        <div className="notification-row-actions">
          {hasDetail && (
            <button
              className="notification-row-action"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(notification);
              }}
              aria-label="Open"
            >
              <SquareArrowOutUpRight size={14} />
            </button>
          )}
          <button
            className="notification-row-action"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(notification.recipientId);
            }}
            aria-label="Remove"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
