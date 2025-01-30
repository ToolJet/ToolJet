import React, { useState, useEffect } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/_helpers/utils';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import ListGroup from 'react-bootstrap/ListGroup';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SortableList from '@/_components/SortableList';
import Trash from '@/_ui/Icon/solidIcons/Trash';

export function Select({ componentMeta, darkMode, ...restProps }) {
  const {
    layoutPropertyChanged,
    component,
    dataQueries,
    paramUpdated,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    pages,
  } = restProps;

  const isMultiSelect = component?.component?.component === 'MultiselectV2';

  const isDynamicOptionsEnabled = resolveReferences(
    component?.component?.definition?.properties?.advanced?.value,
    currentState
  );

  const constructOptions = () => {
    let optionsValue = component?.component?.definition?.properties?.options?.value;
    if (!Array.isArray(optionsValue)) {
      optionsValue = Object.values(optionsValue);
    }
    let options = [];

    if (isDynamicOptionsEnabled || typeof optionsValue === 'string') {
      options = resolveReferences(optionsValue, currentState);
    } else {
      options = optionsValue?.map((option) => option);
    }

    return options.map((option) => {
      const newOption = { ...option };

      Object.keys(option).forEach((key) => {
        if (typeof option[key]?.value === 'boolean') {
          newOption[key]['value'] = `{{${option[key]?.value}}}`;
        }
      });

      return newOption;
    });
  };

  const _markedAsDefault = resolveReferences(
    component?.component?.definition?.properties[isMultiSelect ? 'values' : 'value']?.value,
    currentState
  );

  const [options, setOptions] = useState([]);
  const [markedAsDefault, setMarkedAsDefault] = useState(_markedAsDefault);
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);
  const validations = Object.keys(componentMeta.validation || {});
  let properties = [];
  let additionalActions = [];
  let optionsProperties = [];

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.accordian === 'Options') {
      optionsProperties.push(key);
    } else {
      properties.push(key);
    }
  }

  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    ...draggableStyle,
  });

  const updateAllOptionsParams = (options, props) => {
    paramUpdated({ name: 'options' }, 'value', options, 'properties', false, props);
  };

  const generateNewOptions = () => {
    let found = false;
    let label = '';
    let currentNumber = options.length + 1;
    let value = currentNumber;
    while (!found) {
      label = `option${currentNumber}`;
      value = currentNumber.toString();
      if (options.find((option) => option.label === label) === undefined) {
        found = true;
      }
      currentNumber += 1;
    }
    return {
      value,
      label,
      visible: { value: '{{true}}' },
      disable: { value: '{{false}}' },
      default: { value: '{{false}}' },
    };
  };

  const handleAddOption = () => {
    let _option = generateNewOptions();
    const _items = [...options, _option];
    setOptions(_items);
    updateAllOptionsParams(_items);
  };

  const handleDeleteOption = (index) => {
    const _items = options.filter((option, i) => i !== index);
    setOptions(_items);
    updateAllOptionsParams(_items, { isParamFromDropdownOptions: true });
  };

  const handleLabelChange = (label, index) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          label,
        };
      }
      return option;
    });
    setOptions(_options);
    updateAllOptionsParams(_options);
  };

  const handleValueChange = (value, index) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          value,
        };
      }
      return option;
    });
    setOptions(_options);
    updateAllOptionsParams(_options);
  };

  const reorderOptions = async (startIndex, endIndex) => {
    const result = [...options];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setOptions(result);
    updateAllOptionsParams(result);
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    reorderOptions(source.index, destination.index);
  };

  const handleMarkedAsDefaultChange = (value, index) => {
    const isMarkedAsDefault = resolveReferences(value, currentState);
    if (isMultiSelect) {
      const _value = options[index]?.value;
      let _markedAsDefault = [];
      if (isMarkedAsDefault && !markedAsDefault.includes(_value)) {
        _markedAsDefault = [...markedAsDefault, _value];
      } else {
        _markedAsDefault = markedAsDefault.filter((value) => value !== _value);
      }
      setMarkedAsDefault(_markedAsDefault);
      paramUpdated({ name: 'values' }, 'value', _markedAsDefault, 'properties');
    } else {
      const _value = isMarkedAsDefault ? options[index]?.value : '';
      const _options = options.map((option, i) => {
        if (i === index) {
          return {
            ...option,
            default: {
              ...option.default,
              value,
            },
          };
        } else {
          return {
            ...option,
            default: {
              ...option.default,
              value: `{{false}}`,
            },
          };
        }
      });
      setOptions(_options);
      setMarkedAsDefault(_value);
      updateAllOptionsParams(_options);
    }
  };

  const handleVisibilityChange = (value, index) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          visible: {
            ...option.visible,
            value,
          },
        };
      }
      return option;
    });
    setOptions(_options);
    updateAllOptionsParams(_options);
  };

  const handleDisableChange = (value, index) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          disable: {
            ...option.disable,
            value,
          },
        };
      }
      return option;
    });
    setOptions(_options);
    updateAllOptionsParams(_options);
  };

  const handleOnFxPress = (active, index, key) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          [key]: {
            ...option[key],
            fxActive: active,
          },
        };
      }
      return option;
    });
    setOptions(_options);
    updateAllOptionsParams(_options);
  };

  useEffect(() => {
    setOptions(constructOptions());
  }, [isMultiSelect, component?.id]);

  const _renderOverlay = (item, index) => {
    return (
      <Popover className={`${darkMode && 'dark-theme theme-dark'}`} style={{ minWidth: '248px' }}>
        <Popover.Body>
          <div className="field mb-3" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="font-weight-500 mb-1 font-size-12">
              {'Option label'}
            </label>
            <CodeHinter
              currentState={currentState}
              type={'basic'}
              initialValue={item?.label}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Option label'}
              onChange={(value) => handleLabelChange(value, index)}
            />
          </div>
          <div className="field mb-3" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="font-weight-500 mb-1 font-size-12">
              {'Option value'}
            </label>
            <CodeHinter
              currentState={currentState}
              type={'basic'}
              initialValue={item?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Option value'}
              onChange={(value) => handleValueChange(value, index)}
            />
          </div>
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <CodeHinter
              currentState={currentState}
              initialValue={isMultiSelect ? `{{${markedAsDefault.includes(item.value)}}}` : item?.default?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'fxEditor'}
              paramLabel={'Make this default option'}
              paramName={'isEditable'}
              onChange={(value) => handleMarkedAsDefaultChange(value, index)}
              onFxPress={(active) => handleOnFxPress(active, index, 'default')}
              fxActive={item?.default?.fxActive}
              fieldMeta={{
                type: 'toggle',
                displayName: 'Make editable',
                isFxNotRequired: true,
              }}
              paramType={'toggle'}
            />
          </div>
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <CodeHinter
              currentState={currentState}
              initialValue={item?.visible?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'fxEditor'}
              paramLabel={'Visibility'}
              onChange={(value) => handleVisibilityChange(value, index)}
              paramName={'visible'}
              onFxPress={(active) => handleOnFxPress(active, index, 'visible')}
              fxActive={item?.visible?.fxActive}
              fieldMeta={{
                type: 'toggle',
                displayName: 'Make editable',
              }}
              paramType={'toggle'}
            />
          </div>
          <div className="field" data-cy={`input-and-label-column-name`}>
            <CodeHinter
              currentState={currentState}
              initialValue={item?.disable?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'fxEditor'}
              paramLabel={'Disable'}
              paramName={'disable'}
              onChange={(value) => handleDisableChange(value, index)}
              onFxPress={(active) => handleOnFxPress(active, index, 'disable')}
              fxActive={item?.disable?.fxActive}
              fieldMeta={{
                type: 'toggle',
                displayName: 'Make editable',
              }}
              paramType={'toggle'}
            />
          </div>
        </Popover.Body>
      </Popover>
    );
  };

  const _renderOptions = () => {
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
                  return (
                    <Draggable key={item.value} draggableId={item.value} index={index}>
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
                            overlay={_renderOverlay(item, index)}
                          >
                            <div key={item.value}>
                              <ListGroup.Item
                                style={{ marginBottom: '8px', backgroundColor: 'var(--slate3)' }}
                                onMouseEnter={() => setHoveredOptionIndex(index)}
                                onMouseLeave={() => setHoveredOptionIndex(null)}
                                {...restProps}
                              >
                                <div className="row">
                                  <div className="col-auto d-flex align-items-center">
                                    <SortableList.DragHandle show />
                                  </div>
                                  <div className="col text-truncate cursor-pointer" style={{ padding: '0px' }}>
                                    {resolveReferences(item.label, currentState)}
                                  </div>
                                  <div className="col-auto">
                                    {index === hoveredOptionIndex && (
                                      <ButtonSolid
                                        variant="danger"
                                        size="xs"
                                        className={'delete-icon-btn'}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteOption(index);
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
        <AddNewButton onClick={handleAddOption} dataCy="add-new-dropdown-option" className="mt-0">
          Add new option
        </AddNewButton>
      </List>
    );
  };

  let items = [];

  items.push({
    title: 'Data',
    isOpen: true,
    children: properties
      .filter((property) => !optionsProperties.includes(property))
      ?.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'properties',
          currentState,
          allComponents,
          darkMode
        )
      ),
  });

  items.push({
    title: 'Options',
    isOpen: true,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'advanced',
          'properties',
          currentState,
          allComponents
        )}
        {isDynamicOptionsEnabled
          ? renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'schema',
              'properties',
              currentState,
              allComponents
            )
          : _renderOptions()}
        {isDynamicOptionsEnabled &&
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'optionsLoadingState',
            'properties',
            currentState,
            allComponents
          )}
        {isMultiSelect &&
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'showAllOption',
            'properties',
            currentState,
            allComponents
          )}
      </>
    ),
  });

  items.push({
    title: 'Events',
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

  items.push({
    title: 'Validation',
    isOpen: true,
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
        darkMode,
        componentMeta.validation?.[property]?.placeholder
      )
    ),
  });

  items.push({
    title: `Additional Actions`,
    isOpen: true,
    children: additionalActions.map((property) => {
      return renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        property,
        'properties',
        currentState,
        allComponents,
        darkMode,
        componentMeta.properties?.[property]?.placeholder
      );
    }),
  });

  items.push({
    title: 'Devices',
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

  return <Accordion items={items} />;
}
