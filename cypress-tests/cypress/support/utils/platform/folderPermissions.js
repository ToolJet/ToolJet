import { dashboardSelector } from 'Selectors/platform/dashboard';
import { versionSwitcherSelectors } from 'Selectors/platform/version';
import { workflowSelector } from 'Selectors/platform/workflows';

/* -------------------------------------------------------------------------
 * Dashboard navigation for folder-permission specs.
 *
 * Apps, workflows and modules all render the same Folders.jsx sidebar, so a
 * single readiness assertion works for every dashboard: the folder section
 * (`folder-info`) renders regardless of the viewer's folder-create privilege,
 * which the modules/apps page headers do not guarantee for restricted users.
 * ------------------------------------------------------------------------- */

const openDashboard = (path) => {
  cy.visit(`/${Cypress.env('workspaceSlug')}${path}`);
  cy.wait(2000);
  cy.get(dashboardSelector.folderLabel, { timeout: 50000 }).should('be.visible');
};

export const openAppsDashboard = () => openDashboard('');

export const openWorkflowsList = () => openDashboard('/workflows');

/* -------------------------------------------------------------------------
 * Opening an app / workflow editor.
 *
 * The editor boots behind a chain of calls — /api/session, /api/authorize,
 * /api/apps/validate-private-app-access — and renders only a spinner until the
 * last one resolves. Both the editor shell AND the redirect to /error/restricted
 * are decided at the end of that chain, so a fixed cy.wait() followed by a
 * default-timeout assertion reads the page mid-boot and fails on a spinner. Every
 * editor open here therefore waits on an explicit readiness signal with a budget
 * wide enough for a cold dev-server bundle.
 * ------------------------------------------------------------------------- */

const EDITOR_BOOT_TIMEOUT = 120000;

const visitEditor = (workspaceSlug, resourceId) =>
  cy.visit(`/${workspaceSlug}/apps/${resourceId}`, { failOnStatusCode: false });

// The version switcher is empty until the version list loads, so presence alone
// isn't readiness — assert it has rendered a version name.
export const openAppEditor = (workspaceSlug, appId) => {
  visitEditor(workspaceSlug, appId);
  cy.get(versionSwitcherSelectors.versionSwitcherButton, { timeout: EDITOR_BOOT_TIMEOUT })
    .should('be.visible')
    .and('not.have.text', '');
};

// Workflows share the /apps/:id route but have no version switcher; the canvas
// start node is the equivalent "editor is up" signal.
export const openWorkflowEditor = (workspaceSlug, workflowId) => {
  visitEditor(workspaceSlug, workflowId);
  cy.get(workflowSelector.startNode, { timeout: EDITOR_BOOT_TIMEOUT }).should('be.visible');
};

export const openEditorExpectingRestricted = (workspaceSlug, resourceId) => {
  visitEditor(workspaceSlug, resourceId);
  cy.url({ timeout: EDITOR_BOOT_TIMEOUT }).should('include', '/error/restricted');
};
