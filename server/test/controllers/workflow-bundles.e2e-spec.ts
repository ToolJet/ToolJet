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
  createWorkflowForUser,
  createApplicationVersion,
  createNestAppInstance,
  createUser,
  createUserWorkflowPermissions,
} from '../workflows.helper';
import { WorkflowBundle } from '../../src/entities/workflow_bundle.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { PythonExecutorService } from '../../ee/workflows/services/python-executor.service';

// Helper functions for flexible response assertions
const expectSemVer = () => expect.stringMatching(/^\d+\.\d+\.\d+/);
const expectISO8601 = () => expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
const expectBundleStatus = () => expect.stringMatching(/^(none|building|ready|failed)$/);

// Helper function to wait for bundle completion
const waitForBundleReady = async (
  bundleRepo: any,
  appVersionId: string,
  language: string = 'javascript',
  timeoutMs: number = 15000
): Promise<WorkflowBundle> => {
  const startTime = Date.now();
  const pollInterval = 200; // Poll every 200ms

  while (Date.now() - startTime < timeoutMs) {
    const bundle = await bundleRepo.findOne({
      where: { appVersionId, language }
    });

    if (bundle) {
      if (bundle.status === 'ready') {
        return bundle;
      }
      if (bundle.status === 'failed') {
        throw new Error(`Bundle generation failed: ${bundle.error}`);
      }
      // If status is 'building', continue polling
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Bundle generation timed out after ${timeoutMs}ms`);
};

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
        // Store recordings as __fixtures__/spec-file-name/*
        recordingsDir: path.resolve(
          __dirname,
          `../__fixtures__/${path.basename(__filename).replace(/\.[tj]s$/, '')}`
        ),
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
    app = await createNestAppInstance({
      edition: 'ee',
      isGetContext: true,
    });
  });

  afterEach(async () => {
    await context.polly.stop();
  });

  describe('GET /api/workflows/packages/:language/search', () => {
    it('should search JavaScript packages via unified endpoint', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/javascript/search')
        .query({ q: 'lodash', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.length).toBeLessThanOrEqual(5);

      // Validate exact PackageSearchResult structure
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
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/javascript/search')
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

    it('should search Python packages via unified endpoint', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/python/search')
        .query({ q: 'pandas', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.length).toBeLessThanOrEqual(5);

      // Validate PythonPackageSearchResult structure
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            version: expectSemVer(),
            description: expect.any(String),
          })
        ])
      );

      // Validate specific search result content
      expect(response.body[0].name.toLowerCase()).toContain('pandas');
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/javascript/search')
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

    it('should return 403 when user lacks workflow edit permissions', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'readonly@tooljet.io',
        password: 'password',
        firstName: 'ReadOnly',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: false,
          workflowCreate: false
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/javascript/search')
        .query({ q: 'lodash', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'You do not have permission to access this resource'
        })
      );
    });
  });

  describe('GET /api/workflows/packages/:language/:name', () => {
    it('should get JavaScript package info via unified endpoint', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/javascript/lodash')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'lodash',
          version: expect.any(String),
          description: expect.any(String),
          versions: expect.any(Array),
          language: 'javascript',
        })
      );
    });

    it('should get Python package info via unified endpoint', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/python/requests')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'requests',
          version: expect.any(String),
          description: expect.any(String),
          versions: expect.any(Array),
          language: 'python',
        })
      );
    });

    it('should handle 404 for unknown packages', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/python/nonexistent-package-xyz-12345')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/workflows/packages/:language/:name/versions', () => {
    it('should get JavaScript package versions via unified endpoint', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/javascript/lodash/versions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          versions: expect.any(Array),
          language: 'javascript',
        })
      );
      expect(response.body.versions.length).toBeGreaterThan(0);
    });

    it('should get Python package versions via unified endpoint', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/python/numpy/versions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          versions: expect.any(Array),
          language: 'python',
        })
      );
      expect(response.body.versions.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/workflows/:appVersionId/packages/:language', () => {
    it('should get empty JavaScript dependencies for new workflow', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/packages/javascript`)
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

    it('should get empty Python dependencies for new workflow', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow-python');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/packages/python`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          dependencies: expect.any(Object)
        })
      );
      expect(Object.keys(response.body.dependencies)).toHaveLength(0);
    });

    it('should get existing dependencies for workflow with packages', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
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
        .put(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      // Wait for bundle generation to complete to avoid FK constraint violations on cleanup
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);
      await waitForBundleReady(bundleRepo, appVersion.id, 'javascript');

      // Re-authenticate to ensure fresh token for GET request
      const refreshedUser = await authenticateUser(app, user.email);

      // Now get the dependencies
      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', refreshedUser.tokenCookie)
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
      const response = await request(app.getHttpServer()).get('/api/workflows/fake-id/packages/javascript').send();

      expect(response.statusCode).toBe(401);

      // Validate standard NestJS 401 error response structure
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized'
        })
      );
    });

    it('should return 403 when user lacks workflow edit permissions', async () => {
      // Create admin user who will own the workflow
      const { user: adminUser } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      // Create workflow owned by admin
      const workflow = await createWorkflowForUser(app, adminUser, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);

      // Create limited user in the same organization
      const limitedUser = await createUser(app, {
        email: 'readonly@tooljet.io',
        password: 'password',
        firstName: 'ReadOnly',
        lastName: 'User',
        organizationId: adminUser.organizationId,
      });

      // Give limited user view-only permissions (no edit access)
      await createUserWorkflowPermissions(app, limitedUser, adminUser.organizationId, {
        isAllEditable: false,
        workflowCreate: false
      });

      // Authenticate as limited user
      const loggedUser = await authenticateUser(app, limitedUser.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', adminUser.organizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'You do not have permission to access this resource'
        })
      );
    });
  });

  describe('PUT /api/workflows/:appVersionId/packages/:language', () => {
    it('should update JavaScript workflow packages and verify entity', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
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
        .put(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('javascript'),
          bundleStatus: expect.stringMatching(/^(building|ready|failed)$/)
        })
      );

      // Verify entity in database
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);

      // Wait for bundle generation to complete
      const bundleEntity = await waitForBundleReady(bundleRepo, appVersion.id, 'javascript');

      expect(bundleEntity).toBeDefined();
      expect(bundleEntity).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          appVersionId: appVersion.id,
          dependencies: dependencies,
          bundleBinary: expect.any(Buffer),
          bundleSize: expect.any(Number),
          bundleSha: expect.stringMatching(/^[a-f0-9]{64}$/),
          generationTimeMs: expect.any(Number),
          error: null,
          status: 'ready',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );

      expect(bundleEntity!.bundleSize).toBeGreaterThan(0);
      expect(bundleEntity!.generationTimeMs).toBeGreaterThan(0);
      const bundleContent = bundleEntity!.bundleBinary.toString('utf-8');
      expect(bundleContent).toContain('is-odd');
      expect(bundleContent).toContain('lodash');
    });

    it('should update Python packages and verify entity', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow-python-update');
      const appVersion = await createApplicationVersion(app, workflow, {
        definition: {
          nodes: [{ id: '1', data: { nodeType: 'start' }, position: { x: 0, y: 0 } }],
          edges: [],
        },
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const dependencies = {
        'requests': '2.31.0',
        'charset-normalizer': '3.3.0',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/python`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('python'),
          bundleStatus: expect.stringMatching(/^(building|ready|failed)$/)
        })
      );

      // Verify entity in database
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);

      // Wait for bundle generation to complete
      const bundleEntity = await waitForBundleReady(bundleRepo, appVersion.id, 'python', 60000);

      expect(bundleEntity).toBeDefined();
      expect(bundleEntity).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          appVersionId: appVersion.id,
          dependencies: dependencies,
          language: 'python',
          bundleBinary: expect.any(Buffer),
          bundleSize: expect.any(Number),
          bundleSha: expect.stringMatching(/^[a-f0-9]{64}$/),
          generationTimeMs: expect.any(Number),
          error: null,
          status: 'ready',
        })
      );

      expect(bundleEntity!.bundleSize).toBeGreaterThan(0);
    }, 120000);

    it('should handle invalid dependencies with proper error', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies: { 'nonexistent-package-12345': '1.0.0' } });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('bundleStatus');

      // Wait for bundle generation to complete (even if it fails) to avoid FK constraint violations on cleanup
      // For invalid packages, the bundle may fail quickly or not be created at all
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);
      // Poll until bundle status is not 'building' or timeout (bundle may never be created for early failures)
      const startTime = Date.now();
      while (Date.now() - startTime < 10000) {
        const bundle = await bundleRepo.findOne({ where: { appVersionId: appVersion.id, language: 'javascript' } });
        if (!bundle || bundle.status !== 'building') break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      // Additional small delay to ensure any async operations complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }, 60000);

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/workflows/fake-id/packages/javascript')
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

    it('should return 403 when user lacks workflow edit permissions', async () => {
      // Create admin user who will own the workflow
      const { user: adminUser } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      // Create workflow owned by admin
      const workflow = await createWorkflowForUser(app, adminUser, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);

      // Create limited user in the same organization
      const limitedUser = await createUser(app, {
        email: 'readonly@tooljet.io',
        password: 'password',
        firstName: 'ReadOnly',
        lastName: 'User',
        organizationId: adminUser.organizationId,
      });

      // Give limited user view-only permissions (no edit access)
      await createUserWorkflowPermissions(app, limitedUser, adminUser.organizationId, {
        isAllEditable: false,
        workflowCreate: false
      });

      // Authenticate as limited user
      const loggedUser = await authenticateUser(app, limitedUser.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', adminUser.organizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies: { lodash: '4.17.21' } });

      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'You do not have permission to access this resource'
        })
      );
    });
  });

  describe('GET /api/workflows/:appVersionId/bundle/:language/status', () => {
    it('should return JavaScript bundle status with type checking', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // First, add dependencies to trigger bundle generation
      const dependencies = { 'lodash': '4.17.21' };
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      expect(updateResponse.statusCode).toBe(200);

      // Wait a moment for bundle generation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/bundle/javascript/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);

      // Validate exact BundleStatus structure
      expect(response.body).toEqual(
        expect.objectContaining({
          status: expectBundleStatus(),
          language: 'javascript',
        })
      );
    });

    it('should return Python bundle status', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow-python-status');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // First, add dependencies to trigger bundle generation
      const dependencies = { 'requests': '2.31.0' };
      await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/python`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      // Wait for bundle generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/bundle/python/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          status: expectBundleStatus(),
          language: 'python',
        })
      );
    }, 60000);

    it('should return none status for workflow without bundle', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow-no-bundle');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/bundle/python/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'none'
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows/fake-id/bundle/javascript/status')
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

    it('should return 403 when user lacks workflow edit permissions', async () => {
      // Create admin user who will own the workflow
      const { user: adminUser } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      // Create workflow owned by admin
      const workflow = await createWorkflowForUser(app, adminUser, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);

      // Create limited user in the same organization
      const limitedUser = await createUser(app, {
        email: 'readonly@tooljet.io',
        password: 'password',
        firstName: 'ReadOnly',
        lastName: 'User',
        organizationId: adminUser.organizationId,
      });

      // Give limited user view-only permissions (no edit access)
      await createUserWorkflowPermissions(app, limitedUser, adminUser.organizationId, {
        isAllEditable: false,
        workflowCreate: false
      });

      // Authenticate as limited user
      const loggedUser = await authenticateUser(app, limitedUser.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${appVersion.id}/bundle/javascript/status`)
        .set('tj-workspace-id', adminUser.organizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'You do not have permission to access this resource'
        })
      );
    });
  });

  describe('POST /api/workflows/:appVersionId/bundle/:language/rebuild', () => {
    it('should rebuild JavaScript bundle and verify entity consistency', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // First create a bundle
      const dependencies = { 'is-odd': '3.0.1' };
      await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      // Wait for initial bundle generation
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);
      const initialBundle = await waitForBundleReady(bundleRepo, appVersion.id, 'javascript');

      // Rebuild the bundle
      const rebuildResponse = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/javascript/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(rebuildResponse.statusCode).toBe(201); // POST operations return 201 Created

      expect(rebuildResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('javascript'),
          bundleStatus: 'building'
        })
      );

      // Wait for rebuild completion
      const rebuiltBundle = await waitForBundleReady(bundleRepo, appVersion.id, 'javascript');
      expect(rebuiltBundle).toBeDefined();
      expect(rebuiltBundle!.bundleSha).toBe(initialBundle!.bundleSha);
    });

    it('should rebuild Python bundle and verify entity consistency', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow-python-rebuild');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // First create a Python bundle
      const dependencies = { 'requests': '2.31.0' };
      await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/python`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      // Wait for initial bundle generation
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);
      const initialBundle = await waitForBundleReady(bundleRepo, appVersion.id, 'python', 60000);

      // Rebuild the bundle
      const rebuildResponse = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/python/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(rebuildResponse.statusCode).toBe(201);
      expect(rebuildResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('python'),
          bundleStatus: 'building'
        })
      );

      // Wait for rebuild completion
      const rebuiltBundle = await waitForBundleReady(bundleRepo, appVersion.id, 'python', 60000);
      expect(rebuiltBundle).toBeDefined();
      // Note: Python bundles may have different SHAs on rebuild due to timestamps in wheel files
      // We verify the bundle was rebuilt successfully with same dependencies instead
      expect(rebuiltBundle!.dependencies).toEqual(initialBundle!.dependencies);
      expect(rebuiltBundle!.status).toBe('ready');
      expect(rebuiltBundle!.language).toBe('python');
    }, 180000);

    it('should handle rebuild with no existing bundle', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);
      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/javascript/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500); // Implementation throws HttpException with INTERNAL_SERVER_ERROR
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows/fake-id/bundle/javascript/rebuild')
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

    it('should return 403 when user lacks workflow edit permissions', async () => {
      // Create admin user who will own the workflow
      const { user: adminUser } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      // Create workflow owned by admin
      const workflow = await createWorkflowForUser(app, adminUser, 'test-workflow');
      const appVersion = await createApplicationVersion(app, workflow);

      // Create limited user in the same organization
      const limitedUser = await createUser(app, {
        email: 'readonly@tooljet.io',
        password: 'password',
        firstName: 'ReadOnly',
        lastName: 'User',
        organizationId: adminUser.organizationId,
      });

      // Give limited user view-only permissions (no edit access)
      await createUserWorkflowPermissions(app, limitedUser, adminUser.organizationId, {
        isAllEditable: false,
        workflowCreate: false
      });

      // Authenticate as limited user
      const loggedUser = await authenticateUser(app, limitedUser.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/javascript/rebuild`)
        .set('tj-workspace-id', adminUser.organizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'You do not have permission to access this resource'
        })
      );
    });
  });

  describe('Complete Python package flow', () => {
    it('should install pydash package, execute code using it', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
      });

      const workflow = await createWorkflowForUser(app, user, 'python-pydash-e2e-test');
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

      // Step 1: Search for pydash (Python port of lodash)
      const searchResponse = await request(app.getHttpServer())
        .get('/api/workflows/packages/python/search')
        .query({ q: 'pydash', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(searchResponse.statusCode).toBe(200);
      expect(Array.isArray(searchResponse.body)).toBe(true);

      // Step 2: Get pydash package info
      const infoResponse = await request(app.getHttpServer())
        .get('/api/workflows/packages/python/pydash')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(infoResponse.statusCode).toBe(200);
      expect(infoResponse.body.name).toBe('pydash');
      expect(infoResponse.body.language).toBe('python');

      // Step 3: Install pydash package
      const dependencies = { 'pydash': '8.0.3' };
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/python`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ dependencies });

      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.body).toHaveProperty('success', true);

      // Step 4: Poll bundle status until ready
      let statusResponse: any;
      let attempts = 0;
      const maxAttempts = 30;

      do {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        statusResponse = await request(app.getHttpServer())
          .get(`/api/workflows/${appVersion.id}/bundle/python/status`)
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', tokenCookie)
          .send();
        attempts++;
      } while (statusResponse.body.status === 'building' && attempts < maxAttempts);

      expect(statusResponse.statusCode).toBe(200);
      expect(['ready']).toContain(statusResponse.body.status);

      // Step 5: Verify bundle entity in database
      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      const bundleRepo = defaultDataSource.getRepository(WorkflowBundle);
      const bundleEntity = await waitForBundleReady(bundleRepo, appVersion.id, 'python', 60000);

      expect(bundleEntity).toBeDefined();
      expect(bundleEntity!.dependencies).toEqual(dependencies);
      expect(bundleEntity!.status).toBe('ready');
      expect(bundleEntity!.language).toBe('python');
      expect(bundleEntity!.bundleSize).toBeGreaterThan(0);
      expect(bundleEntity!.bundleBinary).toBeDefined();

      // Step 6: Execute Python code that uses pydash (like lodash for Python)
      // This is the key test: proving the installed package actually works
      const pythonExecutor = app.get<PythonExecutorService>(PythonExecutorService);

      // Test 1: pydash.map_ - like lodash's _.map()
      const mapResult = await pythonExecutor.execute(
        `
import pydash
# Like lodash _.map([1, 2, 3], x => x * 2)
result = pydash.map_([1, 2, 3], lambda x: x * 2)
        `.trim(),
        {},
        appVersion.id,
        30000
      );

      expect(mapResult.status).toBe('ok');
      expect(mapResult.data).toEqual([2, 4, 6]);

      // Test 2: pydash.get - like lodash's _.get()
      const getResult = await pythonExecutor.execute(
        `
import pydash
# Like lodash _.get({a: {b: {c: 1}}}, 'a.b.c')
data = {'user': {'profile': {'name': 'Alice'}}}
result = pydash.get(data, 'user.profile.name')
        `.trim(),
        {},
        appVersion.id,
        30000
      );

      expect(getResult.status).toBe('ok');
      expect(getResult.data).toBe('Alice');

      // Test 3: pydash.chunk - like lodash's _.chunk()
      const chunkResult = await pythonExecutor.execute(
        `
import pydash
# Like lodash _.chunk([1, 2, 3, 4, 5], 2)
result = pydash.chunk([1, 2, 3, 4, 5], 2)
        `.trim(),
        {},
        appVersion.id,
        30000
      );

      expect(chunkResult.status).toBe('ok');
      expect(chunkResult.data).toEqual([[1, 2], [3, 4], [5]]);

      // Test 4: pydash.flatten - like lodash's _.flatten()
      const flattenResult = await pythonExecutor.execute(
        `
import pydash
# Like lodash _.flatten([[1, 2], [3, 4], [5]])
result = pydash.flatten([[1, 2], [3, 4], [5]])
        `.trim(),
        {},
        appVersion.id,
        30000
      );

      expect(flattenResult.status).toBe('ok');
      expect(flattenResult.data).toEqual([1, 2, 3, 4, 5]);

      // Test 5: Combine state injection with pydash
      const stateResult = await pythonExecutor.execute(
        `
import pydash
# Filter items from state using pydash (like lodash _.filter)
result = pydash.filter_(items, lambda x: x > threshold)
        `.trim(),
        { items: [1, 5, 10, 15, 20], threshold: 8 },
        appVersion.id,
        30000
      );

      expect(stateResult.status).toBe('ok');
      expect(stateResult.data).toEqual([10, 15, 20]);

    }, 300000); // 5 minute timeout for full E2E flow
  });

  describe('Complete workflow package management flow', () => {
    it('should handle full JavaScript package management workflow with entity verification', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      }, {
        workflowPermissions: {
          isAllEditable: true,
          workflowCreate: true
        }
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
        .get('/api/workflows/packages/javascript/search')
        .query({ q: 'is-odd', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(searchResponse.statusCode).toBe(200);
      expect(Array.isArray(searchResponse.body)).toBe(true);

      // Step 2: Update workflow packages
      const dependencies = { 'is-odd': '3.0.1', lodash: '4.17.21' };
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/workflows/${appVersion.id}/packages/javascript`)
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
          .get(`/api/workflows/${appVersion.id}/bundle/javascript/status`)
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
      const bundleEntity = await waitForBundleReady(bundleRepo, appVersion.id, 'javascript');

      expect(bundleEntity).toBeDefined();
      expect(bundleEntity!.dependencies).toEqual(dependencies);
      expect(bundleEntity!.status).toBe('ready');
      expect(bundleEntity!.bundleSize).toBeGreaterThan(0);
      expect(bundleEntity!.bundleSha).toMatch(/^[a-f0-9]{64}$/);
      expect(bundleEntity!.generationTimeMs).toBeGreaterThan(0);
      expect(bundleEntity!.bundleBinary).toBeDefined();
      const bundleContent = bundleEntity!.bundleBinary.toString('utf-8');
      expect(bundleContent).toContain('is-odd');
      expect(bundleContent).toContain('lodash');
      expect(bundleEntity!.error).toBeNull();

      // Step 5: Test rebuild functionality
      const initialSha = bundleEntity!.bundleSha;
      const rebuildResponse = await request(app.getHttpServer())
        .post(`/api/workflows/${appVersion.id}/bundle/javascript/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(rebuildResponse.statusCode).toBe(201); // POST operations return 201 Created
      expect(rebuildResponse.body).toHaveProperty('success', true);

      // Step 6: Verify rebuilt bundle consistency
      const rebuiltEntity = await waitForBundleReady(bundleRepo, appVersion.id, 'javascript');

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
  }, 60000);
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

  afterEach(async () => {
    await context.polly.stop();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 60000);

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
        .get('/api/workflows/packages/javascript/search')
        .query({ q: 'lodash', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: Package management requires ToolJet Enterprise Edition'
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
        .get(`/api/workflows/${appVersion.id}/packages/javascript`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: Package management requires ToolJet Enterprise Edition'
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
        .put(`/api/workflows/${appVersion.id}/packages/javascript`)
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
          message: 'Enterprise feature: Package management requires ToolJet Enterprise Edition'
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
        .get(`/api/workflows/${appVersion.id}/bundle/javascript/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: Package management requires ToolJet Enterprise Edition'
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
        .post(`/api/workflows/${appVersion.id}/bundle/javascript/rebuild`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({});

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: Package management requires ToolJet Enterprise Edition'
        })
      );
    });

    it('should return enterprise feature error for Python package search', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .get('/api/workflows/packages/python/search')
        .query({ q: 'requests', limit: 5 })
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.statusCode).toBe(500);

      // Validate structured enterprise error response
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 500,
          message: 'Enterprise feature: Package management requires ToolJet Enterprise Edition'
        })
      );
    });
  });
});
