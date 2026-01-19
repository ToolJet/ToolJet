import React from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../../Utils';
import { resolveReferences } from '@/_helpers/utils';
// eslint-disable-next-line import/no-unresolved
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { v4 as uuidv4 } from 'uuid';
import { EventManager } from '../../EventManager';
import { withTranslation } from 'react-i18next';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import List from '@/ToolJetUI/List/List';
import { capitalize } from 'lodash';
import NoListItem from '../Table/NoListItem';
import { ProgramaticallyHandleProperties } from '../Table/ProgramaticallyHandleProperties';
import { FieldPopoverContent } from './FieldManager/FieldPopover';
import { getFieldIcon } from './utils';

const NON_EDITABLE_FIELDS = ['link', 'image'];

//TO-DO --> Update it to use Functional and resuable component
class KeyValuePairComponent extends React.Component {
  constructor(props) {
    super(props);

    const {
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      eventUpdated,
      eventOptionUpdated,
      components,
      currentState,
    } = props;

    this.state = {
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      eventUpdated,
      eventOptionUpdated,
      components,
      currentState,
      popOverRootCloseBlockers: [],
      isAllFieldsEditable: false,
      activeFieldPopoverIndex: null,
    };
  }

  componentDidMount() {
    const {
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      eventUpdated,
      eventOptionUpdated,
      components,
      currentState,
    } = this.props;

    this.setState({
      dataQueries,
      component,
      paramUpdated,
      componentMeta,
      eventUpdated,
      eventOptionUpdated,
      components,
      currentState,
      isAllFieldsEditable: this.checkIfAllFieldsAreEditable(this.props.component),
    });
  }

  checkIfAllFieldsAreEditable = (component) => {
    const fields = component?.component?.definition?.properties?.fields?.value || [];

    const filteredFields = fields.filter((field) => field && !NON_EDITABLE_FIELDS.includes(field.fieldType));

    const isAllFieldsEditable = filteredFields.every((field) =>
      resolveReferences(field.isEditable, this.props.currentState)
    );

    return isAllFieldsEditable;
  };

  componentDidUpdate(prevProps) {
    const prevPropsFields = prevProps?.component?.component?.definition?.properties?.fields?.value || [];
    const currentPropsFields = this.props?.component?.component?.definition?.properties?.fields?.value || [];
    if (prevPropsFields !== currentPropsFields) {
      const filteredFields = currentPropsFields.filter((field) => field);
      const isAllFieldsEditable = filteredFields
        .filter((field) => !NON_EDITABLE_FIELDS.includes(field.fieldType))
        .every((field) => resolveReferences(field.isEditable));
      this.setState({ isAllFieldsEditable });
    }
  }

  handleToggleFieldPopover = (index) => {
    this.setState({
      activeFieldPopoverIndex: index,
    });
  };

  fieldEventChanged = (fieldForWhichEventsAreChanged, events) => {
    const fields = this.props.component.component.definition.properties.fields.value;

    const newFields = fields.map((field) => {
      if (field.id === fieldForWhichEventsAreChanged.id) {
        const newField = { ...field, events };
        return newField;
      } else {
        return field;
      }
    });

    this.props.paramUpdated({ name: 'fields' }, 'value', newFields, 'properties');
  };

  setFieldPopoverRootCloseBlocker(key, isBlocking) {
    if (isBlocking) {
      this.setState((prev) => ({ popOverRootCloseBlockers: [...prev.popOverRootCloseBlockers, key] }));
    } else {
      this.setState((prev) => ({ popOverRootCloseBlockers: prev.popOverRootCloseBlockers.filter((b) => b !== key) }));
    }
  }

  fieldPopover = (field, index) => {
    return (
      <Popover
        id="popover-basic-2"
        className={`${this.props.darkMode && 'dark-theme'} shadow table-column-popover`}
        style={{
          width: '280px',
          maxHeight: resolveReferences(field.isEditable) ? '100vh' : 'inherit',
          zIndex: '9999',
        }}
      >
        <FieldPopoverContent
          field={field}
          index={index}
          darkMode={this.props.darkMode}
          currentState={this.state.currentState}
          onFieldItemChange={this.onFieldItemChange}
          getPopoverFieldSource={this.getPopoverFieldSource}
          setFieldPopoverRootCloseBlocker={this.setFieldPopoverRootCloseBlocker.bind(this)}
          component={this.state.component}
          props={this.props}
          fieldEventChanged={this.fieldEventChanged}
        />
      </Popover>
    );
  };

  generateNewFieldName = (fields) => {
    let found = false;
    let fieldName = '';
    let currentNumber = 1;

    while (!found) {
      fieldName = `new_field${currentNumber}`;
      if (fields.find((field) => field.name === fieldName) === undefined) {
        found = true;
      }
      currentNumber += 1;
    }

    return fieldName;
  };

  addNewField = () => {
    const fields = this.props.component.component.definition.properties.fields;
    const newValue = fields.value;
    newValue.push({
      name: this.generateNewFieldName(fields.value),
      id: uuidv4(),
      key: this.generateNewFieldName(fields.value),
      isEditable: this.state?.isAllFieldsEditable,
      fxActiveFields: [],
      fieldType: 'string',
    });
    this.props.paramUpdated({ name: 'fields' }, 'value', newValue, 'properties', true);
  };

  onFieldItemChange = (index, item, value) => {
    const fields = this.props.component.component.definition.properties.fields;
    let field = fields.value[index];
    const isAllFieldsEditable = this.state.isAllFieldsEditable;

    field[item] = value;
    const newFields = fields.value;
    newFields[index] = field;

    if (NON_EDITABLE_FIELDS.includes(newFields[index].fieldType)) {
      newFields[index].isEditable = '{{false}}';
    }

    if (item === 'fieldType' && !NON_EDITABLE_FIELDS.includes(value) && isAllFieldsEditable) {
      newFields[index].isEditable = '{{true}}';
    }

    this.props.paramUpdated({ name: 'fields' }, 'value', newFields, 'properties', true);

    // When any of the field is not editable, we need to disable "make all fields editable" toggle
    if (item === 'isEditable' && !resolveReferences(value) && isAllFieldsEditable) {
      this.setState({ isAllFieldsEditable: false });
    }
    // Check if all fields are editable and also if we have disabled "make all fields editable" toggle, if yes then enable it
    if (item === 'isEditable' && resolveReferences(value) && !isAllFieldsEditable) {
      const _isAllFieldsEditable = newFields
        .filter((field) => !NON_EDITABLE_FIELDS.includes(field.fieldType))
        .every((field) => resolveReferences(field.isEditable));
      if (_isAllFieldsEditable) {
        this.setState({ isAllFieldsEditable: true });
      }
    }
  };

  getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    ...draggableStyle,
  });

  removeField = async (index) => {
    try {
      const fields = this.props.component.component.definition.properties.fields;
      const newValue = fields.value;
      newValue.splice(index, 1);
      await this.props.paramUpdated({ name: 'fields' }, 'value', newValue, 'properties', true);
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  reorderFields = (startIndex, endIndex) => {
    const result = this.props.component.component.definition.properties.fields.value;
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    this.props.paramUpdated({ name: 'fields' }, 'value', result, 'properties', true);
  };

  onDragEnd({ source, destination }) {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    this.reorderFields(source.index, destination.index);
  }

  getPopoverFieldSource = (field, fieldName) =>
    `component/${this.props.component.component.name}/${field ?? 'default'}::${fieldName}`;

  handleMakeAllFieldsEditable = (value) => {
    const fields = this.props.component.component.definition.properties.fields;
    const fieldValues = fields.value || [];
    const newValue = fieldValues
      .filter((field) => field)
      .map((field) => ({
        ...field,
        isEditable: !NON_EDITABLE_FIELDS.includes(field.fieldType) ? value : '{{false}}',
      }));

    this.props.paramUpdated({ name: 'fields' }, 'value', newValue, 'properties', true);
    this.setState({ isAllFieldsEditable: resolveReferences(value) });
  };

  duplicateField = (index) => {
    const fields = this.props.component.component.definition.properties?.fields ?? [];
    const newFields = fields.value;
    let fieldToBeDuplicated = newFields?.[index];
    fieldToBeDuplicated = { ...fieldToBeDuplicated, id: uuidv4() };
    newFields.push(fieldToBeDuplicated);
    this.props.paramUpdated({ name: 'fields' }, 'value', newFields, 'properties', true);
  };

  render() {
    const { dataQueries, component, paramUpdated, componentMeta, components, currentState, darkMode } = this.props;
    const fields = component.component.definition.properties.fields;

    // Filter out null or undefined values before mapping
    const filteredFields = (fields.value || []).filter((field) => field);

    const useDynamicField = component.component.definition.properties.useDynamicField?.value
      ? resolveReferences(component.component.definition.properties.useDynamicField?.value) ?? false
      : false;

    const renderCustomElement = (param, paramType = 'properties') => {
      return renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType);
    };

    const getSecondaryText = (text) => {
      switch (text) {
        case undefined:
          return '';
        case 'string':
          return 'String';
        case 'number':
          return 'Number';
        case 'text':
          return 'Text';
        case 'datepicker':
          return 'Date time';
        case 'select':
          return 'Select';
        case 'newMultiSelect':
          return 'Multiselect';
        case 'boolean':
          return 'Boolean';
        case 'image':
          return 'Image';
        case 'link':
          return 'Email';
        case 'json':
          return 'JSON';
        case 'markdown':
          return 'Markdown';
        case 'html':
          return 'HTML';
        case 'tags':
          return 'Tags';
        default:
          return capitalize(text ?? '');
      }
    };

    let items = [];

    // Data section
    items.push({
      title: 'Data',
      children: (
        <>
          {renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'dataSourceSelector',
            'properties',
            currentState,
            components,
            darkMode,
            false
          )}
          {renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'data',
            'properties',
            currentState,
            components,
            darkMode,
            false
          )}
        </>
      ),
    });

    // Fields section
    items.push({
      title: 'Fields',
      children: (
        <div>
          <div>{renderCustomElement('useDynamicField')}</div>
          {useDynamicField && <div>{renderCustomElement('fieldData')}</div>}
          {!useDynamicField && (
            <List>
              <DragDropContext
                onDragEnd={(result) => {
                  this.onDragEnd(result);
                }}
              >
                <Droppable droppableId="droppable">
                  {({ innerRef, droppableProps, placeholder }) => (
                    <div className="w-100 d-flex custom-gap-4 flex-column" {...droppableProps} ref={innerRef}>
                      {filteredFields.map((item, index) => {
                        const resolvedItemName = resolveReferences(item.name);
                        const isEditable = resolveReferences(item.isEditable);
                        const fieldVisibility = item?.fieldVisibility ?? true;
                        return (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                key={index}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={this.getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                              >
                                <OverlayTrigger
                                  trigger="click"
                                  placement="left"
                                  rootClose={this.state.popOverRootCloseBlockers.length === 0}
                                  overlay={this.fieldPopover(item, index)}
                                  onToggle={(show) => {
                                    if (show) {
                                      this.handleToggleFieldPopover(index);
                                    } else {
                                      document.activeElement?.blur();
                                      this.handleToggleFieldPopover(null);
                                    }
                                  }}
                                >
                                  <div key={resolvedItemName} className="table-column-lists">
                                    <List.Item
                                      isDraggable={true}
                                      primaryText={resolvedItemName}
                                      secondaryText={getSecondaryText(item?.fieldType)}
                                      data-cy={`field-${resolvedItemName}`}
                                      enableActionsMenu={false}
                                      isEditable={isEditable}
                                      onMenuOptionClick={(listItem, menuOptionLabel) => {
                                        if (menuOptionLabel === 'Delete') {
                                          this.removeField(index);
                                        } else if (menuOptionLabel === 'copyField') {
                                          this.duplicateField(index);
                                        }
                                      }}
                                      darkMode={darkMode}
                                      showIconOnHover={true}
                                      deleteIconOutsideMenu={true}
                                      showCopyColumnOption={true}
                                      showVisibilityIcon={true}
                                      isColumnVisible={resolveReferences(fieldVisibility)}
                                      className={`${
                                        this.state.activeFieldPopoverIndex === index && 'active-column-list'
                                      }`}
                                      columnType={item?.fieldType}
                                      Icon={getFieldIcon(item?.fieldType)}
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
              <div style={{ marginTop: '8px' }}>
                {fields?.value?.length === 0 && <NoListItem text={'There are no fields'} dataCy={`-fields`} />}
                <div className="mb-2">
                  <AddNewButton dataCy={`button-add-field`} onClick={this.addNewField}>
                    {this.props.t('widget.KeyValuePair.addNewField', ' Add new field')}
                  </AddNewButton>
                </div>
                <ProgramaticallyHandleProperties
                  label="Make all fields editable"
                  currentState={this.state.currentState}
                  darkMode={this.props.darkMode}
                  callbackFunction={(index, property, value) => {
                    this.handleMakeAllFieldsEditable(value);
                  }}
                  property="isAllFieldsEditable"
                  props={{ isAllFieldsEditable: `{{${this.state.isAllFieldsEditable}}}` }}
                  component={this.props.component}
                  paramMeta={{ type: 'toggle', displayName: 'Make all fields editable', isFxNotRequired: true }}
                  paramType="properties"
                />
              </div>
            </List>
          )}
        </div>
      ),
    });

    // Events section
    items.push({
      title: 'Events',
      isOpen: true,
      children: (
        <EventManager
          component={component}
          sourceId={this.props?.component?.id}
          eventSourceType="component"
          eventMetaDefinition={componentMeta}
          currentState={currentState}
          dataQueries={dataQueries}
          components={components}
          eventsChanged={this.props.eventsChanged}
          apps={this.props.apps}
          pages={this.props.pages}
        />
      ),
    });

    // Additional actions section
    const additionalActions = ['loadingState', 'visibility', 'disabledState', 'tooltip'];

    items.push({
      title: 'Additional actions',
      children: additionalActions.map((option) => renderCustomElement(option)),
    });

    // Devices section
    items.push({
      title: 'Devices',
      isOpen: true,
      children: (
        <>
          {renderElement(
            component,
            componentMeta,
            this.props.layoutPropertyChanged,
            dataQueries,
            'showOnDesktop',
            'others',
            currentState,
            components
          )}
          {renderElement(
            component,
            componentMeta,
            this.props.layoutPropertyChanged,
            dataQueries,
            'showOnMobile',
            'others',
            currentState,
            components
          )}
        </>
      ),
    });

    return <Accordion items={items} />;
  }
}

export const KeyValuePair = withTranslation()(KeyValuePairComponent);
