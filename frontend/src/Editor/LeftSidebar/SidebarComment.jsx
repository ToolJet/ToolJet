import React from 'react';
import cx from 'classnames';
import { LeftSidebarItem } from './SidebarItem';

export const LeftSidebarComment = ({ toggleComments, appVersionsId }) => {
  const [isActive, toggleActive] = React.useState(false);
  return (
    <LeftSidebarItem
      tip={appVersionsId ? 'toggle comments' : 'Comments section will be available once you save this application'}
      icon={`comments`}
      className={cx(`left-sidebar-item sidebar-zoom position-relative sidebar-comments`, {
        disabled: !appVersionsId,
        active: isActive,
      })}
      onClick={() => {
        toggleActive(!isActive);
        toggleComments();
      }}
    />
  );
};
