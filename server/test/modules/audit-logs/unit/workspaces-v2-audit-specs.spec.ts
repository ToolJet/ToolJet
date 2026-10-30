/** @group platform */
import { FEATURES } from '@modules/organizations/constants/feature';
import { FEATURE_KEY } from '@modules/organizations/constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';
import { findAuditSpecProblems } from '@modules/audit-logs/events/coverage';
import { buildActor, UNNAMED_TOKEN_LABEL } from '@modules/audit-logs/events/request-utils';
import { AuditableRequest } from '@modules/audit-logs/events/types';
import { WorkspaceAuditAdapter } from '@ee/audit-logs/events/adapters/workspace.adapter';

const WORKSPACES_V2_FEATURES = [
  FEATURE_KEY.CREATE_WORKSPACE_V2,
  FEATURE_KEY.LIST_WORKSPACES_V2,
  FEATURE_KEY.GET_WORKSPACE_V2,
  FEATURE_KEY.UPDATE_WORKSPACE_V2,
  FEATURE_KEY.ARCHIVE_WORKSPACE_V2,
  FEATURE_KEY.UNARCHIVE_WORKSPACE_V2,
  FEATURE_KEY.SET_DEFAULT_WORKSPACE_V2,
];

// Workspaces v2 features live in the organizations module, beside the dashboard workspace features.
const workspaceFeatures = FEATURES[MODULES.ORGANIZATIONS] as unknown as Record<string, FeatureConfig>;
const adapterTypes = [new WorkspaceAuditAdapter(null).targetType];

const requestWith = (overrides: Partial<AuditableRequest>): AuditableRequest =>
  ({ headers: { 'user-agent': 'curl/8' }, socket: {}, ...overrides }) as unknown as AuditableRequest;

describe('Workspaces v2 audit specs', () => {
  it('should give every Workspaces v2 route a valid audit decision', () => {
    expect(findAuditSpecProblems(workspaceFeatures, WORKSPACES_V2_FEATURES, adapterTypes)).toEqual([]);
  });

  it('should flag a route that has no audit decision', () => {
    const features = { ...workspaceFeatures, [FEATURE_KEY.ARCHIVE_WORKSPACE_V2]: { license: undefined } };
    expect(findAuditSpecProblems(features, [FEATURE_KEY.ARCHIVE_WORKSPACE_V2], adapterTypes)).toEqual([
      expect.stringContaining('no audit spec'),
    ]);
  });

  it('should no longer mark Workspaces v2 routes public, so PAT callers reach the permission check', () => {
    for (const key of WORKSPACES_V2_FEATURES) {
      expect(workspaceFeatures[key].isPublic).toBeFalsy();
    }
  });
});

describe('buildActor', () => {
  const user = { id: 'u1', firstName: 'Priya', lastName: 'Nair', email: 'priya@acme.com' };

  it('should record the shared secret as an api_key actor with no user or token', () => {
    expect(buildActor(requestWith({ tj_auth: 'api_key' }))).toMatchObject({ type: 'api_key', user: null, token: null });
  });

  it('should record a PAT caller as the token owner plus the token', () => {
    const actor = buildActor(
      requestWith({ tj_auth: 'pat', user, personalAccessToken: { id: 'pat1', name: 'ci-deploy' } } as never)
    );
    expect(actor).toMatchObject({
      type: 'pat',
      user: { id: 'u1', name: 'Priya Nair', email: 'priya@acme.com' },
      token: { id: 'pat1', name: 'ci-deploy' },
      user_agent: 'curl/8',
    });
  });

  it('should label a PAT that has no name', () => {
    const actor = buildActor(
      requestWith({ tj_auth: 'pat', user, personalAccessToken: { id: 'pat1', name: null } } as never)
    );
    expect(actor.token).toEqual({ id: 'pat1', name: UNNAMED_TOKEN_LABEL });
  });

  it('should attribute nobody when there is neither a user nor an API key', () => {
    expect(buildActor(requestWith({}))).toBeNull();
  });
});
