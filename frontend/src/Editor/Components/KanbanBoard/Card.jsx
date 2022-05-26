import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { BoardContext } from './KanbanBoard';
import { resolveReferences } from '@/_helpers/utils';

const getContent = (content, type) => {
  switch (type) {
    case 'object':
      return JSON.stringify(content);
    default:
      return content.toString();
  }
};

const isStringEqual = (string1, string2) => {
  const pattern = new RegExp(string1, 'gi');
  return pattern.test(string2);
};

export const Card = ({ item, index, state, updateCb, getItemStyle, keyIndex }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const [isHovered, setIsHovered] = React.useState(false);
  const [editType, setEditType] = React.useState(null);
  const { currentState } = React.useContext(BoardContext);

  const updateCardTitle = (newTitle, colIndex, cardIndex) => {
    if (!isStringEqual(newTitle, item.title)) {
      const [preview, error] = resolveReferences(newTitle, currentState, null, {}, true);
      if (!error) {
        const newState = [...state];
        newState[colIndex]['cards'][cardIndex].unresolved = {
          ...newState[colIndex]['cards'][cardIndex].unresolved,
          __title__: newTitle,
        };
        newState[colIndex]['cards'][cardIndex]['title'] = getContent(preview, typeof preview);

        updateCb(newState);
      }
    }
    flipTitleToEditMode(colIndex, cardIndex, 'title');
  };

  const updateCardDescription = (newDescription, colIndex, cardIndex) => {
    if (!isStringEqual(newDescription, item.description)) {
      const [preview, error] = resolveReferences(newDescription, currentState, null, {}, true);
      if (!error) {
        const newState = [...state];
        newState[colIndex]['cards'][cardIndex].unresolved = {
          ...newState[colIndex]['cards'][cardIndex].unresolved,
          __description__: newDescription,
        };
        newState[colIndex]['cards'][cardIndex]['description'] = getContent(preview, typeof preview);
        updateCb(newState);
      }
    }

    flipTitleToEditMode(colIndex, cardIndex, 'description');
  };

  const flipTitleToEditMode = (colIndex, cardIndex, field) => {
    setEditType(field);
    const newState = [...state];
    const isEditing = newState[colIndex]['cards'][cardIndex]['isEditing'];

    if (isEditing === true) {
      newState[colIndex]['cards'][cardIndex]['isEditing'] = false;
    } else {
      newState[colIndex]['cards'][cardIndex]['isEditing'] = true;
    }
    updateCb(newState);
  };

  const removeCardHandler = (colIndex, cardIndex) => {
    const newState = [...state];
    newState[colIndex]['cards'].splice(cardIndex, 1);
    updateCb(newState);
  };

  const handleClick = (e) => {
    if (e.target.className === 'card-body') {
      flipTitleToEditMode(keyIndex, index, null);
    }
  };

  const popoverClickRootClose = (
    <Popover
      id="popover-trigger-click-root-close popover-basic popover-positioned-left"
      className={`shadow ${darkMode && 'popover-dark-themed'}`}
      style={{ width: '350px', padding: '12px', height: 300 }}
      title="Click to edit"
    >
      <div style={{ border: 'none', boxShadow: 'none', backgroundColor: 'inherit' }} className="card h-100">
        <div className="card-status-start bg-green"></div>
        <div onClick={handleClick} className="card-body">
          <h3 className="card-title">
            {editType === 'title' && item.isEditing ? (
              <div>
                <CodeHinter
                  theme={darkMode ? 'monokai' : 'default'}
                  currentState={currentState}
                  initialValue={item?.unresolved?.__title__ ?? item.title}
                  onChange={(value) => updateCardTitle(value, keyIndex, index)}
                  usePortalEditor={false}
                />
              </div>
            ) : (
              <span onClick={() => flipTitleToEditMode(keyIndex, index, 'title')}>
                <code>{item.title}</code>
              </span>
            )}
          </h3>

          {editType === 'description' && item.isEditing ? (
            <CodeHinter
              theme={darkMode ? 'monokai' : 'default'}
              currentState={currentState}
              initialValue={item?.unresolved?.__description__ ?? item.description}
              onChange={(value) => updateCardDescription(value, keyIndex, index)}
              usePortalEditor={false}
            />
          ) : (
            <p
              onClick={() => flipTitleToEditMode(keyIndex, index, 'description')}
              className={darkMode ? 'text-white-50' : 'text-muted'}
            >
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Popover>
  );
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
