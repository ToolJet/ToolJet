import React from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import List from '@/ToolJetUI/List/List';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import OptionItem from './OptionItem';

const OptionsList = ({
  options,
  darkMode,
  hoveredOptionIndex,
  onMouseEnter,
  onMouseLeave,
  onDeleteOption,
  onOptionChange,
  onAddOption,
  onDragEnd,
  getResolvedValue,
  getItemStyle,
  ...restProps
}) => {
  return (
    <List data-cy="inspector-popover-menu-options-list" style={{ marginBottom: '12px' }}>
      <DragDropContext
        onDragEnd={(result) => {
          onDragEnd(result);
        }}
      >
        <Droppable droppableId="droppable">
          {({ innerRef, droppableProps, placeholder }) => {
            return (
              <div
                data-cy="inspector-popover-menu-options-droppable"
                className="w-100"
                {...droppableProps}
                ref={innerRef}
              >
                {options?.map((item, index) => (
                  <OptionItem
                    key={item?.value}
                    item={item}
                    index={index}
                    darkMode={darkMode}
                    hoveredOptionIndex={hoveredOptionIndex}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onDeleteOption={onDeleteOption}
                    onOptionChange={onOptionChange}
                    getResolvedValue={getResolvedValue}
                    getItemStyle={getItemStyle}
                    {...restProps}
                  />
                ))}
                {placeholder}
              </div>
            );
          }}
        </Droppable>
      </DragDropContext>
      <AddNewButton onClick={onAddOption} dataCy="inspector-popover-menu-add-new-option" className="mt-0">
        Add new option
      </AddNewButton>
    </List>
  );
};

export default OptionsList;
