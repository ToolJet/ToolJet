import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@entities/user.entity';
import { AppsRepository } from '@modules/apps/repository';
import { JWTPayload } from '@modules/session/types';

jest.mock('@modules/mcp-oauth/identity.service', () => ({ McpOAuthIdentityService: class {} }));
jest.mock('@modules/users/repositories/repository', () => ({ UserRepository: class {} }));
jest.mock('@modules/session/util.service', () => ({ SessionUtilService: class {} }));
jest.mock('@modules/session/repository', () => ({ UserSessionRepository: class {} }));
jest.mock('@modules/logging/service', () => ({ TransactionLogger: class {} }));
jest.mock('@otel/tracing', () => ({ trackUserActivity: jest.fn(), extractAppIdFromPath: jest.fn() }));
import { JwtStrategy } from '@modules/session/jwt/jwt.strategy';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';

const workspaceId = 'review-workspace';
const appId = 'f930d3a8-63e1-4ef1-8f7c-548c4a0b6c44';

describe.each(['delegation', 'viewer'] as const)('OAuth %s branch context', (kind) => {
  describe.each([false, true])('with an already validated principal: %s', (cached) => {
    function setup(query: Request['query'] = {}, headers: Request['headers'] = {}) {
      const user = Object.assign(new User(), {
        id: 'review-user',
        organizationId: workspaceId,
        oauthGrantId: 'review-grant',
        ...(kind === 'viewer' ? { oauthAppId: appId } : {}),
      });
      const session = { getDefaultBranchId: jest.fn().mockResolvedValue('default-branch') };
      const identity = {
        validateDelegation: jest.fn().mockResolvedValue(user),
        validateViewer: jest.fn().mockResolvedValue(user),
      };
      const strategy: JwtStrategy = Object.assign(Object.create(JwtStrategy.prototype), {
        sessionUtilService: session,
        mcpOAuthIdentityService: identity,
      });
      const request = {
        headers: {
          'tj-workspace-id': workspaceId,
          ...(kind === 'delegation' ? { 'x-tooljet-delegation': 'synthetic-credential' } : {}),
          ...headers,
        },
        cookies: kind === 'viewer' ? { tj_oauth_viewer: 'synthetic-viewer' } : {},
        query,
        ...(cached ? { oauthDelegatedUser: user } : {}),
        params: { id: appId },
      } as unknown as Request;
      const payload = {
        aud: `tooljet:mcp:${kind}`,
        oauthGrantId: 'review-grant',
        oauthAppId: user.oauthAppId,
      } as JWTPayload;
      return { user, session, identity, strategy, request, payload };
    }

    test.each([
      {
        query: { branch_id: ' feature-branch ' },
        headers: { 'x-branch-id': 'legacy-branch' },
        expected: 'feature-branch',
      },
      { query: {}, headers: { 'x-branch-id': ' legacy-branch ' }, expected: 'legacy-branch' },
      { query: {}, headers: {}, expected: 'default-branch' },
      { query: { branch_id: 'null' }, headers: {}, expected: 'default-branch' },
      { query: { branch_id: 'undefined' }, headers: {}, expected: 'default-branch' },
      { query: { branch_id: ' ' }, headers: {}, expected: 'default-branch' },
      { query: { branch_id: ['first', 'second'] }, headers: {}, expected: 'default-branch' },
    ])('resolves $expected for query=$query and headers=$headers', async ({ query, headers, expected }) => {
      const { user, session, identity, strategy, request, payload } = setup(query, headers);
      expect(await strategy.validate(request, payload)).toBe(user);
      expect(user.branchId).toBe(expected);
      if (expected === 'default-branch') expect(session.getDefaultBranchId).toHaveBeenCalledWith(workspaceId);
      else expect(session.getDefaultBranchId).not.toHaveBeenCalled();
      expect(identity[kind === 'viewer' ? 'validateViewer' : 'validateDelegation']).toHaveBeenCalledTimes(
        cached ? 0 : 1
      );
    });

    test('passes the selected branch into the app lookup used by branch-aware routes', async () => {
      const { strategy, request, payload } = setup({ branch_id: 'feature-branch' });
      request.user = (await strategy.validate(request, payload)) as User;
      const repository = { findById: jest.fn().mockResolvedValue({ id: appId, organizationId: workspaceId }) };
      const guard = new ValidAppGuard(repository as unknown as AppsRepository);
      const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(repository.findById).toHaveBeenCalledWith(appId, workspaceId, undefined, 'feature-branch');
    });

    test('does not resolve a branch when credential validation fails', async () => {
      const { session, identity, strategy, request, payload } = setup();
      if (cached) request.headers['tj-workspace-id'] = 'another-workspace';
      else {
        identity.validateDelegation.mockRejectedValue(new Error('Synthetic rejected credential'));
        identity.validateViewer.mockRejectedValue(new Error('Synthetic rejected credential'));
      }
      if (cached) expect(await strategy.validate(request, payload)).toBe(false);
      else await expect(strategy.validate(request, payload)).rejects.toThrow('Synthetic rejected credential');
      expect(session.getDefaultBranchId).not.toHaveBeenCalled();
    });

    if (kind === 'viewer' && cached) {
      test('rejects a cached viewer principal bound to a different app', async () => {
        const { session, identity, strategy, request, payload } = setup();
        payload.oauthAppId = 'bdac9c4a-28b4-46a3-9d98-339dbe3636c6';
        expect(await strategy.validate(request, payload)).toBe(false);
        expect(identity.validateViewer).not.toHaveBeenCalled();
        expect(session.getDefaultBranchId).not.toHaveBeenCalled();
      });
    }
  });
});
