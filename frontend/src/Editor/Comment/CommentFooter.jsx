import React from 'react';

function CommentFooter() {
  return (
    <div className="card-footer">
      <div className="row align-items-center">
        <div className="col-auto">
          <a href="#">Mark as resolved</a>
        </div>
        <div className="col-auto ms-auto">
          <label className="form-check form-switch m-0">
            <input className="form-check-input position-static" type="checkbox" checked={false} />
          </label>
        </div>
      </div>
    </div>
  );
}

export default CommentFooter;