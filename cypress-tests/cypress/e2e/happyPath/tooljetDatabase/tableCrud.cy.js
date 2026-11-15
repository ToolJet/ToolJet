import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import { commonSelectors } from 'Selectors/common';
import { databaseText } from 'Texts/marketplace/database';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiViewTable,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - table create, rename and delete', () => {
  let envs;
  let tableNames = [];

  const trackedName = (prefix) => {
    const name = uniqueTableName(prefix);
    tableNames.push(name);
    return name;
  };

  const openDatabase = () => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.addTableButton, { timeout: 20000 }).should('be.visible');
  };

  const openTableMenu = (name, optionSelector) => {
    // the kebab is only rendered while the pointer is over the list item
    cy.get(tooljetDatabaseSelectors.tableItem(name)).scrollIntoView().trigger('mouseover');
    cy.get(tooljetDatabaseSelectors.tableItem(name)).find(tooljetDatabaseSelectors.tableKebabIcon).click();
    cy.get(optionSelector).click();
  };

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('creates a table from the UI and shows it in the table list with an id column', () => {
    const name = trackedName('qa_crud_new');
    openDatabase();

    cy.get(tooljetDatabaseSelectors.addTableButton).click();
    cy.get(tooljetDatabaseSelectors.tableNameInput).clear().type(name);
    cy.get(commonSelectors.buttonSelector('Create')).click();

    cy.verifyToastMessage(commonSelectors.toastMessage, databaseText.tableCreatedSuccessfullyToast(name));
    cy.get(tooljetDatabaseSelectors.tableItem(name)).should('be.visible');

    cy.get(tooljetDatabaseSelectors.tableName(name)).click();
    cy.get(tooljetDatabaseSelectors.columnHeader('id')).should('be.visible');
    cy.get(tooljetDatabaseSelectors.noRecordsText).should('be.visible');
    apiViewTable(name, envs.development).its('status').should('eq', 200);
  });

  it('renames a table from the table menu', () => {
    const name = trackedName('qa_crud_old');
    const renamed = trackedName('qa_crud_ren');
    apiCreateTable(name, [plainColumn('name')]);

    openDatabase();
    openTableMenu(name, tooljetDatabaseSelectors.renameTableOption);
    cy.get(tooljetDatabaseSelectors.tableNameInput).clear().type(renamed);
    cy.get(commonSelectors.buttonSelector('Save changes')).click();

    // a rename is a schema change and needs a migration confirmation
    cy.get(tooljetDatabaseSelectors.migrationModal).should('be.visible');
    cy.get(tooljetDatabaseSelectors.migrationRun).click();
    cy.get(tooljetDatabaseSelectors.migrationModal).should('not.exist');

    cy.get(tooljetDatabaseSelectors.tableItem(renamed), { timeout: 20000 }).should('be.visible');
    cy.get(tooljetDatabaseSelectors.tableItem(name)).should('not.exist');
    apiViewTable(renamed, envs.development).its('status').should('eq', 200);
  });

  it('deletes a table from the table menu', () => {
    const name = trackedName('qa_crud_del');
    apiCreateTable(name, [plainColumn('name')]);

    openDatabase();
    openTableMenu(name, tooljetDatabaseSelectors.deleteTableOption);
    cy.get(tooljetDatabaseSelectors.deleteTableModal).should('be.visible');
    cy.get(tooljetDatabaseSelectors.deleteTableConfirm).click();

    cy.verifyToastMessage(commonSelectors.toastMessage, databaseText.tableDeletedSuccessfullyToast(name));
    cy.get(tooljetDatabaseSelectors.tableItem(name)).should('not.exist');
    apiViewTable(name, envs.development).its('status').should('eq', 404);
  });

  it('rejects a duplicate table name', () => {
    const name = trackedName('qa_crud_dup');
    apiCreateTable(name, [plainColumn('name')]);

    openDatabase();
    cy.intercept('POST', '**/api/tooljet-db/organizations/*/table').as('createTable');
    cy.get(tooljetDatabaseSelectors.addTableButton).click();
    cy.get(tooljetDatabaseSelectors.tableNameInput).clear().type(name);
    cy.get(commonSelectors.buttonSelector('Create')).click();

    // the error toast is too short-lived to assert on
    cy.wait('@createTable').its('response.statusCode').should('eq', 409);
    cy.get(tooljetDatabaseSelectors.tableNameInput).should('be.visible');
  });
});
