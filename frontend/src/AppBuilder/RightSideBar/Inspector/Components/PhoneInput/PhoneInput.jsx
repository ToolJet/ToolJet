import React, { useMemo, useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { baseComponentProperties } from '../DefaultComponent';
import Select from '@/_ui/Select';
import useStore from '@/AppBuilder/_stores/store';
import { countries } from './en';
import { getCountries } from 'react-phone-number-input/input';
import en from 'react-phone-number-input/locale/en';
import flags from 'react-phone-number-input/flags';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import cx from 'classnames';

export const PhoneInput = ({ componentMeta, darkMode, ...restProps }) => {
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
  const resolvedProperties = useStore((state) => state.getResolvedComponent(component.id)?.properties);
  const defaultCountry = resolvedProperties?.defaultCountry;
  const isDefaultCountryFxOn = componentMeta?.definition?.properties?.dateFormat?.fxActive || false;

  const options = useMemo(
    () =>
      getCountries().map((country) => ({
        label: `${en[country]}`,
        value: country,
      })),
    []
  );

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
          <label className="form-label"> Default Country</label>
          <div
            className={cx({
              'hide-fx': !isDefaultCountryFxOn,
            })}
          >
            <FxButton
              active={isDefaultCountryFxOn}
              onPress={() => {
                paramUpdated({ name: 'dateFormat' }, 'fxActive', !isDefaultCountryFxOn, 'properties');
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

  const filteredProperties = properties.filter(
    (property) => componentMeta.properties[property].section !== 'additionalActions'
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

  accordionItems[0].children.splice(3, 0, getCountryDropdown());

  return <Accordion items={accordionItems} />;
};
