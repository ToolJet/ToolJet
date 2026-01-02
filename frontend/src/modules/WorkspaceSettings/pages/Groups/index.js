export { default } from './ManageGroupPermissionsPage';

export const RESOURCE_TYPE = {
  APPS: 'app',
  DATA_SOURCES: 'data_source',
  WORKFLOWS: 'workflow',
};

export const APP_TYPES = {
  FRONT_END: 'front-end',
  WORKFLOW: 'workflow',
};

export const RESOURCE_NAME_MAPPING = {
  [RESOURCE_TYPE.APPS]: 'Apps',
  [RESOURCE_TYPE.DATA_SOURCES]: 'Data Sources',
  [RESOURCE_TYPE.WORKFLOWS]: 'Workflows',
};
