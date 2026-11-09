import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEWorkflowFolderPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/WorkflowFolderPermissionActionContainer';

const WorkflowFolderPermissionActionContainer = pickEditionSpecificComponent({
  ee: EEWorkflowFolderPermissionActionContainer,
  cloudSameAsEE: true,
});

export default WorkflowFolderPermissionActionContainer;
