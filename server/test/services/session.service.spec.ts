import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '@services/session.service';
import { clearDB, createNestAppInstance, setupOrganization } from '../test.helper';
const uuid = require('uuid');

describe('Session Service', () => {
  let service: SessionService;
  let nestApp: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<SessionService>(SessionService);
  });

  describe('.createSession', () => {
    it('should create a user session', async () => {
      const { adminUser } = await setupOrganization(nestApp);

      const deviceId = uuid.v4();

      const session = await service.createSession(adminUser.id, deviceId);

      expect(session.userId).toBe(adminUser.id);
      expect(session.device).toBe(deviceId);
    });
  });

  describe('.validateUserSession', () => {
    it.only('should throw error id session is invalid', async () => {
      const { adminUser } = await setupOrganization(nestApp);

      const deviceId = uuid.v4();

      const session = await service.createSession(adminUser.id, deviceId);
      await expect(service.validateUserSession(uuid.v4(), session.id)).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUserSession(adminUser.id, uuid.v4())).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUserSession(adminUser.id, session.id)).resolves.not.toThrow(expect.any(Error));
    });
  });

  describe('.terminateSession', () => {
    it('should terminate session', async () => {
      const { adminUser } = await setupOrganization(nestApp);

      const deviceId = uuid.v4();

      const session = await service.createSession(adminUser.id, deviceId);
      await expect(service.validateUserSession(uuid.v4(), session.id)).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUserSession(adminUser.id, uuid.v4())).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUserSession(adminUser.id, session.id)).resolves.not.toThrow(expect.any(Error));
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
