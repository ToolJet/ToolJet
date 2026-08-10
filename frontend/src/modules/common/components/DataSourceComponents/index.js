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

const commonlyUsedSourceNames = [
  'REST API',
  'MongoDB',
  'Google Sheets 2.0',
  'PostgreSQL',
  'Snowflake',
  'GraphQL',
  'OpenAPI',
  'gRPC 2.0',
  'Databricks',
  'AWS S3',
];

const getInstalledPluginId = (plugin) => `${plugin?.pluginId || plugin?.plugin_id || plugin?.id || ''}`.toLowerCase();

export const getCommonlyUsedDataSources = (installedPlugins = []) => {
  const builtInSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
    const sourceName = getSchemaMetadata(allManifests[currentValue], 'name');
    if (commonlyUsedSourceNames.includes(sourceName)) {
      accumulator.push(getSchemaDetailsForRender(allManifests[currentValue]));
    }
    return accumulator;
  }, []);

  // OpenAI isn't a manifest-based source — it only exists as an installed plugin.
  // Pull it from the real installed plugins list instead of allManifests.
  const openAIPlugin = (installedPlugins || []).find((p) => getInstalledPluginId(p) === 'openai');
  const installedOpenAISource = openAIPlugin ? [openAIPlugin] : [];

  return [...builtInSources, ...installedOpenAISource].sort((a, b) => {
    const order = [
      'REST API',
      'PostgreSQL',
      'Google Sheets 2.0',
      'MongoDB',
      'Snowflake',
      'GraphQL',
      'OpenAPI',
      'gRPC 2.0',
      'Databricks',
      'AWS S3',
      'OpenAI',
    ];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });
};

export const CommonlyUsedDataSources = getCommonlyUsedDataSources();

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

export const AiSources = Object.keys(allManifests).reduce((accumulator, currentValue) => {
  if (getSchemaMetadata(allManifests[currentValue], 'type') === 'ai') {
    accumulator.push(getSchemaDetailsForRender(allManifests[currentValue]));
  }

  return accumulator;
}, []);

export const OtherSources = [RunjsSchema.source, RunpySchema.source, TooljetDbSchema.source, WorkflowsSchema.source];
export const DataSourceTypes = [
  ...DataBaseSources,
  ...ApiSources,
  ...CloudStorageSources,
  ...AiSources,
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
