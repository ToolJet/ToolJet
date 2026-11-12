import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEDataSourceFolderPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/DataSourceFolderPermissionActionContainer';

const DataSourceFolderPermissionActionContainer = pickEditionSpecificComponent({
  ee: EEDataSourceFolderPermissionActionContainer,
  cloudSameAsEE: true,
});

export default DataSourceFolderPermissionActionContainer;
