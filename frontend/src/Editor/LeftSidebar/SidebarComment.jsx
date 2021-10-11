import React from 'react';
import cx from 'classnames';
import { LeftSidebarItem } from './sidebar-item';

export const LeftSidebarComment = ({ toggleComments }) => {
  const [isActive, toggleActive] = React.useState(false);
  return (
    <LeftSidebarItem
      commentBadge
      tip="toggle comments"
      icon={`comments`}
      className={cx(`left-sidebar-item sidebar-zoom position-relative`, { active: isActive })}
      onClick={() => {
        toggleActive(!isActive);
        toggleComments();
      }}
    />
  );
};
