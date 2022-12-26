import React from 'react';
import DynamicForm from '@/_components/DynamicForm';

// eslint-disable-next-line import/no-unresolved
import { allOperations } from '@tooljet/plugins/client';
import { Restapi } from './Restapi';
import { Runjs } from './Runjs';
import { Stripe } from './Stripe';
import { Openapi } from './Openapi';
import tooljetDbOperations from './TooljetDatabase/operations.json';

import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';

const computeSelectStyles = (width) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return queryManagerSelectComponentStyle(darkMode, width);
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
  Tooljetdb: (props) => <DynamicForm schema={tooljetDbOperations} {...props} />,
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
