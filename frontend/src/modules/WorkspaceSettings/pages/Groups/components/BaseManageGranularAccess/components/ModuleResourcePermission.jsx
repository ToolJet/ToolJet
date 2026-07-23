import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEModuleResourcePermissions from '@ee/modules/WorkspaceSettings/components/ModuleResourcePermissions/ModuleResourcePermissions';

const ModuleResourcePermissions = pickEditionSpecificComponent({
  ee: EEModuleResourcePermissions,
  cloudSameAsEE: true,
});

export default ModuleResourcePermissions;
