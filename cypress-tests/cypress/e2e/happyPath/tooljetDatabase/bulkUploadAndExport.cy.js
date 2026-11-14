import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiPromote,
  apiSeedSql,
  apiSelectRows,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - bulk upload and CSV export', () => {
  let envs;
  let table;
  let tableNames = [];

  const openTable = () => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(table.name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).should('be.visible');
  };

  const selectEnvironment = (name) => {
    cy.get(tooljetDatabaseSelectors.switcherButton).click();
    cy.get(tooljetDatabaseSelectors.environmentOption(name)).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).should(
      'contain.text',
      name.charAt(0).toUpperCase() + name.slice(1)
    );
  };

  const uploadCsv = (contents) => {
    cy.get(tooljetDatabaseSelectors.addNewDataButton).first().click();
    cy.get(tooljetDatabaseSelectors.bulkUploadOption).click();
    cy.get(tooljetDatabaseSelectors.bulkUploadFileInput).selectFile(
      { contents: Cypress.Buffer.from(contents), fileName: 'rows.csv', mimeType: 'text/csv' },
      { force: true }
    );
    cy.get(tooljetDatabaseSelectors.uploadDataButton).should('not.be.disabled').click();
  };

  const downloadedFile = (prefix, attempts = 20) =>
    cy.exec('ls cypress/downloads', { failOnNonZeroExit: false, log: false }).then(({ stdout }) => {
      const match = stdout.split('\n').find((file) => file.startsWith(prefix));
      if (match) return match;
      expect(attempts, `no download starting with ${prefix}`).to.be.greaterThan(0);
      cy.wait(500, { log: false });
      return downloadedFile(prefix, attempts - 1);
    });

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_bulk');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('uploads a CSV file into the table', () => {
    openTable();
    uploadCsv('name\nada\nbob\n');

    cy.get(tooljetDatabaseSelectors.totalRecords, { timeout: 20000 }).should('contain.text', '2 records');
    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(rows.map((row) => row.name)).to.deep.eq(['ada', 'bob']);
    });
  });

  it('uploads into the environment that is selected', () => {
    apiPromote(table.id, envs.development).its('status').should('eq', 201);
    openTable();
    selectEnvironment('staging');
    uploadCsv('name\nstaging-row\n');

    cy.get(tooljetDatabaseSelectors.totalRecords, { timeout: 20000 }).should('contain.text', '1 records');
    apiSelectRows(table.id, envs.staging).then((rows) => {
      expect(rows.map((row) => row.name)).to.deep.eq(['staging-row']);
    });
    apiSelectRows(table.id, envs.development).should('have.length', 0);
  });

  it('exports the CSV of the environment that is chosen', () => {
    apiPromote(table.id, envs.development).its('status').should('eq', 201);
    apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('dev-row')", envs.development)
      .its('status')
      .should('eq', 201);
    apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('staging-row')", envs.staging)
      .its('status')
      .should('eq', 201);
    openTable();

    // the kebab is only rendered while the pointer is over the list item
    cy.get(tooljetDatabaseSelectors.tableItem(table.name)).trigger('mouseover');
    cy.get(tooljetDatabaseSelectors.tableItem(table.name)).find(tooljetDatabaseSelectors.tableKebabIcon).click();
    cy.get(tooljetDatabaseSelectors.exportCsvOption).click();
    cy.get(tooljetDatabaseSelectors.exportCsvModal).should('be.visible');
    cy.get(tooljetDatabaseSelectors.exportCsvEnvironment('staging')).click();
    cy.get(tooljetDatabaseSelectors.exportCsvConfirm).click();

    cy.readFile(`cypress/downloads/${table.name}-staging.csv`, { timeout: 20000 }).then((csv) => {
      expect(csv).to.include('staging-row');
      expect(csv).to.not.include('dev-row');
    });
  });

  it('exports the table schema as a JSON file', () => {
    openTable();

    cy.get(tooljetDatabaseSelectors.tableItem(table.name)).trigger('mouseover');
    cy.get(tooljetDatabaseSelectors.tableItem(table.name)).find(tooljetDatabaseSelectors.tableKebabIcon).click();
    cy.get(tooljetDatabaseSelectors.exportSchemaOption).click();

    downloadedFile(`${table.name}-export-`).then((fileName) => {
      cy.readFile(`cypress/downloads/${fileName}`).then((schema) => {
        expect(JSON.stringify(schema)).to.include(table.name);
      });
    });
  });
});
