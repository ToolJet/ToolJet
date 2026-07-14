import React from 'react';
import toast from 'react-hot-toast';

const TOAST_MS = 5000;

// Arrival toast for live notifications flagged toast:true — never from REST backfill.
// Rides the app's standard react-hot-toast look; optional "View details" opens the detail.
export function showNotificationToast(notification, { onViewDetails } = {}) {
  // design 70:6926: message + bordered secondary button on one row
  const message = (t) => (
    <span className="notification-toast-row">
      <span className="notification-toast-body">{notification.body || notification.title}</span>
      {onViewDetails && (
        <button
          className="notification-toast-view"
          onClick={() => {
            toast.dismiss(t.id);
            onViewDetails(notification);
          }}
        >
          View details
        </button>
      )}
    </span>
  );

  // react-hot-toast caps toasts at 350px — too narrow for message + action on one line (design 70:6926)
  const opts = { duration: TOAST_MS, style: { maxWidth: '640px' } };
  if (notification.type === 'success') return toast.success(message, opts);
  if (notification.type === 'error') return toast.error(message, opts);
  return toast(message, opts);
}
