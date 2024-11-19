import React from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../Utils';
import { EventManager } from '../EventManager';
import Select from '@/_ui/Select';
import CodeHinter from '@/AppBuilder/CodeEditor';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import useStore from '@/AppBuilder/_stores/store';
import styles from '@/_ui/Select/styles';

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

const DatepickerV2 = ({ componentMeta, darkMode, ...restProps }) => {
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
  const items = [];
  const additionalActions = [];
  const properties = [];
  const customProperties = [];
  const innerCustom = [];
  const validations = Object.keys(componentMeta.validation || {});
  const resolvedProperties = useStore((state) => state.getResolvedComponent(component.id)?.properties);
  const isDateSelectionEnabled = resolvedProperties?.isDateSelectionEnabled;
  const isTimeSelectionEnabled = resolvedProperties?.isTimeSelectionEnabled;
  const isDateDisplayFormatFxOn = componentMeta?.definition?.properties?.dateFormat?.fxActive || false;
  const dateFormat = resolvedProperties?.dateFormat;
  const timeFormat = resolvedProperties?.timeFormat;
  const timezoneInterval = resolvedProperties?.timezoneInterval;

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'custom') {
      customProperties.push(key);
    } else if (componentMeta?.properties[key]?.section === 'innerCustom') {
      innerCustom.push(key);
    } else {
      properties.push(key);
    }
  }
  console.log('resolvedProperties', resolvedProperties);
  console.log('componentMeta', componentMeta);
  console.log('isDateTimeSelectionEnabled', isDateSelectionEnabled);
  items.push({
    title: 'Data',
    isOpen: true,
    children: (
      <>
        {properties?.map((property) =>
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            property,
            'properties',
            currentState,
            allComponents,
            darkMode
          )
        )}
        {customProperties?.map((property, index) => (
          <div
            className="grey-bg-section mb-2"
            style={{ background: 'var(--surfaces-surface-02)', padding: '12px 16px 4px 16px', borderRadius: '6px' }}
            key={index}
          >
            {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              property,
              'properties',
              currentState,
              allComponents,
              darkMode
            )}
            {property === 'isDateSelectionEnabled' && isDateSelectionEnabled && (
              <div
                data-cy={`input-date-display-format`}
                className="field mb-2 w-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="d-flex justify-content-between">
                  <label data-cy={`label-date-display-format`} className="form-label">
                    Date format
                  </label>
                  <span>
                    <FxButton
                      active={isDateDisplayFormatFxOn}
                      onPress={() => {
                        // let resultFxActiveFields = column?.notActiveFxActiveFields || [];
                        // let resultFxActiveFields = [];
                        // if (truth) {
                        //   resultFxActiveFields.push('dateFormat');
                        // } else {
                        //   resultFxActiveFields = resultFxActiveFields.filter((field) => field !== 'dateFormat');
                        // }
                        // paramUpdated(
                        //   { name: 'isDateSelectionEnabled' },
                        //   'fxActive',
                        //   !isDateDisplayFormatFxOn,
                        //   'properties'
                        // );
                        // setIsDateDisplayFormatFxOn(!isDateDisplayFormatFxOn);
                        // onColumnItemChange(index, 'notActiveFxActiveFields', resultFxActiveFields);
                        paramUpdated({ name: 'dateFormat' }, 'fxActive', !isDateDisplayFormatFxOn, 'properties');
                      }}
                    />
                  </span>
                </div>
                {isDateDisplayFormatFxOn ? (
                  <CodeHinter
                    initialValue={dateFormat}
                    theme={darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={false}
                    // placeholder={validation?.placeholder ?? ''}
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
                    styles={styles(darkMode, '100%')}
                  />
                )}
              </div>
            )}
            {property === 'isTimeSelectionEnabled' && isTimeSelectionEnabled && (
              <>
                {!isDateDisplayFormatFxOn && (
                  <div className="field mb-2" onClick={(e) => e.stopPropagation()}>
                    <label className="form-label"> Time Format</label>
                    <Select
                      options={[
                        {
                          label: 'HH:mm',
                          value: 'HH:mm',
                        },
                      ]}
                      value={timeFormat ?? 'HH:mm'}
                      search={true}
                      closeOnSelect={true}
                      onChange={(value) => {
                        paramUpdated({ name: 'timeFormat' }, 'value', value, 'properties');
                      }}
                      fuzzySearch
                      placeholder="Select.."
                      useCustomStyles={true}
                      styles={styles(darkMode, '100%')}
                    />
                  </div>
                )}
                <div>
                  {renderElement(
                    component,
                    componentMeta,
                    paramUpdated,
                    dataQueries,
                    'is24HourFormatEnabled',
                    'properties',
                    currentState,
                    allComponents,
                    darkMode
                  )}
                  {/* <ProgramaticallyHandleProperties
                    label="Enable 24 hr time format"
                    currentState={currentState}
                    index={index}
                    darkMode={darkMode}
                    // callbackFunction={onColumnItemChange}
                    property="isTwentyFourHrFormatEnabled"
                    // props={column}
                    component={component}
                    paramType="properties"
                    paramMeta={{ type: 'toggle', displayName: 'Enable 24 hr time format' }}
                  /> */}
                </div>

                <div data-cy={`input-display-time-zone`} className="field mb-2" onClick={(e) => e.stopPropagation()}>
                  <label data-cy={`label-display-time-zone`} className="form-label">
                    Time zone
                  </label>
                  <Select
                    options={TIMEZONE_OPTIONS}
                    value={timezoneInterval ?? 'UTC'}
                    search={true}
                    closeOnSelect={true}
                    onChange={(value) => {
                      paramUpdated({ name: 'timezoneInterval' }, 'value', value, 'properties');
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
        ))}
      </>
    ),
  });

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {validations.map((property) =>
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            property,
            'validation',
            currentState,
            allComponents,
            darkMode
          )
        )}
      </div>
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

export default DatepickerV2;
