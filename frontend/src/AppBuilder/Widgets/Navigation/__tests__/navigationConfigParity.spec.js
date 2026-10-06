/**
 * The server's widget registry (server/src/modules/apps/services/widget-config) must register the
 * same Navigation definition the builder uses; both come from packages/widget-definitions.
 */
import { navigationConfig as frontendConfig } from '@tooljet/widget-definitions';
// eslint-disable-next-line import/no-relative-packages
import serverWidgets from '../../../../../../server/src/modules/apps/services/widget-config';

const serverConfig = serverWidgets.navigationConfig;

describe('Navigation widget-config parity', () => {
  test('[Navigation-CFG-001] frontend and server register the same actions', () => {
    expect(serverConfig.actions).toEqual(frontendConfig.actions);
  });
});
