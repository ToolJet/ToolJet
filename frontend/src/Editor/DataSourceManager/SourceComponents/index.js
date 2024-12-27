import React from 'react';
import DynamicForm from '@/_components/DynamicForm';
import DynamicFormV2 from '@/_components/DynamicFormV2';
import RunjsSchema from './Runjs.schema.json';
import TooljetDbSchema from '../../QueryManager/QueryEditors/TooljetDatabase/manifest.json';
import RunpySchema from './Runpy.schema.json';

// eslint-disable-next-line import/no-unresolved
import { allManifests } from '@tooljet/plugins/client';

//Commonly Used DS

export const CommonlyUsedDataSources = Object.keys(allManifests)
  .reduce((accumulator, currentValue) => {
    const sourceName = allManifests[currentValue]?.source?.name;
    if (
      sourceName === 'REST API' ||
      sourceName === 'MongoDB' ||
      sourceName === 'Airtable' ||
      sourceName === 'Google Sheets' ||
      sourceName === 'PostgreSQL'
    ) {
      const _source = allManifests[currentValue].source;
      const def = allManifests[currentValue]?.defaults ?? {};
      accumulator.push({ ..._source, defaults: def });
    }

    return accumulator;
  }, [])
  .sort((a, b) => {
    const order = ['REST API', 'PostgreSQL', 'Google Sheets', 'Airtable', 'MongoDB'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

export const DataBaseSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (allManifests[currentValue].type === 'database') {
    const _source = allManifests[currentValue].source;
    const def = allManifests[currentValue]?.defaults ?? {};

    accumulator.push({ ..._source, defaults: def });
  }

  return accumulator;
}, []);
export const ApiSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (allManifests[currentValue].type === 'api') {
    const _source = allManifests[currentValue].source;
    const def = allManifests[currentValue]?.defaults ?? {};

    accumulator.push({ ..._source, defaults: def });
  }

  return accumulator;
}, []);
export const CloudStorageSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (allManifests[currentValue].type === 'cloud-storage') {
    const _source = allManifests[currentValue].source;
    const def = allManifests[currentValue]?.defaults ?? {};

    accumulator.push({ ..._source, defaults: def });
  }

  return accumulator;
}, []);

export const OtherSources = [RunjsSchema.source, RunpySchema.source, TooljetDbSchema.source];
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

    if (schema.version) {
      return <DynamicFormV2 schema={schema} isGDS={true} {...props} />;
    }

    return <DynamicForm schema={schema} isGDS={true} {...props} />;
  };
  return accumulator;
}, {});

export const SourceComponent = (props) => <DynamicForm schema={props.dataSourceSchema} isGDS={true} {...props} />;

export const FetchManifest = (dataSourceName) => {
  const manifestKey = Object.keys(allManifests).filter((id) => dataSourceName === id.toLowerCase());
  if (manifestKey) return allManifests[manifestKey];
};