import React, { useEffect, useState } from 'react';
import { renderElement } from '../../Utils';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import List from '@/ToolJetUI/List/List';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import CodeHinter from '@/AppBuilder/CodeEditor';
import ListGroup from 'react-bootstrap/ListGroup';
import SortableList from '@/_components/SortableList';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getSafeRenderableValue } from '@/Editor/Components/utils';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';
import './styles.scss';

export const PopoverMenu = ({ componentMeta, darkMode, ...restProps }) => {
  // ===== STATE AND VARIABLES =====
  const [options, setOptions] = useState([]);
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);

  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

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

  const isDynamicOptionsEnabled = getResolvedValue(component?.component?.definition?.properties?.advanced?.value);

  // ===== HELPER FUNCTIONS =====
  const updateOptions = (options) => {
    setOptions(options);
    paramUpdated({ name: 'options' }, 'value', options, 'properties', false);
  };

  const constructOptions = () => {
    let optionsValue = component?.component?.definition?.properties?.options?.value;
    if (!Array.isArray(optionsValue)) {
      optionsValue = Object.values(optionsValue);
    }
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

      return newOption;
    });
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
      format: 'plain',
      label,
      description: '',
      value,
      icon: { value: 'IconCirclePlus' },
      iconVisibility: false,
      visible: { value: '{{true}}' },
      disable: { value: '{{false}}' },
    };
  };

  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    ...draggableStyle,
  });

  // ===== EVENT HANDLERS =====
  const handleOptionChange = (propertyPath, value, index) => {
    const newOptions = options.map((option, i) => {
      if (i === index) {
        if (propertyPath.includes('.')) {
          const [parentKey, childKey] = propertyPath.split('.');
          return {
            ...option,
            [parentKey]: {
              ...option[parentKey],
              [childKey]: value,
            },
          };
        }
        return {
          ...option,
          [propertyPath]: value,
        };
      }
      return option;
    });
    updateOptions(newOptions);
  };

  const handleDeleteOption = (index) => {
    const newOptions = options.filter((option, i) => i !== index);
    console.log('newOptions', newOptions);
    updateOptions(newOptions);
  };

  const handleAddOption = () => {
    let _option = generateNewOptions();
    const newOptions = [...options, _option];
    updateOptions(newOptions);
  };

  const reorderOptions = async (startIndex, endIndex) => {
    const result = [...options];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    updateOptions(result);
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    reorderOptions(source.index, destination.index);
  };

  // ===== SIDE EFFECTS =====
  useEffect(() => {
    const newOptions = constructOptions();
    updateOptions(newOptions);
  }, [isDynamicOptionsEnabled]);

  // ===== RENDER FUNCTIONS =====
  const _renderOverlay = (item, index) => {
    const iconVisibility = item?.iconVisibility;
    return (
      <Popover className={`${darkMode && 'dark-theme theme-dark'} pm-option-popover`} style={{ minWidth: '248px' }}>
        <Popover.Body>
          <div>
            <div className="pm-option-header">
              <span className="pm-option-header-title">Option details</span>
              <div className="pm-option-details-actions">
                <ButtonComponent
                  variant="ghost"
                  iconOnly
                  onClick={function noRefCheck() {}}
                  trailingIcon="copy"
                  size="medium"
                />
                <ButtonComponent
                  variant="ghost"
                  iconOnly
                  onClick={() => handleDeleteOption(index)}
                  trailingIcon="trash"
                  size="medium"
                />
              </div>
            </div>
            <div className="pm-option-details">
              <div className="field mb-2">
                <CodeHinter
                  type={'fxEditor'}
                  initialValue={item?.format || 'plain'}
                  paramLabel={'Data format'}
                  theme={darkMode ? 'monokai' : 'default'}
                  paramName={'dataFormat'}
                  onChange={(value) => {
                    handleOptionChange('format', value, index);
                  }}
                  fieldMeta={{
                    type: 'select',
                    displayName: 'Data format',
                    options: [
                      { name: 'Plain', value: 'plain' },
                      { name: 'HTML', value: 'html' },
                      { name: 'Markdown', value: 'markdown' },
                    ],
                    isFxNotRequired: true,
                  }}
                  paramType={'select'}
                />
              </div>

              <div className="field mb-2">
                <label className="font-weight-500 mb-1 font-size-12">Label</label>
                <CodeHinter
                  type={'basic'}
                  initialValue={item?.label}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  onChange={(value) => {
                    handleOptionChange('label', value, index);
                  }}
                />
              </div>
              <div className="field mb-2">
                <label className="font-weight-500 mb-1 font-size-12">Description</label>
                <CodeHinter
                  type={'basic'}
                  initialValue={item?.description}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  onChange={(value) => {
                    handleOptionChange('description', value, index);
                  }}
                />
              </div>
              <div className="field mb-2">
                <label className="font-weight-500 mb-1 font-size-12">Value</label>
                <CodeHinter
                  type={'basic'}
                  initialValue={item?.value}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  onChange={(value) => {
                    handleOptionChange('value', value, index);
                  }}
                />
              </div>
              <div className="field mb-3" data-cy={`input-and-label-tab-id`}>
                <CodeHinter
                  currentState={currentState}
                  initialValue={item?.icon?.value || ''}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  component={component}
                  type={'fxEditor'}
                  paramLabel={'Icon'}
                  paramName={'icon'}
                  onChange={(value) => {
                    handleOptionChange('icon.value', value, index);
                  }}
                  onVisibilityChange={(value) => {
                    const transformedValue = getResolvedValue(value);
                    handleOptionChange('iconVisibility', transformedValue, index);
                  }}
                  onFxPress={(active) => handleOptionChange('icon.fxActive', active, index)}
                  fxActive={item?.icon?.fxActive}
                  fieldMeta={{ type: 'icon', displayName: 'Icon' }}
                  paramType={'icon'}
                  iconVisibility={iconVisibility}
                />
              </div>
              <div className="field mb-2">
                <CodeHinter
                  initialValue={item?.visible?.value}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  type={'fxEditor'}
                  paramLabel={'Option visibility'}
                  paramName={'optionVisibility'}
                  onChange={(value) => {
                    handleOptionChange('visible.value', value, index);
                  }}
                  onFxPress={(active) => handleOptionChange('visible.fxActive', active, index)}
                  fxActive={item?.visible?.fxActive}
                  fieldMeta={{ type: 'toggle', displayName: 'Option visibility' }}
                  paramType={'toggle'}
                />
              </div>
              <div className="field mb-2">
                <CodeHinter
                  initialValue={item?.disable?.value}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  type={'fxEditor'}
                  paramLabel={'Disable option'}
                  paramName={'optionDisabled'}
                  onChange={(value) => {
                    handleOptionChange('disable.value', value, index);
                  }}
                  onFxPress={(active) => handleOptionChange('disable.fxActive', active, index)}
                  fxActive={item?.disable?.fxActive}
                  fieldMeta={{ type: 'toggle', displayName: 'Disable option' }}
                  paramType={'toggle'}
                />
              </div>
            </div>
          </div>
        </Popover.Body>
      </Popover>
    );
  };

  // ===== PROPERTY ORGANIZATION =====
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

  // ===== RENDER FUNCTIONS =====
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
                    <Draggable key={item?.value} draggableId={item?.value} index={index}>
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
                            onToggle={(isOpen) => {
                              if (!isOpen) {
                                document.activeElement?.blur(); // Manually trigger blur when popover closes
                              }
                            }}
                          >
                            <div key={item?.value}>
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
                                    {getSafeRenderableValue(getResolvedValue(item?.label))}
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

  // ===== MAIN RENDER =====
  // Helper function to create renderElement with common parameters
  const createRenderElement = (property, type = 'properties', extraProps = {}) => {
    return renderElement(
      component,
      componentMeta,
      extraProps.paramUpdated || paramUpdated,
      dataQueries,
      property,
      type,
      currentState,
      allComponents,
      extraProps.darkMode || darkMode,
      extraProps.placeholder || ''
    );
  };

  // Helper function to create accordion items
  const createAccordionItem = (title, children, isOpen = true) => ({
    title,
    isOpen,
    children,
  });

  // Section configurations
  const sections = [
    {
      title: 'Trigger',
      type: 'properties',
      properties: properties.filter((property) => !optionsProperties.includes(property)),
    },
    {
      title: 'Options',
      custom: () => (
        <>
          {createRenderElement('advanced')}
          {isDynamicOptionsEnabled ? createRenderElement('schema') : _renderOptions()}
        </>
      ),
    },
    {
      title: 'Events',
      custom: () => (
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
    },
    {
      title: 'Additional Actions',
      type: 'properties',
      properties: additionalActions,
      extraProps: (property) => ({
        placeholder: componentMeta.properties?.[property]?.placeholder,
      }),
    },
    {
      title: 'Devices',
      type: 'others',
      properties: ['showOnDesktop', 'showOnMobile'],
      extraProps: () => ({ paramUpdated: layoutPropertyChanged }),
    },
  ];

  // Build accordion items
  const items = sections.map((section) => {
    if (section.custom) {
      return createAccordionItem(section.title, section.custom());
    }

    const children = section.properties.map((property) => {
      const extraProps = section.extraProps ? section.extraProps(property) : {};
      return createRenderElement(property, section.type, extraProps);
    });

    return createAccordionItem(section.title, children);
  });

  return <Accordion items={items} />;
};
