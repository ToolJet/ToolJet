import { SAFE_USER_SELECT_FIELDS, SAFE_USER_QB_COLUMNS } from '../../../src/modules/users/constants';
import { RolesRepository } from '../../../src/modules/roles/repository';
import { GroupPermissionsRepository } from '../../../src/modules/group-permissions/repository';
import { OrganizationUsersRepository } from '../../../src/modules/organization-users/repository';
import { OrganizationUsersUtilService } from '../../../src/modules/organization-users/util.service';
import { USER_ROLE } from '../../../src/modules/group-permissions/constants';
import { DataSource } from 'typeorm';

describe('User Entity Sanitization and Safe Select', () => {
  describe('SAFE_USER_SELECT_FIELDS definition', () => {
    it('should include standard user profile fields', () => {
      expect(SAFE_USER_SELECT_FIELDS.id).toBe(true);
      expect(SAFE_USER_SELECT_FIELDS.email).toBe(true);
      expect(SAFE_USER_SELECT_FIELDS.firstName).toBe(true);
      expect(SAFE_USER_SELECT_FIELDS.lastName).toBe(true);
      expect(SAFE_USER_SELECT_FIELDS.status).toBe(true);
    });

    it('should strictly exclude sensitive security fields', () => {
      const sensitiveKeys = [
        'password',
        'invitationToken',
        'forgotPasswordToken',
        'expiredPasswordToken',
        'passwordRetryCount',
        'passwordExpiry',
        'invitationTokenExpiry',
        'forgotPasswordTokenExpiry',
      ];

      for (const key of sensitiveKeys) {
        expect((SAFE_USER_SELECT_FIELDS as any)[key]).toBeUndefined();
      }
    });

    it('should define safe query builder columns excluding password and tokens', () => {
      expect(SAFE_USER_QB_COLUMNS).toContain('user.id');
      expect(SAFE_USER_QB_COLUMNS).toContain('user.email');
      expect(SAFE_USER_QB_COLUMNS).toContain('user.firstName');
      expect(SAFE_USER_QB_COLUMNS).not.toContain('user.password');
      expect(SAFE_USER_QB_COLUMNS).not.toContain('user.invitationToken');
      expect(SAFE_USER_QB_COLUMNS).not.toContain('user.forgotPasswordToken');
    });
  });

  describe('RolesRepository.getRoleUsersList', () => {
    let rolesRepo: RolesRepository;
    let mockManager: any;

    beforeEach(() => {
      const mockDataSource = {
        createEntityManager: jest.fn().mockReturnValue({}),
      } as unknown as DataSource;
      rolesRepo = new RolesRepository(mockDataSource);
      mockManager = {
        find: jest.fn().mockResolvedValue([]),
      };
    });

    it('should query users with SAFE_USER_SELECT_FIELDS', async () => {
      await rolesRepo.getRoleUsersList(USER_ROLE.ADMIN, 'org-123', undefined, mockManager);

      expect(mockManager.find).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          select: SAFE_USER_SELECT_FIELDS,
        })
      );
    });
  });

  describe('OrganizationUsersRepository.findByInvitationToken', () => {
    let orgUsersRepo: OrganizationUsersRepository;

    beforeEach(() => {
      const mockDataSource = {
        createEntityManager: jest.fn().mockReturnValue({}),
      } as unknown as DataSource;
      orgUsersRepo = new OrganizationUsersRepository(mockDataSource);
      orgUsersRepo.findOne = jest.fn().mockResolvedValue(null);
    });

    it('should select safe user fields when looking up by invitation token', async () => {
      await orgUsersRepo.findByInvitationToken('invite-token-abc');

      expect(orgUsersRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { invitationToken: 'invite-token-abc' },
          select: expect.objectContaining({
            user: SAFE_USER_SELECT_FIELDS,
          }),
        })
      );
    });
  });

  describe('OrganizationUsersUtilService.findInvitingUserByEmail', () => {
    let utilService: OrganizationUsersUtilService;
    let mockManager: any;

    beforeEach(() => {
      utilService = new OrganizationUsersUtilService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any
      );
      mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };
    });

    it('should query user with SAFE_USER_SELECT_FIELDS', async () => {
      await utilService.findInvitingUserByEmail('test@example.com', mockManager);

      expect(mockManager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: { email: 'test@example.com' },
          select: expect.objectContaining({
            id: true,
            email: true,
            firstName: true,
          }),
        })
      );
    });
  });
});
