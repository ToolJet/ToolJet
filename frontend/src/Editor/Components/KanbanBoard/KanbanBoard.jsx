import React from 'react';
import Board from './Board';

const getData = (columns, cards) => {
  const clonedColumns = [...columns];

  cards.forEach((card) => {
    const column = clonedColumns.find((column) => column.id === card.columnId);
    column.cards = column?.cards ? [...column.cards, card] : [card];
  });

  return columns;
};

export const BoardContext = React.createContext({});

export const KanbanBoard = ({ height, properties, styles, currentState, exposedVariable, setExposedVariable }) => {
  const { columns, cardData } = properties;

  const { visibility, disabledState } = styles;
  const boardData = getData(columns, cardData) ?? [];

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
