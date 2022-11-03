import React from 'react';
import cx from 'classnames';

export const ListGroupItem = ({ active, handleClick, text }) => {
  return (
    <div
      className={cx('list-group-item list-group-item-action d-flex align-items-center cursor-pointer', {
        active,
      })}
      onClick={handleClick}
    >
      {text}
    </div>
  );
};
