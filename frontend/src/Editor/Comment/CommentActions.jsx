import React from 'react';
import cx from 'classnames';

import { useSpring, animated } from 'react-spring';
import usePopover from '@/_hooks/use-popover';

import OptionsIcon from './icons/options.svg';
// import OptionsSelectedIcon from './icons/options-selected.svg';
import useRouter from '@/_hooks/use-router';

import { commentsService } from '@/_services';

const CommentActions = ({
  socket,
  commentId,
  comment,
  setEditCommentId,
  setEditComment,
  fetchComments,
  isCommentOwner,
}) => {
  const [open, trigger, content, setOpen] = usePopover(false);
  const popoverFadeStyle = useSpring({ opacity: open ? 1 : 0 });
  const router = useRouter();

  const handleDelete = async () => {
    await commentsService.deleteComment(commentId);
    fetchComments();
    setOpen(false);
    socket.send(
      JSON.stringify({
        event: 'events',
        data: { message: 'notifications', appId: router.query.id },
      })
    );
  };

  const handleEdit = async () => {
    setEditComment(comment);
    setEditCommentId(commentId);
    setOpen(false);
  };

  return (
    <div className="ms-auto cursor-pointer position-relative">
      {isCommentOwner && (
        <>
          <span {...trigger} className="m-2" title="comment options">
            <OptionsIcon />
          </span>
          <animated.div
            {...content}
            style={popoverFadeStyle}
            className={cx('card popover comment-actions-popover', {
              show: open,
              hide: !open,
            })}
          >
            <div>
              <div className="comment-action" onClick={handleEdit}>
                Edit
              </div>
              {/* TODO: Add a popup confirmation on delete */}
              <div className="comment-action border-top" onClick={handleDelete}>
                Delete
              </div>
            </div>
          </animated.div>
        </>
      )}
    </div>
  );
};

export default CommentActions;
