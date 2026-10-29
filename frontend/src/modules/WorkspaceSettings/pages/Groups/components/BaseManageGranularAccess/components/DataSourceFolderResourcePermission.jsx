import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEDataSourceFolderResourcePermissions from '@ee/modules/WorkspaceSettings/components/DataSourceFolderResourcePermissions';

const DataSourceFolderResourcePermissions = pickEditionSpecificComponent({
  ee: EEDataSourceFolderResourcePermissions,
  cloudSameAsEE: true,
});

export default DataSourceFolderResourcePermissions;
