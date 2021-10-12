import React from 'react';
import { isEmpty } from 'lodash';
import { pluralize } from '@/_helpers/utils';
import moment from 'moment';

const Content = ({ notifications }) => {
  return (
    <div className="card">
      <div className="card-header">
        <sub className="fw-400 light-gray">Total {pluralize(notifications.length, 'comment')}</sub>
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
      <div className="card-body">
        <div className="divide-y">
          {notifications.map((notification) => {
            return (
              <div key={notification.id}>
                <div className="d-flex justify-content-between">
                  <h3>{`${notification.user?.firstName} ${notification.user?.lastName}`} </h3>
                  <div className="ms-auto">{moment(notification.createdAt).fromNow()}</div>
                </div>
                <div>{notification.comment}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Content;
