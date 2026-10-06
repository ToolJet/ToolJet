import React from 'react';
import toast from 'react-hot-toast';
import { CircleCheck, Info } from 'lucide-react';

const TOAST_MS = 5000;
const ACTION_TOAST_MS = 10000; // long enough to reach for the action button

const ICONS = {
  info: <Info className="tw-size-5 tw-shrink-0 tw-text-icon-brand" />,
  success: <CircleCheck className="tw-size-5 tw-shrink-0 tw-text-icon-success" />,
};

// Icon + message + optional action button on one row; the app Toaster adds the close button.
// action: { label, onClick, icon?, accent? } — accent renders the outlined brand button.
export function showActionToast({ type = 'info', message, action }) {
  const content = (t) => (
    <span className="notification-toast-row">
      <span className="notification-toast-body">{message}</span>
      {action && (
        <button
          className={`notification-toast-view ${action.accent ? 'notification-toast-view--accent' : ''}`}
          onClick={() => {
            toast.dismiss(t.id);
            action.onClick();
          }}
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </span>
  );
  // react-hot-toast caps toasts at 350px — too narrow for message + action on one line
  const opts = { duration: action ? ACTION_TOAST_MS : TOAST_MS, style: { maxWidth: '640px' } };
  if (type === 'error') return toast.error(content, opts);
  return toast(content, { ...opts, icon: ICONS[type] ?? ICONS.info });
}

// Arrival toast for live notifications flagged toast:true — never from REST backfill.
// Optional "View details" opens the detail.
export function showNotificationToast(notification, { onViewDetails } = {}) {
  return showActionToast({
    type: notification.type,
    message: notification.body || notification.title,
    action: onViewDetails && { label: 'View details', onClick: () => onViewDetails(notification) },
  });
}
