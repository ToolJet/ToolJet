import React from 'react';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EECreateWorkspaceBtn from '@ee/modules/Dashboard/components/OrganizationList/CreateWorkspaceBtn';

import BaseCreateWorkspaceBtn from './BaseCreateWorkspaceBtn';

function CreateWorkspaceBtn({ onAddWorkspace }) {
  return <BaseCreateWorkspaceBtn onAddWorkspace={onAddWorkspace} />;
}

export default pickEditionSpecificComponent({
  ce: CreateWorkspaceBtn,
  ee: EECreateWorkspaceBtn,
  cloudSameAsEE: true,
});
