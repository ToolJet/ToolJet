/** @group platform */
import { VersionDiffService } from '@modules/versions/diff/version-diff.service';

jest.mock('@helpers/database.helper', () => ({
  ...jest.requireActual('@helpers/database.helper'),
  dbTransactionWrap: (fn: (m: unknown) => unknown) => fn(manager),
}));
const manager: any = {
  query: jest.fn(async (sql: string) =>
    sql.includes('FROM app_version_reviews r')
      ? [{ id: 'r-1', appId: 'a', versionId: 'v-9', title: 'Retitle', status: 'open', authorId: 'u-1' }]
      : []
  ),
};

import { VersionReviewService } from '@modules/versions/reviews/version-review.service';

// The editor header polls for waiting reviews every minute in every open tab. It needs how many
// there are and which one to open, not each version's fingerprint (a full read of the version).
describe('listing reviews', () => {
  it('reads no version content for the brief list the header polls', async () => {
    const load = jest.spyOn(VersionDiffService.prototype, 'loadRows');
    const result = await new VersionReviewService().list({ id: 'a' } as any, 'open', true);
    expect(result.reviews).toEqual([{ id: 'r-1', versionId: 'v-9', title: 'Retitle', status: 'open' }]);
    expect(load).not.toHaveBeenCalled();
  });
});

// Review text is stored and sent to every reviewer's panel: each field has a size limit.
describe('review text limits', () => {
  const service = new VersionReviewService();
  const app = { id: 'a' } as any;
  const user = { id: 'u-2', organizationId: 'o' } as any;
  const long = (n: number) => 'x'.repeat(n);

  it.each([
    ['a title', () => service.open(app, user, 'v-9', { title: long(201) }), 'Title'],
    ['a description', () => service.open(app, user, 'v-9', { title: 'Ok', description: long(10001) }), 'Description'],
    ['a comment', () => service.comment(app, user, 'r-1', { body: long(10001) }), 'Comment'],
    ['an anchor', () => service.comment(app, user, 'r-1', { body: 'Ok', anchor: long(201) }), 'Anchor'],
    [
      'a decision note',
      () => service.decide(app, user, 'r-1', { decision: 'request_changes', body: long(10001) }),
      'Note',
    ],
    ['an override reason', () => service.override(app, user, 'r-1', { reason: long(10001) }), 'Reason'],
  ])('refuses %s over its limit, before touching the database', async (_what, call, field) => {
    manager.query.mockClear();
    await expect(call()).rejects.toThrow(`${field} is too long`);
    expect(manager.query).not.toHaveBeenCalled();
  });
});
