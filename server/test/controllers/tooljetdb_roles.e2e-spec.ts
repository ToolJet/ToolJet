// import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
// import {
//   clearDB,
//   createNestAppInstance,
//   createUser,
//   authenticateUser
// } from '../test.helper';
// import { getManager, EntityManager, DataSource } from 'typeorm';
// import { tooljetDbOrmconfig } from '../../ormconfig';
// import { Organization } from '../../src/entities/organization.entity';
// import { OrganizationTjdbConfigurations } from '../../src/entities/organization_tjdb_configurations.entity';
// import { v4 as uuidv4 } from 'uuid';
// import { findTenantSchema } from 'src/helpers/tooljet_db.helper';

// function prepareNewWorkspaceJson(workspaceName: string) {
//   switch (workspaceName) {
//     case 'workspace1':
//       return { name: "workspace1", slug: "workspace1" };
//     case 'workspace2':
//       return { name: "workspace2", slug: "workspace2" };
//     default:
//       return { name: "workspace1", slug: "workspace1" };
//   }
// }

// async function createNewTooljetDbCustomConnection(user, password, schema = ''): Promise<{ tooljetDbTenantConnection: Connection; tooljetDbTenantManager: EntityManager }> {
//   const tooljetDbTenantConnection = new DataSource({
//     ...tooljetDbOrmconfig,
//     ...(schema && {schema: schema}),
//     username: user,
//     password: password,
//     name: `${uuidv4()}`,
//     extra: {
//       ...tooljetDbOrmconfig.extra,
//       idleTimeoutMillis: 60000,
//     },
//   } as any);

//  await tooljetDbTenantConnection.initialize();
//   const tooljetDbTenantManager = tooljetDbTenantConnection.createEntityManager();
//   return { tooljetDbTenantConnection, tooljetDbTenantManager };
// }

// describe('Tooljet Database Role E2E Tests', () => {
//   let app: INestApplication;

//   beforeAll(async () => {
//     app = await createNestAppInstance();
//   });

//   afterAll(async () => {
//     await app.close();
//   });

//   beforeEach(async () => {
//     await clearDB();
//   });

//   afterEach(() => {
//     jest.resetAllMocks();
//     jest.clearAllMocks();
//   })

//   // Scenario 1
//   describe('Scenario 1: New Schema Creation', () => {
//     it('should create new schemas using Admin login', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;

//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)

//       // Check if entry has been added to Org and OrgTjdbConfiguration table
//       const organizationDetailList = await getManager().find(Organization, {
//         name: 'workspace1'
//       });
//       expect(organizationDetailList).toHaveLength(1);

//       // Fetch: Tjdb configurations for tenant user
//       const [organizationDetail] = organizationDetailList;
//       const organizationConfigDetails = await getManager().find(OrganizationTjdbConfigurations, {
//         organizationId: organizationDetail.id
//       })
//       expect(organizationConfigDetails).toHaveLength(1);

//       // Check if Schema has been created successfully
//       const isSchemaExists = getManager('tooljetDb').query(`SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'workspace_${organizationDetail.id}' )`)
//       expect(isSchemaExists).toBe(true);
//     });

//     it ('should not allow tenant user to create new schema', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//       // Fetch user details from config table
//       const organizationDetailList = await getManager().find(Organization, {
//         name: 'workspace1'
//       });
//       expect(organizationDetailList).toHaveLength(1);

//       const [organizationDetail] = organizationDetailList;
//       const organizationConfigDetails = await getManager().find(OrganizationTjdbConfigurations, {
//         organizationId: organizationDetail.id
//       });
//       expect(organizationConfigDetails).toHaveLength(1);
//       const [organizationConfigDetail] = organizationConfigDetails;
//       const { pgUser, pgPassword } = organizationConfigDetail;

//       // Create new connection
//       const { tooljetDbTenantConnection } = await createNewTooljetDbCustomConnection(pgUser, pgPassword);
//       // Tenant user must not be able to create new schema
//       expect(async () => {
//         await tooljetDbTenantConnection.createQueryRunner().query(`CREATE SCHEMA sampleworkspace1 AUTHORIZATION "${pgUser}"`);
//       }).toThrow()
//     })

//     it('should allow tenant user to connect database but doesnt allow creation of database', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;

//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//       // Fetch details from Organization table and Organization Config table
//       const organizationDetailList = await getManager().find(Organization, {
//         name: 'workspace1'
//       })
//       expect(organizationDetailList).toHaveLength(1);

//       // Fetch TJDB configuration for tenant user
//       const [organizationDetail] = organizationDetailList;
//       const organizationConfigDetails = await getManager().find(OrganizationTjdbConfigurations, {
//         organizationId: organizationDetail.id
//       });
//       expect(organizationConfigDetails).toHaveLength(1);
//       const [organizationConfigDetail] = organizationConfigDetails;
//       const { pgUser } = organizationConfigDetail;
//       const database = process.env['TOOLJET_DB'];

//       // Check if Tenant user can connect to database
//       const checktenantUserCanConnectTjdb = await getManager('tooljetDb').query(`SELECT has_database_privilege('${pgUser}', ${database}, 'CONNECT')`);
//       expect(checktenantUserCanConnectTjdb.has_database_privilege).toBe(true)
//       // Check Tenant user cannot create database
//       const checktenantUserCanCreateTjdb = await getManager('tooljetDb').query(`SELECT has_database_privilege('${pgUser}', ${database}, 'CREATE')`);
//       expect(checktenantUserCanCreateTjdb.has_database_privilege).toBe(false)
//     });

//     it('should restrict tenant user access to only respective schema', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)

//       // Create second workspace
//       const workspace2Details = prepareNewWorkspaceJson('workspace2');
//       const createSecondWorkspaceResponse = await request(app.getHttpServer())
//       .post('/api/organizations')
//       .set('tj-workspace-id', user.defaultOrganizationId)
//       .set('Cookie', userData['tokenCookie'])
//       .send({
//         ...workspace2Details
//       })
//       expect(createSecondWorkspaceResponse.statusCode).toBe(200)

//       // Fetch details from Organization table and Organization Config table
//       const orgOneDetailsList = await getManager().find(Organization, {
//         name: 'workspace1'
//       })
//       expect(orgOneDetailsList).toHaveLength(1);
//       const [orgOneDetail] = orgOneDetailsList;
//       // Fetch TJDB configuration for tenant user
//       const orgOneConfigDetails = await getManager().find(OrganizationTjdbConfigurations, {
//         organizationId: orgOneDetail.id
//       });
//       expect(orgOneConfigDetails).toHaveLength(1);
//       const [orgOneConfigDetail] = orgOneConfigDetails;
//       const orgOneTenantUser = orgOneConfigDetail.pgUser;

//       // Second workspace details
//       const orgTwoDetailsList = await getManager().find(Organization, {
//         name: 'workspace2'
//       })
//       expect(orgTwoDetailsList).toHaveLength(1);
//       const [orgTwoDetail] = orgTwoDetailsList;

//       const shouldAccessRespectiveTenantSchema = await getManager('tooljetDb').query(`select has_schema_privilege('${orgOneTenantUser}', 'workspace_${orgOneDetail.id}', 'USAGE')`);
//       expect(shouldAccessRespectiveTenantSchema.has_schema_privilege).toBe(true);
//       const shouldNotBeAbleToAccessOtherTenantSchema = await getManager('tooljetDb').query(`select has_schema_privilege('${orgOneTenantUser}', 'workspace_${orgTwoDetail.id}', 'USAGE')`);
//       expect(shouldNotBeAbleToAccessOtherTenantSchema.has_schema_privilege).toBe(false);
//     });

//     it('should prevent tenant user from accessing public Schema', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)

//       // Fetch details from Organization table and Organization Config table
//       const orgOneDetailsList = await getManager().find(Organization, {
//         name: 'workspace1'
//       })
//       expect(orgOneDetailsList).toHaveLength(1);
//       const [orgOneDetail] = orgOneDetailsList;
//       // Fetch TJDB configuration for tenant user
//       const orgOneConfigDetails = await getManager().find(OrganizationTjdbConfigurations, {
//         organizationId: orgOneDetail.id
//       });
//       expect(orgOneConfigDetails).toHaveLength(1);
//       const [orgOneConfigDetail] = orgOneConfigDetails;
//       const orgOneTenantUser = orgOneConfigDetail.pgUser;

//       const shouldNotBeAbleToAccessPublicSchema = await getManager('tooljetDb').query(`select has_schema_privilege('${orgOneTenantUser}', 'public', 'USAGE')`);
//       expect(shouldNotBeAbleToAccessPublicSchema.has_schema_privilege).toBe(false);
//     });
//   });

//   // Scenario 2
//   describe('Scenario 2: Create Table Flow', () => {
//     // WORKING
//     it('should allow admin to create table', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });

//     it('should prevent tenant from creating table', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });
//   });

//   // Scenario 3
//   describe('Scenario 3: View Table Details', () => {
//     it('should allow admin to create workspace, tenant user, and table', async () => {
//       // Implementation
//     });

//     it('should allow admin to view tables API as expected', async () => {
//       // Implementation
//     });
//   });

//   // Scenario 4
//   describe('Scenario 4: Column Operations', () => {
//     it('should prevent tenant from creating column with constraints and FK', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)

//     });

//     it('should allow admin to create column with constraints and FK', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });

//     it('should allow admin to edit existing column, including constraints and FK', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });

//     it('should prevent tenant from editing columns', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });

//     it('should allow admin to drop columns', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });

//     it('should prevent tenant from dropping columns', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });
//   });

//   // Scenario 5
//   describe('Scenario 5: Drop Table', () => {
//     it('should prevent tenant from dropping the table', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });

//     it('should allow admin to drop the table', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });
//   });

//   // Scenario 6
//   describe('Scenario 6: Edit Table', () => {
//     it('should prevent tenant from editing table', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });

//     it('should allow admin to edit table', async () => {
//       const userData = await createUser(app, { email: 'admin@tooljet.io' });
//       const { user } = userData;

//       const loggedUser = await authenticateUser(app);
//       userData['tokenCookie'] = loggedUser.tokenCookie;
//       // Creates a new workspace
//       const workspace1Details = prepareNewWorkspaceJson('workspace1');
//       const createNewWorkspaceResponse = await request(app.getHttpServer())
//         .post('/api/organizations')
//         .set('tj-workspace-id', user.defaultOrganizationId)
//         .set('Cookie', userData['tokenCookie'])
//         .send({
//           ...workspace1Details
//         })
//         expect(createNewWorkspaceResponse.statusCode).toBe(200)
//     });
//   });
// });
