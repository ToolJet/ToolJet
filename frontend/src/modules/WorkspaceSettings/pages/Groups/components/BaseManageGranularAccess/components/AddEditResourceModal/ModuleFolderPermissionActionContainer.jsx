import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEModuleFolderPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/ModuleFolderPermissionActionContainer';

const ModuleFolderPermissionActionContainer = pickEditionSpecificComponent({
  ee: EEModuleFolderPermissionActionContainer,
  cloudSameAsEE: true,
});

export default ModuleFolderPermissionActionContainer;
