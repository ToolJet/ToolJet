import { withEditionSpecificModule } from '@/modules/common/helpers';
import { MODULE_CONSTANTS } from '../common/constants';

const Settings = withEditionSpecificModule('Settings', {
  moduleRequiredIn: [MODULE_CONSTANTS.MODULE_EDITIONS.CLOUD, MODULE_CONSTANTS.MODULE_EDITIONS.EE],
});

export default Settings;
