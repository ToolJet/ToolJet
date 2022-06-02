import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { BoardContext } from './KanbanBoard';
import { v4 as uuidv4 } from 'uuid';
import { CardEventPopover } from './CardPopover';
import { ReactPortal } from '@/_components/Portal/ReactPortal';

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

  const { id, containerProps, removeComponent } = React.useContext(BoardContext);

  const removeCardHandler = (colIndex, cardIndex) => {
    const newState = [...state];
    newState[colIndex]['cards'].splice(cardIndex, 1);
    updateCb(newState);
  };

  const draggableId = item.id ?? uuidv4();

  const handleEventPopoverOptions = (e) => {
    setEventPopoverOptions({
      ...eventPopoverOptions,
      show: true,
      offset: {
        left: e.target.getBoundingClientRect().x,
        top: e.target.getBoundingClientRect().y,
        width: e.target.getBoundingClientRect().width,
        height: e.target.getBoundingClientRect().height,
      },
    });
  };

  const target = React.useRef(null);
  const el = document.getElementById(id);

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
            <span
              ref={target}
              onClick={handleEventPopoverOptions}
              className="text-muted flex-grow-1 cursor-pointer fw-bold"
            >
              {item.title}
            </span>
            {isHovered && !item.isEditing && (
              <span
                className="cursor-pointer"
                type="btn btn-sm btn-danger"
                onClick={() => removeCardHandler(keyIndex, index)}
              >
                <img className="mx-1" src={`/assets/images/icons/trash.svg`} width={12} height={12} />
              </span>
            )}
            {eventPopoverOptions.show && (
              <ReactPortal parent={el} className="kanban-portal" componentName="kanban">
                <CardEventPopover
                  kanbanCardWidgetId={id}
                  show={eventPopoverOptions.show}
                  offset={eventPopoverOptions.offset}
                  containerProps={containerProps}
                  removeComponent={removeComponent}
                  popoverClosed={popoverClosed}
                />
              </ReactPortal>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
