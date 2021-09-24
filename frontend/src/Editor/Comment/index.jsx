import React from 'react';
import cx from 'classnames';
import { useSpring, animated } from 'react-spring'

import { useDrag } from 'react-dnd';
import { ItemTypes } from '@/Editor/ItemTypes';
import CommentHeader from '@/Editor/Comment/CommentHeader';
import CommentBody from '@/Editor/Comment/CommentBody';
import CommentFooter from '@/Editor/Comment/CommentFooter';
import usePopover from '@/_hooks/use-popover';

const Comment = ({ x, y, commentId }) => {
  const [placement, setPlacement] = React.useState('left');
  const [open, trigger, content, setOpen] = usePopover(false);
  const [collected, drag] = useDrag(() => ({
    type: ItemTypes.COMMENT,
    item: { name: 'comment' },
  }));

  React.useLayoutEffect(() => {
    const { left } = trigger?.ref?.current?.getBoundingClientRect();

    console.log(trigger?.ref?.current?.getBoundingClientRect());
    if (left < 100) setPlacement('right');
    else setPlacement('left');
  }, [trigger]);

  const commentFadeStyle = useSpring({ from: { opacity: 0 }, to: { opacity: 1 } })
  const popoverFadeStyle = useSpring({ opacity: open ? 1 : 0 })

  return (
    <animated.div
      ref={drag}
      className={cx("comments cursor-move", { 'open': open })}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        ...commentFadeStyle
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
        <animated.div
          {...content}
          style={popoverFadeStyle}
          className={cx('card popover comment-popover', {
            'open-left': placement === 'left',
            'open-right': placement === 'right',
            show: open,
            hide: !open,
          })}
        >
          <div className="card-status-start bg-primary" />
          <CommentHeader />
          <CommentBody />
          <CommentFooter />
        </animated.div>
      </label>
    </animated.div>
  );
};

export default Comment;
