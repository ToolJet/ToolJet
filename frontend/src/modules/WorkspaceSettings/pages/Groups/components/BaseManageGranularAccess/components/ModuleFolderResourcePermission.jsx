import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEModuleFolderResourcePermissions from '@ee/modules/WorkspaceSettings/components/ModuleFolderResourcePermissions';

const ModuleFolderResourcePermissions = pickEditionSpecificComponent({
  ee: EEModuleFolderResourcePermissions,
  cloudSameAsEE: true,
});

export default ModuleFolderResourcePermissions;
