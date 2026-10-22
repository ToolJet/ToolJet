import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEModulePermissionsUI from '@ee/modules/WorkspaceSettings/components/ModulePermissionsUI/ModulePermissionsUI';

const ModulePermissionsUI = pickEditionSpecificComponent({
  ee: EEModulePermissionsUI,
  cloudSameAsEE: true,
});

export default ModulePermissionsUI;
