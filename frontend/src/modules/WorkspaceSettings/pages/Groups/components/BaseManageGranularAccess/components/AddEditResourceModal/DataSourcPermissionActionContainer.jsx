import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEDataSourcPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/DataSourcPermissionActionContainer';

const DataSourcPermissionActionContainer = pickEditionSpecificComponent({
  ee: EEDataSourcPermissionActionContainer,
  cloudSameAsEE: true,
});

export default DataSourcPermissionActionContainer;
