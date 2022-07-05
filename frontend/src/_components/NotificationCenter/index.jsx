import React from 'react';
import { commentsService } from '@/_services';
import { Notification } from './Notification';
import Spinner from '@/_ui/Spinner';

export const NotificationCenter = () => {
  const [loading, setLoading] = React.useState(false);
  const [isRead, setIsRead] = React.useState(false);
  const [commentNotifications, setcommentNotifications] = React.useState([]);

  async function fetchData() {
    setLoading(true);
    const { data } = await commentsService.getMentionedNotifications(isRead);
    setLoading(false);
    setcommentNotifications(data);
  }

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
        {commentNotifications.length !== 0 && <spa style={{ top: 10, right: 10 }} className="badge bg-red" />}
      </a>
      <div
        className="notification-center dropdown-menu dropdown-menu-arrow dropdown-menu-end dropdown-menu-card"
        data-bs-popper="static"
      >
        <div className="card" style={{ minWidth: 400 }}>
          <div className="card-header">
            <h1 className="card-title">Notifications</h1>
          </div>
          <div className="list-group list-group-flush list-group-hoverable p-3">
            {commentNotifications.map((commentNotification) => (
              <Notification key={commentNotification.id} fetchData={fetchData} {...commentNotification} />
            ))}
            {!loading && commentNotifications.length === 0 && (
              <div className="empty">
                <div className="empty-img pb-3" style={{ fontSize: '2.5em' }}>
                  🔔
                </div>
                <p className="empty-title mb-1">You&apos;re all caught up!</p>
                <p className="empty-subtitle text-muted">
                  You don&apos;t have any {!isRead && 'un'}read notifications!
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
            <a href="#" className="text-muted" onClick={() => setIsRead(!isRead)}>
              View {isRead && 'un'}read notifications
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
