import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from './Column';

// fake data generator
const getItems = (count, offset = 0) =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${k + offset}-${new Date().getTime()}`,
    content: `item ${k + offset}`,
  }));

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  const result = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

  return result;
};
const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => {
  const _draggableStyle = isDragging
    ? { ...draggableStyle, left: draggableStyle.left - 200, top: draggableStyle.top - 100 }
    : draggableStyle;

  return {
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,
    background: isDragging ? '#c2cfff' : '#fefefe',
    ..._draggableStyle,
  };
};
const getListStyle = (isDraggingOver) => ({
  padding: grid,
  width: 250,
  borderColor: isDraggingOver && '#c0ccf8',
});

function Board({ height }) {
  const [state, setState] = useState([getItems(7), getItems(2, 7)]);

  function onDragEnd(result) {
    const { source, destination } = result;
    // dropped outside the list
    if (destination && destination !== null) {
      const sInd = +source.droppableId;
      const dInd = +destination.droppableId;

      if (sInd === dInd) {
        const items = reorder(state[sInd], source.index, destination.index);
        const newState = [...state];
        newState[sInd] = items;
        setState(newState);
      } else {
        const result = move(state[sInd], state[dInd], source, destination);
        const newState = [...state];
        newState[sInd] = result[sInd];
        newState[dInd] = result[dInd];

        //   setState(newState.filter((group) => group.length));
        setState(newState);
      }
    }
  }

  return (
    <div style={{ height: height }} onMouseDown={(e) => e.stopPropagation()} className="container d-flex">
      <DragDropContext onDragEnd={onDragEnd}>
        {state.map((el, ind) => (
          <Column
            key={ind}
            state={state}
            keyIndex={ind}
            getListStyle={getListStyle}
            getItemStyle={getItemStyle}
            cards={el}
            updateCb={setState}
          />
        ))}
      </DragDropContext>
      <button
        className="kanban-board-add-btn"
        type="button"
        onClick={() => {
          setState([...state, []]);
        }}
      >
        Add new group
      </button>
    </div>
  );
}

export default Board;
