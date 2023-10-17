import React, { useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import { resolveReferences } from '@/_helpers/utils';
import SelectSearch from 'react-select-search';
import { useTranslation } from 'react-i18next';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import { Color } from '../../Elements/Color';
import { EventManager } from '../../EventManager';
import { ProgramaticallyHandleProperties } from './ProgramaticallyHandleProperties';
export const ColumnPopoverContent = ({
  column,
  index,
  darkMode,
  currentState,
  onColumnItemChange,
  getPopoverFieldSource,
  setColumnPopoverRootCloseBlocker,
  component,
  props,
  columnEventChanged,
}) => {
  const [activeTab, setActiveTab] = useState('propertiesTab');
  const { t } = useTranslation();

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
    // <Popover
    //   id="popover-basic-2"
    //   className={`${darkMode && 'dark-theme'} shadow`}
    //   style={{
    //     maxHeight: resolveReferences(column.isEditable, currentState) ? '100vh' : 'inherit',
    //     overflowY: 'auto',
    //   }}
    // >
    <>
      <Popover.Header>
        <div className="d-flex justify-content-between">
          <span
            className={`${activeTab === 'propertiesTab' && 'active-column-tab'}`}
            onClick={() => {
              if (activeTab !== 'propertiesTab') setActiveTab('propertiesTab');
            }}
          >
            Properties
          </span>
          <span
            className={`${activeTab === 'stylesTab' && 'active-column-tab'}`}
            onClick={() => {
              if (activeTab !== 'styles') setActiveTab('stylesTab');
            }}
          >
            Styles
          </span>
        </div>
      </Popover.Header>
      <Popover.Body>
        <div className="field mb-2" data-cy={`dropdown-column-type`}>
          <label data-cy={`label-column-type`} className="form-label">
            {t('widget.Table.columnType', 'Column type')}
          </label>
          <SelectSearch
            className={`${darkMode ? 'select-search' : 'select-search'}`}
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
              onColumnItemChange(index, 'columnType', value);
            }}
            fuzzySearch
            placeholder={t('globals.select', 'Select') + '...'}
          />
        </div>
        <div className="field mb-2" data-cy={`input-and-label-column-name`}>
          <label data-cy={`label-column-name`} className="form-label">
            {t('widget.Table.columnName', 'Column name')}
          </label>
          <CodeHinter
            currentState={currentState}
            initialValue={column.name}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            placeholder={column.name}
            onChange={(value) => onColumnItemChange(index, 'name', value)}
            componentName={getPopoverFieldSource(column.columnType, 'name')}
            popOverCallback={(showing) => {
              setColumnPopoverRootCloseBlocker('name', showing);
            }}
          />
        </div>
        {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
          <div data-cy={`input-overflow`} className="field mb-2">
            <label data-cy={`label-overflow`} className="form-label">
              {t('widget.Table.overflow', 'Overflow')}
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
                onColumnItemChange(index, 'textWrap', value);
              }}
              fuzzySearch
              placeholder={t('globals.select', 'Select') + '...'}
            />
          </div>
        )}
        <div data-cy={`input-and-label-key`} className="field mb-2">
          <label className="form-label">{t('widget.Table.key', 'key')}</label>
          <CodeHinter
            currentState={currentState}
            initialValue={column.key}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            placeholder={column.name}
            onChange={(value) => onColumnItemChange(index, 'key', value)}
            componentName={getPopoverFieldSource(column.columnType, 'key')}
            popOverCallback={(showing) => {
              setColumnPopoverRootCloseBlocker('tableKey', showing);
            }}
          />
        </div>
        <div className="field mb-2">
          <label className="form-label">{t('widget.Table.horizontalAlignment', 'Horizontal Alignment')}</label>
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
              onColumnItemChange(index, 'horizontalAlignment', value);
            }}
            fuzzySearch
            placeholder={t('globals.select', 'Select') + '...'}
          />
        </div>

        {(column.columnType === 'string' || column.columnType === undefined || column.columnType === 'default') && (
          <div>
            <div data-cy={`input-and-label-text-color`} className="field mb-2">
              <label className="form-label">{t('widget.Table.textColor', 'Text color')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.textColor}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={'Text color of the cell'}
                onChange={(value) => onColumnItemChange(index, 'textColor', value)}
                componentName={getPopoverFieldSource(column.columnType, 'textColor')}
                fieldMeta={column}
                component={component}
                popOverCallback={(showing) => {
                  setColumnPopoverRootCloseBlocker('textColor', showing);
                }}
              />
            </div>
            <div className="field mb-2" data-cy={`input-and-label-cell-background-color`}>
              <label className="form-label">{t('widget.Table.cellBgColor', 'Cell Background Color')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.cellBackgroundColor ?? 'inherit'}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={''}
                onChange={(value) => onColumnItemChange(index, 'cellBackgroundColor', value)}
                componentName={getPopoverFieldSource(column.columnType, 'cellBackgroundColor')}
                popOverCallback={(showing) => {
                  setColumnPopoverRootCloseBlocker('cellBackgroundColor', showing);
                }}
              />
            </div>

            {resolveReferences(column.isEditable, currentState) && (
              <div>
                <div data-cy={`header-validation`} className="hr-text">
                  {t('widget.Table.validation', 'Validation')}
                </div>
                <div data-cy={`input-and-label-regex`} className="field mb-2">
                  <label className="form-label">{t('widget.Table.regex', 'Regex')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.regex}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={''}
                    onChange={(value) => onColumnItemChange(index, 'regex', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'regex')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('regex', showing);
                    }}
                  />
                </div>
                <div data-cy={`input-and-label-min-length`} className="field mb-2">
                  <label className="form-label">{t('widget.Table.minLength', 'Min length')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.minLength}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={''}
                    onChange={(value) => onColumnItemChange(index, 'minLength', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'minLength')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('minLength', showing);
                    }}
                  />
                </div>
                <div data-cy={`input-and-label-max-length`} className="field mb-2">
                  <label className="form-label">{t('widget.Table.maxLength', 'Max length')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.maxLength}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={''}
                    onChange={(value) => onColumnItemChange(index, 'maxLength', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'maxLength')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('maxLength', showing);
                    }}
                  />
                </div>
                <div data-cy={`input-and-label-custom-rule`} className="field mb-2">
                  <label className="form-label">{t('widget.Table.customRule', 'Custom rule')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.customRule}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={''}
                    onChange={(value) => onColumnItemChange(index, 'customRule', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'customRule')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('customRule', showing);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {column.columnType === 'number' && resolveReferences(column.isEditable, currentState) && (
          <div>
            <div className="hr-text" data-cy={`header-validation`}>
              {t('widget.Table.validation', 'Validation')}
            </div>
            <div data-cy={`input-and-label-min-value`} className="field mb-2">
              <label className="form-label">{t('widget.Table.minValue', 'Min value')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.minLength}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={''}
                onChange={(value) => onColumnItemChange(index, 'minValue', value)}
                componentName={getPopoverFieldSource(column.columnType, 'minValue')}
                popOverCallback={(showing) => {
                  setColumnPopoverRootCloseBlocker('minValue', showing);
                }}
              />
            </div>
            <div data-cy={`input-and-label-max-value`} className="field mb-2">
              <label className="form-label">{t('widget.Table.maxValue', 'Max value')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.maxLength}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={''}
                onChange={(value) => onColumnItemChange(index, 'maxValue', value)}
                componentName={getPopoverFieldSource(column.columnType, 'maxValue')}
                popOverCallback={(showing) => {
                  setColumnPopoverRootCloseBlocker('maxValue', showing);
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
                onChange={(name, value, color) => onColumnItemChange(index, 'activeColor', color)}
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
              currentState={currentState}
              dataQueries={props?.dataQueries}
              components={props?.components}
              eventsChanged={(events) => columnEventChanged(column, events)}
              apps={props?.apps}
              popOverCallback={(showing) => {
                setColumnPopoverRootCloseBlocker('event-manager', showing);
              }}
              pages={props?.pages}
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
              <label className="form-label">{t('widget.Table.values', 'Values')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.values}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={'{{[1, 2, 3]}}'}
                onChange={(value) => onColumnItemChange(index, 'values', value)}
                componentName={getPopoverFieldSource(column.columnType, 'values')}
                popOverCallback={(showing) => {
                  setColumnPopoverRootCloseBlocker('values', showing);
                }}
              />
            </div>
            <div data-cy={`input-and-label-labels`} className="field mb-2">
              <label className="form-label">{t('widget.Table.labels', 'Labels')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.labels}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={'{{["one", "two", "three"]}}'}
                onChange={(value) => onColumnItemChange(index, 'labels', value)}
                componentName={getPopoverFieldSource(column.columnType, 'labels')}
                popOverCallback={(showing) => {
                  setColumnPopoverRootCloseBlocker('labels', showing);
                }}
              />
            </div>
          </div>
        )}

        {column.columnType === 'dropdown' && (
          <>
            {resolveReferences(column.isEditable, currentState) && (
              <div>
                <div data-cy={`header-validations`} className="hr-text">
                  {t('widget.Table.validation', 'Validation')}
                </div>
                <div data-cy={`input-and-label-custom-rule`} className="field mb-2">
                  <label className="form-label">{t('widget.Table.customRule', 'Custom Rule')}</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={column.customRule}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    placeholder={''}
                    onChange={(value) => onColumnItemChange(index, 'customRule', value)}
                    componentName={getPopoverFieldSource(column.columnType, 'customRule')}
                    popOverCallback={(showing) => {
                      setColumnPopoverRootCloseBlocker('customRule', showing);
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
              {t('widget.Table.dateDisplayformat', 'Date Display Format')}
            </label>
            <div data-cy={`input-date-display-format`} className="field mb-2">
              <CodeHinter
                currentState={currentState}
                initialValue={column.dateFormat}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={'DD-MM-YYYY'}
                onChange={(value) => onColumnItemChange(index, 'dateFormat', value)}
                componentName={getPopoverFieldSource(column.columnType, 'dateFormat')}
                popOverCallback={(showing) => {
                  setColumnPopoverRootCloseBlocker('dateFormat', showing);
                }}
              />
            </div>
            <label data-cy={`label-date-parse-format`} className="form-label">
              {t('widget.Table.dateParseformat', 'Date Parse Format')}
            </label>
            <div className="field mb-2 tj-app-input">
              <input
                data-cy={`input-date-parse-format`}
                type="text"
                className="form-control text-field"
                onChange={(e) => {
                  e.stopPropagation();
                  onColumnItemChange(index, 'parseDateFormat', e.target.value);
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
                  onColumnItemChange(index, 'timeZoneValue', value);
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
                  onColumnItemChange(index, 'timeZoneDisplay', value);
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
                    onColumnItemChange(index, 'isTimeChecked', !column.isTimeChecked);
                  }}
                  checked={column.isTimeChecked}
                />
                <span data-cy={`label-show-time`} className="form-check-label">
                  {t('widget.Table.showTime', 'show time')}
                </span>
              </div>
            </div>
          </div>
        )}
        {column.columnType === 'image' && (
          <>
            <div data-cy={`input-and-label-border-radius`} className="field mb-2">
              <label className="form-label">{t('widget.Table.borderRadius', 'Border radius')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.borderRadius}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={''}
                onChange={(value) => onColumnItemChange(index, 'borderRadius', value)}
                componentName={getPopoverFieldSource(column.columnType, 'borderRadius')}
              />
            </div>
            <div data-cy={`input-and-label-width`} className="field mb-2">
              <label className="form-label">{t('widget.Table.width', 'Width')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.width}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={''}
                onChange={(value) => onColumnItemChange(index, 'width', value)}
                componentName={getPopoverFieldSource(column.columnType, 'width')}
              />
            </div>
            <div data-cy={`input-and-label-height`} className="field mb-2">
              <label className="form-label">{t('widget.Table.height', 'Height')}</label>
              <CodeHinter
                currentState={currentState}
                initialValue={column.height}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                lineNumbers={false}
                placeholder={''}
                onChange={(value) => onColumnItemChange(index, 'height', value)}
                componentName={getPopoverFieldSource(column.columnType, 'height')}
              />
            </div>
            <div data-cy={`input-and-label-object-fit`} className="field mb-2">
              <label className="form-label">{t('widget.Table.objectFit', 'Object fit')}</label>
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
                  onColumnItemChange(index, 'objectFit', value);
                }}
                fuzzySearch
                placeholder={t('Select') + '...'}
              />
            </div>
          </>
        )}
        {column.columnType === 'link' && (
          <div className="field mb-2">
            <ProgramaticallyHandleProperties
              label="Link target"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={onColumnItemChange}
              property="linkTarget"
              props={column}
              component={component}
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
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={onColumnItemChange}
            property="isEditable"
            props={column}
            component={component}
            paramMeta={{ type: 'toggle', displayName: 'Make editable' }}
            paramType="properties"
          />
        )}

        <ProgramaticallyHandleProperties
          label="Column visibility"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={onColumnItemChange}
          property="columnVisibility"
          props={column}
          component={component}
          paramMeta={{ type: 'toggle', displayName: 'Column visibility' }}
          paramType="properties"
        />
      </Popover.Body>
    </>
    // </Popover>
  );
};
