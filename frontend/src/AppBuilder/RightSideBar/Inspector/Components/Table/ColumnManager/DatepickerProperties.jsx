import React, { useState } from 'react';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import Select from '@/_ui/Select';
import { useTranslation } from 'react-i18next';
import Accordion from '@/_ui/Accordion';
import { resolveReferences } from '@/_helpers/utils';
import styles from '@/_ui/Select/styles';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';

const TIMEZONE_OPTIONS = [
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

const DATE_FORMAT_OPTIONS = [
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
];

const UNIX_TIMESTAMP_OPTIONS = [
  {
    label: 's',
    value: 'seconds',
  },
  {
    label: 'ms',
    value: 'milliseconds',
  },
];

const DatepickerProperties = ({ column, index, darkMode, currentState, onColumnItemChange, component }) => {
  const { t } = useTranslation();
  const items = [];
  const [isDateDisplayFormatFxOn, setIsDateDisplayFormatFxOn] = useState(
    !column?.notActiveFxActiveFields?.includes('dateFormat') ?? true
  );
  const [isParseDateFormatFxOn, setIsParseDateFormatFxOn] = useState(
    !column?.notActiveFxActiveFields?.includes('parseDateFormat') ?? true
  );

  items.push(
    {
      title: 'Date format',
      className: 'table-date-picker-formatting-accordion',
      children: (
        <>
          <div className="grey-bg-section mb-2 border">
            <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px', borderRadius: '6px' }}>
              <ProgramaticallyHandleProperties
                label="Enable date"
                currentState={currentState}
                index={index}
                darkMode={darkMode}
                callbackFunction={onColumnItemChange}
                property="isDateSelectionEnabled"
                props={column}
                component={component}
                paramType="properties"
                paramMeta={{ type: 'toggle', displayName: 'Enable date' }}
              />
            </div>
            {resolveReferences(column?.isDateSelectionEnabled) && (
              <div
                data-cy={`input-date-display-format`}
                className="field mb-2 w-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '0px 12px' }}>
                  <div className="d-flex justify-content-between">
                    <label data-cy={`label-date-display-format`} className="form-label">
                      {t('widget.Table.dateDisplayformat', 'Date format')}
                    </label>
                    <span>
                      <FxButton
                        active={isDateDisplayFormatFxOn}
                        onPress={() => {
                          let resultFxActiveFields = column?.notActiveFxActiveFields || [];
                          if (isDateDisplayFormatFxOn) {
                            resultFxActiveFields.push('dateFormat');
                          } else {
                            resultFxActiveFields = resultFxActiveFields.filter((field) => field !== 'dateFormat');
                          }
                          setIsDateDisplayFormatFxOn(!isDateDisplayFormatFxOn);
                          onColumnItemChange(index, 'notActiveFxActiveFields', resultFxActiveFields);
                        }}
                      />
                    </span>
                  </div>
                  {isDateDisplayFormatFxOn ? (
                    <CodeHinter
                      initialValue={column?.dateFormat}
                      theme={darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      // placeholder={validation?.placeholder ?? ''}
                      onChange={(value) => onColumnItemChange(index, 'dateFormat', value)}
                    />
                  ) : (
                    <Select
                      options={DATE_FORMAT_OPTIONS}
                      value={column?.dateFormat ?? 'DD/MM/YYYY'}
                      search={true}
                      closeOnSelect={true}
                      onChange={(value) => {
                        onColumnItemChange(index, 'dateFormat', value);
                      }}
                      fuzzySearch
                      placeholder="Select.."
                      useCustomStyles={true}
                      styles={styles(darkMode, '100%')}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="grey-bg-section mb-2 border">
            <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px', borderRadius: '6px' }}>
              <ProgramaticallyHandleProperties
                label="Enable time"
                currentState={currentState}
                index={index}
                darkMode={darkMode}
                callbackFunction={onColumnItemChange}
                property="isTimeChecked"
                props={column}
                component={component}
                paramType="properties"
                paramMeta={{ type: 'toggle', displayName: 'Enable time' }}
              />
            </div>
            {resolveReferences(column?.isTimeChecked) && (
              <>
                {!isDateDisplayFormatFxOn && (
                  <div className="field mb-2" onClick={(e) => e.stopPropagation()} style={{ padding: '0px 12px' }}>
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
                      useCustomStyles={true}
                      styles={styles(darkMode, '100%')}
                    />
                  </div>
                )}
                <div style={{ padding: '0px 12px' }}>
                  <ProgramaticallyHandleProperties
                    label="Enable 24 hr time format"
                    currentState={currentState}
                    index={index}
                    darkMode={darkMode}
                    callbackFunction={onColumnItemChange}
                    property="isTwentyFourHrFormatEnabled"
                    props={column}
                    component={component}
                    paramType="properties"
                    paramMeta={{ type: 'toggle', displayName: 'Enable 24 hr time format' }}
                  />
                </div>

                <div
                  data-cy={`input-display-time-zone`}
                  className="field mb-2"
                  onClick={(e) => e.stopPropagation()}
                  style={{ padding: '0px 12px' }}
                >
                  <label data-cy={`label-display-time-zone`} className="form-label">
                    Time zone
                  </label>
                  <Select
                    options={TIMEZONE_OPTIONS}
                    value={column?.timeZoneDisplay ?? ''}
                    search={true}
                    closeOnSelect={true}
                    onChange={(value) => {
                      onColumnItemChange(index, 'timeZoneDisplay', value);
                    }}
                    fuzzySearch
                    placeholder="Select.."
                    useCustomStyles={true}
                    styles={styles(darkMode, '100%')}
                  />
                </div>
              </>
            )}
          </div>
        </>
      ),
    },
    {
      title: 'Parse format',
      children: (
        <>
          <ProgramaticallyHandleProperties
            label="Parse in unix timestamp"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={onColumnItemChange}
            property="parseInUnixTimestamp"
            props={column}
            component={component}
            paramType="properties"
            paramMeta={{ type: 'toggle', displayName: 'Parse in unix timestamp' }}
          />
          {resolveReferences(column?.parseInUnixTimestamp) ? (
            <div className="mt-2">
              <div className="field mb-2 tj-app-input">
                <label data-cy={`label-date-parse-format`} className="form-label">
                  {t('widget.Table.unixTimestamp', 'Unix timestamp')}
                </label>
                <Select
                  options={UNIX_TIMESTAMP_OPTIONS}
                  value={column?.unixTimestamp ?? 'seconds'}
                  search={true}
                  closeOnSelect={true}
                  onChange={(value) => {
                    onColumnItemChange(index, 'unixTimestamp', value);
                  }}
                  fuzzySearch
                  // placeholder="Select.."
                  useCustomStyles={true}
                  styles={styles(darkMode, '100%')}
                />
              </div>
            </div>
          ) : (
            <div className="mt-2">
              {resolveReferences(column?.isDateSelectionEnabled) && (
                <div data-cy={`input-parse-timezone`} className="field mb-2">
                  <div className="d-flex justify-content-between">
                    <label data-cy={`label-parse-timezone`} className="form-label">
                      Date
                    </label>
                    <span>
                      <FxButton
                        active={isParseDateFormatFxOn}
                        onPress={() => {
                          let resultFxActiveFields = column?.notActiveFxActiveFields || [];
                          if (isDateDisplayFormatFxOn) {
                            resultFxActiveFields.push('parseDateFormat');
                          } else {
                            resultFxActiveFields = resultFxActiveFields.filter((field) => field !== 'parseDateFormat');
                          }
                          setIsParseDateFormatFxOn(!isParseDateFormatFxOn);
                          onColumnItemChange(index, 'notActiveFxActiveFields', resultFxActiveFields);
                        }}
                      />
                    </span>
                  </div>
                  {isParseDateFormatFxOn ? (
                    <CodeHinter
                      initialValue={column?.parseDateFormat}
                      theme={darkMode ? 'monokai' : 'default'}
                      mode="javascript"
                      lineNumbers={false}
                      // placeholder={validation?.placeholder ?? ''}
                      onChange={(value) => onColumnItemChange(index, 'parseDateFormat', value)}
                    />
                  ) : (
                    <Select
                      options={DATE_FORMAT_OPTIONS}
                      value={column?.parseDateFormat ?? 'DD/MM/YYYY'}
                      search={true}
                      closeOnSelect={true}
                      onChange={(value) => {
                        onColumnItemChange(index, 'parseDateFormat', value);
                      }}
                      fuzzySearch
                      placeholder="Select.."
                      useCustomStyles={true}
                      styles={styles(darkMode, '100%')}
                    />
                  )}
                </div>
              )}
              {resolveReferences(column?.isTimeChecked) && (
                <>
                  {!isParseDateFormatFxOn && (
                    <div className="field mb-2" onClick={(e) => e.stopPropagation()}>
                      <label className="form-label">{t('widget.Table.timeFormat', 'Time')}</label>
                      <Select
                        options={[
                          {
                            label: 'HH:mm',
                            value: 'HH:mm',
                          },
                        ]}
                        value={column?.parseTimeFormat ?? 'HH:mm'}
                        search={true}
                        closeOnSelect={true}
                        onChange={(value) => {
                          onColumnItemChange(index, 'parseTimeFormat', value);
                        }}
                        fuzzySearch
                        placeholder="Select.."
                        useCustomStyles={true}
                        styles={styles(darkMode, '100%')}
                      />
                    </div>
                  )}
                  <div data-cy={`input-parse-timezone`} className="field mb-2">
                    <label data-cy={`label-parse-timezone`} className="form-label">
                      Time zone
                    </label>
                    <Select
                      options={TIMEZONE_OPTIONS}
                      value={column?.timeZoneValue ?? ''}
                      search={true}
                      closeOnSelect={true}
                      onChange={(value) => {
                        onColumnItemChange(index, 'timeZoneValue', value);
                      }}
                      fuzzySearch
                      placeholder="Select.."
                      useCustomStyles={true}
                      styles={styles(darkMode, '100%')}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ),
    }
  );

  return <Accordion items={items} className="table-column-date-picker-accordion" />;
};

export default DatepickerProperties;
