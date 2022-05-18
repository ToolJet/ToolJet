import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Card } from './Card';

const Column = ({ state, keyIndex, getListStyle, getItemStyle, cards, updateCb }) => {
  return (
    <div className="kanban-col">
      <Droppable key={keyIndex} droppableId={`${keyIndex}`}>
        {(dndProps, dndState) => (
          <div ref={dndProps.innerRef} style={getListStyle(dndState.isDraggingOver)} {...dndProps.droppableProps}>
            <h4>Col</h4>
            {cards.map((item, index) => (
              <Card
                key={index}
                item={item}
                index={index}
                state={state}
                updateCb={updateCb}
                getItemStyle={getItemStyle}
                keyIndex={keyIndex}
              />
            ))}
            {dndProps.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
