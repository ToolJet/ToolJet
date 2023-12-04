import React, { useEffect } from 'react';
import Accordion from '@/_ui/Accordion';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import NoListItem from '../NoListItem';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import { resolveReferences } from '@/_helpers/utils';
export const OptionsList = ({
  column,
  props,
  index,
  darkMode,
  currentState,
  getPopoverFieldSource,
  setColumnPopoverRootCloseBlocker,
  onColumnItemChange,
  component,
}) => {
  const items = [];

  const recordOptions = (startIndex, endIndex) => {
    const columns = props.component.component.definition.properties.columns;
    const column = columns.value[index];
    const options = column.options;
    const [removed] = options.splice(startIndex, 1);
    options.splice(endIndex, 0, removed);
    column.options = options;
    const newColumns = columns.value;
    newColumns[index] = column;
    props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties', true);
  };

  const onDragEnd = async ({ source, destination }) => {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    await recordOptions(source.index, destination.index);
  };

  const getItemStyle = ({ isDragging, isDropAnimating }, draggableStyle) => {
    return {
      userSelect: 'none',
      ...draggableStyle,
      ...(isDragging && {
        zIndex: 1072,
      }),
      ...(isDropAnimating && { transitionDuration: '0.001s' }),
    };
  };

  const createNewOption = () => {
    const columns = props.component.component.definition.properties.columns;
    const column = columns.value[index];
    const options = column.options || [];
    options.push({ name: 'one', value: '1' });
    column.options = options;
    const newColumns = columns.value;
    newColumns[index] = column;
    props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties', true);
  };

  const deleteOption = (option, optionIndex) => {
    const columns = props.component.component.definition.properties.columns;
    const column = columns.value[index];
    const options = column.options;
    options.splice(optionIndex, 1);
    column.options = options;
    const newColumns = columns.value;
    newColumns[index] = column;
    props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties', true);
  };

  const selectPopover = (option, optionIndex) => {
    const handleSelectOption = (option, optionIndex, value, index, optionItemChanged) => {
      const columns = props.component.component.definition.properties.columns;
      const column = columns.value[index];
      const options = column.options;
      options[optionIndex][optionItemChanged] = value;
      column.options = options;
      const newColumns = columns.value;
      newColumns[index] = column;
      props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties', true);
    };
    return (
      <Popover
        id="popover-basic"
        className={`${darkMode && 'dark-theme'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 99999, minWidth: 200 }}
      >
        <Popover.Body>
          <div className="field mb-2 tj-app-input">
            <label data-cy={`label-action-button-text`} className="form-label">
              Option label
            </label>
            <CodeHinter
              currentState={currentState}
              initialValue={option.name}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={option.name}
              onChange={(value) => handleSelectOption(option, optionIndex, value, index, 'name')}
              componentName={getPopoverFieldSource(column.columnType, 'labels')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('labels', showing);
              }}
            />
          </div>
          <div className="field mb-2 tj-app-input">
            <label data-cy={`label-action-button-text`} className="form-label">
              Option value
            </label>
            <CodeHinter
              currentState={currentState}
              initialValue={option.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={option.name}
              onChange={(value) => handleSelectOption(option, optionIndex, value, index, 'value')}
              componentName={getPopoverFieldSource(column.columnType, 'values')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('values', showing);
              }}
            />
          </div>
        </Popover.Body>
      </Popover>
    );
  };

  const defaultOptionsValues = (hasOptions = false, options) => {
    if (hasOptions && Array.isArray(options)) {
      return options;
    }
    return {
      options: [
        { name: 'Jane Cooper', value: 'Jane Copoper' },
        { name: 'Cameron Williamson', value: 'Cameron Williamson' },
        { name: 'Leslie Alexander', value: 'Leslie Alexander' },
        { name: 'Brooklyn Simmons', value: 'Brooklyn Simmons' },
      ],
    };
  };

  items.push({
    title: 'Options',
    children: (
      <div>
        <ProgramaticallyHandleProperties
          label="Dynamic option"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={onColumnItemChange}
          property="useDynamicOptions"
          props={column}
          component={component}
          paramMeta={{
            type: 'toggle',
            displayName: 'Dynamic option',
          }}
          paramType="properties"
        />
        {resolveReferences(column?.useDynamicOptions, currentState) ? (
          <CodeHinter
            currentState={currentState}
            initialValue={column?.dynamicOptions}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            onChange={(value) => onColumnItemChange(index, 'dynamicOptions', value)}
            componentName={getPopoverFieldSource(column.columnType, 'dynamicOptions')}
            popOverCallback={(showing) => {
              setColumnPopoverRootCloseBlocker('dynamicOptions', showing);
            }}
          />
        ) : (
          <List>
            <DragDropContext
              onDragEnd={(result) => {
                onDragEnd(result);
              }}
            >
              <Droppable droppableId="droppable">
                {({ innerRef, droppableProps, placeholder }) => {
                  const defaultOptions = defaultOptionsValues(column.hasOwnProperty('options'), column?.options);
                  Object.assign(column, defaultOptions);
                  return (
                    <div className="w-100" {...droppableProps} ref={innerRef}>
                      {column?.options?.map((option, optionIndex) => {
                        const resolvedItemName = option.name;
                        return (
                          <Draggable key={option.name} draggableId={option.name} index={optionIndex}>
                            {(provided, snapshot) => {
                              return (
                                <div
                                  key={optionIndex}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{ ...getItemStyle(snapshot, provided.draggableProps.style) }}
                                >
                                  <OverlayTrigger
                                    trigger="click"
                                    placement="top"
                                    rootClose={true}
                                    overlay={selectPopover(option, optionIndex)}
                                  >
                                    <div key={resolvedItemName}>
                                      <List.Item
                                        isDraggable={true}
                                        primaryText={resolvedItemName}
                                        data-cy={`column-${resolvedItemName}`}
                                        enableActionsMenu={false}
                                        onMenuOptionClick={(listItem, menuOptionLabel) => {
                                          if (menuOptionLabel === 'Delete') deleteOption(option, optionIndex);
                                        }}
                                        darkMode={darkMode}
                                        deleteIconOutsideMenu={true}
                                      />
                                    </div>
                                  </OverlayTrigger>
                                </div>
                              );
                            }}
                          </Draggable>
                        );
                      })}
                      {placeholder}
                    </div>
                  );
                }}
              </Droppable>
            </DragDropContext>
            <div>
              {column?.options?.length === 0 && <NoListItem text={'There are no columns'} dataCy={`-columns`} />}
              <div>
                <AddNewButton dataCy={`button-add-column`} onClick={() => createNewOption()}>
                  {/* {this.props.t('widget.Table.addNewColumn', ' Add new column')} */}
                  Add new option
                </AddNewButton>
              </div>
            </div>
          </List>
        )}
      </div>
    ),
  });

  return <Accordion items={items} />;
};
