import React from 'react';
import { renderElement } from '../Utils';
import { computeActionName } from '@/_helpers/utils';
import SortableList, { SortableItem } from 'react-easy-sort';
import arrayMove from 'array-move';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { Color } from '../Elements/Color';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { v4 as uuidv4 } from 'uuid';
import { EventManager } from '../EventManager';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

class Table extends React.Component {
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
    });
  }

  onActionButtonPropertyChanged = (index, property, value) => {
    const actions = this.props.component.component.definition.properties.actions;
    actions.value[index][property] = value;
    this.props.paramUpdated({ name: 'actions' }, 'value', actions.value, 'properties');
  };

  actionButtonEventsChanged = (events, index) => {
    let actions = this.props.component.component.definition.properties.actions.value;
    actions[index]['events'] = events;
    this.props.paramUpdated({ name: 'actions' }, 'value', actions, 'properties');
  };

  actionButtonEventUpdated = (event, value, extraData) => {
    const actions = this.props.component.component.definition.properties.actions;
    const index = extraData.index;

    let newValues = actions.value;
    newValues[index][event.name] = {
      actionId: value,
    };

    this.props.paramUpdated({ name: 'actions' }, 'value', newValues, 'properties');
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

    this.props.paramUpdated({ name: 'actions' }, 'value', newValues, 'properties');
  };

  columnPopover = (column, index) => {
    return (
      <Popover id="popover-basic-2" className="shadow">
        <Popover.Content>
          <div className="field mb-2">
            <label className="form-label">Column type</label>
            <SelectSearch
              options={[
                { name: 'Default', value: 'default' },
                { name: 'String', value: 'string' },
                { name: 'Text', value: 'text' },
                { name: 'Badge', value: 'badge' },
                { name: 'Multiple badges', value: 'badges' },
                { name: 'Tags', value: 'tags' },
                { name: 'Dropdown', value: 'dropdown' },
                { name: 'Radio', value: 'radio' },
                { name: 'Multiselect', value: 'multiselect' },
                { name: 'Toggle switch', value: 'toggle' },
                { name: 'Date Picker', value: 'datepicker' },
              ]}
              value={column.columnType}
              search={true}
              closeOnSelect={true}
              onChange={(value) => {
                this.onColumnItemChange(index, 'columnType', value);
              }}
              filterOptions={fuzzySearch}
              placeholder="Select.."
            />
          </div>
          <div className="field mb-2">
            <label className="form-label">Column name</label>
            <input
              type="text"
              className="form-control text-field"
              onBlur={(e) => {
                e.stopPropagation();
                this.onColumnItemChange(index, 'name', e.target.value);
              }}
              defaultValue={column.name}
            />
          </div>
          <div className="field mb-2">
            <label className="form-label">key</label>
            <input
              type="text"
              className="form-control text-field"
              onBlur={(e) => {
                e.stopPropagation();
                this.onColumnItemChange(index, 'key', e.target.value);
              }}
              placeholder={column.name}
              defaultValue={column.key}
            />
          </div>

          {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
            <div>
              <div className="field mb-2">
                <label className="form-label">Text color</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.textColor}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={'Text color of the cell'}
                  onChange={(value) => this.onColumnItemChange(index, 'textColor', value)}
                />
              </div>
              {column.isEditable && (
                <div>
                  <div className="hr-text">Validation</div>
                  <div className="field mb-2">
                    <label className="form-label">Regex</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.regex}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'regex', value)}
                    />
                  </div>
                  <div className="field mb-2">
                    <label className="form-label">Min length</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.minLength}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'minLength', value)}
                    />
                  </div>
                  <div className="field mb-2">
                    <label className="form-label">Max length</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.maxLength}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'maxLength', value)}
                    />
                  </div>
                  <div className="field mb-2">
                    <label className="form-label">Custom rule</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.customRule}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'customRule', value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {column.columnType === 'toggle' && (
            <div>
              <div className="field mb-2">
                <Color
                  param={{ name: 'Active color' }}
                  paramType="properties"
                  componentMeta={{ properties: { color: { displayName: 'Active color' } } }}
                  definition={{ value: column.activeColor || '#3c92dc' }}
                  onChange={(name, value, color) => this.onColumnItemChange(index, 'activeColor', color)}
                />
              </div>
            </div>
          )}

          {(column.columnType === 'dropdown' ||
            column.columnType === 'multiselect' ||
            column.columnType === 'badge' ||
            column.columnType === 'badges' ||
            column.columnType === 'radio') && (
            <div>
              <div className="field mb-2">
                <label className="form-label">Values</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.values}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={'{{[1, 2, 3]}}'}
                  onChange={(value) => this.onColumnItemChange(index, 'values', value)}
                />
              </div>
              <div className="field mb-2">
                <label className="form-label">Labels</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.labels}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={'{{["one", "two", "three"]}}'}
                  onChange={(value) => this.onColumnItemChange(index, 'labels', value)}
                />
              </div>
            </div>
          )}

          {column.columnType === 'dropdown' && (
            <>
              {column.isEditable && (
                <div>
                  <div className="hr-text">Validation</div>
                  <div className="field mb-2">
                    <label className="form-label">Custom rule</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.customRule}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'customRule', value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {column.columnType === 'datepicker' && (
            <div>
              <label className="form-label">Date Format</label>
              <div className="field mb-2">
                <input
                  type="text"
                  className="form-control text-field"
                  onChange={(e) => {
                    e.stopPropagation();
                    this.onColumnItemChange(index, 'dateFormat', e.target.value);
                  }}
                  defaultValue={column.dateFormat}
                  placeholder={'DD-MM-YYYY'}
                />
              </div>
              <div className="field mb-2">
                <label className="form-check form-switch my-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => {
                      this.onColumnItemChange(index, 'isTimeChecked', !column.isTimeChecked);
                    }}
                    checked={column.isTimeChecked}
                  />
                  <span className="form-check-label">show time</span>
                </label>
              </div>
            </div>
          )}

          <label className="form-check form-switch my-4">
            <input
              className="form-check-input"
              type="checkbox"
              onClick={() => this.onColumnItemChange(index, 'isEditable', !column.isEditable)}
              checked={column.isEditable}
            />
            <span className="form-check-label">make editable</span>
          </label>
        </Popover.Content>
      </Popover>
    );
  };

  actionPopOver = (action, index) => {
    const dummyComponentForActionButton = {
      component: {
        definition: {
          events: this.props.component.component.definition.properties.actions.value[index].events || [],
        },
      },
    };

    return (
      <Popover id="popover-basic">
        <Popover.Content>
          <div className="field mb-2">
            <label className="form-label">Button Text</label>
            <input
              type="text"
              className="form-control text-field"
              onChange={(e) => {
                e.stopPropagation();
                this.onActionButtonPropertyChanged(index, 'buttonText', e.target.value);
              }}
              value={action.buttonText}
            />
          </div>
          <div className="field mb-2">
            <label className="form-label">Button position</label>
            <SelectSearch
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
              filterOptions={fuzzySearch}
              placeholder="Select position"
            />
          </div>
          <Color
            param={{ name: 'actionButtonBackgroundColor' }}
            paramType="properties"
            componentMeta={this.state.componentMeta}
            definition={{ value: action.backgroundColor }}
            onChange={(name, value, color) => this.onActionButtonPropertyChanged(index, 'backgroundColor', color)}
          />

          <Color
            param={{ name: 'actionButtonTextColor' }}
            paramType="properties"
            componentMeta={this.state.componentMeta}
            definition={{ value: action.textColor }}
            onChange={(name, value, color) => this.onActionButtonPropertyChanged(index, 'textColor', color)}
          />
          <EventManager
            component={dummyComponentForActionButton}
            componentMeta={{ events: { onClick: { displayName: 'On click' } } }}
            currentState={this.state.currentState}
            dataQueries={this.props.dataQueries}
            components={this.props.components}
            eventsChanged={(events) => this.actionButtonEventsChanged(events, index)}
            apps={this.props.apps}
            popOverCallback={(showing) => {
              this.setState({ actionPopOverRootClose: !showing });
              this.setState({ showPopOver: showing });
            }}
          />
          <button className="btn btn-sm btn-outline-danger mt-2 col" onClick={() => this.removeAction(index)}>
            Remove
          </button>
        </Popover.Content>
      </Popover>
    );
  };

  actionButton(action, index) {
    return (
      <OverlayTrigger
        trigger="click"
        placement="left"
        rootClose={this.state.actionPopOverRootClose}
        overlay={this.actionPopOver(action, index)}
        onToggle={(showing) => this.setState({ showPopOver: showing })}
      >
        <div className={`card p-2 ${this.props.darkMode ? 'bg-secondary' : 'bg-light'}`} role="button">
          <div className={`row ${this.props.darkMode ? '' : 'bg-light'}`}>
            <div className="col-auto">
              <div className="text">{action.buttonText}</div>
            </div>
          </div>
        </div>
      </OverlayTrigger>
    );
  }

  onSortEnd = (oldIndex, newIndex) => {
    const columns = this.props.component.component.definition.properties.columns;
    const newColumns = arrayMove(columns.value, oldIndex, newIndex);
    this.props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties');
  };

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
    newValue.push({ name: this.generateNewColumnName(columns.value), id: uuidv4() });
    this.props.paramUpdated({ name: 'columns' }, 'value', newValue, 'properties');
  };

  addNewAction = () => {
    const actions = this.props.component.component.definition.properties.actions;
    const newValue = actions ? actions.value : [];
    newValue.push({ name: computeActionName(actions), buttonText: 'Button', events: [] });
    this.props.paramUpdated({ name: 'actions' }, 'value', newValue, 'properties');
  };

  removeAction = (index) => {
    const newValue = this.props.component.component.definition.properties.actions.value;
    newValue.splice(index, 1);
    this.props.paramUpdated({ name: 'actions' }, 'value', newValue, 'properties');
  };

  onColumnItemChange = (index, item, value) => {
    const columns = this.props.component.component.definition.properties.columns;
    const column = columns.value[index];

    if (item === 'name') {
      const columnSizes = this.props.component.component.definition.properties.columnSizes;

      if (columnSizes) {
        const newColumnSizes = JSON.parse(JSON.stringify(columnSizes));
        if (newColumnSizes[column.name]) {
          newColumnSizes[value] = newColumnSizes[column.name];
          this.props.paramUpdated({ name: 'columnSizes' }, null, newColumnSizes, 'properties');
        }
      }
    }

    column[item] = value;
    const newColumns = columns.value;
    newColumns[index] = column;

    this.props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties');
  };

  removeColumn = (index) => {
    const columns = this.props.component.component.definition.properties.columns;
    const newValue = columns.value;
    newValue.splice(index, 1);
    this.props.paramUpdated({ name: 'columns' }, 'value', newValue, 'properties');
  };

  render() {
    const { dataQueries, component, paramUpdated, componentMeta, components, currentState, darkMode } = this.props;

    const columns = component.component.definition.properties.columns;
    const actions = component.component.definition.properties.actions || { value: [] };

    if (!component.component.definition.properties.displaySearchBox)
      paramUpdated({ name: 'displaySearchBox' }, 'value', true, 'properties');
    const displaySearchBox = component.component.definition.properties.displaySearchBox.value;
    const serverSidePagination = component.component.definition.properties.serverSidePagination?.value ?? false;

    return (
      <div className="properties-container p-2 " key={this.props.component.id}>
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'data',
          'properties',
          currentState,
          components,
          darkMode
        )}

        <div className="field mb-2 mt-3">
          <div className="row g-2">
            <div className="col">
              <label className="form-label col pt-1">Columns</label>
            </div>
            <div className="col-auto">
              <button onClick={this.addNewColumn} className="btn btn-sm btn-outline-azure col-auto">
                + Add column
              </button>
            </div>
          </div>
          <div>
            <SortableList onSortEnd={this.onSortEnd} className="w-100" draggedItemClassName="dragged">
              {columns.value.map((item, index) => (
                <div className={`card p-2 column-sort-row ${this.props.darkMode ? '' : 'bg-light'}`} key={index}>
                  <OverlayTrigger trigger="click" placement="left" rootClose overlay={this.columnPopover(item, index)}>
                    <div className={`row ${this.props.darkMode ? '' : 'bg-light'}`} role="button">
                      <div className="col-auto">
                        <SortableItem key={item.name}>
                          <img
                            style={{ cursor: 'move' }}
                            className="svg-icon"
                            src="/assets/images/icons/editor/rearrange.svg"
                            width="10"
                            height="10"
                          />
                        </SortableItem>
                      </div>
                      <div className="col">
                        <div className="text">{item.name}</div>
                      </div>
                      <div className="col-auto">
                        <img
                          onClick={() => this.removeColumn(index)}
                          className="svg-icon"
                          src="/assets/images/icons/trash.svg"
                          width="12"
                          height="12"
                        />
                      </div>
                    </div>
                  </OverlayTrigger>
                </div>
              ))}
            </SortableList>
          </div>

          <hr></hr>
          <div className="field mb-2 mt-2">
            <div className="row g-2">
              <div className="col">
                <label className="form-label col pt-1">Action buttons</label>
              </div>
              <div className="col-auto">
                <button onClick={this.addNewAction} className="btn btn-sm btn-outline-azure col-auto">
                  + Button
                </button>
              </div>
            </div>
            <div>{actions.value.map((action, index) => this.actionButton(action, index))}</div>
            {actions.value.length === 0 && (
              <center>
                <small>This table doesn&apos;t have any action buttons</small>
              </center>
            )}
          </div>
          <hr></hr>

          {renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'serverSidePagination',
            'properties',
            currentState
          )}
          {!serverSidePagination &&
            renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'clientSidePagination',
              'properties',
              currentState
            )}
          {renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'displaySearchBox',
            'properties',
            currentState
          )}
          {displaySearchBox &&
            renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'serverSideSearch',
              'properties',
              currentState
            )}
          {renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'showDownloadButton',
            'properties',
            currentState
          )}
          {renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'showFilterButton',
            'properties',
            currentState
          )}
          {renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            'showBulkUpdateActions',
            'properties',
            currentState
          )}

          {Object.keys(componentMeta.styles).map((style) =>
            renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              style,
              'styles',
              currentState,
              components
            )
          )}
          <div className="hr-text">Events</div>

          <EventManager
            component={component}
            componentMeta={componentMeta}
            currentState={currentState}
            dataQueries={dataQueries}
            components={components}
            eventsChanged={this.props.eventsChanged}
            apps={this.props.apps}
          />

          <div className="hr-text">Style</div>
        </div>

        {renderElement(component, componentMeta, paramUpdated, dataQueries, 'loadingState', 'properties', currentState)}
        {renderElement(component, componentMeta, paramUpdated, dataQueries, 'disabledState', 'styles', currentState)}
        {renderElement(component, componentMeta, paramUpdated, dataQueries, 'textColor', 'styles', currentState)}
        {renderElement(component, componentMeta, paramUpdated, dataQueries, 'tableType', 'styles', currentState)}
      </div>
    );
  }
}

export { Table };
