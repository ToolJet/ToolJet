import React from 'react';
import Textarea from '@/_ui/Textarea';
import Button from '@/_ui/Button';

function CommentFooter({ handleSubmit }) {
  const [comment, setComment] = React.useState('');
  const handleClick = () => {
    handleSubmit(comment);
    setComment('');
  };
  return (
    <div className="card-footer">
      <div className="row align-items-center">
        <div className="col-10">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="1"
            className="w-full form-control"
            placeholder="Type your comment here"
          />
        </div>
        <div className="col-2">
          <Button disabled={!comment} className={`m2 `} onClick={handleClick}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CommentFooter;
