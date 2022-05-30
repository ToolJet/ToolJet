import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { BoardContext } from './KanbanBoard';
import { v4 as uuidv4 } from 'uuid';

const isStringEqual = (string1, string2) => {
  const pattern = new RegExp(string1, 'gi');
  return pattern.test(string2);
};

export const Card = ({ item, index, state, updateCb, getItemStyle, keyIndex }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const [isHovered, setIsHovered] = React.useState(false);

  const [eventPopoverOptions, setEventPopoverOptions] = React.useState({ show: false });

  function popoverClosed() {
    setEventPopoverOptions({
      ...eventPopoverOptions,
      show: false,
    });
  }

  const { currentState } = React.useContext(BoardContext);

  const updateCardTitle = (newTitle, colIndex, cardIndex) => {};

  const updateCardDescription = (newDescription, colIndex, cardIndex) => {};

  const removeCardHandler = (colIndex, cardIndex) => {
    const newState = [...state];
    newState[colIndex]['cards'].splice(cardIndex, 1);
    updateCb(newState);
  };

  const popoverClickRootClose = (
    <Popover
      id="popover-trigger-click-root-close popover-basic popover-positioned-left"
      className={`shadow ${darkMode && 'popover-dark-themed'}`}
      style={{ width: '350px', padding: '12px', height: 300 }}
      title="Click to edit"
    >
      <div style={{ border: 'none', boxShadow: 'none', backgroundColor: 'inherit' }} className="card h-100">
        <div className="card-body">
          <h3 className="card-title">
            <span>
              <code>{item.title}</code>
            </span>
          </h3>

          <p className={`${darkMode ? 'text-white-50' : 'text-muted'} w-100 h-100`}>{item.description}</p>
        </div>
      </div>
    </Popover>
  );

  const draggableId = item.id ?? uuidv4();

  return (
    <Draggable
      key={item.id}
      draggableId={typeof draggableId !== String ? String(draggableId) : draggableId}
      index={index}
    >
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
            <OverlayTrigger trigger="click" rootClose placement="right" overlay={popoverClickRootClose}>
              <span className="text-muted flex-grow-1 cursor-pointer fw-bold">{item.title}</span>
            </OverlayTrigger>
            {isHovered && !item.isEditing && (
              <span
                className="cursor-pointer"
                type="btn btn-sm btn-danger"
                onClick={() => removeCardHandler(keyIndex, index)}
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
