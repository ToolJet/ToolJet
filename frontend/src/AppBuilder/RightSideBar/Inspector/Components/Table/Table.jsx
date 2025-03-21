import React from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../../Utils';
import { computeActionName, resolveReferences } from '@/_helpers/utils';
// eslint-disable-next-line import/no-unresolved
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { Color } from '../../Elements/Color';
import SelectSearch from 'react-select-search';
import { v4 as uuidv4 } from 'uuid';
import { EventManager } from '../../EventManager';
import { withTranslation } from 'react-i18next';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import List from '@/ToolJetUI/List/List';
import { capitalize, has, unset } from 'lodash';
import NoListItem from './NoListItem';
import { ProgramaticallyHandleProperties } from './ProgramaticallyHandleProperties';
import { ColumnPopoverContent } from './ColumnManager/ColumnPopover';
import { useAppDataStore } from '@/_stores/appDataStore';
import { checkIfTableColumnDeprecated } from './ColumnManager/DeprecatedColumnTypeMsg';

const NON_EDITABLE_COLUMNS = ['link', 'image'];
class TableComponent extends React.Component {
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
      actionPopOverRootClose: true,
      showPopOver: false,
      popOverRootCloseBlockers: [],
      isAllColumnsEditable: false,
      activeColumnPopoverIndex: null,
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
      isAllColumnsEditable: this.checkIfAllColumnsAreEditable(this.props.component),
    });
  }

  checkIfAllColumnsAreEditable = (component) => {
    const columns = component?.component?.definition?.properties?.columns?.value || [];

    const filteredColumns = columns.filter((column) => column && !NON_EDITABLE_COLUMNS.includes(column.columnType));

    const isAllColumnsEditable = filteredColumns.every((column) =>
      resolveReferences(column.isEditable, this.props.currentState)
    );

    return isAllColumnsEditable;
  };

  componentDidUpdate(prevProps) {
    const prevPropsColumns = prevProps?.component?.component?.definition?.properties?.columns?.value || [];
    const currentPropsColumns = this.props?.component?.component?.definition?.properties?.columns?.value || [];
    if (prevPropsColumns !== currentPropsColumns) {
      const filteredColumns = currentPropsColumns.filter((column) => column);
      const isAllColumnsEditable = filteredColumns
        .filter((column) => !NON_EDITABLE_COLUMNS.includes(column.columnType))
        .every((column) => resolveReferences(column.isEditable));
      this.setState({ isAllColumnsEditable });
    }
  }

  onActionButtonPropertyChanged = (index, property, value) => {
    const actions = this.props.component.component.definition.properties.actions;
    actions.value[index][property] = value;
    this.props.paramUpdated({ name: 'actions' }, 'value', actions.value, 'properties', true);
  };

  actionButtonEventsChanged = (events, index) => {
    let actions = this.props.component.component.definition.properties.actions.value;
    actions[index]['events'] = events;
    this.props.paramUpdated({ name: 'actions' }, 'value', actions, 'properties', true);
  };

  actionButtonEventUpdated = (event, value, extraData) => {
    const actions = this.props.component.component.definition.properties.actions;
    const index = extraData.index;

    let newValues = actions.value;
    newValues[index][event.name] = {
      actionId: value,
    };

    this.props.paramUpdated({ name: 'actions' }, 'value', newValues, 'properties', true);
  };

  handleToggleColumnPopover = (index) => {
    this.setState({
      activeColumnPopoverIndex: index,
    });
  };

  actionButtonEventOptionUpdated = (event, option, value, extraData) => {
    const actions = this.props.component.component.definition.properties.actions;
    const index = extraData.index;

    let newValues = actions.value;
    const options = newValues[index][event.name].options;

    newValues[index][event.name].options = {
      ...options,
      [option]: value,
    };

    this.props.paramUpdated({ name: 'actions' }, 'value', newValues, 'properties', true);
  };

  columnEventChanged = (columnForWhichEventsAreChanged, events) => {
    const columns = this.props.component.component.definition.properties.columns.value;

    const newColumns = columns.map((column) => {
      if (column.id === columnForWhichEventsAreChanged.id) {
        const newColumn = { ...column, events };
        return newColumn;
      } else {
        return column;
      }
    });

    this.props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties');
  };

  setColumnPopoverRootCloseBlocker(key, isBlocking) {
    if (isBlocking) {
      this.setState((prev) => ({ popOverRootCloseBlockers: [...prev.popOverRootCloseBlockers, key] }));
    } else {
      this.setState((prev) => ({ popOverRootCloseBlockers: prev.popOverRootCloseBlockers.filter((b) => b !== key) }));
    }
  }

  columnPopover = (column, index) => {
    return (
      <Popover
        id="popover-basic-2"
        className={`${this.props.darkMode && 'dark-theme'} shadow table-column-popover`}
        style={{
          width: '280px',
          maxHeight: resolveReferences(column.isEditable) ? '100vh' : 'inherit',
          overflowY: 'auto',
          zIndex: '9999',
        }}
      >
        <ColumnPopoverContent
          column={column}
          index={index}
          darkMode={this.props.darkMode}
          currentState={this.state.currentState}
          onColumnItemChange={this.onColumnItemChange}
          getPopoverFieldSource={this.getPopoverFieldSource}
          setColumnPopoverRootCloseBlocker={this.setColumnPopoverRootCloseBlocker}
          component={this.state.component}
          props={this.props}
          columnEventChanged={this.columnEventChanged}
          handleEventManagerPopoverCallback={this.handleEventManagerPopoverCallback}
        />
      </Popover>
    );
  };

  deleteEvents = (ref, eventTarget) => {
    const events = useAppDataStore.getState().events.filter((event) => event.target === eventTarget);

    const toDelete = events?.filter((e) => e.event?.ref === ref.ref);

    return new Promise.all(
      toDelete?.forEach((e) => {
        return useAppDataStore.getState().actions.deleteAppVersionEventHandler(e.id);
      })
    );
  };

  handleEventManagerPopoverCallback = (showing) => {
    this.setState({ actionPopOverRootClose: !showing });
    this.setState({ showPopOver: showing });
  };
  actionPopOver = (action, index) => {
    const dummyComponentForActionButton = {
      component: {
        definition: {
          events: this.props.component.component.definition.properties.actions.value[index].events || [],
        },
      },
    };

    const actionRef = { ref: `${action?.name}` };

    return (
      <Popover id="popover-basic" className={`${this.props.darkMode && 'dark-theme'}`}>
        <Popover.Body className="table-action-popover d-flex flex-column custom-gap-16">
          <div className="field tj-app-input">
            <label data-cy={`label-action-button-text`} className="form-label">
              {this.props.t('widget.Table.buttonText', 'Button Text')}
            </label>
            <input
              data-cy={`action-button-text-input-field`}
              type="text"
              className="form-control text-field"
              onChange={(e) => {
                e.stopPropagation();
                this.onActionButtonPropertyChanged(index, 'buttonText', e.target.value);
              }}
              value={action.buttonText}
            />
          </div>
          <div className="field" data-cy={`dropdown-action-button-position`}>
            <label data-cy={`label-action-button-position`} className="form-label">
              {this.props.t('widget.Table.buttonPosition', 'Button Position')}
            </label>
            <SelectSearch
              className={'select-search'}
              options={[
                { name: 'Left', value: 'left' },
                { name: 'Right', value: 'right' },
              ]}
              value={action.position ?? 'right'}
              search={false}
              closeOnSelect={true}
              onChange={(value) => {
                this.onActionButtonPropertyChanged(index, 'position', value);
              }}
              fuzzySearch
              placeholder="Select position"
            />
          </div>
          <Color
            param={{ name: 'actionButtonBackgroundColor' }}
            paramType="properties"
            componentMeta={this.state.componentMeta}
            definition={{ value: action.backgroundColor }}
            onChange={(name, value, color) => this.onActionButtonPropertyChanged(index, 'backgroundColor', color)}
            cyLabel={`action-button-bg`}
          />
          <Color
            param={{ name: 'actionButtonTextColor' }}
            paramType="properties"
            componentMeta={this.state.componentMeta}
            definition={{ value: action.textColor }}
            onChange={(name, value, color) => this.onActionButtonPropertyChanged(index, 'textColor', color)}
            cyLabel={`action-button-text`}
          />
          <ProgramaticallyHandleProperties
            label="Disable button"
            currentState={this.state.currentState}
            index={index}
            darkMode={this.props.darkMode}
            callbackFunction={this.onActionButtonPropertyChanged}
            property="disableActionButton"
            props={action}
            component={this.props.component}
            paramMeta={{ type: 'toggle', displayName: 'Disable action button' }}
            paramType="properties"
          />
          <EventManager
            //!have to check
            component={dummyComponentForActionButton}
            sourceId={this.props?.component?.id}
            eventSourceType="table_action"
            customEventRefs={actionRef}
            eventMetaDefinition={{ events: { onClick: { displayName: 'On click' } } }}
            currentState={this.state.currentState}
            dataQueries={this.props.dataQueries}
            components={this.props.components}
            eventsChanged={(events) => this.actionButtonEventsChanged(events, index)}
            apps={this.props.apps}
            popOverCallback={(showing) => {
              this.setState({ actionPopOverRootClose: !showing });
              this.setState({ showPopOver: showing });
            }}
            pages={this.props.pages}
          />
          <button
            className="btn btn-sm btn-outline-danger mt-2 col"
            onClick={() => this.removeAction(index, actionRef)}
          >
            {this.props.t('widget.Table.remove', 'Remove')}
          </button>
        </Popover.Body>
      </Popover>
    );
  };

  renderActionButton(action, index) {
    return (
      <OverlayTrigger
        trigger="click"
        placement="left"
        rootClose={this.state.actionPopOverRootClose}
        overlay={this.actionPopOver(action, index)}
        onToggle={(showing) => {
          if (!showing) {
            document.activeElement?.blur(); // Manually trigger blur when popover closes
          }
          this.setState({ showPopOver: showing });
        }}
      >
        <div>
          <List>
            <List.Item
              data-cy={`action-button-${String(action.buttonText ?? '')
                .toLowerCase()
                .replace(/\s+/g, '-')}-${String(index ?? '')}`}
              primaryText={action.buttonText}
            />
          </List>
        </div>
      </OverlayTrigger>
    );
  }

  generateNewColumnName = (columns) => {
    let found = false;
    let columnName = '';
    let currentNumber = 1;

    while (!found) {
      columnName = `new_column${currentNumber}`;
      if (columns.find((column) => column.name === columnName) === undefined) {
        found = true;
      }
      currentNumber += 1;
    }

    return columnName;
  };

  addNewColumn = () => {
    const columns = this.props.component.component.definition.properties.columns;
    const newValue = columns.value;
    newValue.push({
      name: this.generateNewColumnName(columns.value),
      id: uuidv4(),
      isEditable: this.state?.isAllColumnsEditable,
      fxActiveFields: [],
      columnType: 'string',
    });
    this.props.paramUpdated({ name: 'columns' }, 'value', newValue, 'properties', true);
  };

  addNewAction = () => {
    const actions = this.props.component.component.definition.properties.actions;
    const newValue = actions ? actions.value : [];
    newValue.push({ name: computeActionName(actions), buttonText: 'Button', events: [] });
    this.props.paramUpdated({ name: 'actions' }, 'value', newValue, 'properties', true);
  };

  removeAction = (index, ref) => {
    const newValue = this.props.component.component.definition.properties.actions.value;
    newValue.splice(index, 1);
    this.props.paramUpdated({ name: 'actions' }, 'value', newValue, 'properties', true);
    this.deleteEvents(ref, 'table_action');
  };

  onColumnItemChange = (index, item, value) => {
    const columns = this.props.component.component.definition.properties.columns;
    let column = columns.value[index];
    const isAllColumnsEditable = this.state.isAllColumnsEditable;
    if (item === 'columnType' && (value === 'select' || value === 'newMultiSelect')) {
      column?.options?.length > 0 && column.options.forEach((option) => unset(option, 'makeDefaultOption'));
      column.defaultOptionsList = [];
    }
    if (item === 'columnType' && value === 'datepicker') {
      column = {
        ...column,
        isTimeChecked: false,
        dateFormat: 'DD/MM/YYYY',
        parseDateFormat: 'DD/MM/YYYY',
        isDateSelectionEnabled: true,
      };
    }
    column[item] = value;
    const newColumns = columns.value;
    newColumns[index] = column;

    if (NON_EDITABLE_COLUMNS.includes(newColumns[index].columnType)) {
      newColumns[index].isEditable = '{{false}}';
    }

    if (item === 'columnType' && !NON_EDITABLE_COLUMNS.includes(value) && isAllColumnsEditable) {
      newColumns[index].isEditable = '{{true}}';
    }

    this.props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties', true);

    // When any of the column is not editable, we need to disable "make all columns editable" toggle
    if (item === 'isEditable' && !resolveReferences(value) && isAllColumnsEditable) {
      this.setState({ isAllColumnsEditable: false });
    }
    // Check if all columns are editable and also if we have disabled "make all columns editable" toggle, if yes then enable it
    if (item === 'isEditable' && resolveReferences(value) && !isAllColumnsEditable) {
      const _isAllColumnsEditable = newColumns
        .filter((column) => !NON_EDITABLE_COLUMNS.includes(column.columnType))
        .every((column) => resolveReferences(column.isEditable));
      if (_isAllColumnsEditable) {
        this.setState({ isAllColumnsEditable: true });
      }
    }
  };

  getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    ...draggableStyle,
  });

  removeColumn = async (index, ref) => {
    try {
      const columns = this.props.component.component.definition.properties.columns;
      const newValue = columns.value;
      const removedColumns = newValue.splice(index, 1);
      await this.props.paramUpdated({ name: 'columns' }, 'value', newValue, 'properties', true);

      const existingColumnDeletionHistory =
        this.props.component.component.definition.properties.columnDeletionHistory?.value ?? [];
      const newColumnDeletionHistory = [
        ...existingColumnDeletionHistory,
        ...removedColumns.map((column) => column.key || column.name),
      ];
      await this.props.paramUpdated(
        { name: 'columnDeletionHistory' },
        'value',
        newColumnDeletionHistory,
        'properties',
        true
      );

      await this.deleteEvents(ref, 'table_column');
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  reorderColumns = (startIndex, endIndex) => {
    const result = this.props.component.component.definition.properties.columns.value;
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    this.props.paramUpdated({ name: 'columns' }, 'value', result, 'properties', true);
  };

  onDragEnd({ source, destination }) {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    this.reorderColumns(source.index, destination.index);
  }

  getPopoverFieldSource = (column, field) =>
    `component/${this.props.component.component.name}/${column ?? 'default'}::${field}`;

  handleMakeAllColumnsEditable = (value) => {
    const columns = resolveReferences(this.props.component.component.definition.properties.columns);
    const columnValues = columns.value || [];

    const newValue = columnValues
      .filter((column) => column)
      .map((column) => ({
        ...column,
        isEditable: !NON_EDITABLE_COLUMNS.includes(column.columnType) ? value : '{{false}}',
      }));

    this.props.paramUpdated({ name: 'columns' }, 'value', newValue, 'properties', true);
    this.setState({ isAllColumnsEditable: resolveReferences(value) });
  };

  duplicateColumn = (index) => {
    const columns = this.props.component.component.definition.properties?.columns ?? [];
    const newColumns = columns.value;
    let columnToBeDuplicated = newColumns?.[index];
    columnToBeDuplicated = { ...columnToBeDuplicated, id: uuidv4() };
    newColumns.push(columnToBeDuplicated);
    this.props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties', true);
  };

  render() {
    const { dataQueries, component, paramUpdated, componentMeta, components, currentState, darkMode } = this.props;
    const columns = component.component.definition.properties.columns;

    // Filter out null or undefined values before mapping
    const filteredColumns = (columns.value || []).filter((column) => column);
    const actions = component.component.definition.properties.actions || { value: [] };
    if (!component.component.definition.properties.displaySearchBox)
      paramUpdated({ name: 'displaySearchBox' }, 'value', true, 'properties');
    const displaySearchBox = component.component.definition.properties.displaySearchBox.value;
    const displayServerSideFilter = component.component.definition.properties.showFilterButton?.value
      ? resolveReferences(component.component.definition.properties.showFilterButton?.value)
      : false;
    const displayServerSideSearch = component.component.definition.properties.displaySearchBox?.value
      ? resolveReferences(component.component.definition.properties.displaySearchBox?.value)
      : false;
    const serverSidePagination = component.component.definition.properties.serverSidePagination?.value
      ? resolveReferences(component.component.definition.properties.serverSidePagination?.value)
      : false;

    const clientSidePagination = component.component.definition.properties.clientSidePagination?.value
      ? resolveReferences(component.component.definition.properties.clientSidePagination?.value)
      : false;

    let enablePagination = !has(component.component.definition.properties, 'enablePagination')
      ? clientSidePagination || serverSidePagination
      : resolveReferences(component.component.definition.properties.enablePagination?.value);

    const enabledSort = component.component.definition.properties.enabledSort?.value
      ? resolveReferences(component.component.definition.properties.enabledSort?.value)
      : true;
    const useDynamicColumn = component.component.definition.properties.useDynamicColumn?.value
      ? resolveReferences(component.component.definition.properties.useDynamicColumn?.value) ?? false
      : false;
    //from app definition values are of string data type if defined or else,undefined
    const allowSelection = component.component.definition.properties?.allowSelection?.value
      ? resolveReferences(component.component.definition.properties.allowSelection?.value)
      : resolveReferences(component.component.definition.properties.highlightSelectedRow.value) ||
        resolveReferences(component.component.definition.properties.showBulkSelector.value);

    const renderCustomElement = (param, paramType = 'properties') => {
      return renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType);
    };

    let items = [];
    items.push({
      title: 'Data',
      children: renderElement(
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
      ),
    });

    items.push({
      title: 'Columns',
      children: (
        <div>
          <div>{renderCustomElement('useDynamicColumn')}</div>
          {useDynamicColumn && <div>{renderCustomElement('columnData')}</div>}
          {!useDynamicColumn && (
            <List>
              <DragDropContext
                onDragEnd={(result) => {
                  this.onDragEnd(result);
                }}
              >
                <Droppable droppableId="droppable">
                  {({ innerRef, droppableProps, placeholder }) => (
                    <div className="w-100 d-flex custom-gap-4 flex-column" {...droppableProps} ref={innerRef}>
                      {filteredColumns.map((item, index) => {
                        const resolvedItemName = resolveReferences(item.name);
                        const isEditable = resolveReferences(item.isEditable);
                        const columnVisibility = item?.columnVisibility ?? true;
                        const getSecondaryText = (text) => {
                          switch (text) {
                            case undefined:
                              return '';
                            case 'string':
                              return 'String';
                            case 'default':
                              return 'Default';
                            case 'number':
                              return 'Number';
                            case 'text':
                              return 'Text';
                            case 'badge':
                              return 'Badge';
                            case 'badges':
                              return 'Badges';
                            case 'tags':
                              return 'Tags';
                            case 'dropdown':
                              return 'Dropdown';
                            case 'link':
                              return 'Link';
                            case 'radio':
                              return 'Radio';
                            case 'multiselect':
                              return 'Multiselect deprecated';
                            case 'toggle':
                              return 'Toggle';
                            case 'datepicker':
                              return 'Datepicker';
                            case 'image':
                              return 'Image';
                            case 'boolean':
                              return 'Boolean';
                            case 'select':
                              return 'Select';
                            case 'newMultiSelect':
                              return 'Multiselect';
                            case 'json':
                              return 'JSON';
                            default:
                              capitalize(text ?? '');
                          }
                        };
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
                                  overlay={this.columnPopover(item, index)}
                                  onToggle={(show) => {
                                    if (show) {
                                      this.handleToggleColumnPopover(index);
                                    } else {
                                      document.activeElement?.blur(); // Manually trigger blur when popover closes
                                      this.handleToggleColumnPopover(null);
                                    }
                                  }}
                                >
                                  <div key={resolvedItemName} className="table-column-lists">
                                    <List.Item
                                      isDraggable={true}
                                      primaryText={resolvedItemName}
                                      secondaryText={getSecondaryText(item?.columnType)}
                                      data-cy={`column-${resolvedItemName}`}
                                      enableActionsMenu={false}
                                      isEditable={isEditable}
                                      onMenuOptionClick={(listItem, menuOptionLabel) => {
                                        if (menuOptionLabel === 'Delete') {
                                          this.removeColumn(index, `${item.name}-${index}`);
                                        } else if (menuOptionLabel === 'copyColumn') {
                                          this.duplicateColumn(index);
                                        }
                                      }}
                                      darkMode={darkMode}
                                      // menuActions={[
                                      //   {
                                      //     label: 'Delete',
                                      //     icon: '',
                                      //   },
                                      // ]}
                                      deleteIconOutsideMenu={true}
                                      showCopyColumnOption={true}
                                      showVisibilityIcon={true}
                                      isColumnVisible={resolveReferences(columnVisibility)}
                                      className={`${
                                        this.state.activeColumnPopoverIndex === index && 'active-column-list'
                                      }`}
                                      columnType={item?.columnType}
                                      isDeprecated={checkIfTableColumnDeprecated(item?.columnType)}
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
                {columns?.value?.length === 0 && <NoListItem text={'There are no columns'} dataCy={`-columns`} />}
                <div className="mb-2">
                  <AddNewButton dataCy={`button-add-column`} onClick={this.addNewColumn}>
                    {this.props.t('widget.Table.addNewColumn', ' Add new column')}
                  </AddNewButton>
                </div>
                <ProgramaticallyHandleProperties
                  label="Make all columns editable"
                  currentState={this.state.currentState}
                  darkMode={this.props.darkMode}
                  callbackFunction={(index, property, value) => {
                    this.handleMakeAllColumnsEditable(value);
                  }}
                  property="isAllColumnsEditable"
                  props={{ isAllColumnsEditable: `{{${this.state.isAllColumnsEditable}}}` }}
                  component={this.props.component}
                  paramMeta={{ type: 'toggle', displayName: 'Make all columns editable', isFxNotRequired: true }}
                  paramType="properties"
                />
              </div>
            </List>
          )}
        </div>
      ),
    });

    items.push({
      title: 'Action buttons',
      children: (
        <div className="field">
          <div className="row g-2">
            <div>{actions.value.map((action, index) => this.renderActionButton(action, index))}</div>
            {actions.value.length === 0 && <NoListItem text={'No action buttons'} dataCy={`-action-button`} />}
            <AddNewButton dataCy="button-add-new-action-button" onClick={this.addNewAction} className="mt-0">
              New action button
            </AddNewButton>
          </div>
        </div>
      ),
    });

    const rowSelectionsOptions = [
      'allowSelection',
      ...(allowSelection
        ? ['highlightSelectedRow', 'showBulkSelector', 'defaultSelectedRow', 'selectRowOnCellEdit']
        : []),
    ];
    const searchSortFilterOptions = [
      ...(displaySearchBox ? ['displaySearchBox'] : []),
      ...(displayServerSideSearch ? ['serverSideSearch'] : []),
      'enabledSort',
      ...(enabledSort ? ['serverSideSort'] : []),
      'showFilterButton',
      ...(displayServerSideFilter ? ['serverSideFilter'] : []),
    ];
    const paginationOptions = [
      'enablePagination',
      ...(enablePagination ? ['serverSidePagination'] : []),
      ...(enablePagination && !serverSidePagination ? ['rowsPerPage'] : []),
      ...(enablePagination && serverSidePagination ? ['enablePrevButton'] : []),
      ...(enablePagination && serverSidePagination ? ['enableNextButton'] : []),
      ...(enablePagination && serverSidePagination ? ['totalRecords'] : []),
    ];
    const additionalActions = [
      'showAddNewRowButton',
      'showDownloadButton',
      'hideColumnSelectorButton',
      'loadingState',
      'showBulkUpdateActions',
      'visibility',
      'disabledState',
    ];

    items.push({
      title: 'Events',
      isOpen: true,
      children: (
        <EventManager
          //!have to check
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

    items.push({
      title: 'Row Selection',
      children: rowSelectionsOptions.map((option) => renderCustomElement(option)),
    });
    items.push({
      title: 'Search, sort and filter',
      children: searchSortFilterOptions.map((option) => renderCustomElement(option)),
    });

    items.push({
      title: 'Pagination',
      children: paginationOptions.map((option) => renderCustomElement(option)),
    });

    items.push({
      title: 'Additional actions',
      children: additionalActions.map((option) => renderCustomElement(option)),
    });

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

export const Table = withTranslation()(TableComponent);
