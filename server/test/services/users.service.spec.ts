import { clearDB, createNestAppInstance, createUser } from '../test.helper';
import { UsersService } from '@ee/users/service';
import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * @group unit
 *
 * Tests for the EE UsersService (loaded when TOOLJET_EDITION=ee).
 * The CE stub throws "not implemented" for all methods; these tests
 * exercise the real EE implementations of:
 *   - findInstanceUsers (pagination + search)
 *   - updatePassword (validates, hashes, and persists new password)
 *   - autoUpdateUserPassword (generates random password, persists it)
 */
describe('UsersService', () => {
  let nestApp: INestApplication;
  let service: UsersService;
  let defaultDataSource: TypeOrmDataSource;

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<UsersService>(UsersService);
    defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await nestApp.close();
  });

  describe('findInstanceUsers', () => {
    it('should return users with pagination metadata', async () => {
      // Create two users in the same organization
      await createUser(nestApp, {
        email: 'alice@tooljet.io',
        firstName: 'Alice',
        lastName: 'Smith',
        groups: ['end-user', 'admin'],
      });
      await createUser(nestApp, {
        email: 'bob@tooljet.io',
        firstName: 'Bob',
        lastName: 'Jones',
        groups: ['end-user', 'admin'],
      });

      const result = await service.findInstanceUsers({ page: 1 });

      expect(result.meta).toBeDefined();
      expect(result.meta.total_count).toBeGreaterThanOrEqual(2);
      expect(result.meta.current_page).toBe(1);
      expect(result.meta.total_pages).toBeGreaterThanOrEqual(1);
      expect(result.users.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter users by search text matching email', async () => {
      await createUser(nestApp, {
        email: 'findme@tooljet.io',
        firstName: 'Find',
        lastName: 'Me',
        groups: ['end-user', 'admin'],
      });
      await createUser(nestApp, {
        email: 'other@tooljet.io',
        firstName: 'Other',
        lastName: 'Person',
        groups: ['end-user', 'admin'],
      });

      const result = await service.findInstanceUsers({
        page: 1,
        searchText: 'findme',
      });

      expect(result.users.length).toBeGreaterThanOrEqual(1);
      const emails = result.users.map((u) => u.email);
      expect(emails).toContain('findme@tooljet.io');
    });

    it('should filter users by search text matching first name', async () => {
      await createUser(nestApp, {
        email: 'unique1@tooljet.io',
        firstName: 'Xylophone',
        lastName: 'Doe',
        groups: ['end-user', 'admin'],
      });
      await createUser(nestApp, {
        email: 'unique2@tooljet.io',
        firstName: 'Charlie',
        lastName: 'Brown',
        groups: ['end-user', 'admin'],
      });

      const result = await service.findInstanceUsers({
        page: 1,
        searchText: 'Xylophone',
      });

      expect(result.users.length).toBe(1);
      expect(result.users[0].email).toBe('unique1@tooljet.io');
    });

    it('should return empty users array when search matches nothing', async () => {
      await createUser(nestApp, {
        email: 'someone@tooljet.io',
        groups: ['end-user', 'admin'],
      });

      const result = await service.findInstanceUsers({
        page: 1,
        searchText: 'zzz_nonexistent_zzz',
      });

      expect(result.users).toEqual([]);
      expect(result.meta.total_count).toBe(0);
    });
  });

  describe('updatePassword', () => {
    it('should update the user password and hash it', async () => {
      const { user } = await createUser(nestApp, {
        email: 'pwduser@tooljet.io',
        firstName: 'Pwd',
        lastName: 'User',
        groups: ['end-user', 'admin'],
      });

      // Read original password hash from DB
      const userBefore = await defaultDataSource.manager.findOneOrFail(User, {
        where: { id: user.id },
      });
      const originalPasswordHash = userBefore.password;

      const newPassword = 'NewSecurePassword123';
      await service.updatePassword(user.id, user, newPassword);

      // Read updated user from DB
      const userAfter = await defaultDataSource.manager.findOneOrFail(User, {
        where: { id: user.id },
      });

      // Password hash should have changed
      expect(userAfter.password).not.toEqual(originalPasswordHash);

      // The stored hash should be a valid bcrypt hash of the new password
      // Note: updateOne in UserRepository hashes the password with bcrypt before saving
      const isMatch = await bcrypt.compare(newPassword, userAfter.password);
      expect(isMatch).toBe(true);
    });

    it('should reset passwordRetryCount to 0', async () => {
      const { user } = await createUser(nestApp, {
        email: 'retryuser@tooljet.io',
        firstName: 'Retry',
        lastName: 'User',
        groups: ['end-user', 'admin'],
      });

      // Set a non-zero retry count first
      await defaultDataSource.manager.update(User, user.id, {
        passwordRetryCount: 5,
      });

      await service.updatePassword(user.id, user, 'AnotherPassword456');

      const userAfter = await defaultDataSource.manager.findOneOrFail(User, {
        where: { id: user.id },
      });
      expect(userAfter.passwordRetryCount).toBe(0);
    });
  });

  describe('autoUpdateUserPassword', () => {
    it('should generate and persist a new password, returning it in plaintext', async () => {
      const { user } = await createUser(nestApp, {
        email: 'autouser@tooljet.io',
        firstName: 'Auto',
        lastName: 'User',
        groups: ['end-user', 'admin'],
      });

      const userBefore = await defaultDataSource.manager.findOneOrFail(User, {
        where: { id: user.id },
      });
      const originalHash = userBefore.password;

      const newPassword = await service.autoUpdateUserPassword(user.id, user);

      // Should return a non-empty string
      expect(typeof newPassword).toBe('string');
      expect(newPassword.length).toBeGreaterThan(0);

      // DB password should have changed
      const userAfter = await defaultDataSource.manager.findOneOrFail(User, {
        where: { id: user.id },
      });
      expect(userAfter.password).not.toEqual(originalHash);

      // The returned plaintext password should match the stored hash
      const isMatch = await bcrypt.compare(newPassword, userAfter.password);
      expect(isMatch).toBe(true);
    });

    it('should reset passwordRetryCount to 0', async () => {
      const { user } = await createUser(nestApp, {
        email: 'autoreset@tooljet.io',
        firstName: 'AutoReset',
        lastName: 'User',
        groups: ['end-user', 'admin'],
      });

      await defaultDataSource.manager.update(User, user.id, {
        passwordRetryCount: 3,
      });

      await service.autoUpdateUserPassword(user.id, user);

      const userAfter = await defaultDataSource.manager.findOneOrFail(User, {
        where: { id: user.id },
      });
      expect(userAfter.passwordRetryCount).toBe(0);
    });
  });
});
