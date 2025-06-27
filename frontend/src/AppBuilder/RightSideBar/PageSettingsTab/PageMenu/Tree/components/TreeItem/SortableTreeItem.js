import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TreeItem } from './TreeItem';
import { iOS } from '../../utilities';

const animateLayoutChanges = ({ isSorting, wasDragging }) => (isSorting || wasDragging ? false : true);

export function SortableTreeItem({ id, depth, ...props }) {
  const {
    attributes,
    isDragging,
    isSorting,
    listeners,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges,
  });
  const style = props?.disabledBorder
    ? {}
    : {
        transform: CSS.Translate.toString(transform),
        transition,
      };

  return (
    <TreeItem
      ref={setDraggableNodeRef}
      wrapperRef={setDroppableNodeRef}
      style={style}
      depth={depth}
      ghost={isDragging}
      disableSelection={iOS}
      disableInteraction={isSorting}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      {...props}
    />
  );
}
