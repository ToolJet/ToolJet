import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

export enum FEATURE_KEY {
  CREATE_FOLDER = 'CREATE_FOLDER',
  UPDATE_FOLDER = 'UPDATE_FOLDER',
  DELETE_FOLDER = 'DELETE_FOLDER',
}

// App type → the delete-permission key and MODULES bucket that gate its folders.
// Add an entry here (not another ternary arm) when a new folder-owning app type is introduced.
export const FOLDER_PERMISSION_BY_APP_TYPE: Partial<
  Record<APP_TYPES, { deleteKey: 'workflowFolderDelete' | 'moduleFolderDelete'; resourceType: MODULES }>
> = {
  [APP_TYPES.WORKFLOW]: { deleteKey: 'workflowFolderDelete', resourceType: MODULES.WORKFLOW_FOLDER },
  [APP_TYPES.MODULE]: { deleteKey: 'moduleFolderDelete', resourceType: MODULES.MODULE_FOLDER },
};
