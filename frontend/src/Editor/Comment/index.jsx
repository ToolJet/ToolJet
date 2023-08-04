import React from 'react';
import cx from 'classnames';

import { useDrag } from 'react-dnd';
import { ItemTypes } from '@/Editor/ItemTypes';
import CommentHeader from '@/Editor/Comment/CommentHeader';
import CommentBody from '@/Editor/Comment/CommentBody';
import CommentFooter from '@/Editor/Comment/CommentFooter';
import usePopover from '@/_hooks/use-popover';
import { commentsService, organizationService, authenticationService } from '@/_services';
import useRouter from '@/_hooks/use-router';
import DOMPurify from 'dompurify';
import { capitalize } from 'lodash';

const Comment = ({
  socket,
  x,
  y,
  threadId,
  user = {},
  isResolved,
  fetchThreads,
  appVersionsId,
  canvasWidth,
  appId,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [editComment, setEditComment] = React.useState('');
  const [editCommentId, setEditCommentId] = React.useState('');
  const [thread, setThread] = React.useState([]);
  const [mentionedUsers, setMentionedUsers] = React.useState([]);
  const [placement, setPlacement] = React.useState('left');
  const [open, trigger, content, setOpen] = usePopover(false);
  const [, drag] = useDrag(() => ({
    type: ItemTypes.COMMENT,
    item: { threadId, name: 'comment' },
  }));
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState();

  React.useEffect(() => {
    // Listen for messages
    // TODO: add check if user is the initiator of this event, don't fetch data
    const currentSession = authenticationService.currentSessionValue;
    const currentUser = currentSession?.current_user;
    setCurrentUser(currentUser);

    socket?.addEventListener('message', function (event) {
      if (event.data === threadId) fetchData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useLayoutEffect(() => {
    // eslint-disable-next-line no-unsafe-optional-chaining
    const { left } = trigger?.ref?.current?.getBoundingClientRect();

    if (left < 460) setPlacement('right');
    else setPlacement('left');
  }, [trigger]);

  async function fetchData() {
    const { data } = await commentsService.getComments(threadId, appVersionsId);
    setThread(data);
    setLoading(false);
  }

  React.useEffect(() => {
    if (open) {
      fetchData();
    } else {
      // resetting the query param
      // react router updates the url with the set basename resulting invalid url unless replaced
      router.history(window.location.pathname.replace(window.public_config?.SUB_PATH, '/'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (router.query.threadId === threadId) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSubmit = async (comment) => {
    await commentsService.createComment({
      threadId,
      comment: DOMPurify.sanitize(comment),
      appVersionsId,
      mentionedUsers,
    });
    socket.send(
      JSON.stringify({
        event: 'events',
        data: { message: threadId, appId },
      })
    );
    socket.send(
      JSON.stringify({
        event: 'events',
        data: { message: 'notifications', appId },
      })
    );
    fetchData();
  };

  const handleEdit = async (comment, cid) => {
    await commentsService.updateComment(cid, { comment: DOMPurify.sanitize(comment) });
    fetchData();
    socket.send(
      JSON.stringify({
        event: 'events',
        data: { message: 'notifications', appId },
      })
    );
  };

  const searchUser = (query, callback) => {
    if (!query) {
      return;
    }
    organizationService
      .getUsersByValue(query)
      .then((data) =>
        data.users.map((u) => ({
          id: u.user_id,
          display: `${capitalize(u.first_name ?? '')} ${capitalize(u.last_name ?? '')}`,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
        }))
      )
      .then(callback);
  };

  return (
    <>
      <div
        ref={drag}
        id={`thread-${threadId}`}
        className={cx('comments cursor-move', { open })}
        style={{
          transform: `translate(${(x * canvasWidth) / 100}px, ${y}px)`,
        }}
        onDragStart={() => setOpen(false)}
        onDragEnd={() => setOpen(true)}
      >
        <label {...trigger} className="form-selectgroup-item">
          <span
            className={cx('comment cursor-move avatar avatar-sm shadow-lg bg-white avatar-rounded', {
              resolved: isResolved,
              'comment-open': open,
            })}
          >
            {`${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`}
          </span>
        </label>
        <div
          {...content}
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
            socket={socket}
            threadId={threadId}
            fetchThreads={fetchThreads}
            isThreadOwner={currentUser?.id === user.id}
            isResolved={isResolved}
            appId={appId}
          />
          <CommentBody
            socket={socket}
            setEditComment={setEditComment}
            setEditCommentId={setEditCommentId}
            fetchComments={fetchData}
            isLoading={loading}
            thread={thread}
            currentUser={currentUser}
          />
          <CommentFooter
            searchUser={searchUser}
            setMentionedUsers={setMentionedUsers}
            editComment={editComment}
            editCommentId={editCommentId}
            setEditCommentId={setEditCommentId}
            handleSubmit={editCommentId ? handleEdit : handleSubmit}
          />
        </div>
      </div>
      {open && <div className="comment-overlay" onClick={(e) => e.stopPropagation()} />}
    </>
  );
};

export default Comment;
