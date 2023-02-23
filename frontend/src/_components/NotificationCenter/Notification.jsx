import React from 'react';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import { commentNotificationsService } from '@/_services';
import { hightlightMentionedUserInComment, appendWorkspaceId, getWorkspaceId } from '@/_helpers/utils';

export const Notification = ({ id, creator, comment, updatedAt, commentLink, isRead, fetchData, darkMode }) => {
  const updateMentionedNotification = async () => {
    const { error } = await commentNotificationsService.update(id, !isRead);
    if (error) {
      toast.error('Unable to update notification');
      return;
    }
    fetchData();
  };

  const getNewCommentLink = () => {
    const url = new URL(commentLink);
    url.pathname = appendWorkspaceId(getWorkspaceId(), url.pathname);
    return url;
  };

  const updated = moment(updatedAt).fromNow();
  return (
    <div className="list-group-item" style={{ paddingLeft: 0 }}>
      <a className="text-muted text-decoration-none" href={getNewCommentLink()} target="_blank" rel="noreferrer">
        <div className="row">
          <div className="col-auto">
            {creator?.avatar ? (
              <span
                className="avatar avatar-rounded bg-secondary-lt"
                style={{ backgroundImage: `url('data:image/png;base64, ${creator.avatar}')` }}
              />
            ) : (
              <span className="avatar avatar-rounded bg-secondary-lt">
                {creator.firstName.charAt(0)} {creator?.lastName?.charAt(0)}
              </span>
            )}
          </div>
          <div className={`col text-truncate ${darkMode && 'text-white'}`}>
            {creator.firstName} mentioned you
            <div
              className="d-block  text-truncate mt-n1"
              dangerouslySetInnerHTML={{ __html: hightlightMentionedUserInComment(comment) }}
            />
            <div className="text-truncate mt-n1">
              <span>{updated === 'just now' ? updated : `${updated} ago`}</span>
            </div>
          </div>
          <div className="col-auto">
            <a href="#" onClick={updateMentionedNotification} className="list-group-item-actions">
              <svg
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="close-svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.99931 10.9751L15.0242 16.0014L16 15.027L10.9737 10.0007L16 4.97577L15.0256 4L9.99931 9.0263L4.97439 4L4 4.97577L9.02492 10.0007L4 15.0256L4.97439 16.0014L9.99931 10.9751Z"
                  fill="#8092AC"
                />
              </svg>
            </a>
          </div>
        </div>
      </a>
    </div>
  );
};
