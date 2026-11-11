import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEDataSourcePermissionsUI from '@ee/modules/WorkspaceSettings/components/DataSourcePermissionsUI';

const DataSourcePermissionsUI = pickEditionSpecificComponent({
  ee: EEDataSourcePermissionsUI,
  cloudSameAsEE: true,
});

export default DataSourcePermissionsUI;
