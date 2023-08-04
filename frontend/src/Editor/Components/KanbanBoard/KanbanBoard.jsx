import _ from 'lodash';
import React from 'react';
import Board from './Board';
import { isCardColoumnIdUpdated, updateCardData, updateColumnData, getData, isArray, isValidCardData } from './utils';
import { useCurrentState } from '@/_stores/currentStateStore';

export const BoardContext = React.createContext({});

export const KanbanBoard = ({
  id,
  height,
  properties,
  styles,
  setExposedVariable,
  containerProps,
  removeComponent,
  fireEvent,
  dataCy,
}) => {
  const { columns, cardData, enableAddCard } = properties;
  const currentState = useCurrentState();
  const { visibility, disabledState, width, minWidth, accentColor } = styles;

  const [rawColumnData, setRawColumnData] = React.useState([]);
  const [rawCardData, setRawCardData] = React.useState([]);

  const [state, setState] = React.useState([]);

  React.useEffect(() => {
    setExposedVariable('columns', state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  React.useEffect(() => {
    if (isArray(rawColumnData) || isArray(rawCardData)) {
      const colData = JSON.parse(JSON.stringify(columns));
      const _cardData = JSON.parse(JSON.stringify(cardData));
      setRawColumnData(colData);
      setRawCardData(_cardData);
      const data = getData(colData, _cardData);
      setState(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (JSON.stringify(columns) !== JSON.stringify(rawColumnData) && isArray(columns)) {
      const newData = updateColumnData(state, rawColumnData, columns);

      if (newData && isArray(newData)) {
        setState(newData);
      }

      if (!newData && columns.length !== rawColumnData.length) {
        setState(() => getData(columns, rawCardData));
      }
      setRawColumnData(columns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  React.useEffect(() => {
    if (isValidCardData(cardData)) {
      if (cardData.length !== rawCardData.length) {
        setState(() => getData(columns, cardData));
      } else if (JSON.stringify(cardData) !== JSON.stringify(rawCardData) && isArray(cardData)) {
        if (cardData.length === 0) {
          return;
        }

        const isColumnIdUpdated = isCardColoumnIdUpdated(rawCardData, cardData);

        if (isColumnIdUpdated) {
          const newData = getData(columns, cardData);
          if (newData && isArray(newData)) {
            setState(newData);
          }
        }

        if (!isColumnIdUpdated) {
          const newData = updateCardData(state, rawCardData, cardData);

          if (newData && isArray(newData)) {
            setState(newData);
          }
          if (newData === null) {
            return setState(() => getData(columns, cardData));
          }
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

  if (!state || state.length === 0) {
    return (
      <div
        className="mx-auto w-50 p-5 bg-light no-components-box"
        style={{ marginTop: '15%' }}
      >
        <center className="text-muted">Board is empty.</center>
      </div>
    );
  }
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <BoardContext.Provider
      value={{
        id,
        currentState,
        enableAddCard,
        accentColor,
        containerProps,
        removeComponent,
        darkMode,
      }}
    >
      <div
        id={id}
        style={{ display: visibility ? '' : 'none' }}
        data-disabled={disabledState}
        className={`kanban-container p-0 ${darkMode ? 'dark-themed' : ''}`}
        data-cy={dataCy}
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
