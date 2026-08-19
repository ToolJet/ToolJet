import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEModulePermissionActionContainer from '@ee/modules/WorkspaceSettings/components/ModulePermissionActionContainer/ModulePermissionActionContainer';

const ModulePermissionActionContainer = pickEditionSpecificComponent({
  ee: EEModulePermissionActionContainer,
  cloudSameAsEE: true,
});

export default ModulePermissionActionContainer;
