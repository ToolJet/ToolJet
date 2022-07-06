import React from 'react';
import cx from 'classnames';
import Spinner from '@/_ui/Spinner';

import { isEmpty } from 'lodash';
import moment from 'moment';
import CommentActions from './CommentActions';
import { hightlightMentionedUserInComment } from '@/_helpers/utils';

moment.updateLocale('en', {
  relativeTime: {
    past: '%s',
    s: 'just now',
  },
});

const CommentBody = ({ socket, thread, isLoading, setEditComment, setEditCommentId, fetchComments }) => {
  const bottomRef = React.useRef();

  const scrollToBottom = () => {
    bottomRef?.current?.scrollIntoView({
      behavior: 'instant',
      block: 'center',
    });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [thread]);

  React.useLayoutEffect(() => {
    scrollToBottom();
  }, []);

  const getContent = () => {
    if (isEmpty(thread)) return <div className="text-center">There are no comments to display</div>;

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return (
      <div className="divide-y">
        {thread.map(({ id, comment, createdAt, user = {} }) => {
          return (
            <div key={id}>
              <div className="d-flex card-title comment-author">
                {`${user?.firstName} ${user?.lastName}`}{' '}
                <CommentActions
                  socket={socket}
                  fetchComments={fetchComments}
                  comment={comment}
                  commentId={id}
                  isCommentOwner={currentUser.id === user.id}
                  setEditComment={setEditComment}
                  setEditCommentId={setEditCommentId}
                />
              </div>

              <div className="card-subtitle comment-time">{moment(createdAt).fromNow()}</div>
              <p
                className="cursor-auto comment-body "
                dangerouslySetInnerHTML={{ __html: hightlightMentionedUserInComment(comment) }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="card-body text-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className={cx('comment-body card-body card-body-scrollable card-body-scrollable-shadow')}>
        {getContent()}
        <div ref={bottomRef} className="list-bottom"></div>
      </div>
    </>
  );
};

export default CommentBody;
