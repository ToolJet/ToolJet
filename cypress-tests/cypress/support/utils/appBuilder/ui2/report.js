// Every measurement the suite takes, one JSON line each in cypress/reports/ui2/<spec>.jsonl (gitignored), so a run
// leaves the numbers behind a failure as well as the failure itself. `node tools/ui2/report.js --md` turns the files
// into a table.
export const REPORT_DIR = "cypress/reports/ui2";

const fileOf = () => `${REPORT_DIR}/${Cypress.spec.name.replace(/\.cy\.js$/, "")}.jsonl`;

/** Starts a fresh file for this spec. */
export const resetReport = () => cy.writeFile(fileOf(), "", { log: false });

/** Appends one record: { check, widget, mode, width, theme, pass, failures, data }. */
export const record = (rec) =>
  cy.writeFile(fileOf(), `${JSON.stringify({ at: new Date().toISOString(), ...rec })}\n`, { flag: "a+", log: false });

/**
 * Records the result, takes a screenshot of the widget's surroundings when it fails, then asserts. `known` (a
 * reason) marks a failure the team already tracks; it still fails unless CYPRESS_ui2_skip_known is set, in which case
 * the test was skipped before it got here.
 */
export const assertNoFailures = (rec, shotSelector) => {
  const pass = rec.failures.length === 0;
  record({ ...rec, pass });
  if (!pass && shotSelector) {
    const shot = [rec.check, rec.widget, rec.size, rec.mode, rec.width, rec.theme].filter(Boolean).join("-");
    cy.get(shotSelector, { log: false })
      .first()
      .then(($el) => {
        $el[0].scrollIntoView({ block: "center" });
      });
    cy.screenshot(shot, { capture: "viewport", log: false });
  }
  cy.then(() => {
    const where = [rec.widget, rec.size, rec.mode, rec.width && `${rec.width}px`, rec.theme].filter(Boolean).join(" / ");
    expect(rec.failures, `${rec.check}: ${where}${rec.known ? ` [known: ${rec.known}]` : ""}\n  - ${rec.failures.join("\n  - ")}`).to.be.empty;
  });
};
