import React, { useMemo } from 'react';
import Board from './Board';

const getData = (columns, cards) => {
  if (
    Object.prototype.toString.call(cards).slice(8, -1) === 'Array' &&
    Object.prototype.toString.call(columns).slice(8, -1) === 'Array'
  ) {
    const clonedColumns = [...columns];
    cards.forEach((card) => {
      const column = clonedColumns.find((column) => column.id === card.columnId);
      if (column) {
        column['cards'] = column?.cards ? [...column.cards, card] : [card];
      }
    });

    return clonedColumns;
  }
  return null;
};

export const BoardContext = React.createContext({});

export const KanbanBoard = ({ height, properties, styles, currentState, setExposedVariable }) => {
  const { columns, cardData } = properties;

  const { visibility, disabledState, width, minWidth } = styles;
  const boardData = useMemo(() => getData(columns, cardData), [columns, cardData]) ?? [];

  const updateExposedVariable = (data) => {
    setExposedVariable('data', data);
  };

  const colStyles = {
    width: !width ? '100%' : width,
    minWidth: !minWidth ? '350px' : minWidth,
  };

  return (
    <BoardContext.Provider value={{ currentState }}>
      <div style={{ display: visibility ? '' : 'none' }} data-disabled={disabledState} className="kanban-container p-0">
        <Board
          height={height}
          data={boardData}
          isDisable={disabledState}
          updateExposedVariable={updateExposedVariable}
          colStyles={colStyles}
        />
      </div>
    </BoardContext.Provider>
  );
};
