import _ from 'lodash';
import React from 'react';
import Board from './Board';
import { getData } from './utils';

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
  fireEvent,
}) => {
  const { columns, cardData, enableAddCard } = properties;

  const { visibility, disabledState, width, minWidth, accentColor } = styles;

  const [rawColumnData, setRawColumnData] = React.useState([]);
  const [rawCardData, setRawCardData] = React.useState([]);

  const [state, setState] = React.useState([]);

  React.useEffect(() => {
    setExposedVariable('columns', state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  React.useEffect(() => {
    const isEqualCol = _.isEqual(rawColumnData, columns);
    const isEqualCard = _.isEqual(rawCardData, cardData);
    if (!isEqualCol || !isEqualCard) {
      const colData = JSON.parse(JSON.stringify(columns));
      const _cardData = JSON.parse(JSON.stringify(cardData));
      setRawColumnData(colData);
      setRawCardData(_cardData);
      const data = getData(colData, _cardData);
      setState(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, cardData]);

  const colStyles = {
    width: !width ? '100%' : width,
    minWidth: !minWidth ? '350px' : minWidth,
  };

  if (!state || state.length === 0) {
    return (
      <div className="mx-auto w-50 p-5 bg-light no-components-box" style={{ marginTop: '15%' }}>
        <center className="text-muted">Board is empty.</center>
      </div>
    );
  }
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <BoardContext.Provider
      value={{ id, currentState, enableAddCard, accentColor, containerProps, removeComponent, darkMode }}
    >
      <div
        id={id}
        style={{ display: visibility ? '' : 'none' }}
        data-disabled={disabledState}
        className={`kanban-container p-0 ${darkMode ? 'dark-themed' : ''}`}
      >
        <Board
          height={height}
          state={state}
          isDisable={disabledState}
          colStyles={colStyles}
          setState={setState}
          fireEvent={fireEvent}
          setExposedVariable={setExposedVariable}
        />
      </div>
    </BoardContext.Provider>
  );
};
