import React from 'react';
import DynamicForm from '@/_components/DynamicForm';

// eslint-disable-next-line import/no-unresolved
import { allOperations } from '@tooljet/plugins/client';

import { Restapi } from './Restapi';
import { Runjs } from './Runjs';
import { Stripe } from './Stripe';
import { Openapi } from './Openapi';

export const allSources = {
  ...Object.keys(allOperations).reduce((accumulator, currentValue) => {
    accumulator[currentValue] = (props) => <DynamicForm schema={allOperations[currentValue]} {...props} />;
    return accumulator;
  }, {}),
  Restapi,
  Runjs,
  Stripe,
  Openapi,
};

export const source = (props) => <DynamicForm schema={props.pluginSchema} {...props} />;
