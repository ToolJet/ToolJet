import React from 'react';
import cx from 'classnames';

import { useSpring, animated } from 'react-spring';
import usePopover from '@/_hooks/use-popover';
import OptionsIcon from './icons/options.svg';
// import OptionsSelectedIcon from './icons/options-selected.svg';

import { commentsService } from '@/_services';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';

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
  const { t } = useTranslation();
  const { appId } = useEditorStore(
    (state) => ({
      appId: state?.appId,
    }),
    shallow
  );

  const handleDelete = async () => {
    await commentsService.deleteComment(commentId);
    fetchComments();
    setOpen(false);
    socket.send(
      JSON.stringify({
        event: 'events',
        data: { message: 'notifications', appId },
      })
    );
  };

  const handleEdit = async () => {
    setEditComment(comment);
    setEditCommentId(commentId);
    setOpen(false);
  };

  return (
    <div className="ms-auto cursor-pointer position-relative comment-action-component">
      {isCommentOwner && (
        <>
          <span {...trigger} className="m-2 comment-option" title="comment options">
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
                {t('globals.edit', 'Edit')}
              </div>
              {/* TODO: Add a popup confirmation on delete */}
              <div className="comment-action border-top" onClick={handleDelete}>
                {t('globals.delete', 'Delete')}
              </div>
            </div>
          </animated.div>
        </>
      )}
    </div>
  );
};

export default CommentActions;
