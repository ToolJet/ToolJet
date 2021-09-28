import React from 'react';
import { LeftSidebarItem } from './sidebar-item';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '@/Editor/ItemTypes';

export const LeftSidebarComment = ({ toggleComments }) => {
  const [collected, drag] = useDrag(() => ({
    type: ItemTypes.COMMENT,
    item: { name: 'new-comment' },
  }));
  return (
    <LeftSidebarItem
      ref={drag}
      tip="drag and drop to add comment"
      icon={`play`}
      className={`left-sidebar-item sidebar-zoom`}
      onClick={toggleComments}
    />
  );
};
