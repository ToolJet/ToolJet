beforeEach(function () {
  cy.apiLogin();
});

afterEach(function () {
  if (this.currentTest.state === 'failed') {
    testFailed = true;
  }
  cy.apiUpdateLicense("valid");
});

describe("License - Update helper", () => {
  it("Update license", () => {
    cy.apiUpdateLicense("valid");
  });
});
