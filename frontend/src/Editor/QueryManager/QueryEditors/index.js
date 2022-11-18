import React from 'react';
import DynamicForm from '@/_components/DynamicForm';

// eslint-disable-next-line import/no-unresolved
import { allOperations } from '@tooljet/plugins/client';

import { Restapi } from './Restapi';
import { Runjs } from './Runjs';
import { Stripe } from './Stripe';
import { Openapi } from './Openapi';
import defaultStyles from '@/_ui/Select/styles';

const computeSelectStyles = (width) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return {
    ...defaultStyles(darkMode, width),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    menuList: (base) => ({
      ...base,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#11181C',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#11181C',
    }),
    option: (provided) => ({
      ...provided,
      fontSize: '12px',
      cursor: 'pointer',
      backgroundColor: darkMode ? '#2b3547' : '#fff',
      color: darkMode ? '#fff' : '#11181C',
      ':hover': {
        backgroundColor: darkMode ? '#323C4B' : '#F8FAFF',
      },
    }),
    control: (provided) => ({
      ...provided,
      boxShadow: 'none',
      backgroundColor: darkMode ? '#2b3547' : '#ffffff',
      borderRadius: '6px',
      height: 32,
      minHeight: 32,
      borderWidth: '1px',
      '&:hover': {
        backgroundColor: darkMode ? '' : '#F8F9FA',
      },
      '&:focus-within': {
        backgroundColor: darkMode ? '' : '#F8FAFF',
        borderColor: '#3E63DD',
        borderWidth: '1px 1px 1px 1px',
      },
    }),
  };
};

export const allSources = {
  ...Object.keys(allOperations).reduce((accumulator, currentValue) => {
    accumulator[currentValue] = (props) => (
      <div className="query-editor-dynamic-form-container">
        <DynamicForm schema={allOperations[currentValue]} {...props} computeSelectStyles={computeSelectStyles} />
      </div>
    );
    return accumulator;
  }, {}),
  Restapi,
  Runjs,
  Stripe,
  Openapi,
};

export const source = (props) => (
  <div className="query-editor-dynamic-form-container">
    <DynamicForm schema={props.pluginSchema} {...props} computeSelectStyles={computeSelectStyles} />
  </div>
);
