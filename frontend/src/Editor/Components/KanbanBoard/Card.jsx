import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

export const Card = ({ item, index, state, updateCb, getItemStyle, keyIndex }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Draggable key={item.id} draggableId={item.id} index={index}>
      {(dndProps, dndState) => (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="dnd-card card card-sm"
          ref={dndProps.innerRef}
          {...dndProps.draggableProps}
          {...dndProps.dragHandleProps}
          style={{ ...getItemStyle(dndState.isDragging, dndProps.draggableProps.style) }}
        >
          {console.log('dndProps => ', dndProps, 'snapshot =>', dndState)}

          <div className="card-body d-flex">
            <span className="text-muted flex-grow-1"> {item.content}</span>
            {isHovered && (
              <span
                type="btn btn-sm btn-danger"
                onClick={() => {
                  const newState = [...state];
                  newState[keyIndex].splice(index, 1);
                  updateCb(newState.filter((group) => group.length));
                }}
              >
                <img className="mx-1" src={`/assets/images/icons/trash.svg`} width={12} height={12} />
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
