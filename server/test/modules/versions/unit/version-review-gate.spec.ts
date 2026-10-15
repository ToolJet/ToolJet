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

  it('falls back to one approval when the approvals setting is not a number', () => {
    const savedApprovals = process.env.TOOLJET_VERSION_REVIEW_APPROVALS;
    process.env.TOOLJET_VERSION_REVIEW_APPROVALS = 'two';
    expect(reviewPolicy().requiredApprovals).toBe(1);
    process.env.TOOLJET_VERSION_REVIEW_APPROVALS = '0';
    expect(reviewPolicy().requiredApprovals).toBe(1);
    process.env.TOOLJET_VERSION_REVIEW_APPROVALS = '2';
    expect(reviewPolicy().requiredApprovals).toBe(2);
    process.env.TOOLJET_VERSION_REVIEW_APPROVALS = savedApprovals;
  });

  it('lets a version go out again while it is still exactly what was approved', async () => {
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = 'release';
    const released = {
      id: 'r1',
      appId: 'app',
      versionId: 'v',
      authorId: 'author',
      requiredApprovals: 1,
      status: 'released',
    };
    const events = [
      { id: 'e1', reviewId: 'r1', actorId: 'author', kind: 'opened', fingerprint: 'f3:a', createdAt: '2026-10-01' },
      { id: 'e2', reviewId: 'r1', actorId: 'reviewer', kind: 'approved', fingerprint: 'f3:a', createdAt: '2026-10-02' },
      { id: 'e3', reviewId: 'r1', actorId: 'author', kind: 'released', fingerprint: 'f3:a', createdAt: '2026-10-03' },
    ];
    const manager: any = {
      query: async (sql: string) =>
        sql.includes("r.status = 'open'")
          ? []
          : sql.includes("r.status = 'released'")
            ? [released]
            : sql.includes('app_version_review_events')
              ? events
              : [],
    };
    const service = new VersionReviewService();
    const fingerprint = jest.spyOn(service, 'fingerprint');
    fingerprint.mockResolvedValue('f3:a');
    await expect(service.gate(manager, 'app', 'v')).resolves.toMatchObject({ allowed: true, reviewId: 'r1' });
    // Edited since the release: the old approval no longer covers it.
    fingerprint.mockResolvedValue('f3:b');
    await expect(service.gate(manager, 'app', 'v')).resolves.toMatchObject({ allowed: false, reviewId: null });
  });

  it('never gates workflows or modules, which have no compare view to review in', async () => {
    process.env.TOOLJET_VERSION_REVIEW_REQUIRED = 'all';
    const manager: any = { query: async (sql: string) => (sql.includes('FROM apps') ? [{ type: 'workflow' }] : []) };
    const service = new VersionReviewService();
    await expect(service.gate(manager, 'app', 'v', 'release')).resolves.toMatchObject({
      required: false,
      allowed: true,
    });
    await expect(service.gate(manager, 'app', 'v', 'promote')).resolves.toMatchObject({
      required: false,
      allowed: true,
    });
  });
});
