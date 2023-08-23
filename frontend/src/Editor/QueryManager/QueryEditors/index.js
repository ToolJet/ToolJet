import React from 'react';
import DynamicForm from '@/_components/DynamicForm';

import { allOperations } from '@tooljet/plugins/client';
import { Restapi } from './Restapi';
// eslint-disable-next-line import/no-unresolved
import { Runjs } from './Runjs';
import { Runpy } from './Runpy';
import { Stripe } from './Stripe';
import { Openapi } from './Openapi';
import Grpc from './GRPC';
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
        <DynamicForm
          schema={allOperations[currentValue]}
          {...props}
          computeSelectStyles={computeSelectStyles}
          layout="horizontal"
        />
      </div>
    );
    return accumulator;
  }, {}),
  Tooljetdb: (props) => (
    <DynamicForm
      schema={tooljetDbOperations}
      {...props}
      layout="horizontal"
    />
  ),
  Restapi,
  Runjs,
  Runpy,
  Stripe,
  Openapi,
  Grpc,
};

export const source = (props) => (
  <div className="query-editor-dynamic-form-container">
    <DynamicForm
      schema={props.pluginSchema}
      {...props}
      computeSelectStyles={computeSelectStyles}
      layout="horizontal"
    />
  </div>
);
