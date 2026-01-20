import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import List from '@/ToolJetUI/List/List';
import NoListItem from '../../Table/NoListItem';
import { ProgramaticallyHandleProperties } from '../../Table/ProgramaticallyHandleProperties';
import { FieldItem } from './FieldItem';

export const FieldsList = ({
  filteredFields,
  fields,
  activeFieldPopoverIndex,
  isRootCloseEnabled,
  isAllFieldsEditable,
  darkMode,
  currentState,
  component,
  onDragEnd,
  onRemove,
  onDuplicate,
  onAdd,
  onTogglePopover,
  onSetAllEditable,
  renderFieldPopover,
  t,
}) => (
  <List>
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {({ innerRef, droppableProps, placeholder }) => (
          <div className="w-100 d-flex custom-gap-4 flex-column" {...droppableProps} ref={innerRef}>
            {filteredFields.map((item, index) => (
              <FieldItem
                key={item.id}
                item={item}
                index={index}
                activeFieldPopoverIndex={activeFieldPopoverIndex}
                isRootCloseEnabled={isRootCloseEnabled}
                darkMode={darkMode}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                onTogglePopover={onTogglePopover}
                renderFieldPopover={renderFieldPopover}
              />
            ))}
            {placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
    <div style={{ marginTop: '8px' }}>
      {fields?.length === 0 && <NoListItem text="There are no fields" dataCy="-fields" />}
      <div className="mb-2">
        <AddNewButton dataCy="button-add-field" onClick={onAdd}>
          {t('widget.KeyValuePair.addNewField', ' Add new field')}
        </AddNewButton>
      </div>
      <ProgramaticallyHandleProperties
        label="Make all fields editable"
        currentState={currentState}
        darkMode={darkMode}
        callbackFunction={(index, property, value) => onSetAllEditable(value)}
        property="isAllFieldsEditable"
        props={{ isAllFieldsEditable: `{{${isAllFieldsEditable}}}` }}
        component={component}
        paramMeta={{ type: 'toggle', displayName: 'Make all fields editable', isFxNotRequired: true }}
        paramType="properties"
      />
    </div>
  </List>
);
