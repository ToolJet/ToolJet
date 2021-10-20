import React from 'react';
import cx from 'classnames';
import { useSpring, animated } from 'react-spring';

import { useDrag } from 'react-dnd';
import { ItemTypes } from '@/Editor/ItemTypes';
import CommentHeader from '@/Editor/Comment/CommentHeader';
import CommentBody from '@/Editor/Comment/CommentBody';
import CommentFooter from '@/Editor/Comment/CommentFooter';
import usePopover from '@/_hooks/use-popover';
import { commentsService } from '@/_services';
import useRouter from '@/_hooks/use-router';

const Comment = ({ socket, x, y, threadId, user = {}, isResolved, fetchThreads, currentVersionId }) => {
  const [loading, setLoading] = React.useState(true);
  const [editComment, setEditComment] = React.useState('');
  const [editCommentId, setEditCommentId] = React.useState('');
  const [thread, setThread] = React.useState([]);
  const [placement, setPlacement] = React.useState('left');
  const [open, trigger, content, setOpen] = usePopover(false);
  const [, drag] = useDrag(() => ({
    type: ItemTypes.COMMENT,
    item: { threadId, name: 'comment' },
  }));
  const router = useRouter();

  React.useEffect(() => {
    // Listen for messages
    // TODO: add check if user is the initiator of this event, don't fetch data
    socket?.addEventListener('message', function (event) {
      if (event.data === threadId) fetchData();
    });
  }, []);

  React.useLayoutEffect(() => {
    const { left } = trigger?.ref?.current?.getBoundingClientRect();

    if (left < 460) setPlacement('right');
    else setPlacement('left');
  }, [trigger]);

  async function fetchData() {
    const { data } = await commentsService.getComments(threadId, currentVersionId);
    setThread(data);
    setLoading(false);
  }

  React.useEffect(() => {
    if (open) {
      fetchData();
    } else {
      // resetting the query param
      router.push(window.location.pathname);
    }
  }, [open]);

  React.useEffect(() => {
    if (router.query.threadId === threadId) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [router]);

  const handleSubmit = async (comment) => {
    await commentsService.createComment({
      threadId,
      comment,
      currentVersionId,
    });
    socket.send(
      JSON.stringify({
        event: 'events',
        data: threadId,
      })
    );
    fetchData();
  };

  const handleEdit = async (comment, cid) => {
    await commentsService.updateComment(cid, { comment });
    fetchData();
  };

  const commentFadeStyle = useSpring({ from: { opacity: 0 }, to: { opacity: 1 } });
  const popoverFadeStyle = useSpring({ opacity: open ? 1 : 0 });

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  return (
    <>
      <animated.div
        ref={drag}
        id={`thread-${threadId}`}
        className={cx('comments cursor-move', { open: open })}
        style={{
          transform: `translate(${x}px, ${y}px)`,
          ...commentFadeStyle,
        }}
        onDragStart={() => setOpen(false)}
        onDragEnd={() => setOpen(true)}
      >
        <label {...trigger} className="form-selectgroup-item">
          <span
            className={cx('comment cursor-move avatar avatar-sm shadow-lg bg-white avatar-rounded', {
              resolved: isResolved,
            })}
          >
            {`${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`}
          </span>
        </label>
        <animated.div
          {...content}
          style={popoverFadeStyle}
          className={cx('card popover comment-popover', {
            'open-left': placement === 'left',
            'open-right': placement === 'right',
            'comment-is-open': open,
            show: open,
            hide: !open,
          })}
          onClick={(e) => e.stopPropagation()}
        >
          <CommentHeader
            count={thread?.length}
            close={() =>
              setTimeout(() => {
                setOpen(false);
              }, 0)
            }
            threadId={threadId}
            fetchThreads={fetchThreads}
            isThreadOwner={currentUser.id === user.id}
            isResolved={isResolved}
          />
          <CommentBody
            setEditComment={setEditComment}
            setEditCommentId={setEditCommentId}
            fetchComments={fetchData}
            isLoading={loading}
            thread={thread}
          />
          <CommentFooter
            editComment={editComment}
            editCommentId={editCommentId}
            handleSubmit={editCommentId ? handleEdit : handleSubmit}
          />
        </animated.div>
      </animated.div>
      {open && <div className="comment-overlay" onClick={(e) => e.stopPropagation()} />}
    </>
  );
};

export default Comment;
