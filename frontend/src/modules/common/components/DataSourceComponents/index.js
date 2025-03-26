import React from 'react';
import DynamicForm from '@/_components/DynamicForm';
import DynamicFormV2 from '@/_components/DynamicFormV2';
import RunjsSchema from './Runjs.schema.json';
import TooljetDbSchema from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/manifest.json';
import RunpySchema from './Runpy.schema.json';
import WorkflowsSchema from './Workflows.schema.json';

// eslint-disable-next-line import/no-unresolved
import { allManifests } from '@tooljet/plugins/client';
import DataSourceSchemaManager from '@/_helpers/dataSourceSchemaManager';

const getSchemaDetailsForRender = (schema) => {
  if (schema['tj:version']) {
    const dsm = new DataSourceSchemaManager(schema);
    const initialSourceValues = dsm.getDefaults();
    return {
      name: schema['tj:source'].name,
      kind: schema['tj:source'].kind,
      type: schema['tj:source'].type,
      options: initialSourceValues,
      defaults: initialSourceValues, // can deprecate since we use options to fill defaults too?
    };
  }

  const _source = schema.source;
  const def = schema.defaults ?? {};

  return { ..._source, defaults: def };
};

const getSchemaMetadata = (schema, key) => {
  if (schema['tj:version']) return schema['tj:source'][key];
  // Need to depreciate old schema format
  if (key === 'type') return schema.type;
  return schema.source[key];
};

//Commonly Used DS
export const CommonlyUsedDataSources = Object.keys(allManifests)
  .reduce((accumulator, currentValue) => {
    const sourceName = getSchemaMetadata(allManifests[currentValue], 'name');
    if (
      sourceName === 'REST API' ||
      sourceName === 'MongoDB' ||
      sourceName === 'Airtable' ||
      sourceName === 'Google Sheets' ||
      sourceName === 'PostgreSQL'
    ) {
      accumulator.push(getSchemaDetailsForRender(allManifests[currentValue]));
    }

    return accumulator;
  }, [])
  .sort((a, b) => {
    const order = ['REST API', 'PostgreSQL', 'Google Sheets', 'Airtable', 'MongoDB'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

export const DataBaseSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (getSchemaMetadata(allManifests[currentValue], 'type') === 'database') {
    accumulator.push(getSchemaDetailsForRender(allManifests[currentValue]));
  }

  return accumulator;
}, []);

export const ApiSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (getSchemaMetadata(allManifests[currentValue], 'type') === 'api') {
    accumulator.push(getSchemaDetailsForRender(allManifests[currentValue]));
  }

  return accumulator;
}, []);
export const CloudStorageSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (getSchemaMetadata(allManifests[currentValue], 'type') === 'cloud-storage') {
    accumulator.push(getSchemaDetailsForRender(allManifests[currentValue]));
  }

  return accumulator;
}, []);

export const OtherSources = [RunjsSchema.source, RunpySchema.source, TooljetDbSchema.source, WorkflowsSchema.source];
export const DataSourceTypes = [
  ...DataBaseSources,
  ...ApiSources,
  ...CloudStorageSources,
  ...OtherSources,
  ...CommonlyUsedDataSources,
];

export const SourceComponents = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  accumulator[currentValue] = (props) => {
    const schema = allManifests[currentValue];

    if (schema['tj:version']) {
      return <DynamicFormV2 schema={schema} isGDS={true} {...props} />;
    }

    return <DynamicForm schema={schema} isGDS={true} {...props} />;
  };
  return accumulator;
}, {});

export const SourceComponent = (props) => {
  const schema = props.dataSourceSchema;

  if (schema['tj:version']) {
    return <DynamicFormV2 schema={schema} isGDS={true} {...props} />;
  }

  return <DynamicForm schema={schema} isGDS={true} {...props} />;
};
