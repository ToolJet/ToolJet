import React from 'react';
import { LayoutTemplate, Workflow, ToyBrick } from 'lucide-react';

import { authenticationService } from '@/_services/authentication.service';

export const appTypeToDisplayNameMapping = {
  'front-end': 'app',
  module: 'module',
  workflow: 'workflow',
} as const;

export type TAppType = keyof typeof appTypeToDisplayNameMapping;

type TStaticContentMappingByAppType = {
  [key in TAppType]: {
    title: string;
    description: string;
    emptyState: {
      icon: React.ReactNode;
      title: string;
      description: string;
    };
  };
};

export const staticContentMappingByAppType: TStaticContentMappingByAppType = {
  'front-end': {
    title: 'Applications',
    description: 'Build, organize, and manage the applications in your workspace.',
    emptyState: {
      icon: <LayoutTemplate size={20} />,
      title: 'Build your first app',
      description: 'Start from a blank canvas or describe what you\nneed, and let ToolJet build it for you.',
    },
  },
  module: {
    title: 'Modules',
    description: 'Create, reuse, and manage modules across the applications in your workspace.',
    emptyState: {
      icon: <ToyBrick size={20} />,
      title: 'Create your first module',
      description: 'Reuse UI and logic across your apps.\nCreate a module from scratch or with AI.',
    },
  },
  workflow: {
    title: 'Workflows',
    description: 'Build, automate, and manage the workflows in your workspace.',
    emptyState: {
      icon: <Workflow size={20} />,
      title: 'Create your first workflow',
      description: 'Automate tasks and connect your tools.\nStart from scratch or build with AI.',
    },
  },
} as const;

// appType → the snake_case prefix its folder-permission session fields use
// (folder_create, workflow_folder_create, module_folder_create, ...).
// Add an entry here (not another ternary) when a new folder-owning app type is introduced.
const FOLDER_TYPE_PREFIX_BY_APP_TYPE = {
  workflow: 'workflow_',
  module: 'module_',
} as const;

export const hasFolderOperationPermission = (
  userPermissions: { [key: string]: boolean },
  appType: Exclude<TAppType, 'front-end'>,
  action: 'create' | 'delete'
) => {
  const prefix = FOLDER_TYPE_PREFIX_BY_APP_TYPE[appType] ?? '';
  return userPermissions?.[`${prefix}folder_${action}`];
};

export function canUserPerformWorkflowAction(app = {} as { id?: string }) {
  const { user_permissions, workflow_group_permissions, super_admin, admin } =
    authenticationService.currentSessionValue;

  if (super_admin)
    return {
      hasCreatePermission: true,
      hasUpdatePermission: true,
      hasDeletePermission: true,
      hasReadPermission: true,
      hasViewPermission: true,
    };

  const canCreate = admin || user_permissions?.workflow_create;
  const canUpdate =
    workflow_group_permissions?.is_all_editable || workflow_group_permissions?.editable_workflows_id?.includes(app?.id);
  const canExecute =
    canUpdate ||
    workflow_group_permissions?.is_all_executable ||
    workflow_group_permissions?.executable_workflows_id?.includes(app?.id);
  const canDelete = user_permissions?.workflow_delete || admin;

  return {
    hasCreatePermission: canCreate,
    hasUpdatePermission: canUpdate,
    hasDeletePermission: canDelete,
    hasReadPermission: canCreate || canUpdate || canDelete || canExecute,
    hasViewPermission:
      canCreate ||
      canUpdate ||
      canDelete ||
      canExecute ||
      workflow_group_permissions?.editable_workflows_id?.length > 0 ||
      workflow_group_permissions?.executable_workflows_id?.length > 0,
  };
}
