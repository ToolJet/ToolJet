import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEFolderPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/FolderPermissionActionContainer';

const FolderPermissionActionContainer = pickEditionSpecificComponent({
  ee: EEFolderPermissionActionContainer,
  cloudSameAsEE: true,
});

export default FolderPermissionActionContainer;
