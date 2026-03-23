import { ResourceType } from './index';

export const DEFAULT_GRANULAR_PERMISSIONS_NAME = {
  [ResourceType.APP]: 'Apps',
  [ResourceType.DATA_SOURCE]: 'Data sources',
  [ResourceType.WORKFLOWS]: 'Workflows',
  [ResourceType.FOLDER]: 'Folders',
  [ResourceType.DATA_SOURCE_FOLDER]: 'Data source folders',
};
