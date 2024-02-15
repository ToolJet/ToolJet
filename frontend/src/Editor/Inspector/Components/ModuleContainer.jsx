/* eslint-disable prettier/prettier */
import React from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { uniqueId , capitalize, has } from 'lodash';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import List from '@/ToolJetUI/List/List';
import NoListItem from '../Components/Table/NoListItem';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import { computeActionName, resolveReferences } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import SelectSearch from 'react-select-search';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';

export const ModuleContainer = ({
  componentMeta,
  darkMode,
  layoutPropertyChanged,
  component,
  paramUpdated,
  dataQueries,
  currentState,
  eventsChanged,
  apps,
  allComponents,
  pages,
  addProperty,
}) => {
  const properties = Object.keys(component.component?.definition?.properties ?? {});
  console.log({ properties, old: Object.keys(componentMeta.properties) });

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  const { id } = component;

  const addInput = () => {
    // paramUpdated({ name: 'test3' }, 'meta', { displayName: 'Test 2', type: 'code' }, 'properties');
    // setTimeout(() => paramUpdated({ name: 'test3' }, 'value', 'testvalue', 'properties'), 100);
    //paramUpdated({ name: 'test', ...component.component.properties[param] }, 'fxActive', active, paramType)
    addProperty({ id, name: uniqueId().toString(), displayName: uniqueId().toString(), value: 'test5', type: 'code' });
  };

  const generateNewInputItemName = (items) => {
    let found = false;
    let itemName = '';
    let currentNumber = 1;

    while (!found) {
      itemName = `input${currentNumber}`;
      if (items.find((item) => item.name === itemName) === undefined) {
        found = true;
      }
      currentNumber += 1;
    }

    return itemName;
  };

  const addNewInputItem = () => {
    const inputItems = component.component.definition.properties.inputItems;
    const newValue = inputItems.value;
    newValue.push({ name: generateNewInputItemName(inputItems.value), id: uuidv4(), type: 'data', defaultValue: '' });
    paramUpdated({ name: 'inputItems' }, 'value', newValue, 'properties', true);
  };

  const inputItemPropertyChanged = (index, property, value) => {
    const inputItems = component.component.definition.properties.inputItems;
    inputItems.value[index][property] = value;
    paramUpdated({ name: property }, 'value', inputItems.value, 'properties', true);
  }

  const accordionItems = baseComponentProperties(
    properties,
    events,
    component,
    componentMeta,
    layoutPropertyChanged,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    validations,
    darkMode,
    pages,
    addInput,
    addNewInputItem,
    inputItemPropertyChanged
  );

  return <Accordion items={accordionItems} />;
};

export const baseComponentProperties = (
  properties,
  events,
  component,
  componentMeta,
  layoutPropertyChanged,
  paramUpdated,
  dataQueries,
  currentState,
  eventsChanged,
  apps,
  allComponents,
  validations,
  darkMode,
  pages,
  addInput,
  addNewInputItem,
  inputItemPropertyChanged
) => {
  let items = [];
  const inputItems = component.component.definition.properties.inputItems.value;

  const itemPopover = (item, index) => (
    <Popover
      id="popover-basic-2"
      className={`${darkMode && 'dark-theme'} shadow`}
      style={{
        maxHeight: '600px',
      }}
    >
      <Popover.Body>
        <div className="field mb-2 tj-app-input">
          <label data-cy={`label-action-button-text`} className="form-label">
            Name
          </label>
          <input
            data-cy={`action-button-text-input-field`}
            type="text"
            className="form-control text-field"
            onBlur={(e) => {
              e.stopPropagation();
              inputItemPropertyChanged(index, 'name', e.target.value);
              // this.onActionButtonPropertyChanged(index, 'buttonText', e.target.value);
            }}
            defaultValue={item.name}
          />
        </div>
        <div className="field mb-2" data-cy={`dropdown-action-button-position`}>
          <label data-cy={`label-action-button-position`} className="form-label">
            Type
          </label>
          <SelectSearch
            className={'select-search'}
            options={[
              { name: 'Data', value: 'data' },
              { name: 'Query', value: 'query' },
            ]}
            value={item.type}
            search={false}
            closeOnSelect={true}
            onChange={(value) => {
              inputItemPropertyChanged(index, 'type', value);
            }}
            fuzzySearch
            placeholder="Select position"
          />
        </div>
        <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="form-label">
              Default value
            </label>
            <CodeHinter
              currentState={currentState}
              initialValue={item.defaultValue}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Default value'}
              onChange={
                (value) => inputItemPropertyChanged(index, 'defaultValue', value)
              }
              //componentName={this.getPopoverFieldSource(item.type, 'name')}
              popOverCallback={(showing) => {
                //this.setColumnPopoverRootCloseBlocker('name', showing);
              }}
            />
          </div>
      </Popover.Body>
    </Popover>
  );

  items.push({
    title: `${i18next.t('widget.common.input', 'Input')}`,
    isOpen: true,
    children: (
      <>
        <List>
          <DragDropContext
            onDragEnd={(result) => {
              // this.onDragEnd(result);
            }}
          >
            <Droppable droppableId="droppable">
              {({ innerRef, droppableProps, placeholder }) => (
                <div className="w-100" {...droppableProps} ref={innerRef}>
                  {inputItems.map((item, index) => {
                    const resolvedItemName = resolveReferences(item.name, currentState);
                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            key={index}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            // style={this.getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                          >
                            <OverlayTrigger
                              trigger="click"
                              placement="left"
                              //rootClose={popOverRootCloseBlockers.length === 0}
                              overlay={itemPopover(item, index)}
                            >
                              <div key={resolvedItemName}>
                                <List.Item
                                  isDraggable={true}
                                  primaryText={resolvedItemName}
                                  secondaryText={capitalize(item?.columnType)}
                                  data-cy={`input-item-${resolvedItemName}`}
                                  enableActionsMenu
                                  isEditable={item.isEditable === '{{true}}'}
                                  onMenuOptionClick={(listItem, menuOptionLabel) => {
                                    //if (menuOptionLabel === 'Delete') this.removeColumn(index, `${item.name}-${index}`);
                                  }}
                                  darkMode={darkMode}
                                  menuActions={[
                                    {
                                      label: 'Delete',
                                      icon: '',
                                    },
                                  ]}
                                />
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
          <div>
            {inputItems?.length === 0 && <NoListItem text={'There are no input items'} dataCy={`-input-items`} />}
            <div>
              <AddNewButton dataCy={`button-add-column`} onClick={addNewInputItem}>
                Add new
              </AddNewButton>
            </div>
          </div>
        </List>
      </>
    ),
  });

  if (events.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.events', 'Events')}`,
      isOpen: true,
      children: (
        <EventManager
          sourceId={component?.id}
          eventSourceType="component"
          eventMetaDefinition={componentMeta}
          currentState={currentState}
          dataQueries={dataQueries}
          components={allComponents}
          eventsChanged={eventsChanged}
          apps={apps}
          darkMode={darkMode}
          pages={pages}
        />
      ),
    });
  }

  if (validations.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.validation', 'Validation')}`,
      children: validations.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'validation',
          currentState,
          allComponents,
          darkMode
        )
      ),
    });
  }

  items.push({
    title: `${i18next.t('widget.common.general', 'General')}`,
    isOpen: true,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'tooltip',
          'general',
          currentState,
          allComponents
        )}
      </>
    ),
  });

  items.push({
    title: `${i18next.t('widget.common.layout', 'Layout')}`,
    isOpen: true,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnDesktop',
          'others',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnMobile',
          'others',
          currentState,
          allComponents
        )}
      </>
    ),
  });

  return items;
};
