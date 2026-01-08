import React from 'react';
import DynamicForm from '@/_components/DynamicForm';
import DynamicFormV2 from '@/_components/DynamicFormV2';
import RunjsSchema from './Runjs.schema.json';
import TooljetDbSchema from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/manifest.json';
import RunpySchema from './Runpy.schema.json';
import WorkflowsSchema from './Workflows.schema.json';

// eslint-disable-next-line import/no-unresolved
import { allManifests, loadExtendedDatasources } from '@tooljet/plugins/client';
import DataSourceSchemaManager from '@/_helpers/dataSourceSchemaManager';

// State to track if extended datasources are loaded
let currentManifests = { ...allManifests };
let extendedLoaded = false;

export const getSchemaDetailsForRender = (schema) => {
  if (schema['tj:version']) {
    const dsm = new DataSourceSchemaManager(schema);
    const initialSourceValues = dsm.getDefaults();
    return {
      name: schema['tj:source'].name,
      kind: schema['tj:source'].kind,
      type: schema['tj:source'].type,
      options: initialSourceValues,
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

export const OtherSources = [RunjsSchema.source, RunpySchema.source, TooljetDbSchema.source, WorkflowsSchema.source];

// Function to recompute datasource categories from current manifests
function computeCategories(manifests) {
  const databases = Object.keys(manifests).reduce((acc, key) => {
    if (getSchemaMetadata(manifests[key], 'type') === 'database') {
      acc.push(getSchemaDetailsForRender(manifests[key]));
    }
    return acc;
  }, []);

  const apis = Object.keys(manifests).reduce((acc, key) => {
    if (getSchemaMetadata(manifests[key], 'type') === 'api') {
      acc.push(getSchemaDetailsForRender(manifests[key]));
    }
    return acc;
  }, []);

  const cloudStorage = Object.keys(manifests).reduce((acc, key) => {
    if (getSchemaMetadata(manifests[key], 'type') === 'cloud-storage') {
      acc.push(getSchemaDetailsForRender(manifests[key]));
    }
    return acc;
  }, []);

  const commonlyUsed = Object.keys(manifests).reduce((acc, key) => {
    const sourceName = getSchemaMetadata(manifests[key], 'name');
    if (
      sourceName === 'REST API' ||
      sourceName === 'MongoDB' ||
      sourceName === 'Airtable' ||
      sourceName === 'Google Sheets' ||
      sourceName === 'PostgreSQL'
    ) {
      acc.push(getSchemaDetailsForRender(manifests[key]));
    }
    return acc;
  }, []).sort((a, b) => {
    const order = ['REST API', 'PostgreSQL', 'Google Sheets', 'Airtable', 'MongoDB'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  return { databases, apis, cloudStorage, commonlyUsed };
}

// Initial categories from core manifests
let categories = computeCategories(allManifests);

// Load extended datasources and update categories
export async function loadAllDatasources() {
  if (extendedLoaded) {
    return currentManifests;
  }

  const extended = await loadExtendedDatasources();

  // Merge extended manifests into current
  currentManifests = {
    ...currentManifests,
    ...extended.manifests,
  };

  // Recompute categories with all manifests
  categories = computeCategories(currentManifests);

  // Update exported variables
  DataBaseSources.length = 0;
  DataBaseSources.push(...categories.databases);

  ApiSources.length = 0;
  ApiSources.push(...categories.apis);

  CloudStorageSources.length = 0;
  CloudStorageSources.push(...categories.cloudStorage);

  CommonlyUsedDataSources.length = 0;
  CommonlyUsedDataSources.push(...categories.commonlyUsed);

  // Update DataSourceTypes
  DataSourceTypes.length = 0;
  DataSourceTypes.push(...categories.databases, ...categories.apis, ...categories.cloudStorage, ...OtherSources, ...categories.commonlyUsed);

  extendedLoaded = true;

  return currentManifests;
}

// Export dynamic accessors that return current categories
export const getDataBaseSources = () => categories.databases;
export const getApiSources = () => categories.apis;
export const getCloudStorageSources = () => categories.cloudStorage;
export const getCommonlyUsedDataSources = () => categories.commonlyUsed;

// Export static versions for backwards compatibility (will only have core datasources initially)
// These will be mutated in place when extended datasources load
export const DataBaseSources = [...categories.databases];
export const ApiSources = [...categories.apis];
export const CloudStorageSources = [...categories.cloudStorage];
export const CommonlyUsedDataSources = [...categories.commonlyUsed];

export const DataSourceTypes = [
  ...DataBaseSources,
  ...ApiSources,
  ...CloudStorageSources,
  ...OtherSources,
  ...CommonlyUsedDataSources,
];

// Dynamic function to get all current manifests
export const getAllManifests = () => currentManifests;

export const SourceComponents = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  accumulator[currentValue] = (props) => {
    const schema = currentManifests[currentValue] || allManifests[currentValue];

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
