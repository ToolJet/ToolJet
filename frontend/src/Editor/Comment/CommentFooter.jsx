import React from 'react';
import Textarea from '@/_ui/Textarea'

import { commentsService } from '@/_services';

function CommentFooter({ handleSubmit }) {
  const [comment, setComment] = React.useState('')
  const handleClick = () => {
    handleSubmit(comment)
    setComment('')
  }
  return (
    <div className="card-footer">
      <div className="row align-items-center">
        <div className="col-11">
          <Textarea value={comment} onChange={e => setComment(e.target.value)} rows="1" className='w-full form-control' placeholder="Type your comment here" />
        </div>
        <div className="col-1">
          <label>
            <img onClick={handleClick} src="/assets/images/icons/editor/comments/send.png" className="form-check-input w-full h-100 position-static" />
          </label>
        </div>
      </div>
    </div>
  );
}

export default CommentFooter;