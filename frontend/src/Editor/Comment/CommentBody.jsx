import React from 'react';

const CommentBody = () => {
  return (
    <div className="card-body card-body-scrollable card-body-scrollable-shadow">
      {/* <div className="card-subtitle mt-1">2 comments</div> */}
      <div className="divide-y">
        <div>
          <div className="card-title">Gandharv</div>
          <div className="card-subtitle">2 hours ago</div>

          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam deleniti fugit incidunt, iste,
            itaque minima neque pariatur perferendis sed suscipit velit vitae voluptatem.
          </p>
        </div>
        <div>
          <div className="card-title">Gandharv</div>
          <div className="card-subtitle">2 hours ago</div>

          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam deleniti fugit incidunt, iste,
            itaque minima neque pariatur perferendis sed suscipit velit vitae voluptatem.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CommentBody;