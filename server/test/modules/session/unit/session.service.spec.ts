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
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppVersion } from '@entities/app_version.entity';

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

// Mock @otel/tracing — importing it for real runs the SDK auto-start block
jest.mock('@otel/tracing', () => ({
  trackUserActivity: jest.fn(),
  extractAppIdFromPath: jest.fn(),
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
  let appsRepository: any;
  let userRepository: any;

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
            findOne: jest.fn().mockResolvedValue(null),
            manager: { count: jest.fn().mockResolvedValue(0) },
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
    appsRepository = module.get(AppsRepository);
    userRepository = module.get(UserRepository);
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

  // -------------------------------------------------------------------------
  // getSessionDetails for token sessions
  // -------------------------------------------------------------------------
  describe('getSessionDetails | token sessions', () => {
    const tokenWorkspace = { id: 'org-orchard', slug: 'orchard', name: 'Orchard', status: 'active' };
    const otherWorkspace = { id: 'org-vineyard', slug: 'vineyard', name: 'Vineyard', status: 'active' };
    const pinnedApp = {
      id: 'app-harvest',
      slug: 'harvest',
      organizationId: tokenWorkspace.id,
      isPublic: false,
      currentVersionId: null,
    };
    const workspaceToken = {
      id: 'user-1',
      email: 'owner@orchard.test',
      defaultOrganizationId: otherWorkspace.id,
      organizationIds: [tokenWorkspace.id],
      organizationId: tokenWorkspace.id,
      isPATLogin: true,
      patScope: 'workspace',
    } as unknown as User;
    const renderSession = { ...workspaceToken, patAppId: pinnedApp.id } as unknown as User;

    beforeEach(() => {
      organizationRepository.fetchOrganization.mockImplementation(
        async (idOrSlug: string) =>
          [tokenWorkspace, otherWorkspace].find((org) => org.id === idOrSlug || org.slug === idOrSlug) as any
      );
      appsRepository.findOne.mockImplementation(async ({ where }) =>
        where.id === pinnedApp.id && where.organizationId === pinnedApp.organizationId ? pinnedApp : null
      );
    });

    it('should bootstrap the token workspace without changing the default workspace', async () => {
      await service.getSessionDetails(workspaceToken, tokenWorkspace.slug, '', null);

      expect(organizationRepository.fetchOrganization).toHaveBeenCalledWith(tokenWorkspace.id);
      expect(sessionUtilService.generateSessionPayload).toHaveBeenCalledWith(
        workspaceToken,
        tokenWorkspace,
        undefined,
        null
      );
      expect(userRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should refuse a workspace the token was not created for', async () => {
      organizationUserRepository.count.mockResolvedValue(1);

      await expect(service.getSessionDetails(workspaceToken, otherWorkspace.slug, '', null)).rejects.toThrow(
        ForbiddenException
      );
      expect(sessionUtilService.generateSessionPayload).not.toHaveBeenCalled();
    });

    it('should refuse an app from another workspace', async () => {
      appsRepository.retrieveAppDataUsingSlug.mockResolvedValue({
        organizationId: otherWorkspace.id,
        isPublic: false,
        isReleased: true,
      });

      await expect(service.getSessionDetails(workspaceToken, '', 'cellar', null)).rejects.toThrow(ForbiddenException);
      expect(sessionUtilService.generateSessionPayload).not.toHaveBeenCalled();
    });

    it('should open the pinned app of a render session', async () => {
      appsRepository.retrieveAppDataUsingSlug.mockResolvedValue({
        organizationId: tokenWorkspace.id,
        isPublic: false,
        isReleased: false,
      });

      await service.getSessionDetails(renderSession, tokenWorkspace.slug, pinnedApp.slug, null);

      expect(sessionUtilService.generateSessionPayload).toHaveBeenCalledWith(
        renderSession,
        tokenWorkspace,
        { organizationId: tokenWorkspace.id, isPublic: false, isReleased: false },
        null
      );
    });

    it('should refuse another app in the same workspace for a render session', async () => {
      await expect(service.getSessionDetails(renderSession, tokenWorkspace.slug, 'pantry', null)).rejects.toThrow(
        ForbiddenException
      );
      expect(appsRepository.manager.count).toHaveBeenCalledWith(AppVersion, {
        where: { appId: pinnedApp.id, slug: 'pantry' },
      });
      expect(sessionUtilService.generateSessionPayload).not.toHaveBeenCalled();
    });

    it('should open the embedded app by its slug for an embed session', async () => {
      const embedSession = {
        ...workspaceToken,
        patScope: 'app',
        patAppId: pinnedApp.id,
      } as unknown as User;
      appsRepository.retrieveAppDataUsingSlug.mockResolvedValue({
        organizationId: tokenWorkspace.id,
        isPublic: false,
        isReleased: true,
      });

      await service.getSessionDetails(embedSession, '', pinnedApp.slug, null);

      expect(sessionUtilService.generateSessionPayload).toHaveBeenCalledWith(
        embedSession,
        tokenWorkspace,
        { organizationId: tokenWorkspace.id, isPublic: false, isReleased: true },
        null
      );
    });

    it('should refuse a token session that names a second workspace', async () => {
      const widened = { ...workspaceToken, organizationIds: [tokenWorkspace.id, otherWorkspace.id] } as unknown as User;

      await expect(service.getSessionDetails(widened, '', '', null)).rejects.toThrow(ForbiddenException);
    });
  });
});
