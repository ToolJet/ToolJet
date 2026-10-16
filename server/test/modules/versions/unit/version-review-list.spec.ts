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
