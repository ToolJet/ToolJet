import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

// Plans and upgrades don't exist in CE; the edition-specific pricing table replaces this.
const UpgradePlanModal = () => null;

export default withEditionSpecificComponent(UpgradePlanModal, 'common');
