import React, { useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import ListGroup from 'react-bootstrap/ListGroup';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SortableList from '@/_components/SortableList';
import Trash from '@/_ui/Icon/solidIcons/Trash';

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  ...draggableStyle,
});

/**
 * An inspector's list of options: a row per option (drag handle, label, a delete button on hover) that opens a popover
 * with the option's fields, rows dragged to reorder, and an add button under them. The native Dropdown, Multiselect
 * and Radio button inspector (Select.jsx) and the UI 2.0 options field (CodeBuilder/Elements/OptionsList.jsx) both
 * draw their options with it; each keeps its own option shape and fields (renderDetails).
 *
 * getItemId names a row for drag and drop and as its React key (a string): native rows are named by their value.
 */
export const OptionsListEditor = ({
  options,
  darkMode,
  getItemId = (item) => item?.value,
  renderLabel,
  renderDetails,
  onAdd,
  onDelete,
  onReorder,
  onDetailsClosed,
  itemProps = {},
  addLabel = 'Add new option',
  addDataCy = 'add-new-dropdown-option',
}) => {
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);

  const onDragEnd = ({ source, destination }) => {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    onReorder(source.index, destination.index);
  };

  const renderOverlay = (item, index) => {
    return (
      <Popover
        className={`${darkMode && 'dark-theme theme-dark'} inspector-select-options-popover`}
        style={{ minWidth: '248px' }}
      >
        <Popover.Body>{renderDetails(item, index)}</Popover.Body>
      </Popover>
    );
  };

  return (
    <List style={{ marginBottom: '20px' }}>
      <DragDropContext
        onDragEnd={(result) => {
          onDragEnd(result);
        }}
      >
        <Droppable droppableId="droppable">
          {({ innerRef, droppableProps, placeholder }) => (
            <div className="w-100" {...droppableProps} ref={innerRef}>
              {options?.map((item, index) => {
                const id = getItemId(item);
                return (
                  <Draggable key={id} draggableId={id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        key={index}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                      >
                        <OverlayTrigger
                          trigger="click"
                          placement="left"
                          rootClose
                          onExited={onDetailsClosed}
                          overlay={renderOverlay(item, index)}
                          onToggle={(isOpen) => {
                            if (!isOpen) {
                              document.activeElement?.blur(); // Manually trigger blur when popover closes
                            }
                          }}
                        >
                          <div key={id}>
                            <ListGroup.Item
                              style={{ marginBottom: '8px', backgroundColor: 'var(--slate3)' }}
                              onMouseEnter={() => setHoveredOptionIndex(index)}
                              onMouseLeave={() => setHoveredOptionIndex(null)}
                              {...itemProps}
                            >
                              <div className="row">
                                <div className="col-auto d-flex align-items-center">
                                  <SortableList.DragHandle show />
                                </div>
                                <div className="col text-truncate cursor-pointer" style={{ padding: '0px' }}>
                                  {renderLabel(item, index)}
                                </div>
                                <div className="col-auto">
                                  {index === hoveredOptionIndex && (
                                    <ButtonSolid
                                      variant="danger"
                                      size="xs"
                                      className={'delete-icon-btn'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(index);
                                      }}
                                    >
                                      <span className="d-flex">
                                        <Trash fill={'var(--tomato9)'} width={12} />
                                      </span>
                                    </ButtonSolid>
                                  )}
                                </div>
                              </div>
                            </ListGroup.Item>
                          </div>
                        </OverlayTrigger>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <AddNewButton onClick={onAdd} dataCy={addDataCy} className="mt-0">
        {addLabel}
      </AddNewButton>
    </List>
  );
};

export default OptionsListEditor;
