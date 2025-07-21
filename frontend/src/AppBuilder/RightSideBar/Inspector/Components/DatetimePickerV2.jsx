import React, { useMemo } from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../Utils';
import { EventManager } from '../EventManager';
import Select from '@/_ui/Select';
import CodeHinter from '@/AppBuilder/CodeEditor';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import cx from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import styles from '@/_ui/Select/styles';
import moment from 'moment-timezone';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const DATE_FORMAT_OPTIONS = [
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

export const TIME_FORMAT_OPTIONS = [
  {
    label: 'hh:mm A',
    value: 'hh:mm A',
  },
  {
    label: 'h:mm A',
    value: 'h:mm A',
  },
  {
    label: 'HH:mm',
    value: 'HH:mm',
  },
  {
    label: 'H:mm',
    value: 'H:mm',
  },
];

export const TIMEZONE_OPTIONS = [
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

export const TIMEZONE_OPTIONS_MAP = TIMEZONE_OPTIONS.reduce((acc, curr) => {
  acc[curr.name] = curr.value;
  return acc;
}, {});

const DatetimePickerV2 = ({ componentMeta, componentName, darkMode, ...restProps }) => {
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
  const { moduleId } = useModuleContext();
  const items = [];
  const additionalActions = [];
  const properties = [];
  const formatting = [];
  const validations = Object.keys(componentMeta.validation || {});
  const resolvedProperties = useStore((state) => state.getResolvedComponent(component.id, null, moduleId)?.properties);
  const isDateFormatFxOn = componentMeta?.definition?.properties?.dateFormat?.fxActive || false;
  const isTimeFormatFxOn = componentMeta?.definition?.properties?.timeFormat?.fxActive || false;
  const dateFormat = resolvedProperties?.dateFormat ?? resolvedProperties?.format;
  const timeFormat = resolvedProperties?.timeFormat;
  const isTimezoneEnabled = resolvedProperties?.isTimezoneEnabled;
  const displayTimezone = resolvedProperties?.displayTimezone;
  const storeTimezone = resolvedProperties?.storeTimezone;

  const dateValidator = useMemo(() => {
    return (date) => {
      if (typeof date !== 'string')
        return [false, [`Expected a value of type string, but received ${typeof date}`], date];
      if (!date) return [true, null, date];

      const isValid = moment(date, dateFormat, true).isValid();
      console.log('date', date, isValid);

      return [isValid, isValid ? null : [`Invalid date. Expected date format: ${dateFormat}`], date];
    };
  }, [dateFormat]);

  const timeValidator = useMemo(() => {
    return (time) => {
      if (typeof time !== 'string')
        return [false, [`Expected a value of type string, but received ${typeof time}`], time];
      if (!time) return [true, null, time];
      const isValid = moment(time, timeFormat, true).isValid();
      return [isValid, isValid ? null : [`Invalid time. Expected time format: ${timeFormat}`], time];
    };
  }, [timeFormat]);

  const dateArrayValidator = useMemo(() => {
    return (date) => {
      if (!Array.isArray(date)) return [false, [`Expected a value of type array, but received ${typeof date}`], date];
      else if (!date) return [true, null, date];
      const isValid = date.every((d) => moment(d, dateFormat, true).isValid());
      return [isValid, isValid ? null : [`Invalid format. Expected date format: ${dateFormat}`], date];
    };
  }, [dateFormat]);

  const getDynamicPlaceholder = (property) => {
    const dynamicType = componentMeta.validation?.[property]?.dynamicType;
    switch (dynamicType) {
      case 'date':
        return dateFormat;
      case 'time':
        return timeFormat;
      case 'arrayDate':
        return ``;
      default:
        return componentMeta.validation?.[property]?.placeholder;
    }
  };

  const getDynamicDateValidator = (property) => {
    const dynamicType = componentMeta.validation?.[property]?.dynamicType;
    switch (dynamicType) {
      case 'date':
        return dateValidator;
      case 'time':
        return timeValidator;
      case 'arrayDate':
        return dateArrayValidator;
      default:
        return () => {
          return [true, null, null];
        };
    }
  };

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'formatting') {
      formatting.push(key);
    } else {
      properties.push(key);
    }
  }

  const timeFormatSection = () => {
    return (
      <div className="field mb-2 input-date-time-format" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between mb-1">
          <label className="form-label"> Time Format</label>
          <div className={cx({ 'hide-fx': !isTimeFormatFxOn })}>
            <FxButton
              active={isTimeFormatFxOn}
              onPress={() => {
                paramUpdated({ name: 'timeFormat' }, 'fxActive', !isTimeFormatFxOn, 'properties');
              }}
            />
          </div>
        </div>
        {isTimeFormatFxOn ? (
          <CodeHinter
            initialValue={timeFormat}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            onChange={(value) => paramUpdated({ name: 'timeFormat' }, 'value', value, 'properties')}
          />
        ) : (
          <Select
            options={TIME_FORMAT_OPTIONS}
            value={timeFormat ?? 'HH:mm'}
            search={true}
            closeOnSelect={true}
            onChange={(value) => {
              paramUpdated({ name: 'timeFormat' }, 'value', value, 'properties');
            }}
            fuzzySearch
            placeholder="Select.."
            useCustomStyles={true}
            styles={styles(darkMode, '100%', 32, { fontSize: '12px' })}
          />
        )}
      </div>
    );
  };

  if (['TimePicker'].includes(componentName)) {
    // I want my timeFormat section to be the 2nd property in the properties array and then the rest of the properties
    const transformedProperties = [...properties.slice(0, 1), 'timeFormat', ...properties.slice(1)];

    items.push({
      title: 'Data',
      isOpen: true,
      children: (
        <>
          {transformedProperties?.map((property) => {
            if (property === 'timeFormat') {
              return timeFormatSection();
            }
            return renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              property,
              'properties',
              currentState,
              allComponents,
              darkMode
            );
          })}

        </>
      ),
    });
  } else {
    items.push({
      title: 'Data',
      isOpen: true,
      children: (
        <>
          {properties?.map((property) => {
            if (['isTimezoneEnabled', 'customDateFormat'].includes(property)) {
              return (
                <>
                  <div
                    data-cy={`input-date-display-format`}
                    className="field mb-2 w-100 input-date-display-format"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="field mb-2" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex justify-content-between mb-1">
                        <label className="form-label"> Date Format</label>
                        <div
                          className={cx({
                            'hide-fx': !isDateFormatFxOn,
                          })}
                        >
                          <FxButton
                            active={isDateFormatFxOn}
                            onPress={() => {
                              paramUpdated({ name: 'dateFormat' }, 'fxActive', !isDateFormatFxOn, 'properties');
                            }}
                          />
                        </div>
                      </div>
                      {isDateFormatFxOn ? (
                        <CodeHinter
                          initialValue={dateFormat}
                          theme={darkMode ? 'monokai' : 'default'}
                          mode="javascript"
                          lineNumbers={false}
                          onChange={(value) => paramUpdated({ name: 'dateFormat' }, 'value', value, 'properties')}
                        />
                      ) : (
                        <Select
                          options={DATE_FORMAT_OPTIONS}
                          value={dateFormat ?? 'DD/MM/YYYY'}
                          search={true}
                          closeOnSelect={true}
                          onChange={(value) => {
                            paramUpdated({ name: 'dateFormat' }, 'value', value, 'properties');
                          }}
                          fuzzySearch
                          placeholder="Select.."
                          useCustomStyles={true}
                          styles={styles(darkMode, '100%', 32, { fontSize: '12px' })}
                        />
                      )}
                    </div>
                  </div>
                  {!['DatePickerV2'].includes(componentName) && (
                    <>
                      {timeFormatSection()}

                      {renderElement(
                        component,
                        componentMeta,
                        paramUpdated,
                        dataQueries,
                        'isTimezoneEnabled',
                        'properties',
                        currentState,
                        allComponents,
                        darkMode
                      )}

                      {isTimezoneEnabled && (
                        <div style={{ paddingLeft: '16px', borderLeft: '1px solid #E4E7EB' }}>
                          <div
                            data-cy={`input-display-time-zone`}
                            className="field mb-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label data-cy={`label-display-time-zone`} className="form-label">
                              Display in
                            </label>
                            <Select
                              options={TIMEZONE_OPTIONS}
                              value={displayTimezone || 'UTC'}
                              search={true}
                              closeOnSelect={true}
                              onChange={(value) => {
                                paramUpdated({ name: 'displayTimezone' }, 'value', value, 'properties');
                              }}
                              fuzzySearch
                              placeholder="Select.."
                              useCustomStyles={true}
                              styles={styles(darkMode, '100%', 32, { fontSize: '12px' })}
                            />
                          </div>
                          <div
                            data-cy={`input-display-time-zone`}
                            className="field mb-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label data-cy={`label-display-time-zone`} className="form-label">
                              Store in
                            </label>
                            <Select
                              options={TIMEZONE_OPTIONS}
                              value={storeTimezone || 'UTC'}
                              search={true}
                              closeOnSelect={true}
                              onChange={(value) => {
                                paramUpdated({ name: 'storeTimezone' }, 'value', value, 'properties');
                              }}
                              fuzzySearch
                              placeholder="Select.."
                              useCustomStyles={true}
                              styles={styles(darkMode, '100%', 32, { fontSize: '12px' })}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            }

            return renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              property,
              'properties',
              currentState,
              allComponents,
              darkMode
            );
          })}
        </>
      ),
    });
  }

  // if (componentName !== 'DaterangePicker') {
  //   items.push({
  //     title: 'Formatting',
  //     isOpen: true,
  //     children: (

  //     ),
  //   });
  // }

  items.push({
    title: 'Events',
    isOpen: true,
    children: (
      <EventManager
        sourceId={component?.id}
        eventSourceType="component"
        eventMetaDefinition={componentMeta}
        darkMode={darkMode}
      />
    ),
  });

  items.push({
    title: 'Validation',
    isOpen: true,
    children: (
      <>
        {validations.map((property, index) => (
          <div
            key={index}
            className={'date-validation-wrapper'}
            style={{
              height: index + 1 < validations.length ? '62px' : '22px',
            }}
          >
            {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              property,
              'validation',
              currentState,
              allComponents,
              darkMode,
              getDynamicPlaceholder(property),
              getDynamicDateValidator(property)
            )}
          </div>
        ))}
      </>
    ),
  });

  items.push({
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
        {Object.keys(componentMeta.others).map((key) =>
          renderElement(
            component,
            componentMeta,
            layoutPropertyChanged,
            dataQueries,
            key,
            'others',
            currentState,
            allComponents
          )
        )}
      </>
    ),
  });

  return <Accordion items={items} />;
};

export default DatetimePickerV2;
