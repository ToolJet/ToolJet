import React from 'react';
import Board from './Board';

export const BoardContext = React.createContext({});

export const KanbanBoard = ({ height, properties, styles, currentState, exposedVariable, setExposedVariable }) => {
  console.log('KanbanBoard => ', properties, height);
  const boardData = exposedVariable?.data ?? properties.data;
  const { visibility, disabledState } = styles;

  const updateExposedVariable = (data) => {
    setExposedVariable('data', data);
  };

  return (
    <BoardContext.Provider value={{ currentState }}>
      <div style={{ display: visibility ? '' : 'none' }} data-disabled={disabledState} className="kanban-container p-0">
        <Board
          height={height}
          data={boardData}
          isDisable={disabledState}
          updateExposedVariable={updateExposedVariable}
        />
      </div>
    </BoardContext.Provider>
  );
};
