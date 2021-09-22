import '@/_styles/editor/comments.scss';

import React from 'react';
import cx from 'classnames';
import { useDrag } from 'react-dnd';

import usePopover from '@/_hooks/use-popover';
import { ItemTypes } from '@/Editor/ItemTypes';

const Comments = ({ commentPositions }) => {
  const [placement, setPlacement] = React.useState('left');
  const [open, trigger, content, setOpen] = usePopover(false);
  const [collected, drag] = useDrag(() => ({
    type: ItemTypes.COMMENT,
    item: { name: 'comment' },
  }));

  React.useLayoutEffect(() => {
    const { left } = trigger?.ref?.current?.getBoundingClientRect();

    console.log(trigger?.ref?.current?.getBoundingClientRect());
    if (left < 50) setPlacement('left');
    else setPlacement('right');
  }, [trigger]);

  const [x, y] = commentPositions[0];

  return (
    <div
      ref={drag}
      className="comments"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <label {...trigger} className="form-selectgroup-item">
        <input type="checkbox" name="name" value="sun" className="form-selectgroup-input" checked="" />
        <span className="form-selectgroup-label">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"></path>
          </svg>
        </span>
        <div
          {...content}
          className={cx('card popover comment-popover', {
            'open-left': placement === 'left',
            'open-right': placement === 'right',
            show: open,
            hide: !open,
          })}
        >
          <div className="card-status-start bg-primary" />
          <div className="card-header">
            <div className="avatar-list avatar-list-stacked">
              <span className="avatar avatar-sm avatar-rounded">GG</span>
              <span className="avatar avatar-sm avatar-rounded">2G</span>
              <span className="avatar avatar-sm avatar-rounded">3G</span>
              <span className="avatar avatar-sm avatar-rounded">+3</span>
            </div>
            <span className="ms-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
          </div>
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
        </div>
      </label>
    </div>
  );
};

export default Comments;
