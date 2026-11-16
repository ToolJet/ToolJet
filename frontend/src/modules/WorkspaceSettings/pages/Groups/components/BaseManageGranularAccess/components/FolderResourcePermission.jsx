import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEFolderResourcePermissions from '@ee/modules/WorkspaceSettings/components/FolderResourcePermissions';

const FolderResourcePermissions = pickEditionSpecificComponent({
  ee: EEFolderResourcePermissions,
  cloudSameAsEE: true,
});

export default FolderResourcePermissions;
