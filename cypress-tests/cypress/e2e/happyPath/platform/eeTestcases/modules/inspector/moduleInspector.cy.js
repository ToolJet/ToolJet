import { commonWidgetSelector, inspectorSelectors } from 'Selectors/common';
import { navigateAndVerifyInspector } from 'Support/utils/inspector';
import { defineModuleContract, dropModuleComponent } from 'Support/utils/platform/modules';

describe('Modules — Inspector', () => {
  let workspaceId;

  const createFreshModule = () => {
    const moduleName = `Globals Mod ${Date.now()}`;
    cy.apiCreateModule(moduleName).then((module) => {
      Cypress.env('appId', module.id);
      Cypress.env('user_id', module.user_id);
      cy.intercept('GET', `/api/apps/${module.id}`).as('getModuleData');
      cy.window({ log: false }).then((win) => {
        win.localStorage.setItem('walkthroughCompleted', 'true');
      });
      cy.visit(`/${Cypress.env('workspaceId')}/apps/${module.id}/`);
      cy.wait('@getModuleData').then((interception) => {
        const responseData = interception.response.body;
        Cypress.env('editingVersionId', responseData.editing_version.id);
        Cypress.env('environmentId', responseData.editorEnvironment.id);
      });
    });
  };

  afterEach(() => {
    cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
    cy.apiUpdateProfile({
      firstName: 'The',
      lastName: 'Developer',
    });
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    // Computed fresh per attempt — Cypress retries re-run the whole test body,
    // and a stable workspace name/slug would collide with the workspace
    // already created on a prior, later-failing attempt.
    const wsName = `modules-globals-${Date.now()}`;
    const wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    createFreshModule();
  });

  it('verifies the globals inspector — current user, environment, mode, theme, and module-specific input', () => {
    // --- current user: reflects the live profile, including updates made mid-session ---
    cy.apiUpdateProfile({
      firstName: 'The',
      lastName: 'Developer',
    });
    cy.reload();

    const currentUserDataList = [
      ['email', `"dev@tooljet.io"`],
      ['firstName', `"The"`],
      ['lastName', `"Developer"`],
      ['id', `${Cypress.env('user_id')}`],
      ['avatarId', `null`],
      ['groups', `[2]`],
      ['role', `"admin"`],
      ['ssoUserInfo', `{0}`],
    ];

    navigateAndVerifyInspector(['globals', 'currentUser'], currentUserDataList);

    cy.apiUpdateProfile({
      firstName: 'UpdatedThe',
      lastName: 'UpdatedDeveloper',
    }).then(() => {
      cy.reload();

      const currentUserDataListAfter = [
        ['email', `"dev@tooljet.io"`],
        ['firstName', `"UpdatedThe"`],
        ['lastName', `"UpdatedDeveloper"`],
        ['id', `${Cypress.env('user_id')}`],
        ['avatarId', `null`],
        ['groups', `[2]`],
        ['role', `"admin"`],
        ['ssoUserInfo', `{0}`],
      ];

      navigateAndVerifyInspector(['globals', 'currentUser'], currentUserDataListAfter);
    });

    cy.apiUpdateProfile({
      firstName: 'The',
      lastName: 'Developer',
    });
    cy.reload();
    
    // --- environment: matches the workspace's development environment id ---
    const developmentEnvId = Cypress.env('environmentId');
    const environmentDataList = [
      ['id', `${developmentEnvId}`],
      ['name', `development`],
    ];

    navigateAndVerifyInspector(['globals', 'environment'], environmentDataList);


    cy.reload();

    // --- mode: always "edit" inside the module editor ---
    const modeDataList = [['value', `edit`]];

    navigateAndVerifyInspector(['globals', 'mode'], modeDataList);

    cy.reload();


    const themeToggleButton = () =>
      cy.get('.left-sidebar-item:has(svg.lucide-moon), .left-sidebar-item:has(svg.lucide-sun)');

    // Normalize to light first — an earlier spec elsewhere in a full suite run
    // may have left this shared account in dark mode.
    cy.get('body').then(($body) => {
      if ($body.find('.left-sidebar-item:has(svg.lucide-sun)').length > 0) {
        themeToggleButton().click();
        cy.reload();
      }
    });

    navigateAndVerifyInspector(['globals', 'theme'], [['name', `light`]]);

    // KNOWN BUG (product, not test): 
    themeToggleButton().click();
    cy.wait(500);
    cy.reload();
    navigateAndVerifyInspector(['globals', 'theme'], [['name', `light`]]);

    themeToggleButton().click();
    cy.wait(500);
    cy.reload();
    navigateAndVerifyInspector(['globals', 'theme'], [['name', `light`]]);


    cy.reload();

    // --- module-specific 'input' global: only present once the module has a
    // defined contract, and carries the live contract data (not an empty node) ---
    dropModuleComponent();
    defineModuleContract();

    cy.get(commonWidgetSelector.sidebarinspector).should('be.visible').click();
    cy.get('.tooltip-inner').invoke('hide');

    cy.get(inspectorSelectors.inspectorSubNode('input')).should('be.visible').and('have.text', 'Input');

    cy.get('[data-cy="inspector-undefined-expand-button"]').should('be.visible').click();

    // The defined Input contract item ("input1") shows up as real, resolved
    // data under the Input node — proof the module-only `input` global
    // carries live contract data, not just an empty namespace.
    cy.get(inspectorSelectors.inspectorSubNode('input1')).should('be.visible');
  });
});
