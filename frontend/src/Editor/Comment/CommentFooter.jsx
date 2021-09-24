import React from 'react';
import Textarea from '@/_ui/Textarea'

function CommentFooter() {
  return (
    <div className="card-footer">
      <div className="row align-items-center">
        <div className="col-11">
          <Textarea rows="1" className='w-full form-control' placeholder="Type your comment here" />
        </div>
        <div className="col-1">
          <label>
            <img src="/assets/images/icons/editor/comments/send.png" className="form-check-input w-full h-100 position-static" />
          </label>
        </div>
      </div>
    </div>
  );
}

export default CommentFooter;