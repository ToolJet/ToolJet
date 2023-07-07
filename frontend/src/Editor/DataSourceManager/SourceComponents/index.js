import React from 'react';
import DynamicForm from '@/_components/DynamicForm';
import RunjsSchema from './Runjs.schema.json';
import TooljetDbSchema from '../../QueryManager/QueryEditors/TooljetDatabase/manifest.json';
import RunpySchema from './Runpy.schema.json';

// eslint-disable-next-line import/no-unresolved
import { allManifests } from '@tooljet/plugins/client';

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

export const OtherSources = [RunjsSchema.source, RunpySchema.source, TooljetDbSchema.source];
export const DataSourceTypes = [...DataBaseSources, ...ApiSources, ...CloudStorageSources, ...OtherSources];

export const SourceComponents = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  accumulator[currentValue] = (props) => <DynamicForm schema={allManifests[currentValue]} isGDS={true} {...props} />;
  return accumulator;
}, {});

export const SourceComponent = (props) => <DynamicForm schema={props.dataSourceSchema} isGDS={true} {...props} />;
