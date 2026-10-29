import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEWorkflowResourcePermissions from '@ee/modules/WorkspaceSettings/components/WorkflowResourcePermissions';

const WorkflowResourcePermissions = pickEditionSpecificComponent({
  ee: EEWorkflowResourcePermissions,
  cloudSameAsEE: true,
});

export default WorkflowResourcePermissions;
