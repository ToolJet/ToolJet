/** @group platform */
import { reviewPolicy, VersionReviewService } from '@modules/versions/reviews/version-review.service';

describe('review policy and gate', () => {
  const saved = process.env.TOOLJET_VERSION_REVIEW_REQUIRED;
  afterEach(() => {
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = saved;
  });

  it('reads which actions need an approved review', () => {
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = '';
    expect(reviewPolicy()).toMatchObject({ release: false, promote: false });
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = 'release';
    expect(reviewPolicy()).toMatchObject({ release: true, promote: false });
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = 'release, promote';
    expect(reviewPolicy()).toMatchObject({ release: true, promote: true });
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = 'ALL';
    expect(reviewPolicy()).toMatchObject({ release: true, promote: true });
  });

  it('names the action it blocks when there is no review', async () => {
    // No open review for the version.
    const manager: any = { query: async () => [] };
    const service = new VersionReviewService();
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = 'release,promote';
    await expect(service.gate(manager, 'app', 'v', 'promote')).resolves.toMatchObject({
      allowed: false,
      reason: 'This version needs an approved review before it can be promoted to production',
    });
    await expect(service.assertReleasable(manager, 'app', 'v')).rejects.toThrow(
      'This version needs an approved review before it can be released'
    );
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = 'release';
    await expect(service.gate(manager, 'app', 'v', 'promote')).resolves.toMatchObject({
      required: false,
      allowed: true,
    });
  });
});
