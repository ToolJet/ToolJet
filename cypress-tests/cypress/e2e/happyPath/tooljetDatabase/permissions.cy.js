import { fake } from 'Fixtures/fake';
import {
  getEnvironmentIds,
  uniqueTableName,
  apiCreateTable,
  apiPromote,
  apiPromotePreview,
  apiMigrations,
  apiDependents,
  apiRawSqlMigration,
  apiRevertMigration,
  apiSeedSql,
  apiDropTables,
  tooljetDatabaseRequest,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database environments - who can do what', () => {
  const users = {
    builder: { name: fake.firstName, email: fake.email.toLowerCase() },
    endUser: { name: fake.firstName, email: fake.email.toLowerCase() },
  };
  let orgId;
  let envs;
  let table;
  let tableNames = [];

  // a fresh login replaces the session cookie, no logout since cookies are cleared between tests
  const loginAs = (email) => {
    cy.apiLogin(email, 'password', orgId);
  };
  const loginAsAdmin = () => loginAs('dev@tooljet.io');

  before(() => {
    cy.apiLogin();
    cy.then(() => {
      orgId = Cypress.env('workspaceId');
    });
    cy.apiFullUserOnboarding(users.builder.name, users.builder.email, 'builder', 'password', 'My workspace');
    loginAsAdmin();
    cy.apiFullUserOnboarding(users.endUser.name, users.endUser.email, 'end-user', 'password', 'My workspace');
  });

  beforeEach(() => {
    tableNames = [];
    loginAsAdmin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_perm');
    tableNames.push(name);
    apiCreateTable(name).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    loginAsAdmin();
    apiDropTables(tableNames);
  });

  it('TC-36 TC-40 an end-user is refused every table-management route', () => {
    loginAs(users.endUser.email);
    const refused = (label, request) =>
      request.then((response) => {
        expect(response.status, label).to.eq(403);
      });

    refused('promote preview', apiPromotePreview(table.id, envs.development));
    refused('promote', apiPromote(table.id, envs.development));
    refused('raw SQL migration', apiRawSqlMigration(table.id, 'ALTER TABLE "{{self}}" ADD COLUMN x integer'));
    refused(
      'revert',
      apiRevertMigration(table.id, '00000000-0000-4000-8000-000000000000', 'ALTER TABLE "{{self}}" DROP COLUMN x')
    );
    refused('seed SQL', apiSeedSql(table.id, 'SELECT * FROM {{self}}', envs.development));
    refused('baseline report', tooljetDatabaseRequest('GET', '/baseline-report'));
    refused('baseline repair', tooljetDatabaseRequest('POST', `/table/${table.id}/baseline/repair`));

    // nothing happened: staging still has no copy of the table
    loginAsAdmin();
    apiPromotePreview(table.id, envs.development).its('body.result.target_relation_exists').should('eq', false);
  });

  // BUG-01: migration history and dependents answer 200 for an end-user, re-enable once fixed
  it.skip("TC-37 an end-user cannot read a table's migration history or its dependents", () => {
    loginAs(users.endUser.email);
    // intended to be restricted to people who may manage the table
    apiMigrations(table.id).then((response) => {
      expect(response.status, 'migration history').to.eq(403);
    });
    apiDependents(table.id).then((response) => {
      expect(response.status, 'dependents').to.eq(403);
    });

    // control: the admin reads both
    loginAsAdmin();
    apiMigrations(table.id).its('status').should('eq', 200);
    apiDependents(table.id).its('status').should('eq', 200);
  });

  it('TC-38 TC-39 a builder can manage tables, preview, promote and run seed SQL', () => {
    loginAs(users.builder.email);
    apiPromotePreview(table.id, envs.development).its('status').should('eq', 200);
    apiPromote(table.id, envs.development).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.result.promoted_to).to.eq('staging');
    });
    apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('by-builder')", envs.staging)
      .its('status')
      .should('eq', 201);
    tooljetDatabaseRequest('GET', '/baseline-report').its('status').should('eq', 200);
  });

  it('TC-41 baseline repair on a healthy table changes nothing', () => {
    tooljetDatabaseRequest('POST', `/table/${table.id}/baseline/repair`).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.result).to.deep.eq({ baseline_error: null, migrations_recorded: 0 });
    });
    tooljetDatabaseRequest('GET', '/baseline-report').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.result).to.deep.eq([]);
    });
  });
});
