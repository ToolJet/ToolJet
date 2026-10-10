import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export const Trash = ({ id, deleteLabel, dataCy, shadcn = false, dragging = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // The shadcn/ui style shows the zone only while a card is dragged; the default style keeps it on screen.
  if (shadcn) {
    return (
      <div
        ref={setNodeRef}
        className={`kanban-trash skin-shadcn${dragging ? ' dragging' : ''}${isOver ? ' over' : ''}`}
        data-cy={dataCy}
      >
        {deleteLabel}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        left: '50%',
        marginLeft: -150,
        bottom: 20,
        width: 300,
        height: 60,
        borderRadius: 5,
        border: '1px solid',
        borderColor: isOver ? 'red' : '#DDD',
      }}
      data-cy={dataCy}
    >
      {deleteLabel}
    </div>
  );
};
