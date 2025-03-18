import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { getManager } from 'typeorm';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { ImportAppDto, ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { CloneAppDto, CloneResourcesDto, CloneTooljetDatabaseDto } from '@dto/clone-resources.dto';
import { TooljetDbService } from '@services/tooljet_db.service';
import { ValidateTooljetDatabaseConstraint } from '@dto/validators/tooljet-database.validator';
import {
  clearDB,
  createUser,
  generateAppDefaults,
  authenticateUser,
  logoutUser,
  createNestAppInstanceWithServiceMocks,
} from '../test.helper';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AppsService } from '@services/apps.service';

/**
 * Tests ImportExportResourcesController
 *
 * @group platform
 * @group database
 * @group workflow
 */
describe('ImportExportResourcesController', () => {
  let app: INestApplication;
  let user: User;
  let organization: Organization;
  let application: App;
  let loggedUser: { tokenCookie: string; user: User };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let tooljetDbService: TooljetDbService;
  let appsService: AppsService;
  let licenseServiceMock;

  beforeAll(async () => {
    ({ app, licenseServiceMock } = await createNestAppInstanceWithServiceMocks({
      shouldMockLicenseService: true,
    }));
    jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation(jest.fn()); // Avoiding winston transport errors
  });

  beforeEach(async () => {
    await clearDB();

    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });

    ({ application } = await generateAppDefaults(app, adminUserData.user, {
      name: 'Test App',
    }));

    user = adminUserData.user;
    organization = adminUserData.organization;
    tooljetDbService = app.get(TooljetDbService);
    appsService = app.get(AppsService);

    loggedUser = await authenticateUser(app, user.email);
  });

  afterEach(async () => {
    await logoutUser(app, loggedUser.tokenCookie, user.defaultOrganizationId);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v2/resources/export', () => {
    it('should allow only authenticated users', async () => {
      await request(app.getHttpServer()).post('/api/v2/resources/export').expect(401);
    });

    it('should export resources successfully', async () => {
      const exportResourcesDto: ExportResourcesDto = {
        app: [{ id: application.id, search_params: null }],
        tooljet_database: [],
        organization_id: organization.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
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
                dataQueries: [
                  expect.objectContaining({
                    name: 'defaultquery',
                    options: expect.objectContaining({
                      method: 'get',
                      url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
                    }),
                  }),
                ],
                dataSourceOptions: expect.any(Array),
                dataSources: [
                  expect.objectContaining({
                    kind: 'restapi',
                    name: 'name',
                    scope: 'local',
                    type: 'default',
                  }),
                ],
                editingVersion: expect.any(Object),
                events: [],
                icon: null,
                id: expect.any(String),
                isMaintenanceOn: false,
                isPublic: false,
                name: 'Test App',
                organizationId: expect.any(String),
                pages: [],
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
      const regularUserData = await createUser(app, { email: 'regular@tooljet.io', groups: ['all_users'] });
      const regularLoggedUser = await authenticateUser(app, 'regular@tooljet.io');
      const { application } = await generateAppDefaults(app, regularUserData.user, { name: 'Test App' });

      const exportResourcesDto: ExportResourcesDto = {
        app: [{ id: application.id, search_params: null }],
        tooljet_database: [],
        organization_id: regularUserData.organization.id,
      };

      await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', regularLoggedUser.tokenCookie)
        .set('tj-workspace-id', regularUserData.user.defaultOrganizationId)
        .send(exportResourcesDto)
        .expect(403);

      await logoutUser(app, regularLoggedUser.tokenCookie, regularUserData.user.defaultOrganizationId);
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
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .send(importResourcesDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.imports).toBeDefined();
      expect(response.body.imports.app[0].name).toBe('Imported App');

      const importedApp = await getManager().findOne(App, { name: 'Imported App' });
      expect(importedApp).toBeDefined();

      const importedTable = await getManager().findOne(InternalTable, { tableName: 'users' });
      expect(importedTable).toBeDefined();
    });

    it('should import an app with all its data, export it, and verify its integrity', async () => {
      const definitionFile: {
        tooljet_database: ImportTooljetDatabaseDto[];
        app: ImportAppDto[];
        tooljet_version: string;
      } = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../templates/release-notes/definition.json'), 'utf8'));
      definitionFile.app[0].appName = 'Release notes';

      const importResourcesDto: ImportResourcesDto = {
        ...definitionFile,
        organization_id: organization.id,
      };

      // Import the app
      const importResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .send(importResourcesDto)
        .expect(201);

      expect(importResponse.body.success).toBe(true);
      expect(importResponse.body.imports).toBeDefined();

      // Verify that the app was actually created
      const importedApp = await getManager().findOne(App, { where: { name: 'Release notes' } });
      expect(importedApp).toBeDefined();
      expect(importedApp.name).toBe('Release notes');

      const importedTable = await getManager().findOne(InternalTable, { where: { tableName: 'releasenotes' } });
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
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
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
                    showViewerNavigation: expect.any(Boolean),
                  }),
                ],
                components: expect.any(Array),
                createdAt: expect.any(String),
                creationMode: 'DEFAULT',
                currentVersionId: null,
                dataQueries: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'getLabel1',
                  }),
                  expect.objectContaining({
                    name: 'getLabel2',
                  }),
                  expect.objectContaining({
                    name: 'getReleaseNotes',
                  }),
                  expect.objectContaining({
                    name: 'getReleaseNoteswithFilter',
                  }),
                ]),
                dataSourceOptions: expect.any(Array),
                dataSources: expect.arrayContaining([
                  expect.objectContaining({ name: 'restapidefault' }),
                  expect.objectContaining({ name: 'runjsdefault' }),
                  expect.objectContaining({ name: 'runpydefault' }),
                  expect.objectContaining({ name: 'tooljetdbdefault' }),
                  expect.objectContaining({ name: 'workflowsdefault' }),
                ]),
                editingVersion: expect.any(Object),
                events: expect.any(Array),
                icon: expect.any(String),
                id: expect.any(String),
                isMaintenanceOn: expect.any(Boolean),
                isPublic: expect.any(Boolean),
                name: 'Release notes',
                organizationId: expect.any(String),
                pages: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'Home',
                  }),
                ]),
                schemaDetails: {
                  globalDataSources: true,
                  multiEnv: true,
                  multiPages: true,
                },
                slug: expect.any(String),
                type: 'front-end',
                updatedAt: expect.any(String),
                userId: expect.any(String),
                workflowApiToken: null,
                workflowEnabled: expect.any(Boolean),
              },
            },
          },
        ],
        tooljet_database: [
          {
            id: expect.any(String),
            table_name: 'releasenotes',
            schema: {
              columns: expect.arrayContaining([
                expect.objectContaining({
                  column_name: 'id',
                  data_type: 'integer',
                  constraints_type: expect.objectContaining({
                    is_primary_key: true,
                    is_not_null: true,
                  }),
                }),
                expect.objectContaining({
                  column_name: 'title',
                  data_type: 'character varying',
                }),
                expect.objectContaining({
                  column_name: 'description',
                  data_type: 'character varying',
                }),
                expect.objectContaining({
                  column_name: 'label_1',
                  data_type: 'character varying',
                }),
                expect.objectContaining({
                  column_name: 'label_2',
                  data_type: 'character varying',
                }),
                expect.objectContaining({
                  column_name: 'label_3',
                  data_type: 'character varying',
                }),
                expect.objectContaining({
                  column_name: 'published_date',
                  data_type: 'character varying',
                }),
                expect.objectContaining({
                  column_name: 'image_link',
                  data_type: 'character varying',
                }),
                expect.objectContaining({
                  column_name: 'doc_link',
                  data_type: 'character varying',
                }),
              ]),
            },
          },
        ],
      };

      expect(exportResponse.body).toMatchObject(expectedStructure);

      // Validate exported schema against the latest version using ValidateTooljetDatabaseConstraint
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
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
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
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .send(invalidTooljetDatabaseSchema)
        .expect(400);

      expect(response.body.message[0]).toContain(
        'ToolJet Database is not valid. Please ensure it matches the expected format'
      );
    });

    it('should transform tooljet database schema to latest version', async () => {
      const oldVersionSchema = {
        organization_id: uuidv4(),
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

      const response = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .send(oldVersionSchema)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify that the schema was transformed
      const importedTable = await getManager().findOne(InternalTable, { tableName: 'users' });
      expect(importedTable).toBeDefined();

      // Export the table to check its structure
      const exportResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .send({
          organization_id: organization.id,
          tooljet_database: [{ table_id: importedTable.id }],
        })
        .expect(201);

      const exportedSchema = exportResponse.body.tooljet_database[0].schema;
      expect(exportedSchema.columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            column_name: 'id',
            data_type: 'integer',
            constraints_type: {
              is_primary_key: true,
              is_not_null: true,
              is_unique: true,
            },
          }),
          expect.objectContaining({
            column_name: 'name',
            data_type: 'character varying',
            constraints_type: {
              is_primary_key: false,
              is_not_null: true,
              is_unique: false,
            },
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
      // Load the definition file
      const definitionFile: {
        tooljet_database: CloneTooljetDatabaseDto[];
        app: CloneAppDto[];
        tooljet_version: string;
      } = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../templates/release-notes/definition.json'), 'utf8'));
      definitionFile.app[0].name = 'Release notes';

      // Import the original app
      const importResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/import')
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .send({ ...definitionFile, organization_id: organization.id } as CloneResourcesDto)
        .expect(201);

      expect(importResponse.body.success).toBe(true);
      const originalAppId = importResponse.body.imports.app[0].id;

      // Clone the app
      const cloneResourcesDto: CloneResourcesDto = {
        organization_id: organization.id,
        app: [{ id: originalAppId, name: 'Release notes clone' }],
        tooljet_database: [],
      };

      const cloneResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/clone')
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .send(cloneResourcesDto)
        .expect(201);

      expect(cloneResponse.body.success).toBe(true);
      expect(cloneResponse.body.imports.app[0].name).toBe('Release notes clone');

      // Export the cloned app
      const tablesForApp = await appsService.findTooljetDbTables(cloneResponse.body.imports.app[0].id);
      const exportResourcesDto: ExportResourcesDto = {
        organization_id: organization.id,
        app: [{ id: cloneResponse.body.imports.app[0].id, search_params: null }],
        tooljet_database: tablesForApp,
      };

      const exportResponse = await request(app.getHttpServer())
        .post('/api/v2/resources/export')
        .set('Cookie', loggedUser.tokenCookie)
        .set('tj-workspace-id', user.defaultOrganizationId)
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
                    showViewerNavigation: expect.any(Boolean),
                  }),
                ],
                components: expect.any(Array),
                createdAt: expect.any(String),
                creationMode: 'DEFAULT',
                currentVersionId: null,
                dataQueries: expect.any(Array),
                dataSourceOptions: expect.any(Array),
                dataSources: expect.arrayContaining([
                  expect.objectContaining({
                    kind: expect.any(String),
                    name: expect.any(String),
                    scope: expect.any(String),
                    type: expect.any(String),
                  }),
                ]),
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
                type: 'front-end',
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

      // Additional specific checks
      const clonedApp = exportResponse.body.app[0].definition.appV2;

      expect(clonedApp.dataQueries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'getLabel1',
          }),
          expect.objectContaining({
            name: 'getLabel2',
          }),
          expect.objectContaining({
            name: 'getReleaseNotes',
          }),
          expect.objectContaining({
            name: 'getReleaseNoteswithFilter',
          }),
        ])
      );

      expect(clonedApp.dataSources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'restapidefault' }),
          expect.objectContaining({ name: 'runjsdefault' }),
          expect.objectContaining({ name: 'runpydefault' }),
          expect.objectContaining({ name: 'tooljetdbdefault' }),
          expect.objectContaining({ name: 'workflowsdefault' }),
        ])
      );

      expect(clonedApp.pages).toHaveLength(1);
      expect(clonedApp.pages[0].name).toBe('Home');

      // Verify components
      expect(clonedApp.components).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'Container' }),
          expect.objectContaining({ type: 'Text' }),
          expect.objectContaining({ type: 'Image' }),
          expect.objectContaining({ type: 'Multiselect' }),
          expect.objectContaining({ type: 'Button' }),
          expect.objectContaining({ type: 'Listview' }),
          expect.objectContaining({ type: 'Spinner' }),
          expect.objectContaining({ type: 'Tags' }),
        ])
      );
    });

    it('should throw ForbiddenException if user lacks permission', async () => {
      const regularUserData = await createUser(app, { email: 'regular@tooljet.io', groups: ['all_users'] });
      const regularLoggedUser = await authenticateUser(app, regularUserData.user.email);

      const originalApp = await getManager().save(App, {
        name: 'Original App',
        organizationId: organization.id,
        userId: user.id,
      });

      const cloneResourcesDto: CloneResourcesDto = {
        organization_id: organization.id,
        app: [{ id: originalApp.id, name: 'Cloned App' }],
        tooljet_database: [],
      };

      await request(app.getHttpServer())
        .post('/api/v2/resources/clone')
        .set('Cookie', regularLoggedUser.tokenCookie)
        .set('tj-workspace-id', regularUserData.user.defaultOrganizationId)
        .send(cloneResourcesDto)
        .expect(403);

      await logoutUser(app, regularLoggedUser.tokenCookie, regularUserData.user.defaultOrganizationId);
    });
  });
});
