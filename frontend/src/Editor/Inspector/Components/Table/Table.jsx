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
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import { withTranslation } from 'react-i18next';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import List from '@/ToolJetUI/List/List';
import { capitalize, has } from 'lodash';
import NoListItem from './NoListItem';
import { ProgramaticallyHandleProperties } from './ProgramaticallyHandleProperties';
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
    const timeZoneOptions = [
      { name: 'UTC', value: 'Etc/UTC' },
      { name: '-12:00', value: 'Etc/GMT+12' },
      { name: '-11:00', value: 'Etc/GMT+11' },
      { name: '-10:00', value: 'Pacific/Honolulu' },
      { name: '-09:00', value: 'America/Anchorage' },
      { name: '-08:00', value: 'America/Santa_Isabel' },
      { name: '-07:00', value: 'America/Chihuahua' },
      { name: '-06:00', value: 'America/Guatemala' },
      { name: '-05:00', value: 'America/Bogota' },
      { name: '-04:00', value: 'America/Halifax' },
      { name: '-03:30', value: 'America/St_Johns' },
      { name: '-03:00', value: 'America/Sao_Paulo' },
      { name: '-02:00', value: 'Etc/GMT+2' },
      { name: '-01:00', value: 'Atlantic/Cape_Verde' },
      { name: '+00:00', value: 'UTC' },
      { name: '+01:00', value: 'Europe/Berlin' },
      { name: '+02:00', value: 'Africa/Gaborone' },
      { name: '+03:00', value: 'Asia/Baghdad' },
      { name: '+04:00', value: 'Asia/Muscat' },
      { name: '+04:30', value: 'Asia/Kabul' },
      { name: '+05:00', value: 'Asia/Tashkent' },
      { name: '+05:30', value: 'Asia/Colombo' },
      { name: '+05:45', value: 'Asia/Kathmandu' },
      { name: '+06:00', value: 'Asia/Almaty' },
      { name: '+06:30', value: 'Asia/Yangon' },
      { name: '+07:00', value: 'Asia/Bangkok' },
      { name: '+08:00', value: 'Asia/Makassar' },
      { name: '+09:00', value: 'Asia/Seoul' },
      { name: '+09:30', value: 'Australia/Darwin' },
      { name: '+10:00', value: 'Pacific/Chuuk' },
      { name: '+11:00', value: 'Pacific/Pohnpei' },
      { name: '+12:00', value: 'Etc/GMT-12' },
      { name: '+13:00', value: 'Pacific/Auckland' },
    ];
    return (
      <Popover
        id="popover-basic-2"
        className={`${this.props.darkMode && 'dark-theme'} shadow`}
        style={{
          maxHeight: resolveReferences(column.isEditable, this.state.currentState) ? '100vh' : 'inherit',
          overflowY: 'auto',
        }}
      >
        <Popover.Body>
          <div className="field mb-2" data-cy={`dropdown-column-type`}>
            <label data-cy={`label-column-type`} className="form-label">
              {this.props.t('widget.Table.columnType', 'Column type')}
            </label>
            <SelectSearch
              className={`${this.props.darkMode ? 'select-search' : 'select-search'}`}
              options={[
                { name: 'Default', value: 'default' },
                { name: 'String', value: 'string' },
                { name: 'Number', value: 'number' },
                { name: 'Text', value: 'text' },
                { name: 'Badge', value: 'badge' },
                { name: 'Multiple badges', value: 'badges' },
                { name: 'Tags', value: 'tags' },
                { name: 'Dropdown', value: 'dropdown' },
                { name: 'Link', value: 'link' },
                { name: 'Radio', value: 'radio' },
                { name: 'Multiselect', value: 'multiselect' },
                { name: 'Toggle switch', value: 'toggle' },
                { name: 'Date Picker', value: 'datepicker' },
                { name: 'Image', value: 'image' },
              ]}
              value={column.columnType}
              search={true}
              closeOnSelect={true}
              onChange={(value) => {
                this.onColumnItemChange(index, 'columnType', value);
              }}
              fuzzySearch
              placeholder={this.props.t('globals.select', 'Select') + '...'}
            />
          </div>
          <div className="field mb-2" data-cy={`input-and-label-column-name`}>
            <label data-cy={`label-column-name`} className="form-label">
              {this.props.t('widget.Table.columnName', 'Column name')}
            </label>
            <CodeHinter
              currentState={this.props.currentState}
              initialValue={column.name}
              theme={this.props.darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={column.name}
              onChange={(value) => this.onColumnItemChange(index, 'name', value)}
              componentName={this.getPopoverFieldSource(column.columnType, 'name')}
              popOverCallback={(showing) => {
                this.setColumnPopoverRootCloseBlocker('name', showing);
              }}
            />
          </div>
          {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
            <div data-cy={`input-overflow`} className="field mb-2">
              <label data-cy={`label-overflow`} className="form-label">
                {this.props.t('widget.Table.overflow', 'Overflow')}
              </label>
              <SelectSearch
                className={'select-search'}
                options={[
                  { name: 'Wrap', value: 'wrap' },
                  { name: 'Scroll', value: 'scroll' },
                  { name: 'Hide', value: 'hide' },
                ]}
                value={column.textWrap}
                search={true}
                closeOnSelect={true}
                onChange={(value) => {
                  this.onColumnItemChange(index, 'textWrap', value);
                }}
                fuzzySearch
                placeholder={this.props.t('globals.select', 'Select') + '...'}
              />
            </div>
          )}
          <div data-cy={`input-and-label-key`} className="field mb-2">
            <label className="form-label">{this.props.t('widget.Table.key', 'key')}</label>
            <CodeHinter
              currentState={this.props.currentState}
              initialValue={column.key}
              theme={this.props.darkMode ? 'monokai' : 'default'}
              mode="javascript"
              lineNumbers={false}
              placeholder={column.name}
              onChange={(value) => this.onColumnItemChange(index, 'key', value)}
              componentName={this.getPopoverFieldSource(column.columnType, 'key')}
              popOverCallback={(showing) => {
                this.setColumnPopoverRootCloseBlocker('tableKey', showing);
              }}
            />
          </div>
          <div className="field mb-2">
            <label className="form-label">
              {this.props.t('widget.Table.horizontalAlignment', 'Horizontal Alignment')}
            </label>
            <SelectSearch
              className={'select-search'}
              options={[
                { name: 'Left', value: 'left' },
                { name: 'Center', value: 'center' },
                { name: 'Right', value: 'right' },
              ]}
              value={column?.horizontalAlignment ?? 'left'}
              search={true}
              closeOnSelect={true}
              onChange={(value) => {
                this.onColumnItemChange(index, 'horizontalAlignment', value);
              }}
              fuzzySearch
              placeholder={this.props.t('globals.select', 'Select') + '...'}
            />
          </div>

          {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
            <div>
              <div data-cy={`input-and-label-text-color`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.textColor', 'Text color')}</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.textColor}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={'Text color of the cell'}
                  onChange={(value) => this.onColumnItemChange(index, 'textColor', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'textColor')}
                  fieldMeta={column}
                  component={this.state.component}
                  popOverCallback={(showing) => {
                    this.setColumnPopoverRootCloseBlocker('textColor', showing);
                  }}
                />
              </div>
              <div className="field mb-2" data-cy={`input-and-label-cell-background-color`}>
                <label className="form-label">
                  {this.props.t('widget.Table.cellBgColor', 'Cell Background Color')}
                </label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.cellBackgroundColor ?? 'inherit'}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={''}
                  onChange={(value) => this.onColumnItemChange(index, 'cellBackgroundColor', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'cellBackgroundColor')}
                  popOverCallback={(showing) => {
                    this.setColumnPopoverRootCloseBlocker('cellBackgroundColor', showing);
                  }}
                />
              </div>

              {resolveReferences(column.isEditable, this.state.currentState) && (
                <div>
                  <div data-cy={`header-validation`} className="hr-text">
                    {this.props.t('widget.Table.validation', 'Validation')}
                  </div>
                  <div data-cy={`input-and-label-regex`} className="field mb-2">
                    <label className="form-label">{this.props.t('widget.Table.regex', 'Regex')}</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.regex}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'regex', value)}
                      componentName={this.getPopoverFieldSource(column.columnType, 'regex')}
                      popOverCallback={(showing) => {
                        this.setColumnPopoverRootCloseBlocker('regex', showing);
                      }}
                    />
                  </div>
                  <div data-cy={`input-and-label-min-length`} className="field mb-2">
                    <label className="form-label">{this.props.t('widget.Table.minLength', 'Min length')}</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.minLength}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'minLength', value)}
                      componentName={this.getPopoverFieldSource(column.columnType, 'minLength')}
                      popOverCallback={(showing) => {
                        this.setColumnPopoverRootCloseBlocker('minLength', showing);
                      }}
                    />
                  </div>
                  <div data-cy={`input-and-label-max-length`} className="field mb-2">
                    <label className="form-label">{this.props.t('widget.Table.maxLength', 'Max length')}</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.maxLength}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'maxLength', value)}
                      componentName={this.getPopoverFieldSource(column.columnType, 'maxLength')}
                      popOverCallback={(showing) => {
                        this.setColumnPopoverRootCloseBlocker('maxLength', showing);
                      }}
                    />
                  </div>
                  <div data-cy={`input-and-label-custom-rule`} className="field mb-2">
                    <label className="form-label">{this.props.t('widget.Table.customRule', 'Custom rule')}</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.customRule}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'customRule', value)}
                      componentName={this.getPopoverFieldSource(column.columnType, 'customRule')}
                      popOverCallback={(showing) => {
                        this.setColumnPopoverRootCloseBlocker('customRule', showing);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {column.columnType === 'number' && resolveReferences(column.isEditable, this.state.currentState) && (
            <div>
              <div className="hr-text" data-cy={`header-validation`}>
                {this.props.t('widget.Table.validation', 'Validation')}
              </div>
              <div data-cy={`input-and-label-min-value`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.minValue', 'Min value')}</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.minLength}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={''}
                  onChange={(value) => this.onColumnItemChange(index, 'minValue', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'minValue')}
                  popOverCallback={(showing) => {
                    this.setColumnPopoverRootCloseBlocker('minValue', showing);
                  }}
                />
              </div>
              <div data-cy={`input-and-label-max-value`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.maxValue', 'Max value')}</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.maxLength}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={''}
                  onChange={(value) => this.onColumnItemChange(index, 'maxValue', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'maxValue')}
                  popOverCallback={(showing) => {
                    this.setColumnPopoverRootCloseBlocker('maxValue', showing);
                  }}
                />
              </div>
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
              <EventManager
                component={{
                  component: {
                    definition: {
                      events: column.events ?? [],
                    },
                  },
                }}
                hideEmptyEventsAlert={true}
                componentMeta={{ events: { onChange: { displayName: 'On change' } } }}
                currentState={this.props.currentState}
                dataQueries={this.props.dataQueries}
                components={this.props.components}
                eventsChanged={(events) => this.columnEventChanged(column, events)}
                apps={this.props.apps}
                popOverCallback={(showing) => {
                  this.setColumnPopoverRootCloseBlocker('event-manager', showing);
                }}
                pages={this.props.pages}
              />
            </div>
          )}

          {(column.columnType === 'dropdown' ||
            column.columnType === 'multiselect' ||
            column.columnType === 'badge' ||
            column.columnType === 'badges' ||
            column.columnType === 'radio') && (
            <div>
              <div data-cy={`input-and-label-values`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.values', 'Values')}</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.values}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={'{{[1, 2, 3]}}'}
                  onChange={(value) => this.onColumnItemChange(index, 'values', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'values')}
                  popOverCallback={(showing) => {
                    this.setColumnPopoverRootCloseBlocker('values', showing);
                  }}
                />
              </div>
              <div data-cy={`input-and-label-labels`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.labels', 'Labels')}</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.labels}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={'{{["one", "two", "three"]}}'}
                  onChange={(value) => this.onColumnItemChange(index, 'labels', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'labels')}
                  popOverCallback={(showing) => {
                    this.setColumnPopoverRootCloseBlocker('labels', showing);
                  }}
                />
              </div>
            </div>
          )}

          {column.columnType === 'dropdown' && (
            <>
              {resolveReferences(column.isEditable, this.state.currentState) && (
                <div>
                  <div data-cy={`header-validations`} className="hr-text">
                    {this.props.t('widget.Table.validation', 'Validation')}
                  </div>
                  <div data-cy={`input-and-label-custom-rule`} className="field mb-2">
                    <label className="form-label">{this.props.t('widget.Table.customRule', 'Custom Rule')}</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={column.customRule}
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      placeholder={''}
                      onChange={(value) => this.onColumnItemChange(index, 'customRule', value)}
                      componentName={this.getPopoverFieldSource(column.columnType, 'customRule')}
                      popOverCallback={(showing) => {
                        this.setColumnPopoverRootCloseBlocker('customRule', showing);
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {column.columnType === 'datepicker' && (
            <div>
              <label data-cy={`label-date-display-format`} className="form-label">
                {this.props.t('widget.Table.dateDisplayformat', 'Date Display Format')}
              </label>
              <div data-cy={`input-date-display-format`} className="field mb-2">
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.dateFormat}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={'DD-MM-YYYY'}
                  onChange={(value) => this.onColumnItemChange(index, 'dateFormat', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'dateFormat')}
                  popOverCallback={(showing) => {
                    this.setColumnPopoverRootCloseBlocker('dateFormat', showing);
                  }}
                />
              </div>
              <label data-cy={`label-date-parse-format`} className="form-label">
                {this.props.t('widget.Table.dateParseformat', 'Date Parse Format')}
              </label>
              <div className="field mb-2 tj-app-input">
                <input
                  data-cy={`input-date-parse-format`}
                  type="text"
                  className="form-control text-field"
                  onChange={(e) => {
                    e.stopPropagation();
                    this.onColumnItemChange(index, 'parseDateFormat', e.target.value);
                  }}
                  defaultValue={column.parseDateFormat}
                  placeholder={'DD-MM-YYYY'}
                />
              </div>
              <label data-cy={`label-parse-timezone`} className="form-label">
                Parse in timezone
              </label>
              <div data-cy={`input-parse-timezone`} className="field mb-2">
                <SelectSearch
                  className={'select-search'}
                  options={timeZoneOptions}
                  value={column.timeZoneValue}
                  search={true}
                  closeOnSelect={true}
                  onChange={(value) => {
                    this.onColumnItemChange(index, 'timeZoneValue', value);
                  }}
                  fuzzySearch
                  placeholder="Select.."
                />
              </div>
              <label data-cy={`label-display-time-zone`} className="form-label">
                Display in timezone
              </label>
              <div ata-cy={`input-display-time-zone`} className="field mb-2">
                <SelectSearch
                  className={'select-search'}
                  options={timeZoneOptions}
                  value={column.timeZoneDisplay}
                  search={true}
                  closeOnSelect={true}
                  onChange={(value) => {
                    this.onColumnItemChange(index, 'timeZoneDisplay', value);
                  }}
                  fuzzySearch
                  placeholder="Select.."
                />
              </div>
              <div className="field mb-2">
                <div className="form-check form-switch my-2">
                  <input
                    data-cy={`toggle-show-time`}
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => {
                      this.onColumnItemChange(index, 'isTimeChecked', !column.isTimeChecked);
                    }}
                    checked={column.isTimeChecked}
                  />
                  <span data-cy={`label-show-time`} className="form-check-label">
                    {this.props.t('widget.Table.showTime', 'show time')}
                  </span>
                </div>
              </div>
            </div>
          )}
          {column.columnType === 'image' && (
            <>
              <div data-cy={`input-and-label-border-radius`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.borderRadius', 'Border radius')}</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.borderRadius}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={''}
                  onChange={(value) => this.onColumnItemChange(index, 'borderRadius', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'borderRadius')}
                />
              </div>
              <div data-cy={`input-and-label-width`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.width', 'Width')}</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.width}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={''}
                  onChange={(value) => this.onColumnItemChange(index, 'width', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'width')}
                />
              </div>
              <div data-cy={`input-and-label-height`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.height', 'Height')}</label>
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={column.height}
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  mode="javascript"
                  lineNumbers={false}
                  placeholder={''}
                  onChange={(value) => this.onColumnItemChange(index, 'height', value)}
                  componentName={this.getPopoverFieldSource(column.columnType, 'height')}
                />
              </div>
              <div data-cy={`input-and-label-object-fit`} className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.objectFit', 'Object fit')}</label>
                <SelectSearch
                  className={'select-search'}
                  options={[
                    { name: 'Cover', value: 'cover' },
                    { name: 'Contain', value: 'contain' },
                    { name: 'Fill', value: 'fill' },
                  ]}
                  value={column.objectFit}
                  search={true}
                  closeOnSelect={true}
                  onChange={(value) => {
                    this.onColumnItemChange(index, 'objectFit', value);
                  }}
                  fuzzySearch
                  placeholder={this.props.t('Select') + '...'}
                />
              </div>
            </>
          )}
          {column.columnType === 'link' && (
            <div className="field mb-2">
              <ProgramaticallyHandleProperties
                label="Link target"
                currentState={this.state.currentState}
                index={index}
                darkMode={this.props.darkMode}
                callbackFunction={this.onColumnItemChange}
                property="linkTarget"
                props={column}
                component={this.props.component}
                paramMeta={{
                  type: 'select',
                  displayName: 'Link Target',
                  options: [
                    { name: 'Same window', value: '_self' },
                    { name: 'New window', value: '_blank' },
                  ],
                }}
                paramType="properties"
              />
            </div>
          )}

          {!['image', 'link'].includes(column.columnType) && (
            <ProgramaticallyHandleProperties
              label="make editable"
              currentState={this.state.currentState}
              index={index}
              darkMode={this.props.darkMode}
              callbackFunction={this.onColumnItemChange}
              property="isEditable"
              props={column}
              component={this.props.component}
              paramMeta={{ type: 'toggle', displayName: 'Make editable' }}
              paramType="properties"
            />
          )}

          <ProgramaticallyHandleProperties
            label="Column visibility"
            currentState={this.state.currentState}
            index={index}
            darkMode={this.props.darkMode}
            callbackFunction={this.onColumnItemChange}
            property="columnVisibility"
            props={column}
            component={this.props.component}
            paramMeta={{ type: 'toggle', displayName: 'Column visibility' }}
            paramType="properties"
          />
        </Popover.Body>
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
      <Popover id="popover-basic" className={`${this.props.darkMode && 'dark-theme'}`}>
        <Popover.Body>
          <div className="field mb-2 tj-app-input">
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
          <div className="field mb-2" data-cy={`dropdown-action-button-position`}>
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
            pages={this.props.pages}
          />
          <button className="btn btn-sm btn-outline-danger mt-2 col" onClick={() => this.removeAction(index)}>
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
        onToggle={(showing) => this.setState({ showPopOver: showing })}
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

    column[item] = value;
    const newColumns = columns.value;
    newColumns[index] = column;
    this.props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties');
  };

  getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    ...draggableStyle,
  });

  removeColumn = (index) => {
    const columns = this.props.component.component.definition.properties.columns;
    const newValue = columns.value;
    const removedColumns = newValue.splice(index, 1);
    this.props.paramUpdated({ name: 'columns' }, 'value', newValue, 'properties');

    const existingcolumnDeletionHistory =
      this.props.component.component.definition.properties.columnDeletionHistory?.value ?? [];
    const newcolumnDeletionHistory = [
      ...existingcolumnDeletionHistory,
      ...removedColumns.map((column) => column.key || column.name),
    ];
    this.props.paramUpdated({ name: 'columnDeletionHistory' }, 'value', newcolumnDeletionHistory, 'properties');
  };

  reorderColumns = (startIndex, endIndex) => {
    const result = this.props.component.component.definition.properties.columns.value;
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    this.props.paramUpdated({ name: 'columns' }, 'value', result, 'properties');
  };

  onDragEnd({ source, destination }) {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    this.reorderColumns(source.index, destination.index);
  }

  getPopoverFieldSource = (column, field) =>
    `component/${this.props.component.component.name}/${column ?? 'default'}::${field}`;

  render() {
    const { dataQueries, component, paramUpdated, componentMeta, components, currentState, darkMode } = this.props;

    const columns = component.component.definition.properties.columns;
    const actions = component.component.definition.properties.actions || { value: [] };

    if (!component.component.definition.properties.displaySearchBox)
      paramUpdated({ name: 'displaySearchBox' }, 'value', true, 'properties');
    const displaySearchBox = component.component.definition.properties.displaySearchBox.value;
    const displayServerSideFilter = component.component.definition.properties.showFilterButton?.value
      ? resolveReferences(component.component.definition.properties.showFilterButton?.value, currentState)
      : false;
    const displayServerSideSearch = component.component.definition.properties.displaySearchBox?.value
      ? resolveReferences(component.component.definition.properties.displaySearchBox?.value, currentState)
      : false;
    const serverSidePagination = component.component.definition.properties.serverSidePagination?.value
      ? resolveReferences(component.component.definition.properties.serverSidePagination?.value, currentState)
      : false;

    const clientSidePagination = component.component.definition.properties.clientSidePagination?.value
      ? resolveReferences(component.component.definition.properties.clientSidePagination?.value, currentState)
      : false;

    let enablePagination = !has(component.component.definition.properties, 'enablePagination')
      ? clientSidePagination || serverSidePagination
      : resolveReferences(component.component.definition.properties.enablePagination?.value, currentState);

    const enabledSort = component.component.definition.properties.enabledSort?.value
      ? resolveReferences(component.component.definition.properties.enabledSort?.value, currentState)
      : true;
    const useDynamicColumn = component.component.definition.properties.useDynamicColumn?.value
      ? resolveReferences(component.component.definition.properties.useDynamicColumn?.value, currentState) ?? false
      : false;
    //from app definition values are of string data type if defined or else,undefined
    const allowSelection = component.component.definition.properties?.allowSelection?.value
      ? resolveReferences(component.component.definition.properties.allowSelection?.value, currentState)
      : resolveReferences(component.component.definition.properties.highlightSelectedRow.value, currentState) ||
        resolveReferences(component.component.definition.properties.showBulkSelector.value, currentState);
    const renderCustomElement = (param, paramType = 'properties') => {
      return renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState);
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
                    <div className="w-100" {...droppableProps} ref={innerRef}>
                      {columns.value.map((item, index) => {
                        const resolvedItemName = resolveReferences(item.name, this.state.currentState);
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
                                >
                                  <div key={resolvedItemName}>
                                    <List.Item
                                      isDraggable={true}
                                      primaryText={resolvedItemName}
                                      secondaryText={capitalize(item?.columnType)}
                                      data-cy={`column-${resolvedItemName}`}
                                      enableActionsMenu
                                      isEditable={item.isEditable === '{{true}}'}
                                      onMenuOptionClick={(listItem, menuOptionLabel) => {
                                        if (menuOptionLabel === 'Delete') this.removeColumn(index);
                                      }}
                                      darkMode={darkMode}
                                      menuActions={[
                                        {
                                          label: 'Delete',
                                          icon: '',
                                        },
                                      ]}
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
              <div>
                {columns?.value?.length === 0 && <NoListItem text={'There are no columns'} dataCy={`-columns`} />}
                <div>
                  <AddNewButton dataCy={`button-add-column`} onClick={this.addNewColumn}>
                    {this.props.t('widget.Table.addNewColumn', ' Add new column')}
                  </AddNewButton>
                </div>
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
            {actions.value.length === 0 && (
              <NoListItem text={'There are no action buttons'} dataCy={`-action-button`} />
            )}
            <AddNewButton dataCy="button-add-new-action-button" onClick={this.addNewAction} className="mt-0">
              New action button
            </AddNewButton>
          </div>
        </div>
      ),
    });

    const rowSelectionsOptions = [
      'allowSelection',
      ...(allowSelection ? ['highlightSelectedRow', 'showBulkSelector', 'defaultSelectedRow'] : []),
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
    const additionalActions = ['showAddNewRowButton', 'showDownloadButton', 'hideColumnSelectorButton', 'loadingState'];

    items.push({
      title: 'Events',
      isOpen: true,
      children: (
        <EventManager
          component={component}
          componentMeta={componentMeta}
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
      title: 'Search sort and filter',
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
      title: 'Layout',
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
