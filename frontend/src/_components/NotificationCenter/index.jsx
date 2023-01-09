import React from 'react';
import { commentNotificationsService } from '@/_services';
import { Notification } from './Notification';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ToolTip } from '@/_components/ToolTip';

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
        darkMode && 'theme-dark'
      }`}
      data-bs-popper="static"
    >
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">{t('header.notificationCenter.notifications', 'Notifications')}</h1>
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
              <div className="empty-img pb-3">🔔</div>
              <p className="empty-title mb-1">
                {t('header.notificationCenter.youAreCaughtUp', `You're all caught up!`)}
              </p>
              <p className="empty-subtitle text-muted">
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
          <span className="text-muted text-decoration-none cursor-pointer" onClick={() => setIsRead(!isRead)}>
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
      <div className="notification-center-nav-item cursor-pointer">
        <ToolTip message="Comment notifications" placement="right">
          <svg
            className="layout-sidebar-icon"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 21V22C13 22.7956 13.3161 23.5587 13.8787 24.1213C14.4413 24.6839 15.2044 25 16 25C16.7956 25 17.5587 24.6839 18.1213 24.1213C18.6839 23.5587 19 22.7956 19 22V21M14 9C14 8.46957 14.2107 7.96086 14.5858 7.58579C14.9609 7.21071 15.4696 7 16 7C16.5304 7 17.0391 7.21071 17.4142 7.58579C17.7893 7.96086 18 8.46957 18 9C19.1484 9.54303 20.1274 10.3883 20.8321 11.4453C21.5367 12.5023 21.9404 13.7311 22 15V18C22.0753 18.6217 22.2954 19.2171 22.6428 19.7381C22.9902 20.2592 23.4551 20.6914 24 21H8C8.54494 20.6914 9.00981 20.2592 9.35719 19.7381C9.70457 19.2171 9.92474 18.6217 10 18V15C10.0596 13.7311 10.4633 12.5023 11.1679 11.4453C11.8726 10.3883 12.8516 9.54303 14 9Z"
              stroke="#C1C8CD"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ToolTip>
        {commentNotifications?.length !== 0 && <span className="notification-center-badge badge bg-red" />}
      </div>
    </OverlayTrigger>
  );
};
