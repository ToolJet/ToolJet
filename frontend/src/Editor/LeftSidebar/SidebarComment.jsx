import React from 'react';
import cx from 'classnames';
import { LeftSidebarItem } from './sidebar-item';

export const LeftSidebarComment = ({ toggleComments }) => {
  const [isActive, toggleActive] = React.useState(false);
  return (
    <LeftSidebarItem
      tip="toggle comments"
      icon={`comments`}
      className={cx(`left-sidebar-item sidebar-zoom`, { active: isActive })}
      onClick={() => {
        toggleActive(!isActive);
        toggleComments();
      }}
    />
  );
};
