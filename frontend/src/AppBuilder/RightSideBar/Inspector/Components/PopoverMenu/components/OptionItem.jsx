import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import ListGroup from 'react-bootstrap/ListGroup';
import SortableList from '@/_components/SortableList';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import OptionDetailsPopover from './OptionDetailsPopover';

const OptionItem = ({
  item,
  index,
  darkMode,
  hoveredOptionIndex,
  onMouseEnter,
  onMouseLeave,
  onDeleteOption,
  onOptionChange,
  getResolvedValue,
  getItemStyle,
  // Configurable props for reuse
  dataCyPrefix = 'inspector-popover-menu',
  popoverFields,
  popoverClassName,
  ...restProps
}) => {
  return (
    <Draggable key={item?.value} draggableId={item?.value} index={index}>
      {(provided, snapshot) => {
        return (
          <div
            key={index}
            data-cy={`${dataCyPrefix}-option-${index}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
          >
            <OverlayTrigger
              trigger="click"
              placement="left"
              rootClose
              overlay={
                <OptionDetailsPopover
                  item={item}
                  index={index}
                  darkMode={darkMode}
                  onOptionChange={onOptionChange}
                  onDeleteOption={onDeleteOption}
                  getResolvedValue={getResolvedValue}
                  fields={popoverFields}
                  dataCyPrefix={dataCyPrefix}
                  popoverClassName={popoverClassName}
                />
              }
              onToggle={(isOpen) => {
                if (!isOpen) {
                  document.activeElement?.blur(); // Manually trigger blur when popover closes
                }
              }}
            >
              <div key={item?.value}>
                <ListGroup.Item
                  style={{
                    marginBottom: '8px',
                    backgroundColor: 'var(--slate3)',
                  }}
                  onMouseEnter={() => onMouseEnter(index)}
                  onMouseLeave={() => onMouseLeave()}
                  {...restProps}
                >
                  <div data-cy={`${dataCyPrefix}-option-row`} className="row">
                    <div data-cy={`${dataCyPrefix}-option-drag-handle`} className="col-auto d-flex align-items-center">
                      <SortableList.DragHandle show />
                    </div>
                    <div
                      data-cy={`${dataCyPrefix}-option-label`}
                      className="col text-truncate cursor-pointer"
                      style={{ padding: '0px' }}
                    >
                      {getSafeRenderableValue(getResolvedValue(item?.label))}
                    </div>
                    <div data-cy={`${dataCyPrefix}-option-actions`} className="col-auto">
                      {index === hoveredOptionIndex && (
                        <ButtonSolid
                          data-cy={`${dataCyPrefix}-option-delete-button`}
                          variant="danger"
                          size="xs"
                          className={'delete-icon-btn'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteOption(index);
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
        );
      }}
    </Draggable>
  );
};

export default OptionItem;
