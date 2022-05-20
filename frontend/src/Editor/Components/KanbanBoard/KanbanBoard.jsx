import React from 'react';
import Board from './Board';

export const KanbanBoard = ({ height, properties, styles }) => {
  console.log('KanbanBoard => ', properties, height);
  const boardData = properties.data ?? [];
  const { visibility, disabledState } = styles;
  return (
    <div style={{ display: visibility ? '' : 'none' }} data-disabled={disabledState} className="kanban-container p-0">
      <Board height={height} data={boardData} isDisable={disabledState} />
    </div>
  );
};
