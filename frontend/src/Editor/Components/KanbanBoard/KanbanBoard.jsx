import React from 'react';
import Board from './Board';

export const KanbanBoard = ({ height, properties }) => {
  console.log('KanbanBoard => ', properties, height);
  return (
    <div className="kanban-container p-0">
      <Board height={height} />
    </div>
  );
};
