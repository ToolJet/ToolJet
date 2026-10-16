/**
 * SPEC — Table — userflow facet.
 *
 * STATUS: STUB — awaiting input.
 *
 * This facet holds the per-component end-to-end happy path: a single realistic
 * scenario a user actually performs, start to finish, rather than a per-field
 * matrix. Unlike every other facet in this folder, it is NOT derivable from
 * `frontend/src/AppBuilder/WidgetManager/widgets/table.js` — the config says what
 * the Table CAN do, not which journey matters. Generating one without that input
 * would be invention, so this file deliberately ships empty.
 *
 * TO GENERATE: re-run with a flow description, e.g.
 *   /tj-build-cypress-components table --facet=userflow
 * and supply the scenario. Candidate flows already supported by the helper
 * library (Support/utils/appBuilder/components/table.js), if you want a starting
 * point rather than writing one from scratch:
 *
 *   A. Bind data -> make a column editable -> edit a cell -> Save changes ->
 *      assert `dataUpdates` / `changeSet` on the inspector.
 *   B. Search -> filter -> sort -> paginate, asserting `currentPageData` and
 *      `searchText`/`pageIndex` stay coherent through the whole chain.
 *   C. Bulk-select rows -> act on `selectedRows` -> clear selection.
 *   D. Add a new row via the add-new-row bar -> save -> assert it renders and
 *      `onNewRowsAdded` fired.
 *
 * The harness to copy is in inspector.cy.js / events.cy.js in this folder.
 * NOTE: `waitForDropSettle` does NOT exist in this repo — do not call it.
 *
 * DO NOT add speculative it-blocks here. An empty, honest stub is better than a
 * plausible-looking flow nobody asked for; the coverage gate excludes this facet
 * by design until a flow is supplied.
 */

// TODO(userflow): no flow description supplied — see header. Intentionally empty.
