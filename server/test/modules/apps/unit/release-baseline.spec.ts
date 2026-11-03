import { ConflictException } from '@nestjs/common';
import { assertReleaseBaseline } from '@modules/apps/release-baseline';

// A Release dialog says which version the release replaces. Left open while someone else released a newer version,
// its Yes put the older version back live with no warning (codex two-user audit, 2026-10-26).
describe('the version a release replaces', () => {
  const manager = (currentVersionId: string | null) =>
    ({ query: jest.fn(async () => [{ currentVersionId }]) }) as any;

  it('lets the release through when the live version is the one the dialog showed', async () => {
    await expect(assertReleaseBaseline(manager('v-1'), 'app-1', 'v-1')).resolves.toBeUndefined();
    await expect(assertReleaseBaseline(manager(null), 'app-1', '')).resolves.toBeUndefined();
  });

  it('refuses when another release came first', async () => {
    const m = manager('v-2');
    await expect(assertReleaseBaseline(m, 'app-1', 'v-1')).rejects.toBeInstanceOf(ConflictException);
    await expect(assertReleaseBaseline(m, 'app-1', 'v-1')).rejects.toThrow('Another version was released');
    // The app row is locked, so two releases at once queue rather than both passing the check.
    expect(m.query.mock.calls[0][0]).toMatch(/FOR UPDATE/);
  });

  it('checks nothing for a client that does not say (older editors, the API)', async () => {
    const m = manager('v-2');
    await expect(assertReleaseBaseline(m, 'app-1', undefined)).resolves.toBeUndefined();
    expect(m.query).not.toHaveBeenCalled();
  });
});
