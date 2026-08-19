import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEWorkflowPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/WorkflowPermissionActionContainer';

const WorkflowPermissionActionContainer = pickEditionSpecificComponent({
  ee: EEWorkflowPermissionActionContainer,
  cloudSameAsEE: true,
});

export default WorkflowPermissionActionContainer;
