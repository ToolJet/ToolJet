import React, { useState } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import SelectSearch from 'react-select-search';
import { useTranslation } from 'react-i18next';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import { EventManager } from '../../EventManager';
import { ProgramaticallyHandleProperties } from './ProgramaticallyHandleProperties';
import Accordion from '@/_ui/Accordion';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import NoListItem from './NoListItem';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

export const PropertiesTabElements = ({
  column,
  index,
  darkMode,
  currentState,
  onColumnItemChange,
  getPopoverFieldSource,
  setColumnPopoverRootCloseBlocker,
  component,
  props,
  columnEventChanged,
  timeZoneOptions,
}) => {
  const { t } = useTranslation();
  const [showPopover, setShowPopover] = useState(false);
  let items = [];
  const addNewOptionForSelect = () => {
    const options = column?.options || [];
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
  const selectPopover = (option, optionIndex) => {
    const handleSelectOption = (option, optionIndex, value, index, optionItemChanged) => {
      const columns = props.component.component.definition.properties.columns;
      const column = columns.value[index];
      const options = column.options;
      options[optionIndex][optionItemChanged] = value;
      column.options = options;
      console.log('arpit ::', { options, column });
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

  // const renderSelectColumnTypeMenuList = (option, optionIndex) => {
  //   console.log('index ::', { optionIndex });
  //   return (
  //     <OverlayTrigger
  //       trigger="click"
  //       placement="top"
  //       rootClose={true}
  //       overlay={selectPopover(option, optionIndex)}
  //       onToggle={(showing) => setShowPopover(showing)}
  //     >
  //       <div>
  //         <List>
  //           <List.Item primaryText={option.name} />
  //         </List>
  //       </div>
  //     </OverlayTrigger>
  //   );
  // };

  if (column.columnType === 'dropdown') {
    console.log('arpit', { column });
    items.push({
      title: 'Options',
      children: (
        // <div className="field">
        //   <div className="row g-2">
        //     <div>
        //       {column?.options?.map((option, optionIndex) => {
        //         return renderSelectColumnTypeMenuList(option, optionIndex);
        //       })}
        //     </div>
        //     {column?.options?.length === 0 && (
        //       <NoListItem text={'There are no action buttons'} dataCy={`-action-button`} />
        //     )}
        //     <AddNewButton dataCy="button-add-new-action-button" onClick={addNewOptionForSelect} className="mt-0">
        //       Add new option
        //     </AddNewButton>
        //   </div>
        // </div>
        <List>
          <DragDropContext
            onDragEnd={(result) => {
              onDragEnd(result);
            }}
          >
            <Droppable droppableId="droppable">
              {({ innerRef, droppableProps, placeholder }) => {
                return (
                  <div className="w-100" {...droppableProps} ref={innerRef}>
                    {column?.options?.map((option, optionIndex) => {
                      const resolvedItemName = option.name;
                      return (
                        <Draggable key={option.name} draggableId={option.name} index={optionIndex}>
                          {(provided, snapshot) => {
                            if (snapshot.isDragging) {
                              console.log('kiran :: style', {
                                style: getItemStyle(snapshot, provided.draggableProps.style),
                              });
                            }
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
                                  onToggle={(showing) => setShowPopover(showing)}
                                >
                                  <div key={resolvedItemName}>
                                    <List.Item
                                      isDraggable={true}
                                      primaryText={resolvedItemName}
                                      // secondaryText={capitalize(item?.columnType)}
                                      data-cy={`column-${resolvedItemName}`}
                                      enableActionsMenu={false}
                                      // isEditable={item.isEditable === '{{true}}'}
                                      // onMenuOptionClick={(listItem, menuOptionLabel) => {
                                      //   if (menuOptionLabel === 'Delete')
                                      //     this.removeColumn(index, `${item.name}-${index}`);
                                      // }}
                                      darkMode={darkMode}
                                      // menuActions={[
                                      //   {
                                      //     label: 'Delete',
                                      //     icon: '',
                                      //   },
                                      // ]}
                                      // deleteIconOutsideMenu={true}
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
              <AddNewButton dataCy={`button-add-column`}>
                {/* {this.props.t('widget.Table.addNewColumn', ' Add new column')} */}
                Add new option
              </AddNewButton>
            </div>
          </div>
        </List>
      ),
    });
  }
  return (
    <>
      <div className="field" data-cy={`dropdown-column-type`}>
        <label data-cy={`label-column-type`} className="form-label">
          {t('widget.Table.columnType', 'Column type')}
        </label>
        <SelectSearch
          className={`${darkMode ? 'select-search' : 'select-search'}`}
          options={[
            { name: 'Default', value: 'default' },
            { name: 'String', value: 'string' },
            { name: 'Number', value: 'number' },
            { name: 'Text', value: 'text' },
            { name: 'Badge', value: 'badge' },
            { name: 'Multiple badges', value: 'badges' },
            { name: 'Tags', value: 'tags' },
            { name: 'Dropdown', value: 'dropdown' },
            { name: 'Link', value: 'link' },
            { name: 'Radio', value: 'radio' },
            { name: 'Multiselect', value: 'multiselect' },
            { name: 'Toggle switch', value: 'toggle' },
            { name: 'Date Picker', value: 'datepicker' },
            { name: 'Image', value: 'image' },
          ]}
          value={column.columnType}
          search={true}
          closeOnSelect={true}
          onChange={(value) => {
            onColumnItemChange(index, 'columnType', value);
          }}
          fuzzySearch
          placeholder={t('globals.select', 'Select') + '...'}
        />
      </div>
      <div className="field" data-cy={`input-and-label-column-name`}>
        <label data-cy={`label-column-name`} className="form-label">
          {t('widget.Table.columnName', 'Column name')}
        </label>
        <CodeHinter
          currentState={currentState}
          initialValue={column.name}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={column.name}
          onChange={(value) => onColumnItemChange(index, 'name', value)}
          componentName={getPopoverFieldSource(column.columnType, 'name')}
          popOverCallback={(showing) => {
            setColumnPopoverRootCloseBlocker('name', showing);
          }}
        />
      </div>
      <div data-cy={`input-and-label-key`} className="field">
        <label className="form-label">{t('widget.Table.key', 'key')}</label>
        <CodeHinter
          currentState={currentState}
          initialValue={column.key}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={column.name}
          onChange={(value) => onColumnItemChange(index, 'key', value)}
          componentName={getPopoverFieldSource(column.columnType, 'key')}
          popOverCallback={(showing) => {
            setColumnPopoverRootCloseBlocker('tableKey', showing);
          }}
        />
      </div>
      {column.columnType === 'toggle' && (
        <div>
          <EventManager
            component={{
              component: {
                definition: {
                  events: column.events ?? [],
                },
              },
            }}
            hideEmptyEventsAlert={true}
            componentMeta={{ events: { onChange: { displayName: 'On change' } } }}
            currentState={currentState}
            dataQueries={props?.dataQueries}
            components={props?.components}
            eventsChanged={(events) => columnEventChanged(column, events)}
            apps={props?.apps}
            popOverCallback={(showing) => {
              setColumnPopoverRootCloseBlocker('event-manager', showing);
            }}
            pages={props?.pages}
          />
        </div>
      )}
      {column.columnType === 'dropdown' && <Accordion items={items} />}
      {(column.columnType === 'dropdown' ||
        column.columnType === 'multiselect' ||
        column.columnType === 'badge' ||
        column.columnType === 'badges' ||
        column.columnType === 'radio') && (
        <div>
          <div data-cy={`input-and-label-values`} className="field mb-2">
            <label className="form-label">{t('widget.Table.values', 'Values')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.values}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'{{[1, 2, 3]}}'}
              onChange={(value) => onColumnItemChange(index, 'values', value)}
              componentName={getPopoverFieldSource(column.columnType, 'values')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('values', showing);
              }}
            />
          </div>
          <div data-cy={`input-and-label-labels`} className="field mb-2">
            <label className="form-label">{t('widget.Table.labels', 'Labels')}</label>
            <CodeHinter
              currentState={currentState}
              initialValue={column.labels}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'{{["one", "two", "three"]}}'}
              onChange={(value) => onColumnItemChange(index, 'labels', value)}
              componentName={getPopoverFieldSource(column.columnType, 'labels')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('labels', showing);
              }}
            />
          </div>
        </div>
      )}
      {column.columnType === 'datepicker' && (
        <div>
          <label data-cy={`label-date-display-format`} className="form-label">
            {t('widget.Table.dateDisplayformat', 'Date Display Format')}
          </label>
          <div data-cy={`input-date-display-format`} className="field mb-2">
            <CodeHinter
              currentState={currentState}
              initialValue={column.dateFormat}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'DD-MM-YYYY'}
              onChange={(value) => onColumnItemChange(index, 'dateFormat', value)}
              componentName={getPopoverFieldSource(column.columnType, 'dateFormat')}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('dateFormat', showing);
              }}
            />
          </div>
          <label data-cy={`label-date-parse-format`} className="form-label">
            {t('widget.Table.dateParseformat', 'Date Parse Format')}
          </label>
          <div className="field mb-2 tj-app-input">
            <input
              data-cy={`input-date-parse-format`}
              type="text"
              className="form-control text-field"
              onChange={(e) => {
                e.stopPropagation();
                onColumnItemChange(index, 'parseDateFormat', e.target.value);
              }}
              defaultValue={column.parseDateFormat}
              placeholder={'DD-MM-YYYY'}
            />
          </div>
          <label data-cy={`label-parse-timezone`} className="form-label">
            Parse in timezone
          </label>
          <div data-cy={`input-parse-timezone`} className="field mb-2">
            <SelectSearch
              className={'select-search'}
              options={timeZoneOptions}
              value={column.timeZoneValue}
              search={true}
              closeOnSelect={true}
              onChange={(value) => {
                onColumnItemChange(index, 'timeZoneValue', value);
              }}
              fuzzySearch
              placeholder="Select.."
            />
          </div>
          <label data-cy={`label-display-time-zone`} className="form-label">
            Display in timezone
          </label>
          <div ata-cy={`input-display-time-zone`} className="field mb-2">
            <SelectSearch
              className={'select-search'}
              options={timeZoneOptions}
              value={column.timeZoneDisplay}
              search={true}
              closeOnSelect={true}
              onChange={(value) => {
                onColumnItemChange(index, 'timeZoneDisplay', value);
              }}
              fuzzySearch
              placeholder="Select.."
            />
          </div>
          <div className="field mb-2">
            <div className="form-check form-switch my-2">
              <input
                data-cy={`toggle-show-time`}
                className="form-check-input"
                type="checkbox"
                onClick={() => {
                  onColumnItemChange(index, 'isTimeChecked', !column.isTimeChecked);
                }}
                checked={column.isTimeChecked}
              />
              <span data-cy={`label-show-time`} className="form-check-label">
                {t('widget.Table.showTime', 'show time')}
              </span>
            </div>
          </div>
        </div>
      )}
      {column.columnType === 'link' && (
        <div className="field">
          <ProgramaticallyHandleProperties
            label="Link target"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={onColumnItemChange}
            property="linkTarget"
            props={column}
            component={component}
            paramMeta={{
              type: 'select',
              displayName: 'Link Target',
              options: [
                { name: 'Same window', value: '_self' },
                { name: 'New window', value: '_blank' },
              ],
            }}
            paramType="properties"
          />
        </div>
      )}
      {!['image', 'link'].includes(column.columnType) && (
        <ProgramaticallyHandleProperties
          label="make editable"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={onColumnItemChange}
          property="isEditable"
          props={column}
          component={component}
          paramMeta={{ type: 'toggle', displayName: 'Make editable' }}
          paramType="properties"
        />
      )}
      {resolveReferences(column.isEditable, currentState) &&
        ['string', undefined, 'default', 'number', 'dropdown'].includes(column.columnType) && (
          <div className="optional-properties-when-editable-true">
            <div data-cy={`header-validation`} className="validation-text tj-text tj-text-xsm font-weight-500">
              {t('widget.Table.validation', 'Validation')}
            </div>
            {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
              <div className="d-flex flex-column custom-gap-8">
                <div data-cy={`input-and-label-regex`} className="field">
                  <label className="form-label">{t('widget.Table.regex', 'Regex')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.regex}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={''}
                    onChange={(value) => onColumnItemChange(index, 'regex', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'regex')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('regex', showing);
                    }}
                  />
                </div>
                <div className="d-flex align-item-start align-self-stretch custom-gap-3">
                  <div data-cy={`input-and-label-min-length`} className="field" style={{ flex: '1 0 0 ' }}>
                    <label className="form-label">{t('widget.Table.minLength', 'Min length')}</label>
                    <CodeHinter
                      currentState={currentState}
                      initialValue={column.minLength}
                      theme={darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={'Enter min length'}
                      onChange={(value) => onColumnItemChange(index, 'minLength', value)}
                      componentName={getPopoverFieldSource(column.columnType, 'minLength')}
                      popOverCallback={(showing) => {
                        setColumnPopoverRootCloseBlocker('minLength', showing);
                      }}
                    />
                  </div>
                  <div data-cy={`input-and-label-max-length`} className="field " style={{ flex: '1 0 0 ' }}>
                    <label className="form-label">{t('widget.Table.maxLength', 'Max length')}</label>
                    <CodeHinter
                      currentState={currentState}
                      initialValue={column.maxLength}
                      theme={darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={'Enter max length'}
                      onChange={(value) => onColumnItemChange(index, 'maxLength', value)}
                      componentName={getPopoverFieldSource(column.columnType, 'maxLength')}
                      popOverCallback={(showing) => {
                        setColumnPopoverRootCloseBlocker('maxLength', showing);
                      }}
                    />
                  </div>
                </div>
                <div data-cy={`input-and-label-custom-rule`} className="field">
                  <label className="form-label">{t('widget.Table.customRule', 'Custom rule')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.customRule}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={'eg. {{ 1 < 2 }}'}
                    onChange={(value) => onColumnItemChange(index, 'customRule', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'customRule')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('customRule', showing);
                    }}
                  />
                </div>
              </div>
            )}
            {column.columnType === 'number' && (
              <div className="d-flex align-item-start align-self-stretch custom-gap-3">
                <div data-cy={`input-and-label-min-value`} className="field flex-fill">
                  <label className="form-label">{t('widget.Table.minValue', 'Min value')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.minLength}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={'Enter min length'}
                    onChange={(value) => onColumnItemChange(index, 'minValue', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'minValue')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('minValue', showing);
                    }}
                  />
                </div>
                <div data-cy={`input-and-label-max-value`} className="field flex-fill">
                  <label className="form-label">{t('widget.Table.maxValue', 'Max value')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.maxLength}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={'Enter max length'}
                    onChange={(value) => onColumnItemChange(index, 'maxValue', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'maxValue')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('maxValue', showing);
                    }}
                  />
                </div>
              </div>
            )}
            {column.columnType === 'dropdown' && (
              <>
                {
                  <div data-cy={`input-and-label-custom-rule`} className="field mb-2">
                    <label className="form-label">{t('widget.Table.customRule', 'Custom Rule')}</label>
                    <CodeHinter
                      currentState={currentState}
                      initialValue={column.customRule}
                      theme={darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => onColumnItemChange(index, 'customRule', value)}
                      componentName={getPopoverFieldSource(column.columnType, 'customRule')}
                      popOverCallback={(showing) => {
                        setColumnPopoverRootCloseBlocker('customRule', showing);
                      }}
                    />
                  </div>
                }
              </>
            )}
          </div>
        )}

      <ProgramaticallyHandleProperties
        label="Column visibility"
        currentState={currentState}
        index={index}
        darkMode={darkMode}
        callbackFunction={onColumnItemChange}
        property="columnVisibility"
        props={column}
        component={component}
        paramMeta={{ type: 'toggle', displayName: 'Column visibility' }}
        paramType="properties"
      />
    </>
  );
};
