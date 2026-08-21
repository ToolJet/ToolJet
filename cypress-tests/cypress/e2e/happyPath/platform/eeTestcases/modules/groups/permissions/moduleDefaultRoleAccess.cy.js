import { commonSelectors } from 'Selectors/common';
import { openModulesList } from 'Support/utils/platform/modules';

describe('Modules — Coarse Permissions: Default Role Access', () => {
  const testId = Date.now();
  const wsName = `modules-coarse-role-${testId}`;
  const wsSlug = wsName;
  const builderEmail = `qa-coarse-builder-${testId}@example.com`;
  const endUserEmail = `qa-coarse-enduser-${testId}@example.com`;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiFullUserOnboarding('QA Coarse Builder', builderEmail, 'builder', 'password', wsName);
    cy.apiLogin();
    cy.apiFullUserOnboarding('QA Coarse End User', endUserEmail, 'end-user', 'password', wsName);
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.viewport(2000, 1900);
  });

  it('admin can create a module by default', () => {
    cy.apiLogin();
    openModulesList();
    cy.get(commonSelectors.buttonSelector('create new modules')).first().should('be.visible').and('be.enabled');
  });

  it('builder can create a module by default', () => {
    cy.apiLogin(builderEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.buttonSelector('create new modules')).first().should('be.visible').and('be.enabled');
  });

  it('end-user has no access to the Modules section', () => {
    cy.apiLogin(endUserEmail, 'password');
    cy.visit(`/${wsSlug}/modules`);
    cy.get(commonSelectors.pageSectionHeader, { timeout: 20000 }).should('contain.text', 'Applications');
  });
});
