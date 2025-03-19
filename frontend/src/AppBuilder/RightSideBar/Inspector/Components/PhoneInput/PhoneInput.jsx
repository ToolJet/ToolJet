import React, { useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { baseComponentProperties } from '../DefaultComponent';
import Select from '@/_ui/Select';
import useStore from '@/AppBuilder/_stores/store';
import { countries } from './en';

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
  const defaultCountry = resolvedProperties?.defaultCountry || 'None';

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

    return (
      <div style={optionStyle} className={`selectedOption  ${optionValue !== 'none' && 'custom-phone-input-options'}`}>
        <div style={{ width: '25px', height: '16px' }} className={`flag ${optionValue}`}></div>
        {label}
      </div>
    );
  };

  const getCountryDropdown = () => {
    return (
      <div className="mb-2">
        <label class="tj-text-xsm color-slate12 mb-2 false">Default country</label>
        <Select
          width="100%"
          options={countries}
          value={defaultCountry}
          customOption={renderCustomOption}
          onChange={(value) => {
            console.log('value', value);
            paramUpdated({ name: 'defaultCountry' }, 'value', value, 'properties');
          }}
        />
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
