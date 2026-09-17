import { commonSelectors, commonWidgetSelector } from 'Selectors/common';
import { moduleSelectors } from 'Selectors/platform/modules';
import {
  attemptDeleteModuleFromList,
  attemptDeleteModuleVersion,
  authorModuleContract,
  createModuleDraftVersion,
  createModuleViaAPI,
  dragModuleIntoCanvas,
  ensureVersionSwitcherOpen,
  openModulesList,
  publishModuleVersion,
  selectModuleViewerPinnedVersion,
} from 'Support/utils/platform/modules';

describe('Modules — ModuleViewer Pinning & Delete Guards', () => {
  const moduleViewerInstance = 'moduleviewer1';

  let workspaceId;
  let consumerAppId;
  let moduleName;
  let consumerAppName;

  beforeEach(() => {
    const testId = Date.now();
    const shortId = String(testId).slice(-6);
    const wsName = `modules-consumption-${testId}`;
    const wsSlug = wsName;

    moduleName = `Consume Mod ${shortId}`;
    consumerAppName = `Consume App ${shortId}`;

    cy.apiLogin();

    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.then(() => {
      createModuleViaAPI(moduleName);
      authorModuleContract();
      publishModuleVersion('v1', 'v1-published');
    });

    cy.apiCreateApp(consumerAppName).then(() => {
      consumerAppId = Cypress.env('appId');
    });
    cy.viewport(2000, 1900);

    cy.then(() => {
      cy.openApp()
      cy.wait(2000);
      dragModuleIntoCanvas(moduleName);
      cy.get(commonWidgetSelector.draggableWidget(moduleViewerInstance)).should('exist');
    });
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  it('resolves the pinned module version correctly, and blocks saving while a newer draft is pinned but allows it once re-pinned to published', () => {
    cy.get(commonWidgetSelector.draggableWidget(moduleViewerInstance)).click();
    cy.get(commonWidgetSelector.widgetConfigHandle(moduleViewerInstance)).click();

    // Pinned version should resolve to the published version, not "Draft".
    cy.contains('label', 'Version').parent().should('contain.text', 'v1-published').and('not.contain.text', 'Draft');

    cy.get('body').should('not.contain.text', 'Error fetching module data');

    cy.get(moduleSelectors.inputItem('input1')).should('not.exist'); // contract lives on ModuleContainer, not here
    cy.contains('Input').should('be.visible');

    openModulesList();
    cy.get(commonSelectors.appCard(moduleName))
      .trigger('mousehover')
      .trigger('mouseenter')
      .find(commonSelectors.editButton)
      .click({ force: true });
    cy.wait(2000);
    createModuleDraftVersion('v2-draft');

    cy.visit(`/${Cypress.env('workspaceSlug')}`);
    cy.get(commonSelectors.appCard(consumerAppName))
      .trigger('mousehover')
      .trigger('mouseenter')
      .find(commonSelectors.editButton)
      .click({ force: true });
    cy.wait(2000);

    cy.get(commonWidgetSelector.draggableWidget(moduleViewerInstance)).click();
    cy.get(commonWidgetSelector.widgetConfigHandle(moduleViewerInstance)).click();
    selectModuleViewerPinnedVersion('v2-draft');
    cy.contains('label', 'Version').parent().should('contain.text', 'Draft');

    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector('v1 save version')).click();
    cy.get(commonWidgetSelector.parameterInputField('version name')).clear().type('v2');
    cy.get(commonSelectors.buttonSelector('create version save')).click();

    // Save/Publish should be blocked
    cy.get(commonSelectors.toastMessage).should('be.visible');
    cy.get(moduleSelectors.versionLockBanner).should('not.exist');

    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="create-version-cancel-button"]').length > 0) {
        cy.get('[data-cy="create-version-cancel-button"]').click();
      }
    });

    // Re-pin to the published version — save should now succeed.
    cy.get(commonWidgetSelector.draggableWidget(moduleViewerInstance)).click();
    cy.get(commonWidgetSelector.widgetConfigHandle(moduleViewerInstance)).click();
    selectModuleViewerPinnedVersion('v1-published');
    cy.contains('label', 'Version').parent().should('contain.text', 'v1-published').and('not.contain.text', 'Draft');

    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector('v1 save version')).click();
    cy.get(commonWidgetSelector.parameterInputField('version name')).clear().type('v2');
    cy.get(commonSelectors.buttonSelector('create version save')).click();
    cy.get(moduleSelectors.versionLockBanner, { timeout: 15000 }).should('be.visible');
  });

  it('enforces delete guards while the module is referenced, and allows deleting the module and its version once unreferenced', () => {
    cy.get(commonWidgetSelector.draggableWidget(moduleViewerInstance)).click();
    cy.get(commonWidgetSelector.widgetConfigHandle(moduleViewerInstance)).click();
    cy.contains('label', 'Version').parent().should('contain.text', 'v1-published');

    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector('v1 save version')).click();
    cy.get(commonWidgetSelector.parameterInputField('version name')).clear().type('v2');
    cy.get(commonSelectors.buttonSelector('create version save')).click();
    cy.get(moduleSelectors.versionLockBanner, { timeout: 15000 }).should('be.visible');

    // assertNotReferenced: deleting the module while it's still embedded
    openModulesList();
    attemptDeleteModuleFromList(moduleName);

    cy.get(commonSelectors.toastMessage).should('be.visible');
    cy.get(commonSelectors.appCard(moduleName)).should('be.visible');

    // checkModuleVersionInUse: deleting the specific version

    cy.get(commonSelectors.appCard(moduleName))
      .trigger('mousehover')
      .trigger('mouseenter')
      .find(commonSelectors.editButton)
      .click({ force: true });
    cy.wait(2000);

    attemptDeleteModuleVersion('v1-published');

    
    cy.contains('main (Draft) version is the head of the main branch and cannot be deleted').should('be.visible');
    ensureVersionSwitcherOpen();
    cy.get(`[data-cy="v1-published-version-name"]`).should('exist');

    cy.apiDeleteApp(consumerAppId);

    attemptDeleteModuleVersion('v1-published');
    ensureVersionSwitcherOpen();
    cy.get(`[data-cy="v1-published-version-name"]`).should('not.exist');

    openModulesList();
    attemptDeleteModuleFromList(moduleName);
    cy.get(commonSelectors.appCard(moduleName)).should('not.exist');
  });
});
