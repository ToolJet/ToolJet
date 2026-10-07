import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEWorkflowFolderResourcePermissions from '@ee/modules/WorkspaceSettings/components/WorkflowFolderResourcePermissions';

const WorkflowFolderResourcePermissions = pickEditionSpecificComponent({
  ee: EEWorkflowFolderResourcePermissions,
  cloudSameAsEE: true,
});

export default WorkflowFolderResourcePermissions;
