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
  // Configurable props for reuse
  dataCyPrefix = 'inspector-popover-menu',
  popoverFields,
  popoverClassName,
  ...restProps
}) => {
  return (
    <List data-cy={`${dataCyPrefix}-options-list`} style={{ marginBottom: '12px' }}>
      <DragDropContext
        onDragEnd={(result) => {
          onDragEnd(result);
        }}
      >
        <Droppable droppableId="droppable">
          {({ innerRef, droppableProps, placeholder }) => {
            return (
              <div data-cy={`${dataCyPrefix}-options-droppable`} className="w-100" {...droppableProps} ref={innerRef}>
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
                    dataCyPrefix={dataCyPrefix}
                    popoverFields={popoverFields}
                    popoverClassName={popoverClassName}
                    {...restProps}
                  />
                ))}
                {placeholder}
              </div>
            );
          }}
        </Droppable>
      </DragDropContext>
      <AddNewButton onClick={onAddOption} dataCy={`${dataCyPrefix}-add-new-option`} className="mt-0">
        Add new option
      </AddNewButton>
    </List>
  );
};

export default OptionsList;
