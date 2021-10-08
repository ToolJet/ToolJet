import React from 'react';
import TextareaMentions from '@/_ui/Mentions';
import Button from '@/_ui/Button';

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
  return (
    <div className="card-footer">
      <div className="row align-items-center">
        <div className="col-10">
          <TextareaMentions value={comment} setValue={setComment} placeholder="Type your comment here" />
        </div>
        <div className="col-2">
          <Button loading={loading} disabled={!comment} className={`m2 `} onClick={handleClick}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CommentFooter;
