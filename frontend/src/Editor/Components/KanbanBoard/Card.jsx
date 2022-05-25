import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

export const Card = ({ item, index, state, updateCb, getItemStyle, keyIndex }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const updateCardTitle = (newTitle, colIndex, cardIndex) => {
    const newState = [...state];
    newState[colIndex]['cards'][cardIndex]['title'] = newTitle;
    updateCb(newState);
  };

  const flipTitleToEditMode = (colIndex, cardIndex) => {
    const newState = [...state];
    const isEditing = newState[colIndex]['cards'][cardIndex]['isEditing'];

    if (isEditing === true) {
      newState[colIndex]['cards'][cardIndex]['isEditing'] = false;
    } else {
      newState[colIndex]['cards'][cardIndex]['isEditing'] = true;
    }
    updateCb(newState);
  };

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
            {item.isEditing ? (
              <input
                style={{ height: 20, padding: 0 }}
                type="text"
                className="form-control form-control-flush flex-grow-1"
                name="Form control flush"
                defaultValue={item.title}
                autoFocus={true}
                onBlur={(e) => {
                  updateCardTitle(e.target.value, keyIndex, index);
                  flipTitleToEditMode(keyIndex, index);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateCardTitle(e.target.value, keyIndex, index);
                    flipTitleToEditMode(keyIndex, index);
                  }
                }}
              />
            ) : (
              <span onClick={() => flipTitleToEditMode(keyIndex, index)} className="text-muted flex-grow-1 cursor-text">
                {item.title}
              </span>
            )}
            {isHovered && !item.isEditing && (
              <span
                className="cursor-pointer"
                type="btn btn-sm btn-danger"
                onClick={() => {
                  const newState = [...state];
                  newState[keyIndex]['cards'].splice(index, 1);
                  updateCb(newState);
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
