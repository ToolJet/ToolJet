import React from 'react';
import Accordion from '@/_ui/Accordion';

import { renderElement } from '../Utils';
import { computeActionName, resolveReferences } from '@/_helpers/utils';
// eslint-disable-next-line import/no-unresolved
import SortableList, { SortableItem } from 'react-easy-sort';
import arrayMove from 'array-move';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { Color } from '../Elements/Color';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { v4 as uuidv4 } from 'uuid';
import { EventManager } from '../EventManager';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { withTranslation } from 'react-i18next';
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
      { name: '-05:00', value: 'America/New_York' },
      { name: '-04:30', value: 'America/Caracas' },
      { name: '-04:00', value: 'America/Halifax' },
      { name: '-03:30', value: 'America/St_Johns' },
      { name: '-03:00', value: 'America/Sao_Paulo' },
      { name: '-02:00', value: 'Etc/GMT+2' },
      { name: '-01:00', value: 'Atlantic/Cape_Verde' },
      { name: '+00:00', value: 'Africa/Casablanca' },
      { name: '+01:00', value: 'Europe/Berlin' },
      { name: '+02:00', value: 'Europe/Istanbul' },
      { name: '+03:00', value: 'Asia/Baghdad' },
      { name: '+04:00', value: 'Europe/Moscow' },
      { name: '+04:30', value: 'Asia/Kabul' },
      { name: '+05:00', value: 'Asia/Tashkent' },
      { name: '+05:30', value: 'Asia/Colombo' },
      { name: '+05:45', value: 'Asia/Kathmandu' },
      { name: '+06:00', value: 'Asia/Almaty' },
      { name: '+06:30', value: 'Asia/Yangon' },
      { name: '+07:00', value: 'Asia/Bangkok' },
      { name: '+08:00', value: 'Asia/Krasnoyarsk' },
      { name: '+09:00', value: 'Asia/Seoul' },
      { name: '+09:30', value: 'Australia/Darwin' },
      { name: '+10:00', value: 'Australia/Hobart' },
      { name: '+11:00', value: 'Asia/Vladivostok' },
      { name: '+12:00', value: 'Etc/GMT-12' },
      { name: '+13:00', value: 'Pacific/Tongatapu' },
    ];
    return (
      <Popover id="popover-basic-2" className={`${this.props.darkMode && 'popover-dark-themed theme-dark'} shadow`}>
        <Popover.Content>
          <div className="field mb-2">
            <label className="form-label">{this.props.t('widget.Table.columnType', 'Column type')}</label>
            <SelectSearch
              className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
              options={[
                { name: 'Default', value: 'default' },
                { name: 'String', value: 'string' },
                { name: 'Number', value: 'number' },
                { name: 'Text', value: 'text' },
                { name: 'Badge', value: 'badge' },
                { name: 'Multiple badges', value: 'badges' },
                { name: 'Tags', value: 'tags' },
                { name: 'Dropdown', value: 'dropdown' },
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
              filterOptions={fuzzySearch}
              placeholder={this.props.t('globals.select', 'Select') + '...'}
            />
          </div>
          <div className="field mb-2">
            <label className="form-label">{this.props.t('widget.Table.columnName', 'Column name')}</label>
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
          {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
            <div className="field mb-2">
              <label className="form-label">{this.props.t('widget.Table.overflow', 'Overflow')}</label>
              <SelectSearch
                className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
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
                filterOptions={fuzzySearch}
                placeholder={this.props.t('globals.select', 'Select') + '...'}
              />
            </div>
          )}
          <div className="field mb-2">
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

          {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
            <div>
              <div className="field mb-2">
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
              {column.isEditable && (
                <div>
                  <div className="hr-text">{this.props.t('widget.Table.validation', 'Validation')}</div>
                  <div className="field mb-2">
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
                  <div className="field mb-2">
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
                  <div className="field mb-2">
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
                  <div className="field mb-2">
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

          {column.columnType === 'number' && column.isEditable && (
            <div>
              <div className="hr-text">{this.props.t('widget.Table.validation', 'Validation')}</div>
              <div className="field mb-2">
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
              <div className="field mb-2">
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
                componentMeta={{ events: { onChange: { displayName: 'On change' } } }}
                currentState={this.props.currentState}
                dataQueries={this.props.dataQueries}
                components={this.props.components}
                eventsChanged={(events) => this.columnEventChanged(column, events)}
                apps={this.props.apps}
                popOverCallback={(showing) => {
                  this.setColumnPopoverRootCloseBlocker('event-manager', showing);
                }}
              />
            </div>
          )}

          {(column.columnType === 'dropdown' ||
            column.columnType === 'multiselect' ||
            column.columnType === 'badge' ||
            column.columnType === 'badges' ||
            column.columnType === 'radio') && (
            <div>
              <div className="field mb-2">
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
              <div className="field mb-2">
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
              {column.isEditable && (
                <div>
                  <div className="hr-text">{this.props.t('widget.Table.validation', 'Validation')}</div>
                  <div className="field mb-2">
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

          <div className="field mb-2">
            <label className="form-label">{this.props.t('widget.Table.cellBgColor', 'Cell Background Color')}</label>
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

          {column.columnType === 'datepicker' && (
            <div>
              <label className="form-label">
                {this.props.t('widget.Table.dateDisplayformat', 'Date Display Format')}
              </label>
              <div className="field mb-2">
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
              <label className="form-label">{this.props.t('widget.Table.dateParseformat', 'Date Parse Format')}</label>
              <div className="field mb-2">
                <input
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
              <label className="form-label">Parse in timezone</label>
              <div className="field mb-2">
                <SelectSearch
                  className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
                  options={timeZoneOptions}
                  value={column.timeZoneValue}
                  search={true}
                  closeOnSelect={true}
                  onChange={(value) => {
                    this.onColumnItemChange(index, 'timeZoneValue', value);
                  }}
                  filterOptions={fuzzySearch}
                  placeholder="Select.."
                />
              </div>
              <label className="form-label">Display in timezone</label>
              <div className="field mb-2">
                <SelectSearch
                  className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
                  options={timeZoneOptions}
                  value={column.timeZoneDisplay}
                  search={true}
                  closeOnSelect={true}
                  onChange={(value) => {
                    this.onColumnItemChange(index, 'timeZoneDisplay', value);
                  }}
                  filterOptions={fuzzySearch}
                  placeholder="Select.."
                />
              </div>
              <div className="field mb-2">
                <div className="form-check form-switch my-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onClick={() => {
                      this.onColumnItemChange(index, 'isTimeChecked', !column.isTimeChecked);
                    }}
                    checked={column.isTimeChecked}
                  />
                  <span className="form-check-label">{this.props.t('widget.Table.showTime', 'show time')}</span>
                </div>
              </div>
            </div>
          )}
          {column.columnType === 'image' && (
            <>
              <div className="field mb-2">
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
              <div className="field mb-2">
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
              <div className="field mb-2">
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
              <div className="field mb-2">
                <label className="form-label">{this.props.t('widget.Table.objectFit', 'Object fit')}</label>
                <SelectSearch
                  className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
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
                  filterOptions={fuzzySearch}
                  placeholder={this.props.t('Select') + '...'}
                />
              </div>
            </>
          )}

          {column.columnType !== 'image' && (
            <div className="form-check form-switch my-4">
              <input
                className="form-check-input"
                type="checkbox"
                onClick={() => this.onColumnItemChange(index, 'isEditable', !column.isEditable)}
                checked={column.isEditable}
              />
              <span className="form-check-label">{this.props.t('widget.Table.makeEditable', 'make editable')}</span>
            </div>
          )}
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
      <Popover id="popover-basic" className={`${this.props.darkMode && 'popover-dark-themed theme-dark'} shadow`}>
        <Popover.Content>
          <div className="field mb-2">
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
              className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
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
            {this.props.t('widget.Table.remove', 'Remove')}
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
        <div className={`card p-2 mb-1 ${this.props.darkMode ? 'bg-secondary' : 'bg-light'}`} role="button">
          <div className={`row ${this.props.darkMode ? '' : 'bg-light'}`}>
            <div className="col-auto">
              <div
                data-cy={`action-button-${String(action.buttonText ?? '')
                  .toLowerCase()
                  .replace(/\s+/g, '-')}-${String(index ?? '')}`}
                className="text"
              >
                {action.buttonText}
              </div>
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

    column[item] = value;
    const newColumns = columns.value;
    newColumns[index] = column;
    this.props.paramUpdated({ name: 'columns' }, 'value', newColumns, 'properties');
  };

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

  getPopoverFieldSource = (column, field) =>
    `widget/${this.props.component.component.name}/${column ?? 'default'}::${field}`;

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
    const enabledSort = component.component.definition.properties.enabledSort?.value
      ? resolveReferences(component.component.definition.properties.enabledSort?.value, currentState)
      : true;

    const renderCustomElement = (param, paramType = 'properties') => {
      return renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState);
    };

    let items = [];

    items.push({
      title: 'Properties',
      children: renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        'data',
        'properties',
        currentState,
        components,
        darkMode
      ),
    });

    items.push({
      title: 'Columns',
      children: (
        <div>
          <div className="col-auto text-right mb-3">
            <button
              onClick={this.addNewColumn}
              className="btn btn-sm border-0 font-weight-normal padding-2 col-auto color-primary inspector-add-button"
            >
              {this.props.t('widget.Table.addColumn', '+ Add column')}
            </button>
          </div>
          <SortableList onSortEnd={this.onSortEnd} className="w-100" draggedItemClassName="dragged">
            {columns.value.map((item, index) => (
              <div className={`card p-2 column-sort-row mb-1 ${this.props.darkMode ? '' : 'bg-light'}`} key={index}>
                <OverlayTrigger
                  trigger="click"
                  placement="left"
                  rootClose={this.state.popOverRootCloseBlockers.length === 0}
                  overlay={this.columnPopover(item, index)}
                >
                  <div className={`row ${this.props.darkMode ? '' : 'bg-light'}`} role="button">
                    <div className="col-auto">
                      <SortableItem key={item.name}>
                        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M0.666667 1.66667C0.666667 2.03486 0.965143 2.33333 1.33333 2.33333C1.70152 2.33333 2 2.03486 2 1.66667C2 1.29848 1.70152 1 1.33333 1C0.965143 1 0.666667 1.29848 0.666667 1.66667Z"
                            stroke="#8092AC"
                            strokeWidth="1.33333"
                          />
                          <path
                            d="M5.99992 1.66667C5.99992 2.03486 6.2984 2.33333 6.66659 2.33333C7.03478 2.33333 7.33325 2.03486 7.33325 1.66667C7.33325 1.29848 7.03478 1 6.66659 1C6.2984 1 5.99992 1.29848 5.99992 1.66667Z"
                            stroke="#8092AC"
                            strokeWidth="1.33333"
                          />
                          <path
                            d="M0.666667 7.00001C0.666667 7.3682 0.965143 7.66668 1.33333 7.66668C1.70152 7.66668 2 7.3682 2 7.00001C2 6.63182 1.70152 6.33334 1.33333 6.33334C0.965143 6.33334 0.666667 6.63182 0.666667 7.00001Z"
                            stroke="#8092AC"
                            strokeWidth="1.33333"
                          />
                          <path
                            d="M5.99992 7.00001C5.99992 7.3682 6.2984 7.66668 6.66659 7.66668C7.03478 7.66668 7.33325 7.3682 7.33325 7.00001C7.33325 6.63182 7.03478 6.33334 6.66659 6.33334C6.2984 6.33334 5.99992 6.63182 5.99992 7.00001Z"
                            stroke="#8092AC"
                            strokeWidth="1.33333"
                          />
                          <path
                            d="M0.666667 12.3333C0.666667 12.7015 0.965143 13 1.33333 13C1.70152 13 2 12.7015 2 12.3333C2 11.9651 1.70152 11.6667 1.33333 11.6667C0.965143 11.6667 0.666667 11.9651 0.666667 12.3333Z"
                            stroke="#8092AC"
                            strokeWidth="1.33333"
                          />
                          <path
                            d="M5.99992 12.3333C5.99992 12.7015 6.2984 13 6.66659 13C7.03478 13 7.33325 12.7015 7.33325 12.3333C7.33325 11.9651 7.03478 11.6667 6.66659 11.6667C6.2984 11.6667 5.99992 11.9651 5.99992 12.3333Z"
                            stroke="#8092AC"
                            strokeWidth="1.33333"
                          />
                        </svg>
                      </SortableItem>
                    </div>
                    <div className="col">
                      <div className="text">{item.name}</div>
                    </div>
                    <div className="col-auto">
                      <svg
                        onClick={() => this.removeColumn(index)}
                        width="10"
                        height="16"
                        viewBox="0 0 10 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0 13.8333C0 14.75 0.75 15.5 1.66667 15.5H8.33333C9.25 15.5 10 14.75 10 13.8333V3.83333H0V13.8333ZM1.66667 5.5H8.33333V13.8333H1.66667V5.5ZM7.91667 1.33333L7.08333 0.5H2.91667L2.08333 1.33333H0V3H10V1.33333H7.91667Z"
                          fill="#8092AC"
                        />
                      </svg>
                    </div>
                  </div>
                </OverlayTrigger>
              </div>
            ))}
          </SortableList>
        </div>
      ),
    });

    items.push({
      title: 'Action buttons',
      children: (
        <div className="field mb-2 mt-2">
          <div className="row g-2">
            <div className="text-right mb-3">
              <button
                data-cy="button-add-new-action-button"
                onClick={this.addNewAction}
                className="btn btn-sm border-0 font-weight-normal padding-2 col-auto color-primary inspector-add-button"
              >
                {this.props.t('widget.Table.addButton', '+ Add button')}
              </button>
            </div>
          </div>
          <div>{actions.value.map((action, index) => this.actionButton(action, index))}</div>
          {actions.value.length === 0 && (
            <div className="text-center">
              <small data-cy="message-no-action-button" className="color-disabled">
                {this.props.t('widget.Table.noActionMessage', "This table doesn't have any action buttons")}
              </small>
            </div>
          )}
        </div>
      ),
    });

    const options = [
      'serverSidePagination',
      ...(serverSidePagination ? ['enablePrevButton'] : []),
      ...(serverSidePagination ? ['enableNextButton'] : []),
      ...(serverSidePagination ? ['totalRecords'] : []),
      ...(clientSidePagination && !serverSidePagination ? ['rowsPerPage'] : []),
      'enabledSort',
      ...(enabledSort ? ['serverSideSort'] : []),
      'showDownloadButton',
      'showFilterButton',
      ...(displayServerSideFilter ? ['serverSideFilter'] : []),
      'showBulkUpdateActions',
      'showBulkSelector',
      'highlightSelectedRow',
    ];

    let renderOptions = [];

    !serverSidePagination && options.splice(1, 0, 'clientSidePagination');

    options.map((option) => renderOptions.push(renderCustomElement(option)));

    const conditionalOptions = [
      { name: 'displaySearchBox', condition: displaySearchBox },
      { name: 'serverSideSearch', condition: displayServerSideSearch },
      { name: 'loadingState', condition: true },
    ];

    conditionalOptions.map(({ name, condition }) => {
      if (condition) renderOptions.push(renderCustomElement(name));
    });

    items.push({
      title: 'Options',
      children: renderOptions,
    });

    items.push({
      title: 'Events',
      isOpen: false,
      children: (
        <EventManager
          component={component}
          componentMeta={componentMeta}
          currentState={currentState}
          dataQueries={dataQueries}
          components={components}
          eventsChanged={this.props.eventsChanged}
          apps={this.props.apps}
        />
      ),
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
