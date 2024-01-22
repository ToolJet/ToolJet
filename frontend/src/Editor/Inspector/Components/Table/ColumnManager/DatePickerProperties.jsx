import React from 'react';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import SelectSearch from 'react-select-search';
import Select from '@/_ui/Select';
import { useTranslation } from 'react-i18next';
import Accordion from '@/_ui/Accordion';

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
  const items = [];
  items.push({
    title: 'Formatting',
    children: (
      <>
        <div data-cy={`input-date-display-format`} className="field mb-2" onClick={(e) => e.stopPropagation()}>
          <label data-cy={`label-date-display-format`} className="form-label">
            {t('widget.Table.dateDisplayformat', 'Date Display Format')}
          </label>
          <Select
            options={[
              {
                label: 'DD/MM/YYYY',
                value: 'DD/MM/YYYY',
              },
              {
                label: 'MM/DD/YYYY',
                value: 'MM/DD/YYYY',
              },
              {
                label: 'YYYY/DD/MM',
                value: 'YYYY/DD/MM',
              },
              {
                label: 'YYYY/MM/DD',
                value: 'YYYY/MM/DD',
              },
            ]}
            value={column?.dateFormat}
            search={true}
            closeOnSelect={true}
            onChange={(value) => {
              onColumnItemChange(index, 'dateFormat', value);
            }}
            fuzzySearch
            placeholder="Select.."
          />
        </div>
        <div className="field mb-2" onClick={(e) => e.stopPropagation()}>
          <label className="form-label">{t('widget.Table.timeFormat', 'Time Format')}</label>
          <Select
            options={[
              {
                label: 'HH:mm',
                value: 'HH:mm',
              },
            ]}
            value={column?.timeFormat ?? 'HH:mm'}
            search={true}
            closeOnSelect={true}
            onChange={(value) => {
              onColumnItemChange(index, 'timeFormat', value);
            }}
            fuzzySearch
            placeholder="Select.."
          />
        </div>
        <ProgramaticallyHandleProperties
          label="Enable 24 hr time format"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={onColumnItemChange}
          property="enableTwentyFourHrFormat"
          props={column}
          component={component}
          paramType="properties"
          paramMeta={{ type: 'toggle', displayName: 'Enable 24 hr time format' }}
        />
      </>
    ),
  });

  return (
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
      <Accordion items={items} />
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
    </div>
  );
};
