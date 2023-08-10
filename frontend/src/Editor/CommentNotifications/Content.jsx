import React from 'react';
import cx from 'classnames';
import { isEmpty } from 'lodash';
import { pluralize, hightlightMentionedUserInComment } from '@/_helpers/utils';
import moment from 'moment';
import useRouter from '@/_hooks/use-router';

import Spinner from '@/_ui/Spinner';
import { getPathname } from '@/_helpers/routes';

const Content = ({ notifications, loading, darkMode }) => {
  const router = useRouter();
  const [selectedCommentId, setSelectedCommentId] = React.useState(router.query.commentId);

  React.useEffect(() => {
    if (router.query?.commentId) setSelectedCommentId(router.query?.commentId);
    else setSelectedCommentId('');
  }, [router]);

  const getContent = () => {
    if (isEmpty(notifications))
      return (
        <div className="empty">
          <p className="empty-title">{loading ? <Spinner /> : 'No messages to show'}</p>
        </div>
      );

    return (
      <div className="cursor-pointer">
        {notifications.map(({ comment, count }) => {
          return (
            <div
              className={cx('comment-notification', {
                'comment-notification-selected': selectedCommentId === comment.id,
              })}
              onClick={() => {
                router.push({
                  // react router updates the url with the set basename resulting invalid url unless replaced
                  pathname: getPathname(),
                  search: `?threadId=${comment.thread.id}&commentId=${comment.id}`,
                });
              }}
              key={comment.id}
            >
              <div className="d-flex justify-content-between">
                <span className="comment-notification-user">
                  {`${comment.user?.firstName} ${comment.user?.lastName ?? ''}`}{' '}
                </span>
                <div className={`comment-notification-count ms-auto ${darkMode && 'text-light'}`}>
                  {moment(comment.createdAt).fromNow()}
                </div>
              </div>
              <div
                className="comment-notification-message"
                dangerouslySetInnerHTML={{ __html: hightlightMentionedUserInComment(comment.comment) }}
              />
              <div className="my-2 count">{`${count - 1} replies`}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // TODO: move filter to separate file
  return (
    <div className="comment-card-wrapper">
      <div className="card">
        {!loading && (
          <div className="card-header">
            <sub className={`fw-400 comment-notification-count ${darkMode ? 'text-light' : 'light-gray'}`}>
              Total {pluralize(notifications.length, 'comment')}
            </sub>
          </div>
        )}
        <div>{getContent()}</div>
      </div>
    </div>
  );
};

export default Content;
