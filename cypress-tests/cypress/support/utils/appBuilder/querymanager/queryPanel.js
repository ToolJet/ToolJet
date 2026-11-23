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
 * @tjUsage  resizeQueryPanel('90')   // set panel height to 90%
 *           resizeQueryPanel(0)      // collapse the panel
 * @tjDom    `.query-pane` height via inline css
 */
export const resizeQueryPanel = (height = "90") => {
  cy.get('[class="query-pane"]').invoke("css", "height", `calc(${height}%)`);
};

/**
 * @tjBlock  querymanager
 * @tjUsage  expandFoldedQueryPanel()
 * @tjDom    .query-pane collapsed class + query-manager-toggle-button
 */
// EE: a blank app's empty canvas folds the query panel once per page load; reopen it after that fold.
export const expandFoldedQueryPanel = () => {
  cy.get(".query-pane").should("have.class", "collapsed");
  cy.get('[data-cy="query-manager-toggle-button"]').click();
  cy.get(".query-pane").should("not.have.class", "collapsed");
};

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

/**
 * @tjBlock  querymanager
 * @tjUsage  openQueryPanel()
 * @tjDom    .query-pane collapsed class + query-manager-toggle-button
 */
export const openQueryPanel = () => {
  cy.get(".query-pane").then(($panel) => {
    if ($panel.hasClass("collapsed")) {
      cy.get('[data-cy="query-manager-toggle-button"]').click();
    }
  });
  cy.get(".query-pane").should("not.have.class", "collapsed");
};
