/**
 * SessionService Unit Tests
 *
 * Exercises terminateSession and getSessionDetails with fully mocked
 * repositories and utilities — no database or full NestJS app required.
 *
 * @group platform
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '@modules/session/service';
import { UserRepository } from '@modules/users/repositories/repository';
import { SessionUtilService } from '@modules/session/util.service';
import { AppsRepository } from '@modules/apps/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { User } from 'src/entities/user.entity';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { NotFoundException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Module-level mocks — replace side-effecting imports before any import runs
// ---------------------------------------------------------------------------

// Mock dbTransactionWrap so that the callback is invoked with a mock manager
const mockManager = {
  delete: jest.fn().mockResolvedValue(undefined),
};
jest.mock('src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((cb: (manager: any) => Promise<any>) => cb(mockManager)),
}));

// Mock OpenTelemetry metrics (they reference global tracer state)
jest.mock('@otel/tracing', () => ({
  decrementActiveSessions: jest.fn(),
  decrementConcurrentUsers: jest.fn(),
  incrementActiveSessions: jest.fn(),
  incrementConcurrentUsers: jest.fn(),
}));

// Mock RequestContext (CLS-based, not available outside HTTP context)
jest.mock('@modules/request-context/service', () => ({
  RequestContext: {
    setLocals: jest.fn(),
  },
}));

describe('SessionService', () => {
  let service: SessionService;
  let sessionUtilService: jest.Mocked<SessionUtilService>;
  let organizationRepository: jest.Mocked<OrganizationRepository>;
  let organizationUserRepository: jest.Mocked<OrganizationUsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: UserRepository,
          useValue: {
            updateOne: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SessionUtilService,
          useValue: {
            getClearCookieOptions: jest.fn().mockReturnValue({
              httpOnly: true,
              secure: false,
              sameSite: 'strict' as const,
            }),
            generateSessionPayload: jest.fn().mockResolvedValue({
              current_organization_id: 'org-1',
              current_organization_name: 'Test Org',
            }),
            checkUserWorkspaceStatus: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: AppsRepository,
          useValue: {
            retrieveAppDataUsingSlug: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: OrganizationRepository,
          useValue: {
            fetchOrganization: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: OrganizationUsersRepository,
          useValue: {
            count: jest.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionUtilService = module.get(SessionUtilService);
    organizationRepository = module.get(OrganizationRepository);
    organizationUserRepository = module.get(OrganizationUsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // terminateSession
  // -------------------------------------------------------------------------
  describe('terminateSession', () => {
    it('should delete the user session and clear the auth cookie', async () => {
      const user = {
        id: 'user-1',
        email: 'admin@tooljet.io',
        organizationId: 'org-1',
      } as unknown as User;

      const sessionId = 'session-abc';

      const response = {
        clearCookie: jest.fn(),
      } as any;

      await service.terminateSession(user, sessionId, response);

      // Cookie must be cleared
      expect(response.clearCookie).toHaveBeenCalledWith('tj_auth_token', expect.objectContaining({ httpOnly: true }));

      // The mock manager.delete should have been called with correct entity & criteria
      expect(mockManager.delete).toHaveBeenCalledWith(UserSessions, {
        id: sessionId,
        userId: user.id,
      });
    });
  });

  // -------------------------------------------------------------------------
  // getSessionDetails
  // -------------------------------------------------------------------------
  describe('getSessionDetails', () => {
    const baseUser = {
      id: 'user-1',
      email: 'admin@tooljet.io',
      defaultOrganizationId: 'org-1',
      organizationIds: ['org-1'],
    } as unknown as User;

    it('should return session details for a valid user with workspace slug', async () => {
      const mockOrg = { id: 'org-1', slug: 'test-org', name: 'Test Org', status: 'active' };
      organizationRepository.fetchOrganization.mockResolvedValue(mockOrg as any);
      organizationUserRepository.count.mockResolvedValue(1);

      const result = await service.getSessionDetails(baseUser, 'test-org', '', null);

      expect(organizationRepository.fetchOrganization).toHaveBeenCalledWith('test-org');
      expect(sessionUtilService.generateSessionPayload).toHaveBeenCalledWith(baseUser, mockOrg, undefined, null);
      expect(result).toEqual({
        current_organization_id: 'org-1',
        current_organization_name: 'Test Org',
      });
    });

    it('should throw NotFoundException when workspace slug does not resolve', async () => {
      organizationRepository.fetchOrganization.mockResolvedValue(null);

      await expect(service.getSessionDetails(baseUser, 'nonexistent-slug', '', null)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should return session details when no workspace slug or appId provided', async () => {
      const result = await service.getSessionDetails(baseUser, '', '', null);

      // When neither workspaceSlug nor appId is provided, the service should
      // still call generateSessionPayload with undefined currentOrganization
      expect(sessionUtilService.generateSessionPayload).toHaveBeenCalledWith(baseUser, undefined, undefined, null);
      expect(result).toBeDefined();
    });
  });
});
