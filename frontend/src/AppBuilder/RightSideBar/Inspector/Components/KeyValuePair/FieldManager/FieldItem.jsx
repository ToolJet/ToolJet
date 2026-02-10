import React, { useCallback } from 'react';
// eslint-disable-next-line import/no-unresolved
import { Draggable } from 'react-beautiful-dnd';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { resolveReferences } from '@/_helpers/utils';
import List from '@/ToolJetUI/List/List';
import { capitalize } from 'lodash';
import { getFieldIcon } from '../utils';

// Helper function to get display text for field type
const getFieldTypeDisplayText = (fieldType) => {
  const displayMap = {
    undefined: '',
    string: 'String',
    number: 'Number',
    text: 'Text',
    datepicker: 'Date time',
    select: 'Select',
    newMultiSelect: 'Multiselect',
    boolean: 'Boolean',
    image: 'Image',
    link: 'Link',
    json: 'JSON',
    markdown: 'Markdown',
    html: 'HTML',
  };
  return displayMap[fieldType] ?? capitalize(fieldType ?? '');
};

// Draggable item style
const getDraggableStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  ...draggableStyle,
});

export const FieldItem = ({
  item,
  index,
  activeFieldPopoverIndex,
  isRootCloseEnabled,
  darkMode,
  onRemove,
  onDuplicate,
  onTogglePopover,
  renderFieldPopover,
}) => {
  const resolvedItemName = resolveReferences(item.name);
  const isEditable = resolveReferences(item.isEditable);
  const fieldVisibility = item?.visibility ?? true;

  const handleMenuOptionClick = useCallback(
    (listItem, menuOptionLabel) => {
      if (menuOptionLabel === 'Delete') {
        onRemove(index);
      } else if (menuOptionLabel === 'copyField') {
        onDuplicate(index);
      }
    },
    [index, onRemove, onDuplicate]
  );

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getDraggableStyle(snapshot.isDragging, provided.draggableProps.style)}
        >
          <OverlayTrigger
            trigger="click"
            placement="left"
            rootClose={isRootCloseEnabled}
            overlay={renderFieldPopover(item, index)}
            onToggle={(show) => onTogglePopover(index, show)}
          >
            <div className="table-column-lists">
              <List.Item
                isDraggable
                primaryText={resolvedItemName}
                secondaryText={getFieldTypeDisplayText(item?.fieldType)}
                data-cy={`field-${resolvedItemName}`}
                enableActionsMenu={false}
                isEditable={isEditable}
                onMenuOptionClick={handleMenuOptionClick}
                darkMode={darkMode}
                showIconOnHover
                deleteIconOutsideMenu
                showCopyColumnOption
                showVisibilityIcon
                isColumnVisible={resolveReferences(fieldVisibility)}
                className={activeFieldPopoverIndex === index ? 'active-column-list' : ''}
                columnType={item?.fieldType}
                Icon={getFieldIcon(item?.fieldType)}
              />
            </div>
          </OverlayTrigger>
        </div>
      )}
    </Draggable>
  );
};
