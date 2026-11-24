import React from 'react';
import { useNotificationsStore, useNotificationsActions } from '@/_stores/notificationsStore';
import ErrorDetailModal from './ErrorDetailModal';

// Renders the detail modal for whatever notification the store has open, so any page that shows
// notification toasts can offer "View details" by mounting this once.
export default function NotificationDetailHost() {
  const detailNotification = useNotificationsStore((s: { detailNotification: unknown }) => s.detailNotification);
  const actions = useNotificationsActions();
  return (
    <ErrorDetailModal notification={detailNotification} show={!!detailNotification} onClose={actions.closeDetail} />
  );
}
