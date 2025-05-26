import React from 'react';
import Accordion from '@/_ui/Accordion';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import NoListItem from '../NoListItem';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import { resolveReferences } from '@/_helpers/utils';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import { unset } from 'lodash';
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

  const getItemStyle = (draggableStyle) => {
    return {
      ...draggableStyle,
      userSelect: 'none',
      position: 'static',
    };
  };

  const createNewOption = () => {
    const columns = props.component.component.definition.properties.columns;
    const column = columns.value[index];
    const options = column.options || [];
    options.push({ label: 'one', value: '1' });
    column.options = options;
    const newColumns = columns.value;
    newColumns[index] = column;
    props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties', true);
  };

  const deleteOption = (option, optionIndex) => {
    const columns = props.component.component.definition.properties.columns;
    const column = columns.value[index];
    const options = column.options;
    const deletedOption = options.splice(optionIndex, 1);
    column.options = options;
    const defaultOptionsList = column.defaultOptionsList || [];
    const deletedOptionIndexInDefaultOptionsList = defaultOptionsList?.findIndex((defaultOption, index) => {
      if (
        defaultOption.value === deletedOption.value &&
        defaultOption.label === deletedOption.label &&
        defaultOption.makeDefaultOption === deletedOption.makeDefaultOption
      ) {
        return index;
      } else {
        return -1;
      }
    });
    if (deletedOptionIndexInDefaultOptionsList !== -1) {
      defaultOptionsList.splice(deletedOptionIndexInDefaultOptionsList, 1);
      column.defaultOptionsList = defaultOptionsList;
    }
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

    const handleDefaultOptionSelection = (optionIndex, property, value) => {
      const columns = props.component.component.definition.properties.columns;
      const column = columns.value[index];
      const options = column.options;
      options[optionIndex][property] = value;
      column.options = options;
      const isValueTruthy = !!resolveReferences(value);

      // This block is responsible for updating list of defaultOptions when makeDefaultOption prop is updated
      if (property === 'makeDefaultOption') {
        if (column.columnType === 'select') {
          // Disable all other default options except the one selected
          column.options.forEach((option) => unset(option, 'makeDefaultOption'));
          column.options[optionIndex][property] = value;
          if (isValueTruthy) {
            column.defaultOptionsList = [column.options[optionIndex]];
          } else {
            column.defaultOptionsList = [];
          }
        } else {
          const defaultOptionsList = column?.defaultOptionsList ?? [];
          const indexOfOptionInList = defaultOptionsList.findIndex((option) => {
            if (option.value === options[optionIndex].value && option.label === options[optionIndex].label) {
              return option;
            }
          });
          if (indexOfOptionInList === -1 && isValueTruthy) {
            defaultOptionsList.push(options[optionIndex]);
          }
          if (indexOfOptionInList !== -1 && !isValueTruthy) {
            defaultOptionsList.splice(indexOfOptionInList, 1);
          }
          column.defaultOptionsList = defaultOptionsList;
        }
      }

      const newColumns = columns.value;
      newColumns[index] = column;

      props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties', true);
    };

    const handleOptionColorChange = (index, property, value) => {
      handleSelectOption(option, optionIndex, value, index, property);
    };

    return (
      <Popover
        id="popover-basic"
        className={`${darkMode && 'dark-theme'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          zIndex: 99999,
          minWidth: 200,
          boxShadow: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
          borderRadius: '6px',
          border: '1px solid var(--border-default)',
        }}
      >
        <Popover.Body>
          <div className="field mb-2 tj-app-input" onClick={(e) => e.stopPropagation()}>
            <label data-cy={`label-action-button-text`} className="form-label">
              Option label
            </label>
            <CodeHinter
              currentState={currentState}
              initialValue={option?.label}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={option?.label}
              onChange={(value) => handleSelectOption(option, optionIndex, value, index, 'label')}
              componentName={getPopoverFieldSource(column.columnType, 'options::label')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('options::label', showing);
              }}
            />
          </div>
          <div className="field tj-app-input" onClick={(e) => e.stopPropagation()}>
            <label data-cy={`label-action-button-text`} className="form-label">
              Option value
            </label>
            <CodeHinter
              currentState={currentState}
              initialValue={option.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={option.value}
              onChange={(value) => handleSelectOption(option, optionIndex, value, index, 'value')}
              componentName={getPopoverFieldSource(column.columnType, 'options::value')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('options::value', showing);
              }}
            />
          </div>
          <div className="field table-select-colorpicker" style={{ marginBottom: '8px', marginTop: '8px' }}>
            <ProgramaticallyHandleProperties
              label="Label color"
              index={index}
              darkMode={darkMode}
              callbackFunction={handleOptionColorChange}
              property="labelColor"
              props={option}
              component={component}
              paramMeta={{ type: 'colorSwatches', displayName: 'Label color' }}
              paramType="properties"
            />
          </div>
          <div className="field table-select-colorpicker" style={{ marginBottom: '24px' }}>
            <ProgramaticallyHandleProperties
              label="Option color"
              index={index}
              darkMode={darkMode}
              callbackFunction={handleOptionColorChange}
              property="optionColor"
              props={option}
              component={component}
              paramMeta={{ type: 'colorSwatches', displayName: 'Option color' }}
              paramType="properties"
            />
          </div>
          <ProgramaticallyHandleProperties
            label="Make this as default option"
            currentState={currentState}
            index={optionIndex}
            darkMode={darkMode}
            callbackFunction={handleDefaultOptionSelection}
            property="makeDefaultOption"
            props={column.options}
            component={component}
            paramMeta={{
              type: 'toggle',
              displayName: 'Make this option as default',
            }}
            paramType="properties"
          />
        </Popover.Body>
      </Popover>
    );
  };

  const defaultOptionsValues = () => {
    return {
      options: [
        { label: 'Reading', value: 'Reading' },
        { label: 'Traveling', value: 'Traveling' },
        { label: 'Photography', value: 'Photography' },
        { label: 'Music', value: 'Music' },
      ],
    };
  };

  items.push({
    title: 'Options',
    children: (
      <div className="d-flex custom-gap-7 flex-column">
        <ProgramaticallyHandleProperties
          label="Auto assign colors"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={onColumnItemChange}
          property="autoAssignColors"
          props={column}
          component={component}
          paramMeta={{
            type: 'toggle',
            displayName: 'Auto assign colors',
          }}
          paramType="properties"
        />
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
        {resolveReferences(column?.useDynamicOptions) ? (
          <div className="d-flex custom-gap-7 flex-column">
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
              placeholder={`{{[{ label: 'Reading', value: 'Reading' }, { label: 'Traveling', value: 'Traveling' }, { label: 'Photography', value: 'Photography' }, { label: 'Music', value: 'Music' }]}}`}
            />
            <ProgramaticallyHandleProperties
              label="Options loading state"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={onColumnItemChange}
              property="optionsLoadingState"
              props={column}
              component={component}
              paramMeta={{
                type: 'toggle',
                displayName: 'Options loading state',
              }}
              paramType="properties"
            />
          </div>
        ) : (
          <List>
            <DragDropContext
              onDragEnd={(result) => {
                onDragEnd(result);
              }}
            >
              <Droppable droppableId="droppable">
                {({ innerRef, droppableProps, placeholder }) => {
                  const columnHasOptions = column.hasOwnProperty('options');
                  if (!columnHasOptions) {
                    const defaultOptions = defaultOptionsValues(columnHasOptions);
                    Object.assign(column, defaultOptions);
                  }
                  return (
                    <div className="w-100" {...droppableProps} ref={innerRef}>
                      {column?.options?.map((option, optionIndex) => {
                        const resolvedItemName = option.label;
                        return (
                          <Draggable key={option.label} draggableId={option.label} index={optionIndex}>
                            {(provided, snapshot) => {
                              return (
                                <div
                                  key={optionIndex}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{ ...getItemStyle(provided.draggableProps.style) }}
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
                <ButtonComponent
                  leadingIcon="addrectangle"
                  onClick={() => {
                    createNewOption();
                  }}
                  variant="secondary"
                  className="tw-w-full mt-2"
                  width="100%"
                >
                  Add new option
                </ButtonComponent>
              </div>
            </div>
          </List>
        )}
      </div>
    ),
  });

  return <Accordion items={items} className="table-select-column-accordian" />;
};
