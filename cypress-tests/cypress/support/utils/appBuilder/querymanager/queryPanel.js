// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// queryPanel.js
//   closeQueryPanel                  -                    → querymanager
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/querymanager/queryPanel: the app-builder bottom runtime panel
 * (Inspector / Debugger tabs).
 * FOR AI: collapse the bottom panel while building an app.
 * NOT here: query CRUD/config → querymanager/queries.js · datasource connection
 * forms → marketplace/datasources.
 */

/**
 * @tjBlock  querymanager
 * @tjUsage  closeQueryPanel()
 * @tjDom    .query-pane collapsed class + query-manager-toggle-button
 */
// The panel's open state persists in localStorage ACROSS tests, so check before clicking:
// an unguarded toggle re-OPENS it on the second test of a spec.
export const closeQueryPanel = () => {
  cy.get(".query-pane").then(($panel) => {
    if (!$panel.hasClass("collapsed")) {
      cy.get('[data-cy="query-manager-toggle-button"]').click();
    }
  });
};
