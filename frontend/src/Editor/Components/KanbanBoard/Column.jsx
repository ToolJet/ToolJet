import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Card } from './Card';
import { BoardContext } from './KanbanBoard';

const Column = ({
  state,
  group,
  keyIndex,
  getListStyle,
  getItemStyle,
  updateCb,
  addNewItem,
  fireEvent,
  setExposedVariable,
  updateCardProperty,
  boardHeight,
}) => {
  const styles = {
    overflowX: 'hidden',
    overflowY: 'hidden',
    maxHeight: boardHeight - 80,
  };

  const cards = group['cards'];

  const updateGroupTitle = (newTitle) => {
    const newState = [...state];
    newState[keyIndex]['title'] = newTitle;
    updateCb(newState);
  };

  const flipTitleToEditMode = (index) => {
    const newState = [...state];
    const isEditing = newState[index]['isEditing'];

    if (isEditing === true) {
      newState[index]['isEditing'] = false;
    } else {
      newState[index]['isEditing'] = true;
    }
    updateCb(newState);
  };

  const { enableAddCard, accentColor, darkMode } = React.useContext(BoardContext);

  const hexaCodeToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r},${g},${b},0.2)`;
  };

  const colAccentColor = {
    color: accentColor ?? '#4d72fa',
    backgroundColor: accentColor ? hexaCodeToRgb(accentColor) : hexaCodeToRgb('#4d72fa'),
  };

  return (
    <Droppable
      key={keyIndex}
      droppableId={String(keyIndex)}
    >
      {(dndProps, dndState) => (
        <div
          className={`card text-dark mb-3 m-2 kanban-column ${darkMode ? 'bg-dark' : 'bg-light'}`}
          ref={dndProps.innerRef}
          style={getListStyle(dndState.isDraggingOver)}
          {...dndProps.droppableProps}
        >
          <div className="card-header d-flex">
            <div className="flex-grow-1 ">
              {group['isEditing'] ? (
                <input
                  type="text"
                  className="form-control"
                  defaultValue={group['title']}
                  autoFocus={true}
                  onBlur={(e) => {
                    updateGroupTitle(e.target.value);
                    flipTitleToEditMode(keyIndex);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateGroupTitle(e.target.value);
                      flipTitleToEditMode(keyIndex);
                    }
                  }}
                />
              ) : (
                <span
                  style={colAccentColor}
                  onClick={() => flipTitleToEditMode(keyIndex)}
                  className="bade-component cursor-text"
                >
                  {group.title}
                </span>
              )}
            </div>
          </div>
          <div
            style={{ ...styles }}
            className="card-body"
          >
            {cards?.map((item, index) => (
              <Card
                key={index}
                item={item}
                index={index}
                state={state}
                updateCb={updateCb}
                getItemStyle={getItemStyle}
                keyIndex={keyIndex}
                fireEvent={fireEvent}
                setExposedVariable={setExposedVariable}
                updateCardProperty={updateCardProperty}
              />
            ))}

            {dndProps.placeholder}
            {enableAddCard && (
              <button
                className="btn btn-primary w-100 add-card-btn"
                onClick={() => addNewItem(state, keyIndex)}
              >
                Add card
              </button>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
};

export default Column;
