/**
 * JwtStrategy — last-active-branch tier in resolveBranchId (via validate()).
 * @group platform
 */
jest.mock('@otel/tracing', () => ({ trackUserActivity: jest.fn(), extractAppIdFromPath: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@entities/user.entity';
import { JwtStrategy } from '@modules/session/jwt/jwt.strategy';
import { SessionUtilService } from '@modules/session/util.service';
import { UserRepository } from '@modules/users/repositories/repository';
import { UserSessionRepository } from '@modules/session/repository';
import { TransactionLogger } from '@modules/logging/service';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy — branch resolution', () => {
  let strategy: JwtStrategy;
  let sessionUtilService: jest.Mocked<SessionUtilService>;
  let userRepository: jest.Mocked<UserRepository>;

  const baseUser = { id: 'user-1', organizationIds: ['org-1'] } as any;
  // organizationId comes from the tj-workspace-id header (see JwtStrategy.validate); every
  // test needs it set so the request reaches resolveBranchId instead of short-circuiting.
  const req = (overrides: any = {}) =>
    ({ headers: { 'tj-workspace-id': 'org-1' }, cookies: {}, query: {}, ...overrides }) as any;
  const payload = { sub: 'user@example.com', organizationIds: ['org-1'], sessionId: 's1' } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
        {
          provide: SessionUtilService,
          useValue: {
            validateUserSession: jest.fn(),
            findOrganization: jest.fn(),
            getActiveOrDefaultBranchId: jest.fn(),
          },
        },
        { provide: UserRepository, useValue: { findByEmail: jest.fn() } },
        { provide: UserSessionRepository, useValue: {} },
        { provide: TransactionLogger, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    sessionUtilService = module.get(SessionUtilService);
    userRepository = module.get(UserRepository);
  });

  it('uses the query param branch_id and marks it explicit', async () => {
    userRepository.findByEmail.mockResolvedValue({ ...baseUser, organizationUsers: [] });
    const result = (await strategy.validate(req({ query: { branch_id: 'branch-x' } }), payload)) as unknown as User;
    expect(result.branchId).toBe('branch-x');
    expect(result.branchIdExplicit).toBe(true);
    expect(sessionUtilService.getActiveOrDefaultBranchId).not.toHaveBeenCalled();
  });

  it('falls to the last-active/default tier when nothing explicit is given, and marks it non-explicit', async () => {
    userRepository.findByEmail.mockResolvedValue({ ...baseUser, organizationUsers: [] });
    sessionUtilService.getActiveOrDefaultBranchId.mockResolvedValue('branch-last-active');
    const result = (await strategy.validate(req(), payload)) as unknown as User;
    expect(result.branchId).toBe('branch-last-active');
    expect(result.branchIdExplicit).toBe(false);
    expect(sessionUtilService.getActiveOrDefaultBranchId).toHaveBeenCalledWith('org-1', 'user-1');
  });
});
