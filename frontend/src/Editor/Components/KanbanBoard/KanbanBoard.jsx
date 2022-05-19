import React from 'react';
import Board from './Board';

export const KanbanBoard = ({ height, properties, fireEvent }) => {
  console.log('KanbanBoard => ', properties, height);
  return (
    <div className="kanban-container">
      <Board height={height} />
    </div>
  );
};
