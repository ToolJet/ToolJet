// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// queryPanel.js
//   resizeQueryPanel                 -                    → querymanager
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/querymanager/queryPanel: the app-builder bottom QUERY PANEL.
 * FOR AI: resize the query panel (drag/collapse) while building an app.
 * `resizeQueryPanel(0)` collapses it; a percentage sets its height.
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
