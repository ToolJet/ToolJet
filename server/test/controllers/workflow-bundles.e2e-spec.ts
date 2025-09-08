/** @jest-environment setup-polly-jest/jest-environment-node */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';
import * as fs from 'fs';
import {
  clearDB,
  setupOrganizationAndUser,
  authenticateUser,
  createWorkflowForUser,
  createApplicationVersion,
  createNestAppInstance,
  createFeatureMocks,
} from '../workflows.helper';
import { WorkflowBundle } from '../../src/entities/workflow_bundle.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource as TypeOrmDataSource } from 'typeorm';

// Helper functions for flexible response assertions
const expectSemVer = () => expect.stringMatching(/^\d+\.\d+\.\d+/);
const expectISO8601 = () => expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
const expectBundleStatus = () => expect.stringMatching(/^(none|building|ready|failed)$/);
const expectSHA256 = () => expect.stringMatching(/^[a-f0-9]{64}$/);

/**
 * @group workflows
 */
describe('Enterprise Edition - workflow bundle management controller', () => {
  let app: INestApplication;

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
        recordingsDir: path.resolve(__dirname, '../__fixtures__/workflow-bundles-e2e'),
      },
    },
  });

  beforeEach(async () => {
    await clearDB(app);

    // Configure Polly.js to only pass through localhost calls
    // External API calls (like NPM registry) will be recorded
    context.polly.server
      .any()
      .filter(req => {
        const url = new URL(req.url);
        // Pass through localhost and internal calls without recording
        return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.includes('host.docker.internal');
      })
      .passthrough();
    // All other requests (external APIs) will be handled by Polly's recording mechanism
  });

  beforeAll(async () => {
    const featureMocks = await createFeatureMocks();
    app = await createNestAppInstance({
      edition: 'ee',
      isGetContext: true,
      mockProviders: featureMocks,
    });
  });

  afterEach(() => {
    context.polly.stop();
  });

  describe('GET /api/workflows/packages/search', () => {
    it('should search NPM packages with valid query', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/search')
        .query({ q: 'lodash', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.length).toBeLessThanOrEqual(5);

      // Validate exact PackageSearchResult structure
      console.log(JSON.stringify(response.body, null, 2));
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            version: expectSemVer(),
            description: expect.any(String),
            downloads: expect.any(Number),
            links: expect.any(Object),
            author: expect.any(String),
            keywords: expect.arrayContaining([expect.any(String)]),
            modified: expectISO8601()
          })
        ])
      );

      // Validate specific search result content
      expect(response.body[0].name).toContain('lodash');
    });

    it('should handle scoped packages in search', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/search')
        .query({ q: '@types/node', limit: 3 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(3);

      // Validate PackageSearchResult structure for scoped packages
      if (response.body.length > 0) {
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringMatching(/^@[a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-~][a-z0-9-._~]*$/), // NPM scoped package pattern
              version: expectSemVer(),
              description: expect.any(String)
            })
          ])
        );
        expect(response.body[0].name).toContain('@types');
      }
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/search')
        .query({ q: 'lodash' })
        .send();

      expect(response.statusCode).toBe(401);

      // Validate standard NestJS 401 error response structure
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized'
        })
      );
    });
  });

  describe('GET /api/workflows/:workflowId/packages', () => {
    it('should get empty dependencies for new workflow', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);

      // Validate exact GetPackagesResult structure
      expect(response.body).toEqual(
        expect.objectContaining({
          dependencies: expect.any(Object)
        })
      );

      // Verify empty dependencies for new workflow
      expect(Object.keys(response.body.dependencies)).toHaveLength(0);
    });

    it('should get existing dependencies for workflow with packages', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow-with-deps');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // First, add some dependencies to the workflow
      const dependencies = {
        'lodash': '4.17.21',
        'is-odd': '3.0.1',
        'uuid': '9.0.0'
      };

      await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      // Wait for package processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now get the dependencies
      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);

      // Validate exact GetPackagesResult structure
      expect(response.body).toEqual(
        expect.objectContaining({
          dependencies: expect.any(Object)
        })
      );

      // Verify the specific dependencies we set
      expect(response.body.dependencies).toEqual(
        expect.objectContaining({
          'lodash': expectSemVer(),
          'is-odd': expectSemVer(),
          'uuid': expectSemVer()
        })
      );

      // Verify we have the expected number of dependencies
      expect(Object.keys(response.body.dependencies)).toHaveLength(3);
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer()).get('/api/workflows/fake-id/packages').send();

      expect(response.statusCode).toBe(401);

      // Validate standard NestJS 401 error response structure
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized'
        })
      );
    });
  });

  describe('PUT /api/workflows/:workflowId/packages', () => {
    it('should update workflow packages and verify entity', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow, {
        definition: {
          nodes: [{ id: '1', data: { nodeType: 'start' }, position: { x: 0, y: 0 } }],
          edges: [],
        },
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const dependencies = {
        'is-odd': '3.0.1',
        lodash: '4.17.21',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          bundleStatus: expect.stringMatching(/^(building|ready|failed)$/)
        })
      );

      // Verify entity in database
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);

      // Wait a moment for bundle generation
      await new Promise((resolve) => setTimeout(resolve, 100));

      const bundleEntity = await bundleRepo.findOne({
        where: { appVersionId: appVersion.id },
      });

      expect(bundleEntity).toBeDefined();
      expect(bundleEntity).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          appVersionId: appVersion.id,
          dependencies: dependencies,
          bundleContent: expect.any(String),
          bundleSize: expect.any(Number),
          bundleSha: expect.stringMatching(/^[a-f0-9]{64}$/),
          generationTimeMs: expect.any(Number),
          error: null,
          status: 'ready',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );

      expect(bundleEntity!.bundleSize).toBeGreaterThan(
        0);
      expect(bundleEntity!.generationTimeMs).toBeGreaterThan(0);
      console.log('bundle content:', bundleEntity!.bundleContent);
      expect(bundleEntity!.bundleContent).toContain('is-odd');
      expect(bundleEntity!.bundleContent).toContain('lodash');
    });

    it('should handle invalid dependencies with proper error', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies: { 'nonexistent-package-12345': '1.0.0' } });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('bundleStatus');
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/workflows/fake-id/packages')
        .send({ dependencies: { lodash: '4.17.21' } });

      expect(response.statusCode).toBe(401);

      // Validate standard NestJS 401 error response structure
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized'
        })
      );
    });
  });

  describe('GET /api/workflows/:workflowId/bundle/status', () => {
    it('should return bundle status with type checking', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // First, add dependencies to trigger bundle generation
      const dependencies = { 'lodash': '4.17.21' };
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      expect(updateResponse.statusCode).toBe(200);

      // Wait a moment for bundle generation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/bundle/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);

      // Validate exact BundleStatus structure
      expect(response.body).toEqual(
        expect.objectContaining({
          status: expectBundleStatus(),
          sizeBytes: expect.any(Number),
          generationTimeMs: expect.any(Number),
          dependencies: expect.any(Object),
          bundleSha: expectSHA256()
        })
      );
    });

    it('should handle non-existent workflow', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // Use a valid UUID format but non-existent workflow ID
      const nonExistentUUID = '12345678-1234-1234-1234-123456789012';
      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${nonExistentUUID}/bundle/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500); // EntityNotFoundError from repository throws 500
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows/fake-id/bundle/status')
        .send();

      expect(response.statusCode).toBe(401);

      // Validate standard NestJS 401 error response structure
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized'
        })
      );
    });
  });

  describe('POST /api/workflows/:workflowId/bundle/rebuild', () => {
    it('should rebuild bundle and verify entity consistency', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // First create a bundle
      const dependencies = { 'is-odd': '3.0.1' };
      await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      // Wait for initial bundle generation
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Get initial bundle data
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);
      const initialBundle = await bundleRepo.findOne({ where: { appVersionId: appVersion.id } });

      // Rebuild the bundle
      const rebuildResponse = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(rebuildResponse.statusCode).toBe(201); // POST operations return 201 Created

      expect(rebuildResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          bundleStatus: 'building'
        })
      );

      // Wait for rebuild completion
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify rebuilt bundle has same SHA for same dependencies
      const rebuiltBundle = await bundleRepo.findOne({ where: { appVersionId: appVersion.id } });
      expect(rebuiltBundle).toBeDefined();
      expect(rebuiltBundle!.bundleSha).toBe(initialBundle!.bundleSha);
    });

    it('should handle rebuild with no existing bundle', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500); // Implementation throws HttpException with INTERNAL_SERVER_ERROR
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows/fake-id/bundle/rebuild')
        .send();

      expect(response.statusCode).toBe(401);

      // Validate standard NestJS 401 error response structure
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized'
        })
      );
    });
  });

  describe('Complete workflow package management flow', () => {
    it('should handle full package management workflow with entity verification', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'integration-test-workflow');
      const appVersion = await createApplicationVersion(app, workflow, {
        definition: {
          nodes: [
            {
              id: 'start-node',
              data: { nodeType: 'start', label: 'Start' },
              position: { x: 100, y: 100 },
              type: 'input',
            },
          ],
          edges: [],
        },
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // Step 1: Search for packages
      const searchResponse = await request(app.getHttpServer())
        .get('/api/workflows/packages/search')
        .query({ q: 'is-odd', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(searchResponse.statusCode).toBe(200);
      expect(Array.isArray(searchResponse.body)).toBe(true);

      // Step 2: Update workflow packages
      const dependencies = { 'is-odd': '3.0.1', lodash: '4.17.21' };
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.body).toHaveProperty('success', true);

      // Step 3: Poll bundle status until ready
      let statusResponse: any;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        await new Promise((resolve) => setTimeout(resolve, 200));
        statusResponse = await request(app.getHttpServer())
          .get(`/api/workflows/${appVersion.id}/bundle/status`)
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', tokenCookie)
          .send();
        attempts++;
      } while (statusResponse.body.status === 'building' && attempts < maxAttempts);

      expect(statusResponse.statusCode).toBe(200);
      expect(['ready']).toContain(statusResponse.body.status);

      // Step 4: Verify entity in database
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);
      const bundleEntity = await bundleRepo.findOne({
        where: { appVersionId: appVersion.id },
      });

      expect(bundleEntity).toBeDefined();
      expect(bundleEntity!.dependencies).toEqual(dependencies);
      expect(bundleEntity!.status).toBe('ready');
      expect(bundleEntity!.bundleSize).toBeGreaterThan(0);
      expect(bundleEntity!.bundleSha).toMatch(/^[a-f0-9]{64}$/);
      expect(bundleEntity!.generationTimeMs).toBeGreaterThan(0);
      expect(bundleEntity!.bundleContent).toBeDefined();
      expect(bundleEntity!.bundleContent).toContain('is-odd');
      expect(bundleEntity!.bundleContent).toContain('lodash');
      expect(bundleEntity!.error).toBeNull();

      // Step 5: Test rebuild functionality
      const initialSha = bundleEntity!.bundleSha;
      const rebuildResponse = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(rebuildResponse.statusCode).toBe(201); // POST operations return 201 Created
      expect(rebuildResponse.body).toHaveProperty('success', true);

      // Step 6: Verify rebuilt bundle consistency
      await new Promise((resolve) => setTimeout(resolve, 300));
      const rebuiltEntity = await bundleRepo.findOne({
        where: { appVersionId: appVersion.id },
      });

      expect(rebuiltEntity).toBeDefined();
      expect(rebuiltEntity!.bundleSha).toBe(initialSha); // Same dependencies = same SHA
      expect(rebuiltEntity!.status).toBe('ready');
      expect(rebuiltEntity!.dependencies).toEqual(dependencies);
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});

/**
 * @group workflows
 */
describe('Community Edition - workflow bundle management controller', () => {
  let app: INestApplication;

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
        recordingsDir: path.resolve(__dirname, '../__fixtures__/workflow-bundles-ce'),
      },
    },
  });

  beforeEach(async () => {
    await clearDB(app);

    // Configure Polly.js to only pass through localhost calls
    // External API calls (like NPM registry) will be recorded
    context.polly.server
      .any()
      .filter(req => {
        const url = new URL(req.url);
        // Pass through localhost and internal calls without recording
        return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.includes('host.docker.internal');
      })
      .passthrough();
    // All other requests (external APIs) will be handled by Polly's recording mechanism
  });

  beforeAll(async () => {
    // Use CE edition without EE mock providers
    app = await createNestAppInstance({
      edition: 'ce',
      isGetContext: true,
    });
  });

  afterEach(() => {
    context.polly.stop();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('CE Limitations - All endpoints should return enterprise feature errors', () => {
    it('should return enterprise feature error for package search', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/search')
        .query({ q: 'lodash', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: NPM package management requires ToolJet Enterprise Edition'
        })
      );
    });

    it('should return enterprise feature error for get packages', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'Test Workflow');
      const appVersion = await createApplicationVersion(app, workflow);

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: NPM package management requires ToolJet Enterprise Edition'
        })
      );
    });

    it('should return enterprise feature error for update packages', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'Test Workflow');
      const appVersion = await createApplicationVersion(app, workflow);

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({
          dependencies: {
            'lodash': '4.17.21'
          }
        });

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: NPM package management requires ToolJet Enterprise Edition'
        })
      );
    });

    it('should return enterprise feature error for bundle status', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'Test Workflow');
      const appVersion = await createApplicationVersion(app, workflow);

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/bundle/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: NPM package management requires ToolJet Enterprise Edition'
        })
      );
    });

    it('should return enterprise feature error for bundle rebuild', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const workflow = await createWorkflowForUser(app, user, 'Test Workflow');
      const appVersion = await createApplicationVersion(app, workflow);

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({});

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: NPM package management requires ToolJet Enterprise Edition'
        })
      );
    });
  });
});
