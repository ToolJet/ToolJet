import React from 'react';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import SelectSearch from 'react-select-search';
// import Select from '@/_ui/Select';
import { useTranslation } from 'react-i18next';
// import Accordion from '@/_ui/Accordion';

export const DatePickerProperties = ({
  column,
  index,
  darkMode,
  currentState,
  onColumnItemChange,
  getPopoverFieldSource,
  setColumnPopoverRootCloseBlocker,
  component,
  timeZoneOptions,
}) => {
  const { t } = useTranslation();
  <div>
    <div className="field">
      <ProgramaticallyHandleProperties
        label="Show time"
        currentState={currentState}
        index={index}
        darkMode={darkMode}
        callbackFunction={onColumnItemChange}
        property="isTimeChecked"
        props={column}
        component={component}
        paramType="properties"
        paramMeta={{ type: 'toggle', displayName: 'Show time' }}
      />
    </div>
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
  </div>;
};
