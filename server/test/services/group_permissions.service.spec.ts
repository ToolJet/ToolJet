import { INestApplication, BadRequestException } from '@nestjs/common';
import { GroupPermissionsService } from '@services/group_permissions.service';
import { clearDB, createNestAppInstance, setupOrganization } from '../test.helper';

describe('GroupPermissionsService', () => {
  let service: GroupPermissionsService;
  let nestApp: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<GroupPermissionsService>(GroupPermissionsService);
  });

  describe('.create', () => {
    it('should pass group name', async () => {
      const { adminUser } = await setupOrganization(nestApp);

      await expect(service.create(adminUser, '')).rejects.toEqual(
        new BadRequestException('Cannot create group without name')
      );
    });
  });

  describe('.addSingleUserToGroup', () => {
    it('should successfully add user to group and return correct response', async () => {
      const { adminUser, organization, user } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      const result = await service.addSingleUserToGroup(
        group.id,
        user.id,
        organization.id,
        adminUser
      );

      expect(result).toHaveProperty('message', 'User added to group successfully');
      expect(result).toHaveProperty('userId', user.id);
      expect(result).toHaveProperty('groupId', group.id);
      expect(result).toHaveProperty('groupUserId');
      expect(result.groupUserId).toBeDefined();
    });

    it('should return success when user already exists in group (idempotent)', async () => {
      const { adminUser, organization, user } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add user first time
      const firstResult = await service.addSingleUserToGroup(
        group.id,
        user.id,
        organization.id,
        adminUser
      );

      // Add user second time (should be idempotent)
      const secondResult = await service.addSingleUserToGroup(
        group.id,
        user.id,
        organization.id,
        adminUser
      );

      expect(secondResult).toHaveProperty('message', 'User already exists in group');
      expect(secondResult.userId).toEqual(user.id);
      expect(secondResult.groupId).toEqual(group.id);
      expect(secondResult.groupUserId).toEqual(firstResult.groupUserId);
    });

    it('should reject non-existent user', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');
      const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

      await expect(
        service.addSingleUserToGroup(group.id, nonExistentUserId, organization.id, adminUser)
      ).rejects.toThrow();
    });

    it('should reject adding user to group in different organization', async () => {
      const { adminUser: admin1, organization: org1 } = await setupOrganization(nestApp);
      const { adminUser: admin2, user: user2, organization: org2 } = await setupOrganization(nestApp);

      const group1 = await service.create(admin1, 'Org1 Group');

      // Try to add user from org2 to group in org1
      await expect(
        service.addSingleUserToGroup(group1.id, user2.id, org1.id, admin1)
      ).rejects.toThrow();
    });
  });

  describe('.removeSingleUserFromGroup', () => {
    it('should successfully remove user from group', async () => {
      const { adminUser, organization, user } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add user to group first
      await service.addSingleUserToGroup(group.id, user.id, organization.id, adminUser);

      // Remove user from group
      await expect(
        service.removeSingleUserFromGroup(group.id, user.id, organization.id, adminUser)
      ).resolves.toBeUndefined();
    });

    it('should return success when user not in group (idempotent behavior)', async () => {
      const { adminUser, organization, user } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Try to remove user that was never added (should succeed - idempotent)
      await expect(
        service.removeSingleUserFromGroup(group.id, user.id, organization.id, adminUser)
      ).resolves.toBeUndefined();
    });

    it('should throw MethodNotAllowedException when trying to remove user from default group', async () => {
      const { adminUser, organization, user, defaultUserGroup } = await setupOrganization(nestApp);

      // Try to remove user from default group
      await expect(
        service.removeSingleUserFromGroup(defaultUserGroup.id, user.id, organization.id, adminUser)
      ).rejects.toThrow('Cannot delete users from default groups');
    });

    it('should reject removing user from group in different organization', async () => {
      const { adminUser: admin1, organization: org1 } = await setupOrganization(nestApp);
      const { adminUser: admin2, user: user2, organization: org2 } = await setupOrganization(nestApp);

      const group1 = await service.create(admin1, 'Org1 Group');

      // Try to remove user from org1 group using org2 context
      await expect(
        service.removeSingleUserFromGroup(group1.id, user2.id, org2.id, admin2)
      ).rejects.toThrow();
    });

    it('should throw error for non-existent group', async () => {
      const { adminUser, organization, user } = await setupOrganization(nestApp);
      const nonExistentGroupId = '00000000-0000-0000-0000-000000000000';

      await expect(
        service.removeSingleUserFromGroup(nonExistentGroupId, user.id, organization.id, adminUser)
      ).rejects.toThrow();
    });
  });

  describe('.getAllGroupUsers', () => {
    it('should return all users when no pagination params provided (backward compatibility)', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add multiple users to the group
      const users = [];
      for (let i = 0; i < 15; i++) {
        const { user } = await setupOrganization(nestApp, { enableSignup: true });
        await service.addSingleUserToGroup(group.id, user.id, organization.id, adminUser);
        users.push(user);
      }

      const result = await service.getAllGroupUsers(group, organization.id);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(15);
    });

    it('should return paginated response when pagination params provided', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add 25 users to the group
      for (let i = 0; i < 25; i++) {
        const { user } = await setupOrganization(nestApp, { enableSignup: true });
        await service.addSingleUserToGroup(group.id, user.id, organization.id, adminUser);
      }

      const result = await service.getAllGroupUsers(group, organization.id, undefined, 1, 10);

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('pagination');
      expect(result.users.length).toBe(10);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('should calculate totalPages correctly', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add 120 users to test edge case
      for (let i = 0; i < 120; i++) {
        const { user } = await setupOrganization(nestApp, { enableSignup: true });
        await service.addSingleUserToGroup(group.id, user.id, organization.id, adminUser);
      }

      const result = await service.getAllGroupUsers(group, organization.id, undefined, 1, 50);

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.total).toBe(120);
    });

    it('should return correct page of results', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add users with identifiable data
      const addedUsers = [];
      for (let i = 0; i < 30; i++) {
        const { user } = await setupOrganization(nestApp, { enableSignup: true });
        await service.addSingleUserToGroup(group.id, user.id, organization.id, adminUser);
        addedUsers.push(user.id);
      }

      const page1 = await service.getAllGroupUsers(group, organization.id, undefined, 1, 10);
      const page2 = await service.getAllGroupUsers(group, organization.id, undefined, 2, 10);

      expect(page1.users.length).toBe(10);
      expect(page2.users.length).toBe(10);
      expect(page2.pagination.page).toBe(2);

      // Verify pages contain different users
      const page1Ids = page1.users.map(u => u.user.id);
      const page2Ids = page2.users.map(u => u.user.id);
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('should work with searchInput filter and pagination', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add users with specific names
      for (let i = 0; i < 20; i++) {
        const { user } = await setupOrganization(nestApp, {
          enableSignup: true,
          firstName: i < 10 ? 'John' : 'Jane',
        });
        await service.addSingleUserToGroup(group.id, user.id, organization.id, adminUser);
      }

      const result = await service.getAllGroupUsers(group, organization.id, 'john', 1, 5);

      expect(result.users.length).toBeLessThanOrEqual(5);
      expect(result.pagination.total).toBeLessThanOrEqual(10);
      result.users.forEach(groupUser => {
        expect(groupUser.user.firstName.toLowerCase()).toContain('john');
      });
    });

    it('should handle empty group with pagination correctly', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Empty Test Group');

      const result = await service.getAllGroupUsers(group, organization.id, undefined, 1, 50);

      expect(result.users.length).toBe(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should handle last page with fewer items than limit', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add 23 users (last page will have 3 users with limit of 10)
      for (let i = 0; i < 23; i++) {
        const { user } = await setupOrganization(nestApp, { enableSignup: true });
        await service.addSingleUserToGroup(group.id, user.id, organization.id, adminUser);
      }

      const lastPage = await service.getAllGroupUsers(group, organization.id, undefined, 3, 10);

      expect(lastPage.users.length).toBe(3);
      expect(lastPage.pagination.page).toBe(3);
      expect(lastPage.pagination.totalPages).toBe(3);
    });

    it('should return empty array for page beyond total pages', async () => {
      const { adminUser, organization } = await setupOrganization(nestApp);
      const group = await service.create(adminUser, 'Test Group');

      // Add 10 users
      for (let i = 0; i < 10; i++) {
        const { user } = await setupOrganization(nestApp, { enableSignup: true });
        await service.addSingleUserToGroup(group.id, user.id, organization.id, adminUser);
      }

      const result = await service.getAllGroupUsers(group, organization.id, undefined, 10, 10);

      expect(result.users.length).toBe(0);
      expect(result.pagination.total).toBe(10);
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
