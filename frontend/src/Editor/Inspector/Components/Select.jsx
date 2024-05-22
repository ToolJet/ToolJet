import React, { useState, useEffect } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
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
    paramsUpdated,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    pages,
  } = restProps;

  const constructOptions = () => {
    const labels = resolveReferences(component?.component?.definition?.properties?.display_values?.value, currentState);
    const values = resolveReferences(component?.component?.definition?.properties?.values?.value, currentState);
    const disabledOptions = resolveReferences(
      component?.component?.definition?.properties?.optionDisable?.value,
      currentState
    );
    const visibleOptions = resolveReferences(
      component?.component?.definition?.properties?.optionVisibility?.value,
      currentState
    );
    const _options = values?.map((value, index) => ({
      value,
      label: labels?.[index],
      visible: visibleOptions?.[index],
      isDisabled: disabledOptions?.[index],
    }));
    return _options;
  };

  const _markedAsDefault = resolveReferences(component?.component?.definition?.properties?.value?.value, currentState);
  const isDynamicOptionsEnabled = resolveReferences(
    component?.component?.definition?.properties?.advanced?.value,
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

  const updateAllOptionsParams = (options) => {
    paramsUpdated([
      {
        param: { name: 'values' },
        attr: 'value',
        value: options.map((option) => option.value),
        paramType: 'properties',
      },
      {
        param: { name: 'display_values' },
        attr: 'value',
        value: options.map((option) => option.label),
        paramType: 'properties',
      },
      {
        param: { name: 'optionVisibility' },
        attr: 'value',
        value: options.map((option) => option.visible),
        paramType: 'properties',
      },
      {
        param: { name: 'optionDisable' },
        attr: 'value',
        value: options.map((option) => option.isDisabled),
        paramType: 'properties',
      },
    ]);
  };

  const generateNewOptions = () => {
    let found = false;
    let label = '';
    let currentNumber = options.length + 1;
    let value = currentNumber;
    while (!found) {
      label = `Option ${currentNumber}`;
      value = currentNumber.toString();
      if (options.find((option) => option.label === label) === undefined) {
        found = true;
      }
      currentNumber += 1;
    }
    return {
      value,
      label,
      visible: true,
      isDisabled: false,
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
    updateAllOptionsParams(_items);
  };

  const handleLabelChange = (label, index) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          label,
          value: option.value,
        };
      }
      return option;
    });
    setOptions(_options);
    paramUpdated(
      { name: 'display_values' },
      'value',
      _options.map((option) => option.label),
      'properties'
    );
  };

  const handleValueChange = (value, index) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          label: option.label,
          value,
        };
      }
      return option;
    });
    setOptions(_options);
    paramUpdated(
      { name: 'values' },
      'value',
      _options.map((option) => option.value),
      'properties'
    );
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
    const _value = isMarkedAsDefault ? options[index]?.value : '';
    setMarkedAsDefault(_value);
    paramUpdated({ name: 'value' }, 'value', _value, 'properties');
  };

  const handleVisibilityChange = (value, index) => {
    const _value = resolveReferences(value, currentState);
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          visible: _value,
        };
      }
      return option;
    });
    setOptions(_options);

    paramUpdated(
      { name: 'optionVisibility' },
      'value',
      _options.map((option) => option.visible),
      'properties'
    );
  };

  const handleDisableChange = (value, index) => {
    const _value = resolveReferences(value, currentState);
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          isDisabled: _value,
        };
      }
      return option;
    });
    setOptions(_options);
    paramUpdated(
      { name: 'optionDisable' },
      'value',
      _options.map((option) => option.isDisabled),
      'properties'
    );
  };

  useEffect(() => {
    setOptions(constructOptions());
  }, []);

  const _renderOverlay = (item, index) => {
    return (
      <Popover id="popover-basic" className={`${darkMode && 'dark-theme'}`} style={{ minWidth: '248px' }}>
        <Popover.Body>
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="form-label">
              {'Option label'}
            </label>
            <CodeHinter
              currentState={currentState}
              initialValue={item.label}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Option label'}
              onChange={(value) => handleLabelChange(value, index)}
            />
          </div>
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="form-label">
              {'Option value'}
            </label>
            <CodeHinter
              currentState={currentState}
              initialValue={item.value}
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
              initialValue={markedAsDefault === item.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'toggle'}
              paramLabel={'Mark this as default option'}
              onChange={(value) => handleMarkedAsDefaultChange(value, index)}
            />
          </div>
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <CodeHinter
              currentState={currentState}
              initialValue={item.visible !== false}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'toggle'}
              paramLabel={'Visibility'}
              onChange={(value) => handleVisibilityChange(value, index)}
            />
          </div>
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <CodeHinter
              currentState={currentState}
              initialValue={item.isDisabled}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'toggle'}
              paramLabel={'Disable'}
              onChange={(value) => handleDisableChange(value, index)}
            />
          </div>
        </Popover.Body>
      </Popover>
    );
  };

  const _renderOptions = () => {
    return (
      <List>
        <DragDropContext
          onDragEnd={(result) => {
            onDragEnd(result);
          }}
        >
          <Droppable droppableId="droppable">
            {({ innerRef, droppableProps, placeholder }) => (
              <div className="w-100" {...droppableProps} ref={innerRef}>
                {options.map((item, index) => {
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
                                  <div className="col text-truncate cursor-pointer" style={{ paddingLeft: '8px' }}>
                                    {item.label}
                                  </div>
                                  <div className="col-auto">
                                    <span
                                      onClick={() => {
                                        handleDeleteOption(index);
                                      }}
                                    >
                                      {index === hoveredOptionIndex && (
                                        <ButtonSolid
                                          variant="tertiary"
                                          size="xs"
                                          className={'inspector-select-option-btn'}
                                        >
                                          <span className="d-flex">
                                            <Trash fill={'#E54D2E'} width={'14'} />
                                          </span>
                                        </ButtonSolid>
                                      )}
                                    </span>
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
