import React from 'react';
import cx from 'classnames';

import { useSpring, animated } from 'react-spring';
import usePopover from '@/_hooks/use-popover';

const CommentActions = () => {
  const [open, trigger, content] = usePopover(false);
  const popoverFadeStyle = useSpring({ opacity: open ? 1 : 0 });

  console.log('here', open);
  return (
    <>
      <div {...trigger} className="ms-auto cursor-pointer position-relative">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7.99992 8.66659C8.36811 8.66659 8.66659 8.36811 8.66659 7.99992C8.66659 7.63173 8.36811 7.33325 7.99992 7.33325C7.63173 7.33325 7.33325 7.63173 7.33325 7.99992C7.33325 8.36811 7.63173 8.66659 7.99992 8.66659Z"
            stroke="black"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.6667 8.66659C13.0349 8.66659 13.3333 8.36811 13.3333 7.99992C13.3333 7.63173 13.0349 7.33325 12.6667 7.33325C12.2985 7.33325 12 7.63173 12 7.99992C12 8.36811 12.2985 8.66659 12.6667 8.66659Z"
            stroke="black"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.33329 8.66659C3.70148 8.66659 3.99996 8.36811 3.99996 7.99992C3.99996 7.63173 3.70148 7.33325 3.33329 7.33325C2.9651 7.33325 2.66663 7.63173 2.66663 7.99992C2.66663 8.36811 2.9651 8.66659 3.33329 8.66659Z"
            stroke="black"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <animated.div
        {...content}
        style={popoverFadeStyle}
        className={cx('card popover comment-actions-popover', {
          show: open,
          hide: !open,
        })}
      >
        <div className="card-status-start bg-primary" />
      </animated.div>
    </>
  );
};

export default CommentActions;
