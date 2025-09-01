import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { renderElement } from '../Utils';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import List from '@/ToolJetUI/List/List';
import ListGroup from 'react-bootstrap/ListGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import useStore from '@/AppBuilder/_stores/store';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SortableList from '@/_components/SortableList';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { shallow } from 'zustand/shallow';
import { getSafeRenderableValue } from '@/Editor/Components/utils';
import { resolveReferences } from '@/_helpers/utils';

export const Tags = ({
  component,
  componentMeta,
  paramUpdated,
  dataQueries,
  eventsChanged,
  apps,
  allComponents,
  currentState,
  darkMode,
  pages,
  layoutPropertyChanged,
}) => {
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);

  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  const isDynamicOptionsEnabled = getResolvedValue(component?.component?.definition?.properties?.advanced?.value);
  const currentOptions = component?.component?.definition?.properties?.options?.value || [];

  let additionalActions = [];
  let optionsProperties = [];
  let properties = [];

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

  const onDragEnd = ({ source, destination }) => {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    reorderOptions(source.index, destination.index);
  };

  const reorderOptions = (startIndex, endIndex) => {
    const result = [...currentOptions];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    paramUpdated({ property: 'options' }, 'properties', result);
  };

  const generateNewTagOption = () => {
    const colorPalette = [
      { hex: '#40474D', textColor: '#40474D' },
      { hex: '#CE2761', textColor: '#CE2761' },
      { hex: '#6745E2', textColor: '#6745E2' },
      { hex: '#2576CE', textColor: '#2576CE' },
      { hex: '#1A9C6D', textColor: '#1A9C6D' },
      { hex: '#69AF20', textColor: '#69AF20' },
      { hex: '#F35717', textColor: '#F35717' },
      { hex: '#EB2E39', textColor: '#EB2E39' },
      { hex: '#A438C0', textColor: '#A438C0' },
      { hex: '#405DE6', textColor: '#405DE6' },
      { hex: '#1E8FA3', textColor: '#1E8FA3' },
      { hex: '#34A947', textColor: '#34A947' },
      { hex: '#F19119', textColor: '#F19119' },
    ];

    const colorIndex = currentOptions.length % colorPalette.length;
    const selectedColor = colorPalette[colorIndex];
    const backgroundColor = `${selectedColor.hex}1A`;
    const textColor = selectedColor.textColor;

    let found = false;
    let title = '';
    let id = '';
    let currentNumber = currentOptions.length + 1;
    while (!found) {
      title = `Tag ${currentNumber}`;
      id = `t${currentNumber}`;
      if (currentOptions.find((option) => option.title === title || option.id === id) === undefined) {
        found = true;
      }
      currentNumber += 1;
    }
    return {
      title,
      icon: { value: 'IconHome' },
      iconVisibility: { value: '{{false}}' },
      backgroundColor: { value: backgroundColor },
      loading: { value: '{{false}}' },
      visible: { value: '{{true}}' },
      disable: { value: '{{false}}' },
      textColor: { value: textColor },
    };
  };

  const updateOptions = (options, props) => {
    paramUpdated({ name: 'options' }, 'value', options, 'properties', false, props);
  };

  const handleAddOption = () => {
    let newOption = generateNewTagOption();
    const updatedOptions = [...currentOptions, newOption];
    updateOptions(updatedOptions);
  };

  const handleDeleteOption = (index) => {
    const updatedOptions = currentOptions.filter((_, i) => i !== index);
    updateOptions(updatedOptions);
  };

  const handleValueChange = (item, value, property, index) => {
    const updatedOptions = currentOptions.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          [property]: value,
        };
      }
      return option;
    });
    updateOptions(updatedOptions);
  };

  const onChangeVisibility = (item, value, property, index) => {
    const updatedOptions = currentOptions.map((option, i) => {
      if (i === index) {
        let newVisibilityValue = resolveReferences(option[property]);
        newVisibilityValue =
          typeof newVisibilityValue === 'boolean' ? newVisibilityValue : newVisibilityValue?.['value'];
        return {
          ...option,
          [property]: !newVisibilityValue,
        };
      }
      return option;
    });
    updateOptions(updatedOptions);
  };

  const onChangeIcon = (item, value, property, index) => {
    const updatedOptions = currentOptions.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          [property]: value,
          iconVisibility: { value: true },
        };
      }
      return option;
    });
    updateOptions(updatedOptions);
  };

  const handleOnFxPress = (active, index, property) => {
    const updatedOptions = currentOptions.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          [property]: {
            ...option[property],
            fxActive: active,
          },
        };
      }
      return option;
    });
    updateOptions(updatedOptions);
  };

  const _renderOverlay = (item, index) => {
    const iconVisibility =
      item?.iconVisibility?.value !== undefined
        ? getResolvedValue(item?.iconVisibility?.value)
        : item?.iconVisibility !== undefined
        ? item?.iconVisibility
        : false;

    return (
      <Popover className={`${darkMode && 'dark-theme theme-dark'}`} style={{ minWidth: '248px' }}>
        <Popover.Body onClick={(e) => e.stopPropagation()}>
          <div className="field mb-3" data-cy={`input-and-label-tag-title`}>
            <label data-cy={`label-tag-title`} className="font-weight-500 mb-1 font-size-12">
              {'Tab Title'}
            </label>
            <CodeHinter
              currentState={currentState}
              type={'basic'}
              initialValue={item?.title}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Tag Title'}
              onChange={(value) => handleValueChange(item, value, 'title', index)}
            />
          </div>

          <div className="field mb-2">
            <CodeHinter
              currentState={currentState}
              initialValue={item?.backgroundColor?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'fxEditor'}
              paramLabel={'Background'}
              paramName={'backgroundColor'}
              onChange={(value) => {
                handleValueChange(item, { value }, 'backgroundColor', index);
              }}
              fieldMeta={{ type: 'colorSwatches', displayName: 'Background' }}
              paramType={'colorSwatches'}
            />
          </div>
          <div className="field mb-2">
            <CodeHinter
              currentState={currentState}
              initialValue={item?.textColor?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'fxEditor'}
              paramLabel={'Foreground'}
              paramName={'textColor'}
              onChange={(value) => {
                handleValueChange(item, { value }, 'textColor', index);
              }}
              fieldMeta={{ type: 'colorSwatches', displayName: 'Foreground' }}
              paramType={'colorSwatches'}
            />
          </div>

          <div className="field mb-3" data-cy={`input-and-label-tag-icon`}>
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
                onChangeIcon(item, { value }, 'icon', index);
              }}
              onVisibilityChange={(_value) => onChangeVisibility(item, { value: true }, 'iconVisibility', index)}
              fieldMeta={{ type: 'icon', displayName: 'Icon' }}
              paramType={'icon'}
              iconVisibility={iconVisibility}
            />
          </div>

          <div className="field mb-2" data-cy={`input-and-label-tag-visible`}>
            <CodeHinter
              currentState={currentState}
              initialValue={item?.visible?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              component={component}
              type={'fxEditor'}
              paramLabel={'Tag visibility'}
              onChange={(value) => handleValueChange(item, { value }, 'visible', index)}
              paramName={'visible'}
              onFxPress={(active) => handleOnFxPress(active, index, 'visible')}
              fxActive={item?.visible?.fxActive}
              fieldMeta={{
                type: 'toggle',
                displayName: 'Tag visibility',
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
                {currentOptions?.map((item, index) => {
                  return (
                    <Draggable key={item?.title || index} draggableId={item?.title || `tag-${index}`} index={index}>
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
                            <div key={item?.title || index}>
                              <ListGroup.Item
                                style={{ marginBottom: '8px', backgroundColor: 'var(--slate3)' }}
                                onMouseEnter={() => setHoveredOptionIndex(index)}
                                onMouseLeave={() => setHoveredOptionIndex(null)}
                              >
                                <div className="row">
                                  <div className="col-auto d-flex align-items-center">
                                    <SortableList.DragHandle show />
                                  </div>
                                  <div className="col text-truncate cursor-pointer" style={{ padding: '0px' }}>
                                    {getSafeRenderableValue(getResolvedValue(item?.title))}
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
        <AddNewButton onClick={handleAddOption} dataCy="add-new-tag-option" className="mt-0">
          Add new option
        </AddNewButton>
      </List>
    );
  };

  const _properties = componentMeta.properties ? Object.keys(componentMeta.properties) : [];
  const _validation = componentMeta.validation ? Object.keys(componentMeta.validation) : [];

  const items = [];

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
          allComponents,
          darkMode,
          componentMeta.properties?.advanced?.placeholder
        )}
        {isDynamicOptionsEnabled
          ? renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'data',
              'properties',
              currentState,
              allComponents,
              componentMeta.properties?.data?.displayName
            )
          : _renderOptions()}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'overflow',
          'properties',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'tagColor',
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
