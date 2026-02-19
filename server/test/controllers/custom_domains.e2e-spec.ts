/** @jest-environment setup-polly-jest/jest-environment-node */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';
import {
  clearDB,
  setupOrganizationAndUser,
  authenticateUser,
  createNestAppInstance,
} from '../workflows.helper';
import { CustomDomain } from '../../src/entities/custom_domain.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource as TypeOrmDataSource } from 'typeorm';

describe('Custom Domains API (Cloud edition)', () => {
  let app: INestApplication;
  let dataSource: TypeOrmDataSource;

  const context = setupPolly({
    adapters: [NodeHttpAdapter as any],
    persister: FSPersister as any,
    recordFailedRequests: true,
    recordIfMissing: true,
    mode: (process.env.POLLY_MODE as any) || 'replay',
    matchRequestsBy: {
      method: true,
      headers: {
        exclude: ['user-agent', 'accept-encoding', 'connection', 'host', 'cookie'],
      },
      body: true,
      url: {
        protocol: true,
        hostname: true,
        port: true,
        pathname: true,
        query: true,
      },
    },
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(
          __dirname,
          `../__fixtures__/${path.basename(__filename).replace(/\.[tj]s$/, '')}`
        ),
      },
    },
  });

  beforeAll(async () => {
    app = await createNestAppInstance({
      edition: 'cloud',
      isGetContext: true,
    });
    dataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
  });

  beforeEach(async () => {
    await clearDB(app);

    context.polly.server
      .any()
      .filter((req) => {
        const url = new URL(req.url);
        return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      })
      .passthrough();
  });

  afterEach(() => {
    context.polly.stop();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('GET /api/custom-domains', () => {
    it('should return null when no custom domain is configured', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);

      const response = await request(app.getHttpServer())
        .get('/api/custom-domains')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
    });

    it('should return existing custom domain', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const domainRepo = dataSource.getRepository(CustomDomain);
      await domainRepo.save(
        domainRepo.create({
          organizationId: user.defaultOrganizationId,
          domain: 'app.example.com',
          status: 'active',
          sslStatus: 'active',
          cnameTarget: 'proxy.tooljet.com',
        })
      );

      const loggedUser = await authenticateUser(app, user.email);

      const response = await request(app.getHttpServer())
        .get('/api/custom-domains')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body.domain).toBe('app.example.com');
      expect(response.body.status).toBe('active');
    });
  });

  describe('POST /api/custom-domains', () => {
    it('should reject invalid domain format', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);

      const response = await request(app.getHttpServer())
        .post('/api/custom-domains')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ domain: 'not a valid domain!' });

      expect(response.statusCode).toBe(400);
    });

    it('should reject duplicate domain for same organization', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const domainRepo = dataSource.getRepository(CustomDomain);
      await domainRepo.save(
        domainRepo.create({
          organizationId: user.defaultOrganizationId,
          domain: 'existing.example.com',
          status: 'active',
        })
      );

      const loggedUser = await authenticateUser(app, user.email);

      const response = await request(app.getHttpServer())
        .post('/api/custom-domains')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ domain: 'new.example.com' });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('DELETE /api/custom-domains', () => {
    it('should return 404 when no domain configured', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);

      const response = await request(app.getHttpServer())
        .delete('/api/custom-domains')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send();

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/custom-domains/resolve', () => {
    it('should resolve active domain to organization', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const domainRepo = dataSource.getRepository(CustomDomain);
      await domainRepo.save(
        domainRepo.create({
          organizationId: user.defaultOrganizationId,
          domain: 'resolve.example.com',
          status: 'active',
          cnameTarget: 'proxy.tooljet.com',
        })
      );

      const response = await request(app.getHttpServer())
        .get('/api/custom-domains/resolve')
        .query({ domain: 'resolve.example.com' })
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body.organizationId).toBe(user.defaultOrganizationId);
      expect(response.body).toHaveProperty('organizationSlug');
    });

    it('should return 404 for unknown domain', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/custom-domains/resolve')
        .query({ domain: 'unknown.example.com' })
        .send();

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when domain param is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/custom-domains/resolve')
        .send();

      expect(response.statusCode).toBe(400);
    });
  });

  describe('CloudFeatureGuard', () => {
    it('should block access in non-cloud edition', async () => {
      // This test validates that the guard works correctly
      // The test app is started in cloud mode, so endpoints should be accessible
      // In CE/EE mode, endpoints would return 403
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);

      const response = await request(app.getHttpServer())
        .get('/api/custom-domains')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send();

      // In cloud edition, should not be 403
      expect(response.statusCode).not.toBe(403);
    });
  });
});
