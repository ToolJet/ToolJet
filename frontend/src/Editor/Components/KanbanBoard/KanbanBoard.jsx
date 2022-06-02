import React, { useState } from 'react';
import Board from './Board';
import { CardEventPopover } from './CardPopover';
import { isCardColoumnIdUpdated, updateCardData, updateColumnData } from './utils';

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

export const KanbanBoard = ({
  id,
  height,
  properties,
  styles,
  currentState,
  setExposedVariable,
  containerProps,
  removeComponent,
}) => {
  const { columns, cardData, enableAddCard } = properties;

  const { visibility, disabledState, width, minWidth, accentColor } = styles;

  const [rawColumnData, setRawColumnData] = React.useState([]);
  const [rawCardData, setRawCardData] = React.useState([]);

  const [state, setState] = React.useState(() => getData(columns, cardData) ?? []);

  React.useEffect(() => {
    setExposedVariable('data', state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  React.useEffect(() => {
    if (JSON.stringify(columns) !== JSON.stringify(rawColumnData)) {
      const newData = updateColumnData(state, rawColumnData, columns);

      if (newData && Object.prototype.toString.call(newData).slice(8, -1) === 'Array') {
        setState(newData);
      }
      setRawColumnData(columns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  React.useEffect(() => {
    if (JSON.stringify(cardData) !== JSON.stringify(rawCardData)) {
      const isColumnIdUpdated = isCardColoumnIdUpdated(rawCardData, cardData);

      if (isColumnIdUpdated) {
        const newData = getData(columns, cardData);
        if (newData && Object.prototype.toString.call(newData).slice(8, -1) === 'Array') {
          setState(newData);
        }
      }

      if (!isColumnIdUpdated) {
        const newData = updateCardData(state, rawCardData, cardData);
        if (newData && Object.prototype.toString.call(newData).slice(8, -1) === 'Array') {
          setState(newData);
        }
      }

      setRawCardData(cardData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardData]);

  const colStyles = {
    width: !width ? '100%' : width,
    minWidth: !minWidth ? '350px' : minWidth,
  };

  if (state.length === 0) {
    return (
      <div className="mx-auto w-50 p-5 bg-light no-components-box" style={{ marginTop: '15%' }}>
        <center className="text-muted">Board is empty.</center>
      </div>
    );
  }

  return (
    <BoardContext.Provider value={{ id, currentState, enableAddCard, accentColor, containerProps, removeComponent }}>
      <div
        id={id}
        style={{ display: visibility ? '' : 'none' }}
        data-disabled={disabledState}
        className="kanban-container p-0"
      >
        <Board height={height} state={state} isDisable={disabledState} colStyles={colStyles} setState={setState} />
      </div>
    </BoardContext.Provider>
  );
};
