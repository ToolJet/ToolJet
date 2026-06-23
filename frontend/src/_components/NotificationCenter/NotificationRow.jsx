import React from 'react';
import moment from 'moment';
import {
  IconInfoCircleFilled,
  IconCircleCheckFilled,
  IconAlertTriangleFilled,
  IconExclamationCircle,
  IconX,
} from '@tabler/icons-react';

const ICON_BY_TYPE = {
  info: { Icon: IconInfoCircleFilled, color: '#6177DB' },
  success: { Icon: IconCircleCheckFilled, color: '#3CA04E' },
  warning: { Icon: IconAlertTriangleFilled, color: '#E68A1E' },
  error: { Icon: IconExclamationCircle, color: '#D72D39' },
};

export default function NotificationRow({ notification, onDismiss, onOpenDetail, darkMode }) {
  const { type, title, body, createdAt, readAt } = notification;
  const { Icon, color } = ICON_BY_TYPE[type] || ICON_BY_TYPE.info;
  const clickable = type === 'error';

  return (
    <div
      className={`notification-row ${readAt ? 'read' : 'unread'} ${clickable ? 'clickable' : ''} ${
        darkMode ? 'dark' : ''
      }`}
      onClick={clickable ? () => onOpenDetail(notification) : undefined}
      role={clickable ? 'button' : undefined}
    >
      <Icon size={20} style={{ color, flexShrink: 0 }} />
      <div className="notification-row-content">
        <div className="notification-row-title">{title}</div>
        {body && <div className="notification-row-body">{body}</div>}
        <div className="notification-row-time">{moment(createdAt).fromNow()}</div>
      </div>
      <button
        className="notification-row-dismiss"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.recipientId);
        }}
        aria-label="Dismiss"
      >
        <IconX size={16} />
      </button>
    </div>
  );
}
