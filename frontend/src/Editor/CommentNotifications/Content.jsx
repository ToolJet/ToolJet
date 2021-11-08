import React from 'react';
import cx from 'classnames';
import { isEmpty } from 'lodash';
import { pluralize } from '@/_helpers/utils';
import moment from 'moment';
import usePopover from '@/_hooks/use-popover';
import { useSpring, animated } from 'react-spring';
import useRouter from '@/_hooks/use-router';

import Spinner from '@/_ui/Spinner';

const Content = ({ notifications, loading }) => {
  const router = useRouter();
  const [selectedCommentId, setSelectedCommentId] = React.useState(router.query.commentId);
  const [open, trigger, content] = usePopover(false);
  const popoverFadeStyle = useSpring({ opacity: open ? 1 : 0 });

  React.useEffect(() => {
    if (router.query?.commentId) setSelectedCommentId(router.query?.commentId);
    else setSelectedCommentId('');
  }, [router]);

  const getComment = (comment) => {
    var regex = /(\()([^)]+)(\))/g;
    return comment.replace(regex, '<span class=mentioned-user>$2</span>');
  };

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
                  pathname: window.location.pathname,
                  search: `?threadId=${comment.thread.id}&commentId=${comment.id}`,
                });
              }}
              key={comment.id}
            >
              <div className="d-flex justify-content-between">
                <span className="comment-notification-user">
                  {`${comment.user?.firstName} ${comment.user?.lastName}`}{' '}
                </span>
                <div className="comment-notification-count ms-auto">{moment(comment.createdAt).fromNow()}</div>
              </div>
              <div
                className="comment-notification-message"
                dangerouslySetInnerHTML={{ __html: getComment(comment.comment) }}
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
    <div className="card">
      {!loading && (
        <div className="card-header">
          <sub className="fw-400 comment-notification-count light-gray">
            Total {pluralize(notifications.length, 'comment')}
          </sub>
          {/* <div className="ms-auto position-relative">
          <svg {...trigger} width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14.3333 1H1L6.33333 7.30667V11.6667L9 13V7.30667L14.3333 1Z"
              stroke="#5E5E5E"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <animated.div
            {...content}
            style={popoverFadeStyle}
            className={cx('card popover comment-notification-filter-popover', {
              show: open,
              hide: !open,
            })}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="d-flex mb-3">
                <span>Show all</span>
                <div className="ms-auto">
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M0.799988 4.5999L4.39999 8.1999L11.2 1.3999"
                      stroke="#0565FF"
                      strokeWidth="1.06667"
                      strokeLinecap="square"
                    />
                  </svg>
                </div>
              </div>
              <div className="d-flex">
                <span>Only mention of you</span>
                <div className="ms-auto">
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M0.799988 4.5999L4.39999 8.1999L11.2 1.3999"
                      stroke="#0565FF"
                      strokeWidth="1.06667"
                      strokeLinecap="square"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </animated.div>
        </div> */}
        </div>
      )}
      <div>{getContent()}</div>
    </div>
  );
};

export default Content;
