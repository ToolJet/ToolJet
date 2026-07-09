import React from 'react';
import toast from 'react-hot-toast';

const TOAST_MS = 5000;

// Arrival toast for live notifications flagged toast:true — never from REST backfill.
// Rides the app's standard react-hot-toast look; optional "View details" opens the detail.
export function showNotificationToast(notification, { onViewDetails } = {}) {
  const message = (t) => (
    <span>
      {notification.body || notification.title}
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

  const opts = { duration: TOAST_MS };
  if (notification.type === 'success') return toast.success(message, opts);
  if (notification.type === 'error') return toast.error(message, opts);
  return toast(message, opts);
}
