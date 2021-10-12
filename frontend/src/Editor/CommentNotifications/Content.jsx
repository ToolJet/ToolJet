import React from 'react';
import { isEmpty } from 'lodash';
import { pluralize } from '@/_helpers/utils';
import moment from 'moment';

const Content = ({ notifications }) => {
  const getContent = () => {
    if (isEmpty(notifications))
      return (
        <div className="empty">
          <p className="empty-title">No messages to show</p>
        </div>
      );

    return (
      <div className="divide-y">
        {notifications.map((notification) => {
          return (
            <div className="comment-notification comment-notification-selected" key={notification.id}>
              <div className="d-flex justify-content-between">
                <span className="comment-notification-user">
                  {`${notification.user?.firstName} ${notification.user?.lastName}`}{' '}
                </span>
                <div className="comment-notification-count ms-auto">{moment(notification.createdAt).fromNow()}</div>
              </div>
              <div className="comment-notification-message">{notification.comment}</div>
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div className="card">
      <div className="card-header">
        <sub className="fw-400 comment-notification-count light-gray">
          Total {pluralize(notifications.length, 'comment')}
        </sub>
        <div className="ms-auto">
          <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14.3333 1H1L6.33333 7.30667V11.6667L9 13V7.30667L14.3333 1Z"
              stroke="#5E5E5E"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div>{getContent()}</div>
    </div>
  );
};

export default Content;
