import React, { useState, useEffect } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useStore from '@/AppBuilder/_stores/store';
import CodeHinter from '@/AppBuilder/CodeEditor';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import ListGroup from 'react-bootstrap/ListGroup';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SortableList from '@/_components/SortableList';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { shallow } from 'zustand/shallow';
import Switch from '@/Editor/CodeBuilder/Elements/Switch';

export function Steps({ componentMeta, darkMode, ...restProps }) {
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
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  const isDynamicOptionsEnabled = getResolvedValue(component?.component?.definition?.properties?.advanced?.value);

  const [options, setOptions] = useState([]);
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);
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
    paramUpdated({ name: 'steps' }, 'value', options, 'properties', false, props);
  };

  const generateNewOptions = () => {
    let found = false;
    let label = '';
    let currentNumber = options.length + 1;
    while (!found) {
      label = `step ${currentNumber}`;
      if (options.find((option) => option.label === label) === undefined) {
        found = true;
      }
      currentNumber += 1;
    }
    return {
      name: label,
      id: Number((Math.random() * 1000).toFixed(0)),
      tooltip: label,
      visible: { value: '{{true}}' },
      disabled: { value: '{{false}}' },
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

  const handleLabelChange = (propertyName, value, index) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          [propertyName]: value,
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

  const _renderOverlay = (item, index) => {
    return (
      <Popover className={`${darkMode && 'dark-theme theme-dark'}`} style={{ minWidth: '248px' }}>
        <Popover.Body>
          <div className="field mb-3" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="font-weight-500 mb-1 font-size-12">
              {'Id'}
            </label>
            <CodeHinter
              type={'basic'}
              initialValue={item?.id + ''}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Option label'}
              onChange={(value) => handleLabelChange('id', value, index)}
            />
          </div>
          <div className="field mb-3" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="font-weight-500 mb-1 font-size-12">
              {'Label'}
            </label>
            <CodeHinter
              type={'basic'}
              initialValue={item?.name}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Option label'}
              onChange={(value) => handleLabelChange('name', value, index)}
            />
          </div>
          <div className="field mb-3" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="font-weight-500 mb-1 font-size-12">
              {'Tooltip'}
            </label>
            <CodeHinter
              type={'basic'}
              initialValue={item?.tooltip + ''}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Tooltip'}
              onChange={(value) => handleLabelChange('tooltip', value, index)}
            />
          </div>
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <CodeHinter
              initialValue={item?.visible?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'fxEditor'}
              paramLabel={'Visibility'}
              onChange={(value) =>
                handleLabelChange(
                  'visible',
                  {
                    value,
                  },
                  index
                )
              }
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
              initialValue={item?.disabled?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'fxEditor'}
              paramLabel={'Disable'}
              paramName={'disable'}
              onChange={(value) => handleLabelChange('disabled', { value }, index)}
              onFxPress={(active) => handleOnFxPress(active, index, 'disabled')}
              fxActive={item?.disabled?.fxActive}
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
                    <Draggable key={item.name} draggableId={item.name} index={index}>
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
                            <div key={item.name + item.id}>
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
                                    {getResolvedValue(item.name)}
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

  const isDynamicStepsEnabled = getResolvedValue(component?.component?.definition?.properties?.advanced?.value);
  useEffect(() => {
    setOptions(constructSteps());
  }, [component?.id, isDynamicStepsEnabled]);

  const constructSteps = () => {
    try {
      let optionsValue = isDynamicOptionsEnabled
        ? component?.component?.definition?.properties?.schema?.value
        : component?.component?.definition?.properties?.steps?.value;
      let options = [];

      if (isDynamicOptionsEnabled || typeof optionsValue === 'string') {
        options = getResolvedValue(optionsValue);
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

        if (!('visible' in newOption)) {
          newOption['visible'] = { value: '{{true}}' };
        }
        return newOption;
      });
    } catch (error) {
      return [];
    }
  };

  let items = [];

  items.push({
    title: 'Steps',
    isOpen: true,
    children: (
      <>
        {properties
          .filter((property) => !optionsProperties.includes(property))
          ?.map((property) => {
            if (property === 'steps') {
              return (
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
                  {isDynamicStepsEnabled
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
                </>
              );
            }
            //  else if (property === 'variant') {
            //   return renderTest(
            //     component,
            //     componentMeta,
            //     paramUpdated,
            //     dataQueries,
            //     'variant',
            //     'properties',
            //     currentState,
            //     allComponents,
            //     handleLabelChange
            //   );
            // }
            return renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              property,
              'properties',
              currentState,
              allComponents,
              darkMode
            );
          })}
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

function renderTest(...props) {
  const [
    component,
    componentMeta,
    paramUpdated,
    dataQueries,
    param,
    paramType,
    currentState,
    components = {},
    darkMode = false,
    placeholder = '',
    validationFn,
  ] = props;
  const value = componentMeta?.definition?.properties?.variant?.value;
  return (
    <div style={{ marginBottom: 8 }}>
      <Switch
        value={value}
        onChange={(e) => {
          paramUpdated({ name: 'variant' }, 'value', e, 'properties', false, props);
        }}
        meta={{
          ...componentMeta.properties[param],
          fullWidth: true,
        }}
        paramName={param}
        isIcon={false}
        component={component.component.definition.name}
      />
    </div>
  );
}
