import React from 'react';
import { LeftSidebarItem } from './sidebar-item';
import { ItemTypes } from '@/Editor/ItemTypes';

export const LeftSidebarComment = ({ toggleComments }) => {
  return (
    <LeftSidebarItem
      tip="toggle comments"
      icon={`play`}
      className={`left-sidebar-item sidebar-zoom`}
      onClick={toggleComments}
    />
  );
};
