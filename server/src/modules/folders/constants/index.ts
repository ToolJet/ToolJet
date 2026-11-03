import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

export enum FEATURE_KEY {
  CREATE_FOLDER = 'CREATE_FOLDER',
  UPDATE_FOLDER = 'UPDATE_FOLDER',
  DELETE_FOLDER = 'DELETE_FOLDER',
}

// Folder `type` value for data-source folders. App folders use APP_TYPES values
// ('front-end' / 'workflow' / 'module'); data sources are NOT an app type, so their folder type
// is defined here rather than polluting APP_TYPES (which drives app creation/versioning logic).
export const DATA_SOURCE_FOLDER_TYPE = 'data_source';

// folder.type → the delete-permission key and MODULES bucket that gate its folders. Front-end
// folders fall through to folderDelete / MODULES.FOLDER. Add an entry here (not another ternary
// arm) when a new folder-owning resource type is introduced.
export const FOLDER_PERMISSION_BY_TYPE: Partial<
  Record<
    string,
    { deleteKey: 'workflowFolderDelete' | 'moduleFolderDelete' | 'dataSourceFolderDelete'; resourceType: MODULES }
  >
> = {
  [APP_TYPES.WORKFLOW]: { deleteKey: 'workflowFolderDelete', resourceType: MODULES.WORKFLOW_FOLDER },
  [APP_TYPES.MODULE]: { deleteKey: 'moduleFolderDelete', resourceType: MODULES.MODULE_FOLDER },
  [DATA_SOURCE_FOLDER_TYPE]: { deleteKey: 'dataSourceFolderDelete', resourceType: MODULES.DATA_SOURCE_FOLDER },
};
