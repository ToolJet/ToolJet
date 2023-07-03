import React from 'react';
import { commentNotificationsService } from '@/_services';
import { Notification } from './Notification';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const NotificationCenter = ({ darkMode }) => {
  const [loading, setLoading] = React.useState(false);
  const [isRead, setIsRead] = React.useState(false);
  const [commentNotifications, setCommentNotifications] = React.useState([]);

  const { t } = useTranslation();
  async function fetchData() {
    setLoading(true);
    const { data, error } = await commentNotificationsService.findAll(isRead);
    setLoading(false);
    if (error) {
      toast.error('Unable to fetch notifications');
      return;
    }
    setCommentNotifications(data);
  }

  const updateAllNotifications = async () => {
    setLoading(true);
    const { error } = await commentNotificationsService.updateAll(!isRead);
    setLoading(false);
    if (error) {
      toast.error('Unable to update notifications');
      return;
    }
    fetchData();
  };

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRead]);

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
          {!loading && commentNotifications?.length > 0 && (
            <span onClick={updateAllNotifications} className="text-decoration-none cursor-pointer ms-auto">
              Mark all as {isRead && 'un'}read
            </span>
          )}
        </div>
        <div className="list-group list-group-flush list-group-hoverable p-3">
          {!loading &&
            commentNotifications?.map((commentNotification) => (
              <Notification
                key={commentNotification.id}
                fetchData={fetchData}
                {...commentNotification}
                darkMode={darkMode}
              />
            ))}
          {!loading && commentNotifications.length === 0 && (
            <div className="empty">
              <div className="empty-img pb-3" data-cy="empty-notification-icon">
                🔔
              </div>
              <p className="empty-title mb-1" data-cy="empty-notification-title">
                {t('header.notificationCenter.youAreCaughtUp', `You're all caught up!`)}
              </p>
              <p className="empty-subtitle text-muted" data-cy="empty-notification-subtitle">
                {`${t('header.notificationCenter.youDontHaveany', `You don't have any`)} ${
                  !isRead ? t('header.notificationCenter.un', 'un') : ''
                }${t('header.notificationCenter.read', 'read')} ${t(
                  `header.notificationCenter.notifications`,
                  'notifications'
                ).toLowerCase()}!
              `}
              </p>
            </div>
          )}
          {loading && (
            <div className="m-auto spinner">
              <Spinner />
            </div>
          )}
        </div>
        <div className="card-footer text-center margin-auto">
          <span
            className="text-muted text-decoration-none cursor-pointer"
            onClick={() => setIsRead(!isRead)}
            data-cy="notifications-card-footer"
          >
            {`${t('header.notificationCenter.view', 'View')} ${
              isRead ? t('header.notificationCenter.un', 'un') : ''
            }${t('header.notificationCenter.read', 'read')} ${t(
              `header.notificationCenter.notifications`,
              'notifications'
            ).toLowerCase()}`}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <OverlayTrigger rootClose trigger="click" placement="right" overlay={overlay}>
      <div>
        <ToolTip message="Comment notifications" placement="right">
          <div className="notification-center-nav-item cursor-pointer tj-leftsidebar-icon-items">
            <SolidIcon data-cy="notifications-icon" name="notification" fill={darkMode ? '#4C5155' : '#C1C8CD'} />
            {commentNotifications?.length !== 0 && <span className="notification-center-badge badge bg-red" />}
          </div>
        </ToolTip>
      </div>
    </OverlayTrigger>
  );
};
