import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import Column from './Column';
import { reorderCards, moveCards } from './utils';

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => {
  const _draggableStyle = isDragging
    ? { ...draggableStyle, left: draggableStyle.left - 100, top: draggableStyle.top - 100 }
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
    const newItem = {
      id: uuidv4(),
      title: 'New card',
      columnId: state[keyIndex].id,
    };
    const newState = [...state];
    if (!newState[keyIndex]['cards']) [(newState[keyIndex]['cards'] = [])];
    newState[keyIndex]['cards'].push(newItem);
    setState(newState);
    setExposedVariable('lastAddedCard', newItem);
    fireEvent('onCardAdded');
  };

  function onDragEnd(result) {
    const { source, destination } = result;

    // dropped outside the list
    if (destination && destination !== null) {
      const sInd = +source.droppableId;
      const dInd = +destination.droppableId;
      const originColumnId = state[sInd].id;
      const destinationColumnId = state[dInd].id;

      const card = state[sInd]['cards'][source.index];
      const cardDetails = {
        title: card.title,
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
        originCardIndex: sInd,
        destinationCardIndex: dInd,
        cardDetails,
      };
      setExposedVariable('lastCardMovement', movementDetails);
      fireEvent('onCardMoved');
    }
  }

  const getListStyle = (isDraggingOver) => ({
    ...colStyles,
    padding: grid,
    borderColor: isDraggingOver && '#c0ccf8',
  });

  const updateCardProperty = (columnIndex, cardIndex, property, newValue) => {
    const columnOfCardToBeUpdated = state[columnIndex];
    const cardSetOfTheCardToBeUpdated = columnOfCardToBeUpdated.cards;
    const cardToBeUpdated = cardSetOfTheCardToBeUpdated[cardIndex];
    const updatedCard = { ...cardToBeUpdated, [property]: newValue };
    const updatedCardSet = cardSetOfTheCardToBeUpdated.map((card, index) => (index === cardIndex ? updatedCard : card));
    const updatedColumn = { ...columnOfCardToBeUpdated, cards: updatedCardSet };
    const newState = state.map((column, index) => (index === columnIndex ? updatedColumn : column));
    setState(newState);

    setExposedVariable('lastUpdatedCard', updatedCard);
    fireEvent('onCardUpdated');
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
