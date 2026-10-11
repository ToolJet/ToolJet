/**
 * SPEC — Table — customerIssues facet.
 *
 * STATUS: STUB — awaiting input.
 *
 * This facet holds regression tests for SPECIFIC tracked defects: one it-block
 * per issue, each named with its issue id and asserting the exact behaviour that
 * regressed. It is sourced from GitHub/ClickUp issue links, never from the widget
 * config, so it cannot be generated from `table.js`.
 *
 * TO GENERATE: re-run with issue links, e.g.
 *   /tj-build-cypress-components table --facet=customerIssues
 * and supply the tracked issues. Each generated it-block should carry:
 *   - the issue id + title in the test name
 *   - a `// source: <issue url>` citation
 *   - an assertion on the regressed behaviour specifically, not a general smoke test
 *
 * SEPARATE NOTE — do not confuse these with customer issues:
 * the generation run for this component surfaced product bugs found by reading
 * source, NOT from customer reports. They are recorded in
 * `.superpowers/sdd/plan-table.md` (F1-F11) and in the run's Findings report.
 * The highest-signal ones, if anyone wants to file them:
 *   F1  every column validation control renders with NO data-cy
 *       (`dateCy` declared vs `dataCy` read) - ValidationProperties.jsx:41/:179
 *   F6  datepicker parse-format Fx handler reads the display-format flag while
 *       setting the parse-format flag - DatepickerProperties.jsx:301
 *   onTableDataDownload never fires on the default client-side pagination path
 *       - ControlButtons.jsx:189-207
 * Once any of those is filed and fixed, its regression test belongs HERE.
 *
 * The harness to copy is in inspector.cy.js / events.cy.js in this folder.
 * NOTE: `waitForDropSettle` does NOT exist in this repo — do not call it.
 */

// TODO(customerIssues): no issue links supplied — see header. Intentionally empty.
