import React from 'react';
import cx from 'classnames';

import { useSpring, animated } from 'react-spring';
import usePopover from '@/_hooks/use-popover';

// import Spinner from '@/_ui/Spinner';

import OptionsIcon from './icons/options.svg';
// import OptionsSelectedIcon from './icons/options-selected.svg';
import UnResolvedIcon from './icons/unresolved.svg';
import ResolvedIcon from './icons/resolved.svg';

import { commentsService } from '@/_services';

const CommentActions = ({
  threadId,
  commentId,
  isResolved,
  comment,
  setEditCommentId,
  setEditComment,
  fetchComments,
}) => {
  const [resolved, setResolved] = React.useState(isResolved);
  // const [spinning, setSpinning] = React.useState(false);
  const [open, trigger, content] = usePopover(false);
  const popoverFadeStyle = useSpring({ opacity: open ? 1 : 0 });

  const handleResolved = async () => {
    // setSpinning(true);
    const { data } = await commentsService.updateThread(threadId, { isResolved: !resolved });
    setResolved(data.isResolved);
    // setSpinning(false);
  };

  const handleDelete = async () => {
    await commentsService.deleteComment(commentId);
    fetchComments();
  };

  const handleEdit = async () => {
    setEditComment(comment);
    setEditCommentId(commentId);
  };

  const getResolveIcon = () => {
    // if (spinning) return <Spinner />;

    if (resolved) return <ResolvedIcon />;

    return <UnResolvedIcon />;
  };

  return (
    <div className="ms-auto cursor-pointer position-relative">
      <span {...trigger} className="m-2" title="comment options">
        <OptionsIcon />
      </span>
      <span title="toggle resolved" onClick={handleResolved}>
        {getResolveIcon()}
      </span>
      <animated.div
        {...content}
        style={popoverFadeStyle}
        className={cx('card popover comment-actions-popover', {
          show: open,
          hide: !open,
        })}
      >
        <div className="divide-y">
          <div className="p-3" onClick={handleEdit}>
            Edit
          </div>
          <div className="p-3" onClick={handleDelete}>
            Delete
          </div>
        </div>
      </animated.div>
    </div>
  );
};

export default CommentActions;
