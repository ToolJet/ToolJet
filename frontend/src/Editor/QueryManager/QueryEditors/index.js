import React from 'react';

import DynamicForm from '@/_components/DynamicForm';

import { allOperations } from '@tooljet/plugins/client';

import { Restapi } from './Restapi';
import { Runjs } from './Runjs';
import { Stripe } from './Stripe';

export const allSources = {
  ...Object.keys(allOperations).reduce((accumulator, currentValue) => {
    accumulator[currentValue] = (props) => <DynamicForm schema={allOperations[currentValue]} {...props} />;
    return accumulator;
  }, {}),
  Restapi,
  Runjs,
  Stripe,
};
