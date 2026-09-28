import React, { useMemo, useState } from 'react';
import Accordion from '@/AppBuilder/RightSideBar/Inspector/InspectorAccordion';
import { baseComponentProperties } from '../DefaultComponent';
import Select from '@/_ui/Select';
// eslint-disable-next-line import/no-unresolved
import flags from 'react-phone-number-input/flags';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import cx from 'classnames';
import { CurrencyMap, NUMBER_FORMATS } from '@/AppBuilder/Widgets/PhoneCurrency/constants';

export const CurrencyInput = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
  } = restProps;

  const properties = Object.keys(componentMeta.properties);
  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});
  const defaultCountry = componentMeta?.definition?.properties?.defaultCountry?.value || 'US';
  // This was `properties.dateFormat.fxActive`, a Datepicker key copied in here. The read and the
  // write used the same wrong key, so the toggle worked, but it stored a phantom `dateFormat`
  // property on every app that used it and never wrote the real one. Apps saved under the old
  // key are moved across by the MigrateDefaultCountryFxKey data migration, which is why no
  // fallback read is carried here.
  const isDefaultCountryFxOn = componentMeta?.definition?.properties?.defaultCountry?.fxActive || false;
  const isNumberFormatFxOn = componentMeta?.definition?.properties?.numberFormat?.fxActive || false;
  const numberFormat = componentMeta?.definition?.properties?.numberFormat?.value || 'us';

  const options = useMemo(() => {
    return Object.keys(CurrencyMap).map((country) => ({
      label: `${CurrencyMap[country].prefix} (${CurrencyMap[country].currency})`,
      value: country,
    }));
  }, []);

  const numberFormatOptions = useMemo(() => {
    return Object.entries(NUMBER_FORMATS).map(([value, { name }]) => ({ name, value }));
  }, []);

  const renderCustomOption = ({ label, value: optionValue }) => {
    const optionStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'start',
      height: '18px',
      gap: '6px',
      cursor: 'pointer',
      fontFamily: 'IBM Plex Sans',
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: '400',
      color: darkMode ? '#fff' : '#1B1F24',
    };
    const FlagIcon = flags[optionValue];

    return (
      <div style={optionStyle} className={`selectedOption  ${optionValue !== 'none' && 'custom-phone-input-options'}`}>
        <div>{FlagIcon ? <FlagIcon style={{ width: '22px', height: '16px' }} /> : null}</div>
        {label}
      </div>
    );
  };

  const getCountryDropdown = () => {
    return (
      <div className="mb-2">
        <div className="d-flex justify-content-between mb-1">
          <label className="form-label"> Default Currency</label>
          <div
            className={cx({
              'hide-fx': !isDefaultCountryFxOn,
            })}
          >
            <FxButton
              active={isDefaultCountryFxOn}
              onPress={() => {
                paramUpdated({ name: 'defaultCountry' }, 'fxActive', !isDefaultCountryFxOn, 'properties');
              }}
            />
          </div>
        </div>
        {isDefaultCountryFxOn ? (
          <CodeHinter
            initialValue={defaultCountry}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            onChange={(value) => paramUpdated({ name: 'defaultCountry' }, 'value', value, 'properties')}
          />
        ) : (
          <Select
            width="100%"
            options={options}
            value={defaultCountry}
            customOption={renderCustomOption}
            onChange={(value) => {
              paramUpdated({ name: 'defaultCountry' }, 'value', value, 'properties');
            }}
          />
        )}
      </div>
    );
  };

  const getNumberFormat = () => {
    return (
      <div className="mb-2">
        <div className="d-flex justify-content-between mb-1">
          <label className="form-label"> Number Format</label>
          <div
            className={cx({
              'hide-fx': !isNumberFormatFxOn,
            })}
          >
            <FxButton
              active={isNumberFormatFxOn}
              onPress={() => {
                paramUpdated({ name: 'numberFormat' }, 'fxActive', !isNumberFormatFxOn, 'properties');
              }}
            />
          </div>
        </div>
        {isNumberFormatFxOn ? (
          <CodeHinter
            initialValue={numberFormat}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            onChange={(value) => paramUpdated({ name: 'numberFormat' }, 'value', value, 'properties')}
          />
        ) : (
          <Select
            width="100%"
            options={numberFormatOptions}
            value={numberFormat}
            customOption={renderCustomOption}
            onChange={(value) => {
              paramUpdated({ name: 'numberFormat' }, 'value', value, 'properties');
            }}
          />
        )}
      </div>
    );
  };

  const filteredProperties = properties.filter(
    (property) => !['additionalActions', 'deprecatedStyles'].includes(componentMeta.properties[property].section)
  );

  const additionalActions = properties.filter(
    (property) => componentMeta.properties[property].section === 'additionalActions'
  );

  const accordionItems = baseComponentProperties(
    filteredProperties,
    events,
    component,
    componentMeta,
    layoutPropertyChanged,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    validations,
    darkMode,
    null,
    additionalActions
  );

  accordionItems[0].children.splice(4, 0, getCountryDropdown());
  accordionItems[0].children.splice(5, 0, getNumberFormat());

  return <Accordion items={accordionItems} />;
};
