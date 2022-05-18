import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

export const Card = ({ item, index, state, updateCb, getItemStyle, keyIndex }) => {
  return (
    <div className="dnd-card">
      <Draggable key={item.id} draggableId={item.id} index={index}>
        {(dndProps, dndState) => (
          <div
            ref={dndProps.innerRef}
            {...dndProps.draggableProps}
            {...dndProps.dragHandleProps}
            style={getItemStyle(dndState.isDragging, dndProps.draggableProps.style)}
          >
            {console.log('dndProps => ', dndProps, 'snapshot =>', dndState)}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
              }}
            >
              {item.content}
              <button
                type="button"
                onClick={() => {
                  const newState = [...state];
                  newState[keyIndex].splice(index, 1);
                  updateCb(newState.filter((group) => group.length));
                }}
              >
                delete
              </button>
            </div>
          </div>
        )}
      </Draggable>
    </div>
  );
};
