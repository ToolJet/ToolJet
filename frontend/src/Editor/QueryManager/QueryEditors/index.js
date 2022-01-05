import React from 'react';

import DynamicForm from '@/_components/DynamicForm';

import { allOperations } from '@gandharv99/tooljet-plugins/client';

import { Restapi } from './Restapi';
import { Runjs } from './Runjs';
import { Stripe } from './Stripe';

export const allSources = {
  ...Object.keys(allOperations).reduce((accumulator, currentValue) => {
    accumulator[currentValue] = ({ ...rest }) => <DynamicForm schema={allOperations[currentValue]} {...rest} />;
    return accumulator;
  }, {}),
  Restapi,
  Runjs,
  Stripe,
};
