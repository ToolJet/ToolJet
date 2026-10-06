import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEConstantsEnvironmentsTabs from '@ee/modules/WorkspaceSettings/components/ConstantsEnvironmentsTabs';

const ConstantsEnvironmentsTabs = pickEditionSpecificComponent({
  ee: EEConstantsEnvironmentsTabs,
  cloudSameAsEE: true,
});

export default ConstantsEnvironmentsTabs;
