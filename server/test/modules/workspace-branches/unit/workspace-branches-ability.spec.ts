/// <reference types="jest" />
import { FeatureAbilityFactory, FeatureAbility } from '@modules/workspace-branches/ability/index';
import { FEATURE_KEY } from '@modules/workspace-branches/constants';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { buildAbilityViaFactory, expectFeatures } from 'test-helper';

const ALL_ACTIONS = [
  FEATURE_KEY.LIST_BRANCHES,
  FEATURE_KEY.CREATE_BRANCH,
  FEATURE_KEY.SWITCH_BRANCH,
  FEATURE_KEY.DELETE_BRANCH,
  FEATURE_KEY.PUSH_WORKSPACE,
  FEATURE_KEY.PULL_WORKSPACE,
  FEATURE_KEY.RESOLVE_CONFLICTS,
  FEATURE_KEY.PULL_APP,
  FEATURE_KEY.PULL_MODULE,
  FEATURE_KEY.CHECK_UPDATES,
  FEATURE_KEY.LIST_REMOTE_BRANCHES,
  FEATURE_KEY.FETCH_PULL_REQUESTS,
  FEATURE_KEY.ENSURE_DRAFT,
  FEATURE_KEY.GET_ENTITY_TAGS,
];

const factory = new FeatureAbilityFactory(null as any);

/** @group platform */
describe('workspace-branches FeatureAbilityFactory', () => {
  it('grants every branch action to isAdmin', async () => {
    const ability = await buildAbilityViaFactory<FeatureAbility>(factory, { isAdmin: true });
    expectFeatures(ability, WorkspaceBranch, { allowed: ALL_ACTIONS });
  });

  it('grants every branch action to superAdmin', async () => {
    const ability = await buildAbilityViaFactory<FeatureAbility>(factory, { superAdmin: true });
    expectFeatures(ability, WorkspaceBranch, { allowed: ALL_ACTIONS });
  });

  it('denies every branch action to a plain end user (no admin, no builder)', async () => {
    const ability = await buildAbilityViaFactory<FeatureAbility>(factory, {});
    expectFeatures(ability, WorkspaceBranch, { denied: ALL_ACTIONS });
  });

  it('grants every branch action to isBuilder — including DELETE_BRANCH, PUSH_WORKSPACE, PULL_WORKSPACE', async () => {
    // Documents current behavior: `isBuilder` grants the exact same full action set as
    // admin/superAdmin, with no restriction relative to admin. Worth confirming with the team
    // whether every builder is meant to be able to push/pull/delete workspace git branches
    // unrestricted, or whether this should be a narrower subset.
    const ability = await buildAbilityViaFactory<FeatureAbility>(factory, { isBuilder: true });
    expectFeatures(ability, WorkspaceBranch, { allowed: ALL_ACTIONS });
  });
});
