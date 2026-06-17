import React from 'react';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useNotificationsStore, useNotificationsActions } from '@/_stores/notificationsStore';
import NotificationRow from './NotificationRow';
import ErrorDetailModal from './ErrorDetailModal';

export const NotificationCenter = ({ darkMode }) => {
  const { items, unreadCount, isLoading } = useNotificationsStore((s) => ({
    items: s.items,
    unreadCount: s.unreadCount,
    isLoading: s.isLoading,
  }));
  const actions = useNotificationsActions();
  const [detail, setDetail] = React.useState(null);

  const { t } = useTranslation();

  // Refresh badge count on mount
  React.useEffect(() => {
    actions.refreshUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called when dropdown opens
  const handleOpen = () => {
    actions.fetch('all');
  };

  const handleMarkAllRead = async () => {
    const { error } = await actions.markAllRead();
    if (error) toast.error('Unable to update notifications');
  };

  const overlay = (
    <div
      className={`notification-center dropdown-menu dropdown-menu-arrow dropdown-menu-end !tw-rounded-lg dropdown-menu-card ${
        darkMode && 'dark-theme'
      }`}
      data-bs-popper="static"
    >
      <div className="card notifications-card" data-cy="notifications-card">
        <div className="card-header">
          <h1 className="card-title" data-cy="notifications-card-title">
            {t('header.notificationCenter.notifications', 'Notifications')}
          </h1>
          {!isLoading && items.length > 0 && (
            <span onClick={handleMarkAllRead} className="text-decoration-none cursor-pointer ms-auto">
              {t('notifications.markAllRead', 'Mark all as read')}
            </span>
          )}
        </div>
        <div className="list-group list-group-flush list-group-hoverable p-3">
          {!isLoading &&
            items.map((n) => (
              <NotificationRow
                key={n.recipientId}
                notification={n}
                darkMode={darkMode}
                onDismiss={actions.markRead}
                onOpenDetail={setDetail}
              />
            ))}
          {!isLoading && items.length === 0 && (
            <div className="empty">
              <div className="empty-img pb-3" data-cy="empty-notification-icon">
                🔔
              </div>
              <p className="empty-title mb-1" data-cy="empty-notification-title">
                {t('notifications.empty', 'No notifications')}
              </p>
            </div>
          )}
          {isLoading && (
            <div className="m-auto spinner">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <OverlayTrigger onEntering={handleOpen} rootClose trigger="click" placement="right" overlay={overlay}>
        <div>
          <ToolTip message="Notifications" placement="right">
            <div className="notification-center-nav-item cursor-pointer tj-leftsidebar-icon-items">
              <SolidIcon data-cy="notifications-icon" name="notification" fill="var(--slate8)" />
              {unreadCount > 0 && (
                <span className="notification-center-badge badge bg-red">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
          </ToolTip>
        </div>
      </OverlayTrigger>
      <ErrorDetailModal notification={detail} show={!!detail} onClose={() => setDetail(null)} />
    </>
  );
};
