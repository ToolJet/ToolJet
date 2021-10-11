import React from 'react';
import cx from 'classnames';
import TextareaMentions from '@/_ui/Mentions';
import Button from '@/_ui/Button';
import useShortcuts from '@/_hooks/use-shortcuts';

function CommentFooter({ editComment = '', editCommentId, handleSubmit }) {
  const [comment, setComment] = React.useState(editComment);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    setComment(editComment);
  }, [editComment]);

  const handleClick = async () => {
    setLoading(true);
    await handleSubmit(comment, editCommentId);
    setComment('');
    setLoading(false);
  };
  useShortcuts(['Meta', 'Enter'], () => handleClick(), [comment]);

  return (
    <div className="card-footer">
      <div className="row align-items-center">
        <div className="col-8">
          <TextareaMentions value={comment} setValue={setComment} placeholder="Type your comment here" />
        </div>
        <div className="col-1 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.6665 11.6667C6.6665 11.6667 7.9165 13.3334 9.99984 13.3334C12.0832 13.3334 13.3332 11.6667 13.3332 11.6667M7.5 7.5H7.51M12.5 7.5H12.51M18.3332 10.0001C18.3332 14.6025 14.6022 18.3334 9.99984 18.3334C5.39746 18.3334 1.6665 14.6025 1.6665 10.0001C1.6665 5.39771 5.39746 1.66675 9.99984 1.66675C14.6022 1.66675 18.3332 5.39771 18.3332 10.0001Z"
              stroke="#5E5E5E"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          className={cx('col-3', {
            'cursor-pointer': !!comment,
            'cursor-not-allowed': !comment,
          })}
        >
          <Button loading={loading} disabled={!comment} className={`m2 `} onClick={handleClick}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CommentFooter;
