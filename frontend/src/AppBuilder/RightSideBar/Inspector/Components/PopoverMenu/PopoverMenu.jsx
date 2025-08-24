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
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { shallow } from 'zustand/shallow';
import './styles.scss';

export const PopoverMenu = ({ componentMeta, darkMode, ...restProps }) => {
  let properties = [];
  let additionalActions = [];
  let optionsProperties = [];
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const [options, setOptions] = useState([]);
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);

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

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.accordian === 'Options') {
      optionsProperties.push(key);
    } else {
      properties.push(key);
    }
  }

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

  useEffect(() => {
    setOptions(constructOptions());
  }, [component?.component?.definition?.properties?.options?.value, isDynamicOptionsEnabled]);

  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    ...draggableStyle,
  });

  const _renderOverlay = (item, index) => {
    return (
      <Popover className={`${darkMode && 'dark-theme theme-dark'} pm-option-popover`} style={{ minWidth: '248px' }}>
        <Popover.Body>
          <div>
            <div className="pm-option-header">
              <span className="pm-option-header-title">Option details</span>
              <div className="pm-option-details-actions">
                <SolidIcon name="copy" width="14px" fill="#6A727C" />
                <SolidIcon name="trash" width="14px" fill="#6A727C" />
              </div>
            </div>
            <div className="pm-option-details">
              <div className="field mb-2">
                <CodeHinter
                  type={'fxEditor'}
                  initialValue={''}
                  paramLabel={'Data format'}
                  theme={darkMode ? 'monokai' : 'default'}
                  paramName={'dataFormat'}
                  onChange={(value) => {
                    console.log('value', value);
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
                <label className="font-weight-500 mb-1 font-size-12">Option title</label>
                <CodeHinter
                  type={'basic'}
                  initialValue={item?.title}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  onChange={(value) => {
                    console.log('value', value);
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
                    console.log('value', value);
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
                    // onChangeIcon(item, { value }, 'icon', index);
                    console.log('value', value);
                  }}
                  // onVisibilityChange={(value) => onChangeVisibility(item, { value: true }, 'iconVisibility', index)}
                  fieldMeta={{ type: 'icon', displayName: 'Icon' }}
                  paramType={'icon'}
                  // iconVisibility={iconVisibility}
                />
              </div>
              <div className="field mb-2">
                <CodeHinter
                  initialValue={item?.optionVisibility?.value}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  type={'fxEditor'}
                  paramLabel={'Option visibility'}
                  paramName={'optionVisibility'}
                  onChange={(value) => {
                    // handleValueChange(item, { value }, 'loading', index);
                    console.log('value', value);
                  }}
                  fieldMeta={{ type: 'toggle', displayName: 'Option visibility' }}
                  paramType={'toggle'}
                />
              </div>
              <div className="field mb-2">
                <CodeHinter
                  initialValue={item?.optionDisabled?.value}
                  theme={darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  type={'fxEditor'}
                  paramLabel={'Disable option'}
                  paramName={'optionDisabled'}
                  onChange={(value) => {
                    // handleValueChange(item, { value }, 'loading', index);
                    console.log('value', value);
                  }}
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

  const _renderOptions = () => {
    return (
      <List style={{ marginBottom: '20px' }}>
        <DragDropContext
          onDragEnd={(result) => {
            // onDragEnd(result);
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
                            onExited={() => {
                              //   if (isSortingEnabled && sort !== 'none') {
                              //     const sortedOptions = sortArray([...options], sort);
                              //     updateOptions(sortedOptions);
                              //   }
                            }}
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
                                    {/* {getSafeRenderableValue(getResolvedValue(item?.label))} */}
                                    {item?.label}
                                  </div>
                                  <div className="col-auto">
                                    {index === hoveredOptionIndex && (
                                      <ButtonSolid
                                        variant="danger"
                                        size="xs"
                                        className={'delete-icon-btn'}
                                        onClick={(e) => {
                                          //   e.stopPropagation();
                                          //   handleDeleteOption(index);
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
        <AddNewButton
          //  onClick={handleAddOption}
          dataCy="add-new-dropdown-option"
          className="mt-0"
        >
          Add new option
        </AddNewButton>
      </List>
    );
  };

  let items = [];

  items.push({
    title: 'Trigger',
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

  console.log('isDynamicOptionsEnabled', isDynamicOptionsEnabled);
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
};
