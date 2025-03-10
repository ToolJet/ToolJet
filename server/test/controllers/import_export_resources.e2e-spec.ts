import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { CloneAppDto, CloneResourcesDto, CloneTooljetDatabaseDto } from '@dto/clone-resources.dto';
import { ValidateTooljetDatabaseConstraint } from '@dto/validators/tooljet-database.validator';
import { authenticateUser, logoutUser, createNestAppInstanceWithServiceMocks } from '../test.helper';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  clearDB,
  createApplicationForUser,
  createOrganization,
  createUser,
  createAndAddUserToOrganization,
} from '../common.helper';
import { camelizeKeys } from 'humps';
import { APP_TYPES } from '@modules/apps/constants';
import { LICENSE_FIELD, LICENSE_LIMIT } from '@modules/licensing/constants';
import { USER_ROLE } from '@modules/group-permissions/constants';

/**
 * Tests ImportExportResourcesController
 *
 * @group platform
 * @group database
 * @group workflow
 */
describe('ImportExportResourcesController', () => {
  let app: INestApplication;
  let loggedInUser: User;
  let organization: Organization;
  let loggedInUserData: { tokenCookie: string; user: any };
  let licenseServiceMock;

  beforeAll(async () => {
    ({ app, licenseServiceMock } = await createNestAppInstanceWithServiceMocks({
      shouldMockLicenseService: true,
    }));

    jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
      switch (key) {
        case LICENSE_FIELD.USER:
          return {
            total: LICENSE_LIMIT.UNLIMITED,
            editors: LICENSE_LIMIT.UNLIMITED,
            viewers: LICENSE_LIMIT.UNLIMITED,
            superadmins: LICENSE_LIMIT.UNLIMITED,
          };
        case LICENSE_FIELD.AUDIT_LOGS:
          return false;
      }
    });
  });

  beforeEach(async () => {
    await clearDB(app);

    const adminUserParams = {
      email: 'admin@tooljet.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'password',
      status: 'active',
    };

    organization = await createOrganization(app, { name: 'Test Organization', slug: 'test-organization' });
    await createUser(app, adminUserParams, organization.id, USER_ROLE.ADMIN);
    loggedInUserData = await authenticateUser(app, adminUserParams.email, adminUserParams.password, organization.id);
    loggedInUser = camelizeKeys(loggedInUserData.user) as User;
  });

  afterEach(async () => {
    if (!loggedInUserData) return;

    await logoutUser(app, loggedInUserData.tokenCookie, organization.id);
  });

  afterAll(async () => {
    await clearDB(app);
    await app.close();
  });

  describe('POST /api/v2/resources/export', () => {
    it('should allow only authenticated users', async () => {
      await request(app.getHttpServer()).post('/api/v2/resources/export').expect(401);
    });

    it('should export resources successfully', async () => {
      const application = await createApplicationForUser(app, loggedInUser, 'Blank App');

      const exportResourcesDto: ExportResourcesDto = {
        app: [{ id: application.id, search_params: null }],
        tooljet_database: [],
        organization_id: organization.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(exportResourcesDto)
        .expect(201);

      const expectedStructure = {
        app: [
          {
            definition: {
              appV2: {
                appEnvironments: [
                  expect.objectContaining({
                    name: 'development',
                    isDefault: false,
                    priority: 1,
                  }),
                  expect.objectContaining({
                    name: 'staging',
                    isDefault: false,
                    priority: 2,
                  }),
                  expect.objectContaining({
                    name: 'production',
                    isDefault: true,
                    priority: 3,
                  }),
                ],
                appVersions: [
                  expect.objectContaining({
                    name: expect.any(String),
                    showViewerNavigation: true,
                  }),
                ],
                components: [],
                createdAt: expect.any(String),
                creationMode: 'DEFAULT',
                currentVersionId: null,
                dataQueries: [],
                dataSourceOptions: expect.any(Array),
                dataSources: [],
                editingVersion: expect.any(Object),
                events: [],
                icon: null,
                id: expect.any(String),
                isMaintenanceOn: false,
                isPublic: null,
                name: 'Blank App',
                organizationId: expect.any(String),
                pages: [
                  {
                    appVersionId: expect.any(String),
                    autoComputeLayout: true,
                    createdAt: expect.any(String),
                    disabled: null,
                    handle: 'home',
                    hidden: null,
                    icon: null,
                    id: expect.any(String),
                    index: 1,
                    isPageGroup: false,
                    name: 'Home',
                    pageGroupId: null,
                    pageGroupIndex: null,
                    updatedAt: expect.any(String),
                  },
                ],
                schemaDetails: {
                  globalDataSources: true,
                  multiEnv: true,
                  multiPages: true,
                },
                slug: null,
                type: 'front-end',
                updatedAt: expect.any(String),
                userId: expect.any(String),
                workflowApiToken: null,
                workflowEnabled: false,
              },
            },
          },
        ],
        tooljet_version: globalThis.TOOLJET_VERSION,
      };

      expect(response.body).toEqual(expectedStructure);
    });

    it('should throw Forbidden if user lacks permission', async () => {
      const endUserParams = {
        email: 'enduser@org.com',
        firstName: 'End',
        lastName: 'User',
        password: 'password',
        status: 'active',
      };
      const endUser = await createAndAddUserToOrganization(app, endUserParams, organization, USER_ROLE.END_USER);

      const { tokenCookie } = await authenticateUser(
        app,
        endUser.email,
        endUserParams.password,
        endUser.defaultOrganizationId
      );

      const application = await createApplicationForUser(app, endUser, 'Blank App');

      const exportResourcesDto: ExportResourcesDto = {
        app: [{ id: application.id, search_params: null }],
        tooljet_database: [],
        organization_id: endUser.defaultOrganizationId,
      };

      await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', endUser.defaultOrganizationId)
        .send(exportResourcesDto)
        .expect(403);
    });
  });

  describe('POST /api/v2/resources/import', () => {
    it('should allow only authenticated users', async () => {
      await request(app.getHttpServer()).post('/api/v2/resources/import').expect(401);
    });

    it('should import resources successfully', async () => {
      const importResourcesDto: ImportResourcesDto = {
        organization_id: organization.id,
        tooljet_version: globalThis.TOOLJET_VERSION,
        app: [
          {
            definition: {
              appV2: {
                name: 'Imported App',
                components: [
                  {
                    id: 'comp1',
                    name: 'Text1',
                    type: 'Text',
                    properties: {},
                    styles: {},
                    validation: {},
                    general: {},
                    generalStyles: {},
                    displayPreferences: {},
                    parent: null,
                    layouts: [],
                  },
                ],
                pages: [
                  {
                    id: 'page1',
                    name: 'Home',
                    handle: 'home',
                    index: 1,
                    disabled: false,
                    hidden: false,
                  },
                ],
                events: [],
                dataQueries: [],
                dataSources: [],
                appVersions: [
                  {
                    name: 'v1',
                    definition: null,
                    showViewerNavigation: true,
                  },
                ],
                globalSettings: {
                  hideHeader: false,
                  appInMaintenance: false,
                  canvasMaxWidth: 100,
                  canvasMaxWidthType: '%',
                  canvasMaxHeight: 2400,
                  canvasBackgroundColor: '#edeff5',
                },
                homePageId: 'page1',
              },
            },
            appName: 'Imported App',
          },
        ],
        tooljet_database: [
          {
            id: uuidv4(),
            table_name: 'users',
            schema: {
              columns: [
                {
                  column_name: 'id',
                  data_type: 'integer',
                  constraints_type: {
                    is_primary_key: true,
                    is_not_null: true,
                    is_unique: true,
                  },
                  keytype: 'PRIMARY KEY',
                  column_default: "nextval('users_id_seq'::regclass)",
                },
                {
                  column_name: 'name',
                  data_type: 'character varying',
                  constraints_type: {
                    is_primary_key: false,
                    is_not_null: false,
                    is_unique: false,
                  },
                  keytype: '',
                },
              ],
              foreign_keys: [],
            },
          },
        ],
      };
      const response = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(importResourcesDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.imports).toBeDefined();
      expect(response.body.imports.app[0].name).toBe('Imported App');

      // check data persistence
      const appRepository = app.get('AppRepository') as Repository<App>;
      const tableRepository = app.get('InternalTableRepository') as Repository<InternalTable>;
      const importedApp = await appRepository.findOne({ where: { name: 'Imported App' } });
      const importedTable = await tableRepository.findOne({ where: { tableName: 'users' } });

      expect(importedApp).toBeDefined();
      expect(importedTable).toBeDefined();
    });

    it('should import an app, export it, and verify its integrity', async () => {
      const definitionFile = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../templates/release-notes/definition.json'), 'utf8')
      );
      definitionFile.app[0].appName = 'Release notes';

      const importResourcesDto: ImportResourcesDto = {
        ...definitionFile,
        organization_id: organization.id,
      };

      // Import the app
      const importResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(importResourcesDto)
        .expect(201);

      expect(importResponse.body.success).toBe(true);
      expect(importResponse.body.imports).toBeDefined();

      const appRepository = app.get('AppRepository') as Repository<App>;
      const tableRepository = app.get('InternalTableRepository') as Repository<InternalTable>;

      // Verify that the app was created
      const importedApp = await appRepository.findOne({ where: { name: 'Release notes' } });
      expect(importedApp).toBeDefined();
      expect(importedApp.name).toBe('Release notes');

      const importedTable = await tableRepository.findOne({ where: { tableName: 'releasenotes' } });
      expect(importedTable).toBeDefined();
      expect(importedTable.tableName).toBe('releasenotes');

      // Export the app
      const exportResourcesDto: ExportResourcesDto = {
        app: [{ id: importedApp.id, search_params: null }],
        tooljet_database: [{ table_id: importedTable.id }],
        organization_id: organization.id,
      };

      const exportResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(exportResourcesDto)
        .expect(201);

      const expectedStructure = {
        app: [
          {
            definition: {
              appV2: {
                appEnvironments: [
                  expect.objectContaining({ name: 'development', isDefault: false, priority: 1 }),
                  expect.objectContaining({ name: 'staging', isDefault: false, priority: 2 }),
                  expect.objectContaining({ name: 'production', isDefault: true, priority: 3 }),
                ],
                appVersions: [
                  expect.objectContaining({
                    name: expect.any(String),
                    showViewerNavigation: false,
                    globalSettings: expect.objectContaining({
                      hideHeader: true,
                      appInMaintenance: false,
                      canvasMaxWidth: 100,
                      canvasMaxWidthType: '%',
                      canvasMaxHeight: 2400,
                      canvasBackgroundColor: '#edeff5',
                      backgroundFxQuery: '#edeff5',
                    }),
                  }),
                ],
                components: expect.any(Array),
                createdAt: expect.any(String),
                creationMode: 'DEFAULT',
                currentVersionId: null,
                dataQueries: expect.any(Array),
                dataSourceOptions: expect.any(Array),
                dataSources: expect.any(Array),
                editingVersion: expect.objectContaining({
                  id: expect.any(String),
                  name: 'v1',
                  appId: expect.any(String),
                  globalSettings: expect.objectContaining({
                    hideHeader: true,
                    appInMaintenance: false,
                    canvasMaxWidth: 100,
                    canvasMaxWidthType: '%',
                    canvasMaxHeight: 2400,
                    canvasBackgroundColor: '#edeff5',
                    backgroundFxQuery: '#edeff5',
                  }),
                  showViewerNavigation: false,
                }),
                events: expect.any(Array),
                icon: 'floppydisk',
                id: expect.any(String),
                isMaintenanceOn: false,
                isPublic: false,
                name: 'Release notes',
                organizationId: expect.any(String),
                pages: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'Home',
                    handle: 'home',
                    index: 1,
                    autoComputeLayout: false,
                    hidden: false,
                  }),
                ]),
                schemaDetails: expect.objectContaining({
                  globalDataSources: true,
                  multiEnv: true,
                  multiPages: true,
                }),
                slug: expect.any(String),
                type: 'front-end',
                updatedAt: expect.any(String),
                userId: expect.any(String),
                workflowApiToken: null,
                workflowEnabled: false,
              },
            },
          },
        ],
        tooljet_version: expect.any(String),
      };

      expect(exportResponse.body).toMatchObject(expectedStructure);

      // Validate exported schema against the latest version
      const validator = new ValidateTooljetDatabaseConstraint();
      const isValid = validator.validate(exportResponse.body.tooljet_database[0], null);
      expect(isValid).toBe(true);
    });

    it('should throw BadRequestException for empty app definition', async () => {
      const importResourcesDto: ImportResourcesDto = {
        organization_id: organization.id,
        tooljet_version: '0.0.1',
        app: [{ definition: {}, appName: 'Imported App' }],
        tooljet_database: [],
      };
      await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(importResourcesDto)
        .expect(400);
    });

    it('should validate tooljet database schema', async () => {
      const invalidTooljetDatabaseSchema = {
        organization_id: uuidv4(),
        tooljet_version: globalThis.TOOLJET_VERSION,
        tooljet_database: [
          {
            id: uuidv4(),
            table_name: 'invalid_table',
            schema: {
              columns: [
                {
                  // Missing column_name
                  data_type: 'integer',
                  constraints_type: {
                    is_primary_key: true,
                    is_not_null: true,
                    is_unique: true,
                  },
                },
              ],
              // Missing foreign_keys
            },
          },
        ],
      };
      const response = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(invalidTooljetDatabaseSchema)
        .expect(400);
      expect(response.body.message[0]).toContain(
        'ToolJet Database is not valid. Please ensure it matches the expected format'
      );
    });

    it('should transform tooljet database schema to the latest version', async () => {
      const oldVersionSchema = {
        organization_id: organization.id,
        tooljet_version: '2.29.0', // An older version
        app: [],
        tooljet_database: [
          {
            id: uuidv4(),
            table_name: 'users',
            schema: {
              columns: [
                {
                  column_name: 'id',
                  data_type: 'integer',
                  constraint_type: 'PRIMARY KEY', // Old format
                },
                {
                  column_name: 'name',
                  data_type: 'character varying',
                  is_nullable: 'NO', // Old format
                },
              ],
              foreign_keys: [],
            },
          },
        ],
      };

      // Import the old version schema
      const response = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(oldVersionSchema)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify that the schema was transformed and the table was imported
      const tableRepository = app.get('InternalTableRepository') as Repository<InternalTable>;
      const importedTable = await tableRepository.findOne({ where: { tableName: 'users' } });
      expect(importedTable).toBeDefined();

      // Export the transformed schema to verify its integrity
      const exportResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send({
          organization_id: organization.id,
          tooljet_database: [{ table_id: importedTable.id }],
        })
        .expect(201);

      const exportedSchema = exportResponse.body.tooljet_database[0].schema;

      // Validate the exported schema against the current expected structure
      expect(exportedSchema.columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            column_name: 'id',
            data_type: 'integer',
            constraints_type: expect.objectContaining({
              is_primary_key: true,
              is_not_null: true,
              is_unique: false,
            }),
          }),
          expect.objectContaining({
            column_name: 'name',
            data_type: 'character varying',
            constraints_type: expect.objectContaining({
              is_primary_key: false,
              is_not_null: true,
              is_unique: false,
            }),
          }),
        ])
      );
    });
  });

  describe('POST /api/v2/resources/clone', () => {
    it('should allow only authenticated users', async () => {
      await request(app.getHttpServer()).post('/api/v2/resources/clone').expect(401);
    });

    it('should clone resources successfully and verify the cloned data against expected structure', async () => {
      const definitionFile: {
        tooljet_database: CloneTooljetDatabaseDto[];
        app: CloneAppDto[];
        tooljet_version: string;
      } = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../templates/release-notes/definition.json'), 'utf8'));
      definitionFile.app[0].name = 'Release notes';

      // Import the original app
      const importResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send({ ...definitionFile, organization_id: organization.id } as CloneResourcesDto)
        .expect(201);

      expect(importResponse.body.success).toBe(true);
      const originalAppId = importResponse.body.imports.app[0].id;
      const originalAppTableIds = importResponse.body.imports.tooljet_database.map((table) => table.id);

      // Clone the app
      const cloneResourcesDto: CloneResourcesDto = {
        organization_id: organization.id,
        app: [{ id: originalAppId, name: 'Release notes clone' }],
        tooljet_database: [...originalAppTableIds],
      };

      const cloneResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/clone')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(cloneResourcesDto)
        .expect(201);

      expect(cloneResponse.body.success).toBe(true);
      expect(cloneResponse.body.imports.app[0].name).toBe('Release notes clone');
      const clonedAppTableIds = cloneResponse.body.imports.tooljet_database.map((table) => table.id);

      // Export the cloned app
      const exportResourcesDto: ExportResourcesDto = {
        organization_id: organization.id,
        app: [{ id: cloneResponse.body.imports.app[0].id, search_params: null }],
        tooljet_database: [...clonedAppTableIds],
      };

      const exportResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', loggedInUserData.tokenCookie)
        .set('tj-workspace-id', loggedInUser.organizationId)
        .send(exportResourcesDto)
        .expect(201);

      const expectedStructure = {
        app: [
          {
            definition: {
              appV2: {
                appEnvironments: [
                  expect.objectContaining({ name: 'development', isDefault: false, priority: 1 }),
                  expect.objectContaining({ name: 'staging', isDefault: false, priority: 2 }),
                  expect.objectContaining({ name: 'production', isDefault: true, priority: 3 }),
                ],
                appVersions: [
                  expect.objectContaining({
                    appId: expect.any(String),
                    createdAt: expect.any(String),
                    currentEnvironmentId: expect.any(String),
                    definition: null,
                    globalSettings: expect.objectContaining({
                      appInMaintenance: expect.any(Boolean),
                      backgroundFxQuery: expect.any(String),
                      canvasBackgroundColor: expect.any(String),
                      canvasMaxHeight: expect.any(Number),
                      canvasMaxWidth: expect.any(Number),
                      canvasMaxWidthType: expect.any(String),
                      hideHeader: expect.any(Boolean),
                    }),
                    homePageId: expect.any(String),
                    id: expect.any(String),
                    name: 'v1',
                    pageSettings: expect.any(Object),
                    promotedFrom: null,
                    showViewerNavigation: expect.any(Boolean),
                    updatedAt: expect.any(String),
                  }),
                ],
                components: expect.any(Array),
                createdAt: expect.any(String),
                creationMode: 'DEFAULT',
                currentVersionId: null,
                dataQueries: expect.any(Array),
                dataSourceOptions: expect.any(Array),
                dataSources: expect.any(Array),
                editingVersion: expect.any(Object),
                events: expect.any(Array),
                icon: expect.any(String),
                id: expect.any(String),
                isMaintenanceOn: expect.any(Boolean),
                isPublic: expect.any(Boolean),
                name: 'Release notes clone',
                organizationId: expect.any(String),
                pages: expect.any(Array),
                schemaDetails: {
                  globalDataSources: true,
                  multiEnv: true,
                  multiPages: true,
                },
                slug: expect.any(String),
                type: APP_TYPES.FRONT_END,
                updatedAt: expect.any(String),
                userId: expect.any(String),
                workflowApiToken: null,
                workflowEnabled: expect.any(Boolean),
              },
            },
          },
        ],
        tooljet_database: expect.any(Array),
      };

      expect(exportResponse.body).toMatchObject(expectedStructure);
      exportResponse.body.tooljet_database.forEach((table) => {
        const columnMatchers = table.schema.columns.map((col) => ({
          character_maximum_length: col.character_maximum_length === null ? null : expect.anything(),
          column_default: col.column_default === null ? null : expect.anything(),
          column_name: expect.any(String),
          configurations: expect.any(Object),
          constraints_type: expect.objectContaining({
            is_not_null: expect.any(Boolean),
            is_primary_key: expect.any(Boolean),
            is_unique: expect.any(Boolean),
          }),
          data_type: expect.any(String),
          keytype: expect.any(String),
          numeric_precision: col.numeric_precision === null ? null : expect.anything(),
        }));

        expect(table).toMatchObject({
          id: expect.any(String),
          table_name: expect.any(String),
          schema: {
            columns: columnMatchers,
            foreign_keys: expect.any(Array),
          },
        });
      });
    });

    it('should throw ForbiddenException if user lacks permission', async () => {
      const endUserParams = {
        email: 'regular_user@tooljet.com',
        firstName: 'Regular',
        lastName: 'User',
        password: 'password',
        status: 'active',
      };

      const endUser = await createAndAddUserToOrganization(app, endUserParams, organization, USER_ROLE.END_USER);

      const { tokenCookie } = await authenticateUser(
        app,
        endUser.email,
        endUserParams.password,
        endUser.defaultOrganizationId
      );

      // Add an original app as an admin or privileged user
      const appRepository = app.get('AppRepository') as Repository<App>;
      const originalApp = await appRepository.save({
        name: 'Original App',
        organizationId: organization.id,
        userId: loggedInUser.id,
      });

      const cloneResourcesDto: CloneResourcesDto = {
        organization_id: organization.id,
        app: [{ id: originalApp.id, name: 'Cloned App' }],
        tooljet_database: [],
      };

      // Attempt to clone the app with a user lacking sufficient permissions
      await request(app.getHttpServer())
        .post('/api/v2/resources/clone')
        .set('Cookie', tokenCookie)
        .set('tj-workspace-id', endUser.defaultOrganizationId)
        .send(cloneResourcesDto)
        .expect(403);
    });
  });
});
