import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { BrushCleaning, Bell } from 'lucide-react';

import { cn } from '@/lib/utils';
import Spinner from '@/_ui/Spinner';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { IconBellCheck } from '@tabler/icons-react';
import { ToolTip } from '@/_components/ToolTip';
import { useNotificationsStore, useNotificationsActions } from '@/_stores/notificationsStore';
import NotificationRow from './NotificationRow';
import ErrorDetailModal from './ErrorDetailModal';

export const NotificationCenter = ({ darkMode }) => {
  const { items, unreadCount, isLoading, hasMore, loadingMore, detailNotification } = useNotificationsStore((s) => ({
    items: s.items,
    unreadCount: s.unreadCount,
    isLoading: s.isLoading,
    hasMore: s.hasMore,
    loadingMore: s.loadingMore,
    detailNotification: s.detailNotification,
  }));
  const actions = useNotificationsActions();

  const { t } = useTranslation();

  const [showOverlay, setShowOverlay] = useState(false);

  // Refresh badge count on mount + open the live socket (pushes deltas, backfills on reconnect)
  React.useEffect(() => {
    actions.refreshUnread();
    actions.connect();
    return () => actions.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpen = () => {
    actions.fetch('all');
  };

  const handleMarkAllRead = async () => {
    const { error } = await actions.markAllRead();
    if (error) toast.error('Unable to update notifications');
  };

  const handleClearRead = async () => {
    const { error } = await actions.clearRead();
    if (error) toast.error('Unable to clear notifications');
  };

  const handleRemove = async (recipientId) => {
    const { error } = await actions.remove(recipientId);
    if (error) toast.error('Unable to remove notification');
  };

  const hasRead = items.some((n) => n.readAt);

  const overlay = (
    <div
      className={`notification-center dropdown-menu dropdown-menu-arrow dropdown-menu-end dropdown-menu-card ${
        darkMode && 'dark-theme'
      }`}
      data-bs-popper="static"
    >
      <div className="card notifications-card" data-cy="notifications-card">
        <div className="card-header">
          <h1 className="card-title" data-cy="notifications-card-title">
            {t('header.notificationCenter.notifications', 'Notifications')}
          </h1>
          {unreadCount > 0 && <span className="notification-new-pill">{unreadCount} new</span>}
          <div className="notification-header-actions ms-auto">
            <ToolTip message={t('notifications.markAllRead', 'Mark all as read')} placement="bottom">
              <button
                className="notification-header-action"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                aria-label="Mark all as read"
                data-cy="mark-all-read-button"
              >
                <IconBellCheck size={16} />
              </button>
            </ToolTip>
            <ToolTip message={t('notifications.clearRead', 'Clear read notifications')} placement="bottom">
              <button
                className="notification-header-action"
                onClick={handleClearRead}
                disabled={!hasRead}
                aria-label="Clear read notifications"
                data-cy="clear-read-button"
              >
                <BrushCleaning size={16} />
              </button>
            </ToolTip>
          </div>
        </div>
        <div className="list-group list-group-flush list-group-hoverable p-2">
          {!isLoading &&
            items.map((n) => (
              <NotificationRow
                key={n.recipientId}
                notification={n}
                darkMode={darkMode}
                onRemove={handleRemove}
                onMarkRead={actions.markRead}
                onOpen={actions.openDetail}
              />
            ))}
          {!isLoading && items.length === 0 && (
            <div className="empty">
              <div className="empty-img" data-cy="empty-notification-icon">
                {/* design 85:9355 uses lucide/bell-check; lucide-react has no BellCheck yet */}
                <IconBellCheck size={20} color="#ACB2B9" />
              </div>
              <p className="empty-title" data-cy="empty-notification-title">
                {t('notifications.allCaughtUp', "You're all caught up!")}
              </p>
              <p className="empty-subtitle text-muted" data-cy="empty-notification-subtitle">
                {t('notifications.emptyHint', 'Status of background operations will appear here')}
              </p>
            </div>
          )}
          {isLoading && (
            <div className="m-auto spinner">
              <Spinner />
            </div>
          )}
        </div>
        {/* design 70:8193: pinned footer bar below the scroll area — centered label, top border */}
        {!isLoading && hasMore && (
          <button
            className="notification-load-more"
            onClick={actions.loadMore}
            disabled={loadingMore}
            data-cy="load-more-notifications"
          >
            {loadingMore ? t('notifications.loading', 'Loading…') : t('notifications.loadMore', 'Load more')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <OverlayTrigger
        onEntering={handleOpen}
        rootClose
        trigger="click"
        placement="right-end"
        overlay={overlay}
        show={showOverlay}
        onToggle={(newShowOverlayState) => setShowOverlay(newShowOverlayState)}
      >
        {/* Had to use function instead of JSX element directly because button is wrapped inside a tooltip and trigger props contains ref to which element the overlay should be attached */}
        {(triggerProps) => (
          <ToolTip message="Notifications" placement="right">
            <button
              type="button"
              className={cn('tw-relative cursor-pointer tj-leftsidebar-icon-items', {
                active: showOverlay,
              })}
              {...triggerProps}
            >
              <Bell data-cy="notifications-icon" size={16} />
              {unreadCount > 0 && (
                <span className="notification-center-badge badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
          </ToolTip>
        )}
      </OverlayTrigger>
      <ErrorDetailModal notification={detailNotification} show={!!detailNotification} onClose={actions.closeDetail} />
    </>
  );
};
