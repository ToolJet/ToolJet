import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEAppPromoteReleasePermissionsUI from '@ee/modules/WorkspaceSettings/components/AppPromoteReleasePermissionsUI';

const AppPromoteReleasePermissionsUI = pickEditionSpecificComponent({
  ee: EEAppPromoteReleasePermissionsUI,
  cloudSameAsEE: true,
});

export default AppPromoteReleasePermissionsUI;
