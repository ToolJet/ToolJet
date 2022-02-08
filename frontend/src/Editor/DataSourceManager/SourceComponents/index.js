import React from 'react';

import DynamicForm from '@/_components/DynamicForm';

import { allManifests } from '@tooljet/plugins/client';

import RunjsSchema from './Runjs.schema.json';

export const DataBaseSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (allManifests[currentValue].type === 'database') accumulator.push(allManifests[currentValue].source);
  return accumulator;
}, []);
export const ApiSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (allManifests[currentValue].type === 'api') accumulator.push(allManifests[currentValue].source);
  return accumulator;
}, []);
export const CloudStorageSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (allManifests[currentValue].type === 'cloud-storage') accumulator.push(allManifests[currentValue].source);
  return accumulator;
}, []);

export const OtherSources = [RunjsSchema.source];
export const DataSourceTypes = [...DataBaseSources, ...ApiSources, ...CloudStorageSources, ...OtherSources];

export const SourceComponents = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  accumulator[currentValue] = (props) => <DynamicForm schema={allManifests[currentValue]} {...props} />;
  return accumulator;
}, {});
