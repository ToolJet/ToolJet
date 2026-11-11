import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.LIST_BRANCHES]: FeatureConfig;
  [FEATURE_KEY.CREATE_BRANCH]: FeatureConfig;
  [FEATURE_KEY.SWITCH_BRANCH]: FeatureConfig;
  [FEATURE_KEY.DELETE_BRANCH]: FeatureConfig;
  [FEATURE_KEY.PUSH_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.PULL_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.RESOLVE_CONFLICTS]: FeatureConfig;
  [FEATURE_KEY.CHECK_UPDATES]: FeatureConfig;
  [FEATURE_KEY.LIST_REMOTE_BRANCHES]: FeatureConfig;
  [FEATURE_KEY.FETCH_PULL_REQUESTS]: FeatureConfig;
  [FEATURE_KEY.ENSURE_DRAFT]: FeatureConfig;
  [FEATURE_KEY.PULL_APP]: FeatureConfig;
  [FEATURE_KEY.PULL_MODULE]: FeatureConfig;
  [FEATURE_KEY.GET_ENTITY_TAGS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.WORKSPACE_BRANCHES]: Features;
}

export type PullCategory = 'dataSources' | 'apps' | 'modules' | 'workflows';

export interface PullResourceCounts {
  imported: number;
  skipped: number;
  stale: number;
  outdated: number;
  errors: number;
}

// Where a workspace pull spent its time and which shortcuts kicked in. Same shape in the
// POST /workspace-branches/pull response (stage=request) and git-sync notification metadata (stage=job).
export interface PullDiagnostics {
  stage: 'request' | 'job';
  pod: string; // hashed hostname: git mirror cache is per-pod disk
  attempt?: number;
  totalMs: number;
  phases: Record<string, number>; // ms; prefix net_ / db_ / code_ / wait_ says where
  skips: {
    headUnchanged?: boolean;
    categories?: Partial<Record<PullCategory, boolean>>; // true = tree SHA unchanged, skipped
  };
  gitCache?: {
    enabled: boolean;
    hit: boolean;
    mirrorBuilt?: boolean; // true = cold mirror on this pod
    mirrorFetchMs?: number;
    mirrorLockWaitMs?: number;
  };
  resources?: Partial<Record<Exclude<PullCategory, 'dataSources'>, PullResourceCounts>>;
}
