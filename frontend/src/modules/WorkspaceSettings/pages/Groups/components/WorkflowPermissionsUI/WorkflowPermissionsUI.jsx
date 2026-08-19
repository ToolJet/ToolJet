import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEWorkflowPermissionsUI from '@ee/modules/WorkspaceSettings/components/WorkflowPermissionsUI';

const WorkflowPermissionsUI = pickEditionSpecificComponent({
  ee: EEWorkflowPermissionsUI,
  cloudSameAsEE: true,
});

export default WorkflowPermissionsUI;
