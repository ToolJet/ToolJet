/**
 * frontend/src/AppBuilder/WidgetManager/widgets/navigation.js and
 * server/src/modules/apps/services/widget-config/navigation.js are independently
 * maintained copies of the same widget registration (see NumberInput's contract,
 * which found the two files kept in lockstep by convention). Navigation's copies
 * had drifted: the server copy was missing `setItemVisibility`/`setItemDisable`
 * and registered `selectItem`'s `id` param as `type: 'text'` instead of `'code'`.
 */
import { navigationConfig as frontendConfig } from '../../../WidgetManager/widgets/navigation';
// eslint-disable-next-line import/no-relative-packages
import { navigationConfig as serverConfig } from '../../../../../../server/src/modules/apps/services/widget-config/navigation';

describe('Navigation widget-config parity', () => {
  test('[Navigation-CFG-001] frontend and server register the same actions', () => {
    expect(serverConfig.actions).toEqual(frontendConfig.actions);
  });
});
