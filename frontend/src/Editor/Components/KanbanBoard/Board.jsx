import _ from 'lodash';
import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { defineObjectProperty } from '@/_helpers/utils';
import Column from './Column';
import { reorderCards, moveCards } from './utils';

const grid = 8;

const getItemStyle = (isDragging, draggableStyle, windowWidth) => {
  const leftDisplacement =
    windowWidth > 1800 && windowWidth < 2160
      ? 150
      : windowWidth == 2160
      ? 300
      : windowWidth > 2160 && windowWidth <= 2560
      ? 400
      : windowWidth > 2560
      ? 700
      : 100;

  const _draggableStyle = isDragging
    ? {
        ...draggableStyle,
        left: draggableStyle.left - leftDisplacement,
        top: draggableStyle.top - 100,
      }
    : draggableStyle;

  return {
    ..._draggableStyle,
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,
    background: isDragging ? '#c2cfff' : '#fefefe',
  };
};

function Board({ height, state, colStyles, setState, fireEvent, setExposedVariable }) {
  const addNewItem = (state, keyIndex) => {
    setExposedVariable('selectedColumn', _.omit(state[keyIndex], 'cards')).then(() => fireEvent('onCardAddRequested'));
  };

  function onDragEnd(result) {
    const { source, destination } = result;

    // dropped outside the list
    if (destination && destination !== null) {
      const sInd = +source.droppableId;
      const dInd = +destination.droppableId;
      const originColumnId = state[sInd].id;
      const destinationColumnId = state[dInd].id;
      const originalCardIndex = source.index;
      const destinationCardIndex = destination.index;

      const card = state[sInd]['cards'][source.index];
      const cardDetails = {
        title: card.title,
        id: card.id,
      };

      if (sInd === dInd) {
        const items = reorderCards(state[sInd]['cards'], source.index, destination.index);
        const newState = [...state];
        newState[sInd]['cards'] = items;
        setState(newState);
      } else {
        const result = moveCards(state[sInd]['cards'], state[dInd].cards, source, destination);
        const newState = [...state];
        newState[sInd]['cards'] = result[sInd];
        newState[dInd]['cards'] = result[dInd];
        newState[dInd]['cards'][destination.index].columnId = newState[dInd].id;

        setState(newState);
      }

      const movementDetails = {
        originColumnId,
        destinationColumnId,
        originalCardIndex,
        destinationCardIndex,
        cardDetails,
      };
      setExposedVariable('lastCardMovement', movementDetails).then(() => fireEvent('onCardMoved'));
    }
  }

  const getListStyle = (isDraggingOver) => ({
    ...colStyles,
    padding: grid,
    borderColor: isDraggingOver && '#c0ccf8',
  });

  const updateCardProperty = (columnIndex, cardIndex, property, newValue) => {
    const columnOfCardToBeUpdated = state[columnIndex];
    const cardSetOfTheCardToBeUpdated = columnOfCardToBeUpdated['cards'];
    const cardToBeUpdated = cardSetOfTheCardToBeUpdated[cardIndex];
    const updatedCard = { ...cardToBeUpdated, [property]: newValue };

    if (!cardToBeUpdated.hasOwnProperty('data')) {
      defineObjectProperty(cardToBeUpdated, 'data', {});
    }

    const updatedCardSet = cardSetOfTheCardToBeUpdated.map((card, index) => (index === cardIndex ? updatedCard : card));
    const updatedColumn = { ...columnOfCardToBeUpdated, cards: updatedCardSet };
    const newState = state.map((column, index) => (index === columnIndex ? updatedColumn : column));

    setState(newState);

    setExposedVariable('lastUpdatedCard', updatedCard).then(() => fireEvent('onCardUpdated'));
  };

  return (
    <div
      style={{ height: height, overflowX: 'auto' }}
      onMouseDown={(e) => e.stopPropagation()}
      className="container d-flex"
    >
      <DragDropContext onDragEnd={onDragEnd}>
        {state.map((col, ind) => (
          <Column
            key={ind}
            state={state}
            group={col}
            keyIndex={ind}
            getListStyle={getListStyle}
            getItemStyle={getItemStyle}
            updateCb={setState}
            addNewItem={addNewItem}
            colStyles={colStyles}
            fireEvent={fireEvent}
            setExposedVariable={setExposedVariable}
            updateCardProperty={updateCardProperty}
            boardHeight={height}
          />
        ))}
      </DragDropContext>
    </div>
  );
}

export default Board;
