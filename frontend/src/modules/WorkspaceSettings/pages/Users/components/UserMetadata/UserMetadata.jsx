import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEUserMetadata from '@ee/modules/WorkspaceSettings/components/UserMetadata';

const UserMetadata = pickEditionSpecificComponent({
  ee: EEUserMetadata,
  cloudSameAsEE: true,
});

export default UserMetadata;
