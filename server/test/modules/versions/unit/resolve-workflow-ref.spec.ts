import { BadRequestException } from '@nestjs/common';
import { pinIsDraftSentinel, resolveWorkflowRef } from '@modules/versions/workflow-ref.util';
import { WORKFLOW_CURRENT_BRANCH_SENTINEL, DRAFT_SENTINEL } from '@modules/versions/ref-sentinels';
import { App } from '@entities/app.entity';
import { AppVersionType, AppVersionStatus } from '@entities/app_version.entity';

/**
 * Full tier coverage for resolveWorkflowRef. The tiers, in the order the function tries them:
 *   Tier C  __current_branch__      -> the consumer branch's BRANCH row; main's draft only when
 *                                     the consumer has no branch context or is on main
 *   Tier D  __default_branch_draft__ -> main's draft
 *   Tier 0  a version name          -> main's PUBLISHED row, else a main DRAFT of that name (legacy)
 *   unpinned                        -> whatever is released (apps.current_version_id)
 *
 * A set-but-unresolvable pin must always throw rather than substitute a different version — that
 * is the property most of these tests exist to protect.
 *
 * The group tag must stay on its own line inside this docblock. jest-runner-groups reads pragmas
 * through jest-docblock, which only matches a tag at the start of a line, so collapsing it into a
 * single-line docblock of its own makes it inert and the suite invisible to --group.
 *
 * @group workflows
 */
describe('resolveWorkflowRef', () => {
  const organizationId = 'org-1';
  const mainId = 'branch-main';
  const featureId = 'branch-feature';
  const otherOrgId = 'org-2';

  const WF_APP = { id: 'wf-1', co_relation_id: 'co-rel-1', type: 'workflow', organizationId, currentVersionId: null };

  /**
   * In-memory manager. Matches the real where clause field-by-field (array where = OR, object
   * where = AND) rather than guessing from its shape, so a query that names the wrong column
   * genuinely misses. `order: { createdAt: 'DESC' }` is honoured — Tier C/D/0 rely on it.
   */
  const makeManager = (apps: any[], versions: any[]) => {
    const matches = (row: any, where: Record<string, any>) => Object.entries(where).every(([k, v]) => row[k] === v);
    return {
      findOne: jest.fn(async (entity: any, opts: any) => {
        const rows = entity === App ? apps : versions;
        const clauses = Array.isArray(opts?.where) ? opts.where : [opts?.where ?? {}];
        let hits = rows.filter((r) => clauses.some((w: any) => matches(r, w)));
        const dir = opts?.order?.createdAt;
        if (dir) {
          hits = [...hits].sort((a, b) =>
            dir === 'DESC' ? (b.createdAt ?? 0) - (a.createdAt ?? 0) : (a.createdAt ?? 0) - (b.createdAt ?? 0)
          );
        }
        return hits[0] ?? null;
      }),
    } as any;
  };

  const version = (over: Partial<Record<string, any>>) => ({
    id: 'v-x',
    appId: WF_APP.id,
    branchId: mainId,
    name: 'v1',
    status: AppVersionStatus.DRAFT,
    versionType: AppVersionType.VERSION,
    isStub: false,
    createdAt: 1,
    ...over,
  });

  const mainDraft = version({ id: 'v-main-draft', name: 'main-draft', status: AppVersionStatus.DRAFT });
  const branchRow = version({
    id: 'v-branch',
    branchId: featureId,
    name: 'uuid-ish',
    versionType: AppVersionType.BRANCH,
  });

  // ---------------------------------------------------------------- no target

  it('returns nulls when the query has no workflowId at all (unconfigured query)', async () => {
    const manager = makeManager([WF_APP], []);
    expect(await resolveWorkflowRef(manager, {}, organizationId, mainId)).toEqual({
      appId: null,
      appVersionId: null,
    });
    expect(manager.findOne).not.toHaveBeenCalled();
  });

  it('returns nulls when the workflow App does not exist in this organization', async () => {
    // Same co_relation_id, different org — the lookup is org-scoped, so this must not resolve.
    const manager = makeManager([{ ...WF_APP, organizationId: otherOrgId }], [mainDraft]);
    expect(await resolveWorkflowRef(manager, { workflowId: 'co-rel-1' }, organizationId, mainId)).toEqual({
      appId: null,
      appVersionId: null,
    });
  });

  it('finds the workflow App by co_relation_id (post-B9) or by primary key (legacy rows)', async () => {
    const byCoRel = makeManager([WF_APP], [mainDraft]);
    expect(
      (
        await resolveWorkflowRef(
          byCoRel,
          { workflowId: 'co-rel-1', workflowVersionId: DRAFT_SENTINEL },
          organizationId,
          mainId
        )
      ).appId
    ).toBe(WF_APP.id);

    const byPk = makeManager([WF_APP], [mainDraft]);
    expect(
      (
        await resolveWorkflowRef(
          byPk,
          { workflowId: 'wf-1', workflowVersionId: DRAFT_SENTINEL },
          organizationId,
          mainId
        )
      ).appId
    ).toBe(WF_APP.id);
  });

  it('prefers the camelCase key when a row carries both casings', async () => {
    // Rows healed by the frontend can hold both; camelCase is the canonical write form, so it
    // must win. If precedence flipped, this pin would resolve as a name instead of a sentinel.
    const published = version({ id: 'v-pub', name: 'v3', status: AppVersionStatus.PUBLISHED });
    const manager = makeManager([WF_APP], [mainDraft, published]);
    const result = await resolveWorkflowRef(
      manager,
      { workflowId: 'co-rel-1', workflowVersionId: DRAFT_SENTINEL, workflow_version_id: 'v3' },
      organizationId,
      mainId
    );
    expect(result.appVersionId).toBe(mainDraft.id);
  });

  it('reads legacy snake_case option keys', async () => {
    const manager = makeManager([WF_APP], [mainDraft]);
    const result = await resolveWorkflowRef(
      manager,
      { workflow_id: 'co-rel-1', workflow_version_id: DRAFT_SENTINEL },
      organizationId,
      mainId
    );
    expect(result).toEqual({ appId: WF_APP.id, appVersionId: mainDraft.id });
  });

  // ---------------------------------------------------- Tier C: __current_branch__

  describe('Tier C — __current_branch__', () => {
    const pin = { workflowId: 'co-rel-1', workflowVersionId: WORKFLOW_CURRENT_BRANCH_SENTINEL };

    // The feature-branch arm throws 10.4's actionable message; the default-branch arm throws the
    // generic `not available`. Asserting the class alone would let a reword down to the generic
    // message pass, and telling the user what to do is the whole point of the step.
    const NO_BRANCH_ROW = /no version on the current branch/;

    it('returns the feature branch BRANCH row when one exists there', async () => {
      const manager = makeManager([WF_APP], [mainDraft, branchRow]);
      expect(await resolveWorkflowRef(manager, pin, organizationId, mainId, featureId)).toEqual({
        appId: WF_APP.id,
        appVersionId: branchRow.id,
      });
    });

    // Phase 10 Step 10.4. Before it, this returned main's draft — silently running content the
    // pin does not name. Both negative-control cases live here.
    it('THROWS on a feature branch with no BRANCH row, even though main has a draft', async () => {
      const manager = makeManager([WF_APP], [mainDraft]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId, featureId)).rejects.toThrow(NO_BRANCH_ROW);
    });

    it('treats an unhydrated stub on the branch as absent, and throws', async () => {
      const manager = makeManager([WF_APP], [mainDraft, { ...branchRow, isStub: true }]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId, featureId)).rejects.toThrow(NO_BRANCH_ROW);
    });

    it('does not accept a VERSION-type row that happens to sit on the consumer branch', async () => {
      // Tier C wants the branch's own BRANCH draft specifically; versionType is part of the
      // lookup, not decoration.
      const versionTypeOnFeature = version({ id: 'v-vt', branchId: featureId, name: 'stray' });
      const manager = makeManager([WF_APP], [mainDraft, versionTypeOnFeature]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId, featureId)).rejects.toThrow(NO_BRANCH_ROW);
    });

    it('does not accept a stubbed default-branch draft on the no-branch-context arm', async () => {
      const manager = makeManager([WF_APP], [{ ...mainDraft, isStub: true }]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it("ignores another feature branch's BRANCH row", async () => {
      const manager = makeManager([WF_APP], [mainDraft, { ...branchRow, branchId: 'branch-other' }]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId, featureId)).rejects.toThrow(NO_BRANCH_ROW);
    });

    // The two arms Phase 8's publish gate and public-app backstop depend on.
    it("resolves to main's draft when no consumerBranchId is passed (publish / promote sweeps)", async () => {
      const manager = makeManager([WF_APP], [mainDraft, branchRow]);
      expect(await resolveWorkflowRef(manager, pin, organizationId, mainId)).toEqual({
        appId: WF_APP.id,
        appVersionId: mainDraft.id,
      });
    });

    it("resolves to main's draft when the consumer is on the default branch (a released app)", async () => {
      const manager = makeManager([WF_APP], [mainDraft, branchRow]);
      expect(await resolveWorkflowRef(manager, pin, organizationId, mainId, mainId)).toEqual({
        appId: WF_APP.id,
        appVersionId: mainDraft.id,
      });
    });

    it('picks the newest draft when an unsynced app holds several on the default branch', async () => {
      const older = version({ id: 'v-old', name: 'd1', createdAt: 1 });
      const newer = version({ id: 'v-new', name: 'd2', createdAt: 9 });
      const manager = makeManager([WF_APP], [older, newer]);
      expect((await resolveWorkflowRef(manager, pin, organizationId, mainId)).appVersionId).toBe('v-new');
    });

    it('throws when neither a branch row nor a default-branch draft exists', async () => {
      const manager = makeManager([WF_APP], []);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('throws rather than substituting when there is no default branch to fall back to', async () => {
      const manager = makeManager([WF_APP], [mainDraft]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, null)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ------------------------------------------------ Tier D: __default_branch_draft__

  describe('Tier D — __default_branch_draft__', () => {
    const pin = { workflowId: 'co-rel-1', workflowVersionId: DRAFT_SENTINEL };

    it("resolves to main's draft from a feature branch — this pin deliberately crosses branches", async () => {
      const manager = makeManager([WF_APP], [mainDraft, branchRow]);
      expect(await resolveWorkflowRef(manager, pin, organizationId, mainId, featureId)).toEqual({
        appId: WF_APP.id,
        appVersionId: mainDraft.id,
      });
    });

    it('never returns a BRANCH-type row, even one sitting on the default branch', async () => {
      const branchTypeOnMain = version({ id: 'v-bad', versionType: AppVersionType.BRANCH, name: 'x' });
      const manager = makeManager([WF_APP], [branchTypeOnMain]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('does not reach onto a feature branch for a draft — the lookup is default-branch scoped', async () => {
      const draftOnFeature = version({ id: 'v-f', branchId: featureId, name: 'fdraft' });
      const manager = makeManager([WF_APP], [draftOnFeature]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId, featureId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('throws when the default branch has no draft', async () => {
      const published = version({ id: 'v-pub', status: AppVersionStatus.PUBLISHED });
      const manager = makeManager([WF_APP], [published]);
      await expect(resolveWorkflowRef(manager, pin, organizationId, mainId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });

  // ------------------------------------------------------- Tier 0: a version name

  describe('Tier 0 — a named version', () => {
    const pinTo = (name: string) => ({ workflowId: 'co-rel-1', workflowVersionId: name });

    it("resolves to the default branch's PUBLISHED row of that name", async () => {
      const published = version({ id: 'v-pub', name: 'v3', status: AppVersionStatus.PUBLISHED });
      const manager = makeManager([WF_APP], [mainDraft, published]);
      expect(await resolveWorkflowRef(manager, pinTo('v3'), organizationId, mainId)).toEqual({
        appId: WF_APP.id,
        appVersionId: 'v-pub',
      });
    });

    it('does not resolve a name that only exists on a feature branch', async () => {
      const onFeature = version({ id: 'v-f', name: 'v3', branchId: featureId, status: AppVersionStatus.PUBLISHED });
      const manager = makeManager([WF_APP], [onFeature]);
      await expect(resolveWorkflowRef(manager, pinTo('v3'), organizationId, mainId, featureId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    // Phase 8 Step 8.3e.6: pre-branch-model pins name a DRAFT and used to run it.
    it('falls back to a default-branch DRAFT of that exact name (legacy pin)', async () => {
      const namedDraft = version({ id: 'v-legacy', name: 'my-draft', status: AppVersionStatus.DRAFT });
      const manager = makeManager([WF_APP], [namedDraft]);
      expect(await resolveWorkflowRef(manager, pinTo('my-draft'), organizationId, mainId)).toEqual({
        appId: WF_APP.id,
        appVersionId: 'v-legacy',
      });
    });

    it('does not resolve a name pin onto a BRANCH-type row, even on the default branch', async () => {
      // The legacy-draft fallback is scoped to VERSION rows: a BRANCH row is a working copy, not
      // a version anyone can pin by name.
      const branchTypeOnMain = version({
        id: 'v-bt',
        name: 'my-draft',
        versionType: AppVersionType.BRANCH,
      });
      const manager = makeManager([WF_APP], [branchTypeOnMain]);
      await expect(resolveWorkflowRef(manager, pinTo('my-draft'), organizationId, mainId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('does not resolve a name pin onto an unhydrated stub', async () => {
      const stubbed = version({ id: 'v-stub', name: 'v3', status: AppVersionStatus.PUBLISHED, isStub: true });
      const manager = makeManager([WF_APP], [stubbed]);
      await expect(resolveWorkflowRef(manager, pinTo('v3'), organizationId, mainId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('picks the newest when several default-branch drafts share the pinned name', async () => {
      const older = version({ id: 'v-old', name: 'dup', createdAt: 1 });
      const newer = version({ id: 'v-new', name: 'dup', createdAt: 9 });
      const manager = makeManager([WF_APP], [older, newer]);
      expect((await resolveWorkflowRef(manager, pinTo('dup'), organizationId, mainId)).appVersionId).toBe('v-new');
    });

    it('THROWS when the pin matches nothing — never substitutes another version', async () => {
      // A draft and a published row both exist, just under other names. Neither may be returned.
      const published = version({ id: 'v-pub', name: 'v1', status: AppVersionStatus.PUBLISHED });
      const manager = makeManager([WF_APP], [mainDraft, published]);
      await expect(resolveWorkflowRef(manager, pinTo('v99'), organizationId, mainId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('throws when there is no default branch, rather than searching other branches', async () => {
      const published = version({ id: 'v-pub', name: 'v3', status: AppVersionStatus.PUBLISHED });
      const manager = makeManager([WF_APP], [published]);
      await expect(resolveWorkflowRef(manager, pinTo('v3'), organizationId, null)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });

  // ------------------------------------------------------------------- unpinned

  describe('unpinned', () => {
    // For a workflow query, empty means "run whatever is released" — the opposite of a
    // ModuleViewer, where empty means "follow the consumer's branch". Do not unify these.
    it('returns the released version and never consults a branch', async () => {
      const app = { ...WF_APP, currentVersionId: 'v-released' };
      const manager = makeManager([app], [mainDraft, branchRow]);
      expect(await resolveWorkflowRef(manager, { workflowId: 'co-rel-1' }, organizationId, mainId, featureId)).toEqual({
        appId: app.id,
        appVersionId: 'v-released',
      });
      // One call only: the App lookup. No version query at all.
      expect(manager.findOne).toHaveBeenCalledTimes(1);
    });

    it('returns a null version, without throwing, when the workflow was never released', async () => {
      const manager = makeManager([WF_APP], [mainDraft]);
      expect(await resolveWorkflowRef(manager, { workflowId: 'co-rel-1' }, organizationId, mainId)).toEqual({
        appId: WF_APP.id,
        appVersionId: null,
      });
    });

    it('treats an empty-string pin as unpinned, not as a name', async () => {
      const app = { ...WF_APP, currentVersionId: 'v-released' };
      const manager = makeManager([app], [mainDraft]);
      expect(
        await resolveWorkflowRef(manager, { workflowId: 'co-rel-1', workflowVersionId: '' }, organizationId, mainId)
      ).toEqual({ appId: app.id, appVersionId: 'v-released' });
    });
  });
});

/**
 * The guard every tag lookup has to pass a pin through — a sentinel is not a tag name, and
 * treating one as a tag is the bug class Phase 8 Step 8.3e.5 fixed in stub hydration.
 * (Group tag lives in the file's first docblock; a second one only duplicates the pragma.)
 */
describe('pinIsDraftSentinel', () => {
  it('recognises both moving-draft sentinels and nothing else', () => {
    expect(pinIsDraftSentinel(DRAFT_SENTINEL)).toBe(true);
    expect(pinIsDraftSentinel(WORKFLOW_CURRENT_BRANCH_SENTINEL)).toBe(true);
    expect(pinIsDraftSentinel('v2')).toBe(false);
    expect(pinIsDraftSentinel('')).toBe(false);
    expect(pinIsDraftSentinel(null)).toBe(false);
    expect(pinIsDraftSentinel(undefined)).toBe(false);
  });
});
