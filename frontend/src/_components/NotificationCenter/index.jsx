import React from 'react';
import { commentNotificationsService } from '@/_services';
import { Notification } from './Notification';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';
import { useTranslation } from 'react-i18next';

export const NotificationCenter = () => {
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

  return (
    <div className="flex-row nav-item dropdown d-none d-md-flex">
      <a
        href="#"
        className="nav-link px-0 show"
        data-bs-toggle="dropdown"
        tabIndex="-1"
        aria-label="Show notifications"
        aria-expanded="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path>
          <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
        </svg>
        {commentNotifications?.length !== 0 && <span className="notification-center-badge badge bg-red" />}
      </a>
      <div
        className="notification-center dropdown-menu dropdown-menu-arrow dropdown-menu-end dropdown-menu-card"
        data-bs-popper="static"
      >
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">{t('header.notificationCenter.notifications', 'Notifications')}</h1>
            {!loading && commentNotifications?.length > 0 && (
              <a href="#" onClick={updateAllNotifications} className="text-muted text-decoration-none ms-auto">
                Mark all as {isRead && 'un'}read
              </a>
            )}
          </div>
          <div className="list-group list-group-flush list-group-hoverable p-3">
            {!loading &&
              commentNotifications?.map((commentNotification) => (
                <Notification key={commentNotification.id} fetchData={fetchData} {...commentNotification} />
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
            <a href="#" className="text-muted text-decoration-none" onClick={() => setIsRead(!isRead)}>
              {`${t('header.notificationCenter.view', 'View')} ${
                isRead ? t('header.notificationCenter.un', 'un') : ''
              }${t('header.notificationCenter.read', 'read')} ${t(
                `header.notificationCenter.notifications`,
                'notifications'
              ).toLowerCase()}`}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
