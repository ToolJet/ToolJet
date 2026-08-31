import { Environments } from 'Constants/constants/multiEnv';
import { commonSelectors, commonWidgetSelector } from 'Selectors/common';
import { commonEeSelectors, multiEnvSelector } from 'Selectors/eeCommon';
import { importSelectors } from 'Selectors/exportImport';
import { moduleSelectors } from 'Selectors/platform/modules';
import { dragModuleIntoCanvas, openModulesList } from 'Support/utils/platform/modules';

describe('Modules — Workspace Constants Across Environments', () => {
  const testId = Date.now();
  const moduleFile = 'cypress/fixtures/templates/modules/one version module.json';
  // Filename-derived, same convention as moduleImport.cy.js (readAndImport
  // strips only the ".json" extension — the space stays as-is).
  const moduleFileName = 'one version module';

  const ENDPOINT = 'http://130.131.160.149:4000';
  // Env-var-seeded, static across all 3 environments (root .env).
  const HEADER_KEY_VALUE = 'customHeader';
  const UI_CONST_GLOBAL_VALUE = 'sample-ui-constant-value';

  let workspaceId, wsName, wsSlug;
  let moduleAppId, moduleEditingVersionId, moduleDevEnvironmentId;
  let consumerAppId;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `modules-constants-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiCreateWorkspaceConstant(
      'ui_const',
      ENDPOINT,
      ['Secret'],
      [Environments.development, Environments.staging, Environments.production]
    );

    cy.apiCreateWorkspaceConstant(
      'ui_const',
      UI_CONST_GLOBAL_VALUE,
      ['Global'],
      [Environments.development, Environments.staging, Environments.production]
    );

    cy.then(() => openModulesList());

    cy.get(importSelectors.dropDownMenu).should('be.visible').click();
    cy.get(importSelectors.importOptionInput).eq(0).selectFile(moduleFile, { force: true });
    cy.wait(2000);
    cy.get('[data-cy="import-module"]').click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Module imported successfully.');
    cy.url({ timeout: 15000 }).should('include', '/apps/');

    cy.url().then((url) => {
      moduleAppId = url.split('/apps/')[1].split('/')[0];
      Cypress.env('appId', moduleAppId);
      cy.intercept('GET', `/api/apps/${moduleAppId}`).as('getModuleData');
      cy.reload();
      cy.wait('@getModuleData').then((interception) => {
        moduleEditingVersionId = interception.response.body.editing_version.id;
        moduleDevEnvironmentId = interception.response.body.editorEnvironment.id;
        Cypress.env('editingVersionId', moduleEditingVersionId);
        Cypress.env('environmentId', moduleDevEnvironmentId);
      });
    });
     cy.apiPublishDraftVersion('v1');
    cy.reload();
    cy.wait(2000);
  });

  const promoteEnv = (fromEnv) => {
    cy.get(multiEnvSelector.environmentsTag(fromEnv)).click();
    cy.waitForElement(commonEeSelectors.promoteVersionButton);
    cy.wait(200);
    cy.get(commonEeSelectors.promoteVersionButton, { timeout: 10000 }).click();
    cy.get(commonEeSelectors.promoteButton, { timeout: 10000 }).click();
    cy.wait(2000);
  };

  const verifyResolvedForEnv = (envLabel) => {
    cy.get('[data-cy="text1-text"] > .text-widget-section').verifyVisibleElement(
      'have.text',
      `Env Secrets: ${envLabel} environment testing`
    );
    cy.get('[data-cy="text3-text"] > .text-widget-section').verifyVisibleElement(
      'have.text',
      `UI Secrets and Global Env: ${envLabel} environment testing`
    );
    cy.get('[data-cy="text2-text"] > .text-widget-section').verifyVisibleElement(
      'have.text',
      `Env Constant: ${HEADER_KEY_VALUE}`
    );
    cy.get('[data-cy="text4-text"] > .text-widget-section').verifyVisibleElement(
      'have.text',
      `UI Constants: ${UI_CONST_GLOBAL_VALUE}`
    );
  };

  it('imports a module and verifies its secrets/constants resolve correctly across dev/staging/production', () => {
  
    verifyResolvedForEnv('Development');

    promoteEnv(Environments.development);
    verifyResolvedForEnv('Staging');

    promoteEnv(Environments.staging);
    verifyResolvedForEnv('Production');
  });

  it('embeds the module in a consuming app and verifies its constants still resolve correctly across dev/staging/production', () => {
    const consumerAppName = `Constants Consumer ${testId}`;

    cy.apiCreateApp(consumerAppName).then(() => {
      consumerAppId = Cypress.env('appId');
    });

    cy.visit(`/${Cypress.env('workspaceSlug')}`);
    cy.get(commonSelectors.appCard(consumerAppName))
      .trigger('mousehover')
      .trigger('mouseenter')
      .find(commonSelectors.editButton)
      .click({ force: true });
    cy.wait(2000);

    dragModuleIntoCanvas(moduleFileName);

    verifyResolvedForEnv('Development');

    // Save/lock this version before promoting 
    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector('v1 save version')).click();
    cy.get(commonWidgetSelector.parameterInputField('version name')).clear().type('v1');
    cy.get(commonSelectors.buttonSelector('create version save')).click();
    cy.get(moduleSelectors.versionLockBanner, { timeout: 15000 }).should('be.visible');

   
    cy.then(() => {
      Cypress.env('editingVersionId', moduleEditingVersionId);
      cy.apiPromoteAppVersion(moduleDevEnvironmentId, moduleAppId).then(() => {
        cy.apiPromoteAppVersion(Cypress.env('stagingEnvId'), moduleAppId);
      });
    });
    cy.then(() => {
      cy.getAuthHeaders().then((headers) => {
        cy.request({
          method: 'PUT',
          url: `${Cypress.env('server_host')}/api/apps/${moduleAppId}/release`,
          headers,
          body: { versionToBeReleased: moduleEditingVersionId },
        }).then((res) => {
          expect(res.status).to.eq(200);
        });
      });
    });

    promoteEnv(Environments.development);
    verifyResolvedForEnv('Staging');

    promoteEnv(Environments.staging);
    verifyResolvedForEnv('Production');
  });
});
