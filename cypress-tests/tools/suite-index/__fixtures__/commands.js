/**
 * @tjType   pr.merge
 * @tjBlock  gitSync
 * @tjUsage  cy.alpha(1, 2)
 * @tjDom    none
 */
Cypress.Commands.add("alpha", (a, b) => {
  cy.log(a + b);
});

Cypress.Commands.add(
  "beta",
  () => {
    cy.log("beta");
  }
);

const name = "gamma";
Cypress.Commands.add(name, () => {});
