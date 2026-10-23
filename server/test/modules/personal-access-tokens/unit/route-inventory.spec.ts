/** @group security */
import { join } from 'path';
import { readFileSync } from 'fs';
import { patCanAccess, patBundleOf, patAppViewerCanAccess } from '@modules/personal-access-tokens/constants/scopes';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY as CONFIG_FEATURE } from '@modules/configs/constants';
import { FEATURE_KEY as SESSION_FEATURE } from '@modules/session/constants';
import { routeInventory } from '../route-inventory.cjs';

test('public controller routes reachable by PAT/OAuth match the reviewed inventory', () => {
  const root = join(__dirname, '../../../..');
  const actual = routeInventory(root, 'src/modules', patCanAccess, patBundleOf, patAppViewerCanAccess);
  expect(actual.length).toBeGreaterThan(100);
  expect(actual).toEqual(JSON.parse(readFileSync(join(__dirname, '../routes.json'), 'utf8')));
}, 30000);

test('viewer routes including OAuth bootstrap exceptions match the reviewed inventory', () => {
  const root = join(__dirname, '../../../..');
  const viewerAccess = (module, feature, verb) =>
    patAppViewerCanAccess(module, feature) ||
    (verb === 'GET' &&
      ((module === MODULES.CONFIGS && feature === CONFIG_FEATURE.GET_PUBLIC_CONFIGS) ||
        (module === MODULES.SESSION && feature === SESSION_FEATURE.GET_USER_SESSION)));
  const actual = routeInventory(root, 'src/modules', viewerAccess, () => 'viewer');
  expect(actual.length).toBeGreaterThan(0);
  expect(actual).toEqual(JSON.parse(readFileSync(join(__dirname, '../viewer-routes.json'), 'utf8')));
}, 30000);
