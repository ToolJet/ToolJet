import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import Column from './Column';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const generateColumnData = () => {
  return {
    id: uuidv4(),
    title: 'New column',
    color: '#fefefe',
    cards: [
      {
        id: uuidv4(),
        title: 'New card',
        description: '',
      },
    ],
  };
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destinationClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destinationClone.splice(droppableDestination.index, 0, removed);

  const result = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destinationClone;

  return result;
};
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
const getListStyle = (isDraggingOver) => ({
  padding: grid,
  width: 250,
  borderColor: isDraggingOver && '#c0ccf8',
});

function Board({ height, data }) {
  const [state, setState] = useState(() => data);

  state.map((col, ind) => console.log(' state board =>  state', col, ind));

  const addNewItem = (state, keyIndex) => {
    const newItem = {
      id: uuidv4(),
      title: 'New card',
      description: '',
    };
    const newState = [...state];
    newState[keyIndex]['cards'].push(newItem);
    setState(newState);
  };

  const deleteGroup = (state, keyIndex) => {
    const newState = [...state];
    newState.splice(keyIndex, 1);
    setState(newState);
  };

  function onDragEnd(result) {
    const { source, destination } = result;

    // dropped outside the list
    if (destination && destination !== null) {
      const sInd = +source.droppableId;
      const dInd = +destination.droppableId;

      if (sInd === dInd) {
        const items = reorder(state[sInd]['cards'], source.index, destination.index);
        const newState = [...state];
        newState[sInd]['cards'] = items;
        setState(newState);
      } else {
        const result = move(state[sInd]['cards'], state[dInd].cards, source, destination);
        const newState = [...state];
        newState[sInd]['cards'] = result[sInd];
        newState[dInd]['cards'] = result[dInd];
        setState(newState);
      }
    }
  }

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
            deleteGroup={deleteGroup}
          />
        ))}
      </DragDropContext>
      <button
        className="kanban-board-add-group"
        type="button"
        onClick={() => {
          setState([...state, generateColumnData()]);
        }}
      >
        Add new group
      </button>
    </div>
  );
}

export default Board;
