import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiAddColumn,
  apiPromotePreview,
  apiViewTable,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - concurrent promotes', () => {
  let envs;
  let tableNames = [];

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('lets two simultaneous promotes of the same table finish without a double apply', () => {
    const name = uniqueTableName('qa_conc');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name')]).then((id) => {
      apiAddColumn(name, plainColumn('gpa', 'integer'));
      const workspaceId = Cypress.env('workspaceId');
      const url = `${Cypress.env('server_host')}/api/tooljet-db/organizations/${workspaceId}/table/${id}/promote`;
      const promote = () =>
        fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'tj-workspace-id': workspaceId },
          body: JSON.stringify({ environment_id: envs.development }),
        }).then(async (response) => ({ status: response.status, body: await response.json() }));

      // started inside cy.then so the column above exists before the requests go out
      cy.then(() => Promise.all([promote(), promote()])).then((results) => {
        const statuses = results.map((result) => result.status);
        // one wins, the other either reports the conflict or finds nothing left to apply
        expect(statuses).to.include(201);
        results
          .filter((result) => result.status !== 201)
          .forEach((result) => {
            expect(result.status).to.eq(409);
            expect(result.body.message).to.include('Another promote is already in progress');
          });
      });

      apiViewTable(name, envs.staging).its('status').should('eq', 200);
      apiPromotePreview(id, envs.development).its('body.result.missing_migrations').should('have.length', 0);
    });
  });
});
