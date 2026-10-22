import React, { useState, useEffect, useRef } from 'react';
import Accordion from '@/AppBuilder/RightSideBar/Inspector/InspectorAccordion';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '../inspectorConstants';
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
import { Button } from '@/components/ui/Button/Button';
import SortableList from '@/_components/SortableList';
import { shallow } from 'zustand/shallow';
import { sortArray } from '@/AppBuilder/Widgets/DropdownV2/utils';
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import './Select.scss';

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

  const isInitialRender = useRef(true);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const isMultiSelect = component?.component?.component === 'MultiselectV2';
  const isTagsInput = component?.component?.component === 'TagsInput';
  const isRadioButton = component?.component?.component === 'RadioButtonV2';
  const isDropdownV2 = component?.component?.component === 'DropdownV2';
  const isCaptionEnabled = isDropdownV2 || isMultiSelect;
  const isIconImageEnabled = isDropdownV2 || isMultiSelect;
  const isDynamicOptionsEnabled = getResolvedValue(component?.component?.definition?.properties?.advanced?.value);
  const isSortingEnabled = componentMeta?.properties['sort'] ?? false;
  const sort = component?.component?.definition?.properties?.sort?.value;

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

  const _markedAsDefault = getResolvedValue(
    component?.component?.definition?.properties[isMultiSelect || isTagsInput ? 'values' : 'value']?.value
  );

  const [options, setOptions] = useState([]);
  const [markedAsDefault, setMarkedAsDefault] = useState(_markedAsDefault);
  const validations = Object.keys(componentMeta.validation || {});
  let properties = [];
  let additionalActions = [];
  let optionsProperties = [];

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (
      componentMeta?.properties[key]?.accordian === 'Options' ||
      componentMeta?.properties[key]?.accordian === 'Tags'
    ) {
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

  const updateSortParam = (value) => {
    paramUpdated({ name: 'sort' }, 'value', value, 'properties');
  };

  const updateOptions = (options) => {
    setOptions(options);
    updateAllOptionsParams(options);
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
      ...(isCaptionEnabled ? { caption: null } : {}),
      ...(isIconImageEnabled ? { icon: { value: 'IconHome2' }, iconVisibility: false } : {}),
      visible: { value: '{{true}}' },
      disable: { value: '{{false}}' },
      default: { value: '{{false}}' },
    };
  };

  const handleAddOption = () => {
    let _option = generateNewOptions();
    const _items = [...options, _option];
    const sortedItems = sortArray(_items, sort);
    updateOptions(sortedItems);
  };

  const handleDeleteOption = (index) => {
    const _items = options.filter((option, i) => i !== index);
    setOptions(_items);
    updateAllOptionsParams(_items, { isParamFromDropdownOptions: true });
  };

  const handleDuplicateOption = (index) => {
    const source = options[index];
    if (!source) return;

    // `value` is the option's identity (Draggable key + selection value), so it must stay unique.
    const base = `${source?.value}_copy`;
    let newValue = base;
    let counter = 2;
    while (options.find((option) => option.value === newValue)) {
      newValue = `${base}_${counter}`;
      counter += 1;
    }

    const duplicated = {
      ...source, // copies icon, image, caption, iconVisibility, visible, disable — everything
      label: `${source?.label} copy`,
      value: newValue,
      default: { ...source.default, value: '{{false}}' }, // don't carry over the default selection
    };

    const _items = [...options];
    _items.splice(index + 1, 0, duplicated); // place right after the original
    updateOptions(sortArray(_items, sort));
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
    updateOptions(_options);
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
    updateOptions(_options);
  };

  const handleCaptionChange = (caption, index) => {
    const _options = options.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          caption: caption === '' ? null : caption,
        };
      }
      return option;
    });
    updateOptions(_options);
  };

  const handleIconChange = (value, index) => {
    const _options = options.map((option, i) =>
      i === index ? { ...option, icon: { ...option.icon, value } } : option
    );
    updateOptions(_options);
  };

  const handleIconVisibilityChange = (value, index) => {
    const isVisible = getResolvedValue(value);
    const _options = options.map((option, i) =>
      i === index
        ? {
            ...option,
            iconVisibility: isVisible,
            // Legacy/empty options: stamp the default the moment visibility turns on, so the
            // stored value matches what the picker displays (its IconHome2 is a render-time
            // fallback only — without this stamp the widget sees '' and shows nothing).
            ...(isVisible && !option?.icon?.value ? { icon: { ...option?.icon, value: 'IconHome2' } } : {}),
          }
        : option
    );
    updateOptions(_options);
  };

  const handleImageChange = (value, index) => {
    const _options = options.map((option, i) =>
      i === index ? { ...option, image: value === '' ? undefined : value } : option
    );
    updateOptions(_options);
  };

  const reorderOptions = async (startIndex, endIndex) => {
    const result = [...options];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    updateOptions(result);
    if (isSortingEnabled && sort !== 'none') {
      updateSortParam('none');
    }
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    reorderOptions(source.index, destination.index);
  };

  const handleMarkedAsDefaultChange = (value, index) => {
    const isMarkedAsDefault = getResolvedValue(value);
    if (isMultiSelect || isTagsInput) {
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
      updateOptions(_options);
      setMarkedAsDefault(_value);
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
    updateOptions(_options);
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
    updateOptions(_options);
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
    updateOptions(_options);
  };

  useEffect(() => {
    if (!isInitialRender.current && isSortingEnabled) {
      const sortedOptions = sortArray([...options], sort);
      updateOptions(sortedOptions);
    }
  }, [sort]);

  useEffect(() => {
    const sortedOptions = sortArray(constructOptions(), sort);
    updateOptions(sortedOptions);
    isInitialRender.current = false;
  }, [isMultiSelect, component?.id]);

  const _renderOverlay = (item, index) => {
    return (
      <Popover
        className={`${darkMode && 'dark-theme theme-dark'} inspector-select-options-popover`}
        style={{ minWidth: '248px' }}
      >
        <Popover.Header className="">
          <div className="d-flex align-items-center justify-content-between">
            <div className="font-weight-500 font-size-12">Edit Option</div>
            <div className="d-flex align-items-center justify-content-end custom-gap-6">
              <Button
                iconOnly
                isLucid
                size="medium"
                variant="ghost"
                leadingIcon="copy"
                onClick={() => handleDuplicateOption(index)}
                data-cy={`option-duplicate-button`}
              />
              <Button
                iconOnly
                isLucid
                size="medium"
                variant="ghost"
                leadingIcon="trash"
                onClick={() => handleDeleteOption(index)}
                data-cy={`option-delete-button`}
              />
            </div>
          </div>
        </Popover.Header>
        <Popover.Body>
          <div className="field mb-3" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="mb-1 font-size-12">
              {'Option label'}
            </label>
            <CodeHinter
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
            <label data-cy={`label-column-name`} className="mb-1 font-size-12">
              {'Option value'}
            </label>
            <CodeHinter
              type={'basic'}
              initialValue={item?.value}
              theme={darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={'Option value'}
              onChange={(value) => handleValueChange(value, index)}
            />
          </div>
          {isCaptionEnabled && (
            <div className="field mb-3" data-cy={`input-and-label-option-caption`}>
              <label className="mb-1 font-size-12">{'Option Caption'}</label>
              <CodeHinter
                type={'basic'}
                initialValue={item?.caption ?? ''}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={'Optional description'}
                onChange={(value) => handleCaptionChange(value, index)}
              />
            </div>
          )}
          {isIconImageEnabled && (
            <div className="field mb-3">
              <CodeHinter
                initialValue={item?.icon?.value || ''}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                component={component}
                type={'fxEditor'}
                paramName={'leadingIcon'}
                paramLabel={'Leading Icon'}
                onChange={(value) => handleIconChange(value, index)}
                onVisibilityChange={(value) => handleIconVisibilityChange(value, index)}
                onFxPress={(active) => handleOnFxPress(active, index, 'icon')}
                fxActive={item?.icon?.fxActive}
                fieldMeta={{ type: 'icon', displayName: 'Leading icon', isFxNotRequired: true }}
                paramType={'icon'}
                iconVisibility={item?.iconVisibility}
              />
            </div>
          )}
          {isIconImageEnabled && (
            <div className="field mb-3">
              <label className="mb-1 font-size-12">{'Leading image'}</label>
              <CodeHinter
                type={'basic'}
                initialValue={item?.image ?? ''}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={'Image URL'}
                onChange={(value) => handleImageChange(value, index)}
              />
            </div>
          )}
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <CodeHinter
              initialValue={
                isMultiSelect || isTagsInput ? `{{${markedAsDefault?.includes(item?.value)}}}` : item?.default?.value
              }
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
                              if (isSortingEnabled && sort !== 'none') {
                                const sortedOptions = sortArray([...options], sort);
                                updateOptions(sortedOptions);
                              }
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
                                {...restProps}
                              >
                                <div className="row">
                                  <div className="col-auto d-flex align-items-center">
                                    <SortableList.DragHandle show />
                                  </div>
                                  <div className="col text-truncate cursor-pointer" style={{ padding: '0px' }}>
                                    {getSafeRenderableValue(getResolvedValue(item?.label))}
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
    title: isTagsInput ? 'Tags' : 'Options',
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
        {isMultiSelect &&
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'showAllSelectedLabel',
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
            'maxLimit',
            'properties',
            currentState,
            allComponents,
            darkMode,
            componentMeta.properties?.maxLimit?.placeholder
          )}
        {isSortingEnabled &&
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'sort',
            'properties',
            currentState,
            allComponents
          )}
        {isTagsInput &&
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'allowNewTags',
            'properties',
            currentState,
            allComponents
          )}
        {isTagsInput &&
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'enableSearch',
            'properties',
            currentState,
            allComponents
          )}
        {isTagsInput &&
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'serverSideSearch',
            'properties',
            currentState,
            allComponents
          )}
        {isRadioButton &&
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'layout',
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
    id: ADDITIONAL_ACTIONS_ACCORDION_ID,
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
