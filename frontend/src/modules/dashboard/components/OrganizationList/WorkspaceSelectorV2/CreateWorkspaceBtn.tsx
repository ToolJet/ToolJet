import React from 'react';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EECreateWorkspaceBtn from '@ee/modules/Dashboard/components/OrganizationList/CreateWorkspaceBtn';

import BaseCreateWorkspaceBtn from './BaseCreateWorkspaceBtn';

/** How much of the plan's workspace allowance is used; only the enterprise button reads it. */
export interface WorkspacesLimit {
  canAddUnlimited?: boolean;
  percentage?: number;
}

export interface CreateWorkspaceBtnProps {
  onAddWorkspace: () => void;
  workspacesLimit: WorkspacesLimit | null;
}

function CreateWorkspaceBtn({ onAddWorkspace }: CreateWorkspaceBtnProps) {
  return <BaseCreateWorkspaceBtn onAddWorkspace={onAddWorkspace} />;
}

export default pickEditionSpecificComponent<CreateWorkspaceBtnProps>({
  ce: CreateWorkspaceBtn,
  ee: EECreateWorkspaceBtn,
  cloudSameAsEE: true,
});
