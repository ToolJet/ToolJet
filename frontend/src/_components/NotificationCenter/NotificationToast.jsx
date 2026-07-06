import React from 'react';
import { createRoot } from 'react-dom/client';
import { IconCircleCheckFilled, IconCircleXFilled, IconInfoCircleFilled } from '@tabler/icons-react';

const ICON_BY_TYPE = {
  success: { Icon: IconCircleCheckFilled, color: '#1E823B' },
  error: { Icon: IconCircleXFilled, color: '#D72D39' },
  warning: { Icon: IconCircleXFilled, color: '#E68A1E' },
  info: { Icon: IconInfoCircleFilled, color: '#4368E3' },
};

const TOAST_MS = 5000;

// Self-managed mount — react-hot-toast's dispatcher silently drops toasts fired from
// non-React contexts (the notifications ws handler), so this renders into its own root.
function ensureContainer() {
  let el = document.getElementById('tj-notification-toasts');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tj-notification-toasts';
    document.body.appendChild(el);
  }
  return el;
}

// design (85:9598) has no close affordance — click-to-dismiss on the card body instead.
// Copy doc: the toast line is the DESCRIPTION (carries the branch name), not the title.
function ToastCard({ notification, onView, onClose }) {
  const { Icon, color } = ICON_BY_TYPE[notification.type] || ICON_BY_TYPE.info;
  return (
    <div className="notification-toast" onClick={onClose} role="status">
      <Icon size={20} style={{ color, flexShrink: 0 }} />
      <span className="notification-toast-title">{notification.body || notification.title}</span>
      {onView && (
        <button
          className="notification-toast-action"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          View details
        </button>
      )}
    </div>
  );
}

// Branded arrival toast (Figma 85:9598): type icon + one-line title + optional "View details".
// Fired only for live arrivals flagged toast:true — never from REST backfill.
export function showNotificationToast(notification, { onViewDetails } = {}) {
  const host = document.createElement('div');
  ensureContainer().appendChild(host);
  const root = createRoot(host);
  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    clearTimeout(timer);
    root.unmount();
    host.remove();
  };
  const timer = setTimeout(remove, TOAST_MS);
  root.render(
    <ToastCard
      notification={notification}
      onView={
        onViewDetails
          ? () => {
              remove();
              onViewDetails(notification);
            }
          : undefined
      }
      onClose={remove}
    />
  );
}
