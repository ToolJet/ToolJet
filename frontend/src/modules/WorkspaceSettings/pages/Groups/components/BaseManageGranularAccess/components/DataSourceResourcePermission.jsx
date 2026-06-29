import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEDataSourceResourcePermissions from '@ee/modules/WorkspaceSettings/components/DataSourceResourcePermissions';

const DataSourceResourcePermissions = pickEditionSpecificComponent({
  ee: EEDataSourceResourcePermissions,
  cloudSameAsEE: true,
});

export default DataSourceResourcePermissions;
