// The retired UI 2.0 names (NAMING.md) live in two copies: this one, and the server's, which rewrites imported apps.
// They must agree, and no current name may also be a retired name of the same widget (a second rewrite would move it).
import { UI2_COMMON_RENAMES, UI2_RENAMES, renamesFor } from '../legacyNames';
import * as server from '../../../../../../server/src/modules/apps/services/ui2-legacy-names';

describe('retired UI 2.0 names', () => {
  it('match the server copy', () => {
    expect(server.UI2_COMMON_RENAMES).toEqual(UI2_COMMON_RENAMES);
    expect(server.UI2_RENAMES).toEqual(UI2_RENAMES);
  });

  it.each(Object.keys(UI2_RENAMES))('%s never renames a name into another retired name', (type) => {
    const r = renamesFor(type);
    for (const kind of ['events', 'actions', 'exposed', 'properties']) {
      const targets = Object.values(r[kind]).map((t) => t.split('.')[0]);
      expect(targets.filter((t) => r[kind][t])).toEqual([]);
    }
  });

  it('leaves types that are not UI 2.0 widgets alone', () => {
    expect(renamesFor('Table')).toBeNull();
    expect(renamesFor('')).toBeNull();
  });
});
